/* Bunny Beat Jump — a rhythm platformer. Beat is detected in the browser from any audio file. */
(function () {
  const { $, rand, safe } = FX;
  const cv = $("#cv"), g = cv.getContext("2d"), W = cv.width, H = cv.height;
  const audio = $("#song");
  const bunny = new Image(); bunny.src = "assets/bunny.png";

  /* ---------- wobbly title ---------- */
  const logo = $("#logo");
  const mk = (txt, parent) => [...txt].forEach((c) => { const s = document.createElement("span"); if (c === " ") s.className = "sp"; else { s.className = "ch"; s.textContent = c; } parent.appendChild(s); });
  mk("Bunny Beat", logo); const sub = document.createElement("span"); sub.className = "sub"; mk("Jump", sub); logo.appendChild(sub);
  logo.addEventListener("pointerover", (e) => { const c = e.target.closest(".ch"); if (c) FX.squish(c); });

  const analyse = Beat.analyse;

  /* ---------- state ---------- */
  const V = 330;            // world speed px/s
  const PX = 230;           // player screen x
  const BASE_Y = 430, LANE = 52;
  let tracks = [], cur = null, beat = { bpm: 100, offset: 0, beats: [], accents: [], down: 0 }, level = null, latency = 0;
  let running = false, over = false, t = 0, lastA = 0, lastP = 0;
  let P, score, combo, maxCombo, hearts, perfects, pearlsGot, pearlsTotal, floaters = [], parts = [];

  /* ---------- level from the song's real beat times ---------- */
  const synthGrid = (bpm, off, dur) => { const p = 60 / bpm, a = []; for (let t = off; t < dur + 2; t += p) a.push(t); return a; };
  function nearBeat(time0) { const time = time0 - latency; // binary search: distance to the nearest beat, phase since the last beat, local period
    const B = beat.beats; if (!B.length) return { d: 1, ph: 0, p: 0.6 };
    let lo = 0, hi = B.length - 1; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (B[mid] <= time) lo = mid; else hi = mid; }
    const p = Math.max(0.2, B[hi] - B[lo]), ph = Math.max(0, Math.min(1, (time - B[lo]) / p));
    return { d: Math.min(Math.abs(time - B[lo]), Math.abs(B[hi] - time)), ph, p };
  }
  function buildLevel(dur) {
    const B = beat.beats.map((x) => x + latency), n = B.length;
    const per = (i) => (i + 1 < n ? B[i + 1] - B[i] : B[i] - B[Math.max(0, i - 1)]) || 0.6;
    const at = (i) => (i < n ? B[i] : B[n - 1] + (i - n + 1) * per(n - 1));
    const avgP = (B[n - 1] - B[0]) / Math.max(1, n - 1) || 0.6, m = avgP < 0.45 ? 4 : 2;
    const plats = [], pearls = [];
    let lane = 0, seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    plats.push({ ts: -6, te: at(0) - 0.25 * per(0) + 0.75 * (at(m) - at(0)), lane: 0, col: 0 });
    for (let k = m, i = 0; at(k) - 0.25 * per(Math.min(k, n - 1)) < dur + 1; k += m, i++) {
      const ts = at(k) - 0.25 * per(Math.min(k, n - 1)), te = ts + 0.75 * (at(k + m) - at(k));
      const r = rnd(); lane = Math.max(0, Math.min(3, lane + (r < 0.33 ? -1 : r < 0.66 ? 0 : 1)));
      const pl = { ts, te, lane, col: i % 5 }; plats.push(pl);
      for (let j = k; j < k + m + 1; j++) { const tb = at(j); if (tb < pl.ts + 0.05 || tb >= pl.te) continue; const star = (j - beat.down) % 8 === 0; pearls.push({ t: tb, y: BASE_Y - lane * LANE - (star ? 150 : 95), star, got: false, miss: false }); }
    }
    // accent pearls: strong off-beat hits in the music (vocal / synth / snare accents)
    let lastA = -9; const sorted = beat.accents.filter((a) => a.s > 3).sort((x, y) => x.t - y.t);
    for (const a of sorted) {
      const t0 = a.t + latency; if (t0 - lastA < 0.4) continue; const pl = plats.find((q) => q.ts + 0.1 <= t0 && q.te - 0.1 >= t0); if (!pl) continue;
      if (pearls.some((q) => Math.abs(q.t - t0) < 0.16)) continue; pearls.push({ t: t0, y: BASE_Y - pl.lane * LANE - 125, star: false, acc: true, got: false, miss: false }); lastA = t0;
    }
    pearls.sort((x, y) => x.t - y.t);
    return { plats, pearls, p: avgP, u: m * avgP, dur };
  }
  const platTop = (pl) => BASE_Y - pl.lane * LANE;
  const platAt = (time, ytop) => level.plats.find((pl) => pl.ts <= time && pl.te >= time);

  /* ---------- game flow ---------- */
  function reset() {
    level = buildLevel(cur.duration);
    score = combo = maxCombo = perfects = pearlsGot = 0; hearts = 3; pearlsTotal = level.pearls.length;
    floaters = []; parts = [];
    P = { y: BASE_Y, vy: 0, ground: true, jumps: 0, sq: 1, hover: false, inv: 0 };
    over = false; t = 0;
  }
  function start() {
    reset(); $("#menu").classList.add("hidden"); $("#result").classList.add("hidden");
    audio.currentTime = 0; audio.play().then(() => { running = true; lastP = performance.now(); lastA = 0; }).catch(() => FX.toast("Tap again to start the music"));
    running = true; lastP = performance.now(); lastA = 0;
  }
  function finish(win) {
    if (over) return; over = true; running = false; audio.pause();
    const key = "nj-bj-" + cur.title, prev = parseInt(safe(() => localStorage.getItem(key)) || "0", 10) || 0;
    const nb = score > prev; if (nb) safe(() => localStorage.setItem(key, score));
    const pct = pearlsTotal ? Math.round((pearlsGot / pearlsTotal) * 100) : 0;
    $("#res-title").textContent = win ? (pct > 80 ? "💙 Bunny legend!" : "🎉 Song complete!") : "😵 Out of hearts!";
    $("#res-body").innerHTML = `Score <b>${score}</b>${nb ? " — <b>new best!</b>" : ` (best ${prev})`}<br>Pearls ${pearlsGot}/${pearlsTotal} (${pct}%) · Perfect landings ${perfects} · Best combo ${maxCombo}`;
    $("#result").classList.remove("hidden"); if (win) FX.rain(["💙", "🧋", "⭐"], 26);
    safe(() => { const k2 = "nj-bjp-" + cur.title, pp = parseInt(localStorage.getItem(k2) || "0", 10) || 0; if (pct > pp) localStorage.setItem(k2, pct); });
    if (win && FX.badge) { FX.badge("game"); if (pct >= 90) FX.badge("legend"); }
    renderBoard();
  }
  audio.addEventListener("ended", () => finish(true));

  function jump() {
    if (!running) return;
    if (P.hover) return;
    if (P.ground) { P.vy = -780; P.ground = false; P.jumps = 1; P.sq = 1.35; FX.pop(1.4, "triangle", .09); }
    else if (P.jumps < 2) { P.vy = -700; P.jumps = 2; P.sq = 1.3; FX.pop(1.8, "triangle", .09); burst(PX, P.y, 5, "#fff"); }
  }
  addEventListener("keydown", (e) => { if (["Space", "ArrowUp", "KeyW"].includes(e.code)) { e.preventDefault(); if (!e.repeat) jump(); } });
  cv.addEventListener("pointerdown", (e) => { e.preventDefault(); jump(); });

  function burst(x, y, n, col) { for (let i = 0; i < n; i++) parts.push({ x, y, vx: rand(-160, 160), vy: rand(-240, -20), l: 1, c: col || "#fff" }); }
  function say(text, x, y, col) { floaters.push({ text, x, y, l: 1, col: col || "#23203a" }); }

  /* ---------- update ---------- */
  function update(dt) {
    // clock: audio time, smoothed
    const at = audio.currentTime; const now = performance.now();
    if (at !== lastA) { lastA = at; lastP = now; }
    t = at + (audio.paused ? 0 : Math.min(0.05, (now - lastP) / 1000));
    const p = level.p;
    // physics
    const pl = platAt(t);
    const top = pl ? platTop(pl) : null;
    if (P.hover) {
      const next = level.plats.find((q) => q.te >= t && q.ts <= t + 0.2) || level.plats.find((q) => q.ts > t);
      const tgt = next ? platTop(next) - 90 : BASE_Y - 90;
      P.y += (tgt - P.y) * Math.min(1, dt * 8); P.vy = 0;
      if (pl && Math.abs(P.y - (top - 90)) < 25) { P.hover = false; P.inv = 1.2; P.ground = false; }
    } else {
      const prevY = P.y; P.vy += 2300 * dt; P.y += P.vy * dt;
      if (top != null && P.vy >= 0 && prevY <= top + 6 && P.y >= top) {
        P.y = top; P.vy = 0;
        if (!P.ground) {
          P.ground = true; P.jumps = 0; P.sq = 0.62;
          const d = nearBeat(t).d;
          let lanePitch = 0.9 + pl.lane * 0.18;
          if (d < 0.09) { perfects++; score += 50; say("PERFECT!", PX, P.y - 80, "#c2307f"); FX.pop(lanePitch + 0.5, "sine", .18); burst(PX, P.y, 8, "#ffd84d"); }
          else if (d < 0.18) { score += 15; say("good", PX, P.y - 70, "#1b78a8"); FX.pop(lanePitch, "sine", .12); }
          else FX.pop(lanePitch * 0.8, "sine", .08);
        }
      } else if (top == null || P.y > top + 6) { if (P.ground) { P.ground = false; P.jumps = Math.max(P.jumps, 1); } }
      if (P.y > H + 80) {
        if (P.inv <= 0) { hearts--; combo = 0; say("💔", PX, 150); FX.pop(0.35, "sawtooth", .25); if (hearts <= 0) { finish(false); return; } }
        P.hover = true; P.y = BASE_Y - 400; P.vy = 0; P.ground = false;
      }
    }
    P.inv = Math.max(0, P.inv - dt); P.sq += (1 - P.sq) * Math.min(1, dt * 10);
    // pearls
    for (const pe of level.pearls) {
      if (pe.got || pe.miss) continue;
      const x = PX + (pe.t - t) * V;
      if (Math.hypot(x - PX, pe.y - (P.y - 34)) < 44) {
        pe.got = true; pearlsGot++; combo++; maxCombo = Math.max(maxCombo, combo);
        const pts = (pe.star ? 30 : pe.acc ? 15 : 10) * (1 + Math.floor(combo / 10)); score += pts;
        FX.pop(1.2 + (combo % 8) * 0.08, "sine", .1); burst(x, pe.y, 6, pe.star ? "#ffd84d" : "#a9e5ff");
        if (combo % 10 === 0) say(`${combo} combo!`, PX + 60, P.y - 100, "#c2307f");
      } else if (x < PX - 60) { pe.miss = true; combo = 0; }
    }
    for (const q of parts) { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 700 * dt; q.l -= dt * 1.6; }
    parts = parts.filter((q) => q.l > 0);
    for (const f of floaters) { f.y -= 40 * dt; f.l -= dt * 0.9; }
    floaters = floaters.filter((f) => f.l > 0);
  }

  /* ---------- draw ---------- */
  const COLS = ["#d8f7ae", "#ffb3dc", "#a9e5ff", "#fff4a8", "#dccaff"];
  function rr(x, y, w, h, r) { g.beginPath(); g.roundRect ? g.roundRect(x, y, w, h, r) : g.rect(x, y, w, h); }
  function draw() {
    const nb = nearBeat(t), ph = nb.ph, pulse = Math.max(0, 1 - ph * 2.5);
    const bg = g.createLinearGradient(0, 0, W, H); bg.addColorStop(0, "#cfe9ff"); bg.addColorStop(.55, "#ffd6e7"); bg.addColorStop(1, "#dff8ef");
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    // beat rings
    g.strokeStyle = "rgba(255,255,255," + (0.7 * pulse) + ")"; g.lineWidth = 6 + 10 * pulse;
    g.beginPath(); g.arc(W / 2, H / 2, 120 + (1 - pulse) * 260, 0, Math.PI * 2); g.stroke();
    // parallax dots
    g.fillStyle = "rgba(255,255,255,.7)";
    for (let i = 0; i < 26; i++) { const x = ((i * 137 - t * V * 0.25) % (W + 60) + W + 60) % (W + 60) - 30, y = (i * 83) % 330 + 20; g.beginPath(); g.arc(x, y, 3 + (i % 3) * 2 + pulse * 2, 0, 7); g.fill(); }
    // platforms
    for (const pl of level.plats) {
      const x0 = PX + (pl.ts - t) * V, x1 = PX + (pl.te - t) * V; if (x1 < -20 || x0 > W + 20) continue;
      const y = platTop(pl), w = x1 - x0, hgt = 26 + pulse * 3;
      g.fillStyle = "rgba(35,32,58,.18)"; rr(x0, y + 10, w, hgt, 14); g.fill();
      const gr = g.createLinearGradient(0, y, 0, y + hgt); gr.addColorStop(0, "#fff"); gr.addColorStop(.25, COLS[pl.col]); gr.addColorStop(1, COLS[pl.col]);
      g.fillStyle = gr; g.strokeStyle = "#23203a"; g.lineWidth = 3.5; rr(x0, y, w, hgt, 14); g.fill(); g.stroke();
      g.fillStyle = "rgba(255,255,255,.7)"; rr(x0 + 10, y + 4, Math.min(60, w - 20), 5, 3); g.fill();
    }
    // pearls
    for (const pe of level.pearls) {
      if (pe.got) continue; const x = PX + (pe.t - t) * V; if (x < -30 || x > W + 30) continue;
      const bob = Math.sin(t * 6 + pe.t) * 4, r = (pe.star ? 17 : pe.acc ? 10 : 13) + pulse * 3;
      g.font = r * 2 + "px serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(pe.star ? "⭐" : pe.acc ? "💗" : "🧋", x, pe.y + bob);
    }
    // bunny
    const sq = P.sq, bw = 60 / sq, bh = 82 * sq * (bunny.naturalHeight ? 1 : 1);
    g.save(); g.translate(PX, P.y); g.rotate(P.ground ? 0 : Math.max(-0.35, Math.min(0.35, P.vy / 2400)));
    if (P.inv > 0 && Math.floor(P.inv * 10) % 2) g.globalAlpha = .45;
    g.fillStyle = "rgba(35,32,58,.18)"; g.beginPath(); g.ellipse(0, 4, 26, 6, 0, 0, 7); g.fill();
    if (bunny.complete && bunny.naturalWidth) g.drawImage(bunny, -bw / 2, -bh, bw, bh); else { g.font = "60px serif"; g.textAlign = "center"; g.fillText("🐰", 0, -10); }
    g.restore();
    // particles + floaters
    for (const q of parts) { g.globalAlpha = Math.max(0, q.l); g.fillStyle = q.c; g.strokeStyle = "#23203a"; g.lineWidth = 2; g.beginPath(); g.arc(q.x, q.y, 6, 0, 7); g.fill(); g.stroke(); }
    g.globalAlpha = 1; g.font = "800 28px Baloo 2, Fredoka, sans-serif"; g.textAlign = "center";
    for (const f of floaters) { g.globalAlpha = Math.max(0, f.l); g.lineWidth = 5; g.strokeStyle = "#fff"; g.strokeText(f.text, f.x, f.y); g.fillStyle = f.col; g.fillText(f.text, f.x, f.y); }
    g.globalAlpha = 1;
    // HUD
    g.textAlign = "left"; g.font = "700 26px Fredoka, sans-serif"; g.fillStyle = "#23203a"; g.fillText("Score " + score, 20, 40);
    g.font = "600 20px Fredoka, sans-serif"; g.fillText(combo > 1 ? "Combo ×" + combo : "", 20, 68);
    g.textAlign = "right"; g.font = "28px serif"; g.fillText("💙".repeat(Math.max(0, hearts)) + "🤍".repeat(Math.max(0, 3 - hearts)), W - 20, 42);
    const prog = Math.max(0, Math.min(1, t / level.dur));
    g.fillStyle = "#fff"; g.strokeStyle = "#23203a"; g.lineWidth = 3; rr(20, H - 26, W - 40, 12, 6); g.fill(); g.stroke();
    g.fillStyle = "#ff9ccf"; rr(20, H - 26, Math.max(12, (W - 40) * prog), 12, 6); g.fill(); g.stroke();
  }

  let lastF = performance.now();
  (function loop(now) {
    const dt = Math.min(0.05, (now - lastF) / 1000); lastF = now;
    if (level && cur) { if (running) update(dt); draw(); }
    else { g.fillStyle = "#cfe9ff"; g.fillRect(0, 0, W, H); }
    requestAnimationFrame(loop);
  })(performance.now());

  /* ---------- menu / loading ---------- */
  const status = $("#analysis"), startBtn = $("#start"), tune = $("#tune"), bpmIn = $("#bpm");
  let base = null;
  function reset_idle() { reset(); running = false; t = 0; }
  function applyBeat() { level = buildLevel(cur.duration); reset_idle(); }
  function rebuildGrid() { // user typed a BPM: use a perfectly even grid from the first tracked beat
    const off = (base && base.beats[0]) || beat.offset; beat.bpm = parseFloat(bpmIn.value) || beat.bpm; beat.beats = synthGrid(beat.bpm, off, cur.duration); applyBeat();
  }
  function nudge(ms) { latency += ms / 1000; safe(() => localStorage.setItem("nj-lat-" + cur.title, latency)); $("#lat").textContent = (latency >= 0 ? "+" : "") + Math.round(latency * 1000) + " ms"; applyBeat(); }
  async function loadTrack(title, url, getBuffer) {
    startBtn.disabled = true; tune.hidden = true; status.textContent = "Listening to the beat… 🎧";
    try {
      const ab = await getBuffer();
      const info = await analyse(ab);
      audio.src = url; audio.load();
      cur = { title, duration: info.duration }; beat.bpm = info.bpm; beat.offset = info.offset; beat.beats = info.beats; beat.accents = info.accents || []; beat.down = info.down || 0; latency = parseFloat(safe(() => localStorage.getItem("nj-lat-" + title)) || "0") || 0; $("#lat").textContent = (latency >= 0 ? "+" : "") + Math.round(latency * 1000) + " ms"; base = { beats: info.beats.slice(), accents: (info.accents || []).map((a) => ({ ...a })) };
      bpmIn.value = info.bpm; reset_idle();
      status.textContent = `Tracked ${info.beats.length} beats (about ${info.bpm} BPM). Press “Test beats” to hear clicks on the beat; if they feel early or late, nudge them.`;
      tune.hidden = false; startBtn.disabled = false; FX.toast("🎵 " + title + " ready!");
    } catch (e) {
      console.error(e); cur = null;
      status.textContent = "Couldn't read that audio here. If you opened this from a file:// link, run it through GitHub Pages or a local server, or try an mp3/m4a.";
    }
  }
  function renderBoard() {
    const box = $("#board"); if (!box) return;
    const rows = tracks.map((tr) => { const s = parseInt(safe(() => localStorage.getItem("nj-bj-" + tr.title)) || "0", 10) || 0, p = parseInt(safe(() => localStorage.getItem("nj-bjp-" + tr.title)) || "0", 10) || 0; return { tr, s, p }; });
    box.innerHTML = "<h3>🏆 Best scores</h3>" + rows.map((r) => `<div class="board-row"><span>${r.tr.emoji || "🎵"} ${r.tr.title}</span><b>${r.s ? r.s.toLocaleString() : "—"}</b><small>${r.s ? r.p + "% pearls" : "not played yet"}</small></div>`).join("");
  }
  function renderTracks() {
    const box = $("#track-list"); box.innerHTML = "";
    tracks.forEach((tr, i) => {
      const b = document.createElement("button"); b.type = "button"; b.className = "jelly track-btn"; b.style.setProperty("--jc", tr.color || "#a9e5ff");
      b.textContent = (tr.emoji || "🎵") + " " + tr.title; b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", () => { box.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", "false")); b.setAttribute("aria-pressed", "true"); loadTrack(tr.title, tr.file, () => fetch(tr.file).then((r) => r.arrayBuffer())); });
      box.appendChild(b); if (i === 0) setTimeout(() => b.click(), 50);
    });
  }
  fetch("music/tracks.json").then((r) => r.json()).catch(() => [{ title: "Hype Boy", file: "music/Hype%20Boy.m4a", emoji: "🐰", color: "#a9e5ff" }]).then((l) => { tracks = l; renderTracks(); renderBoard(); });

  $("#file").addEventListener("change", (e) => {
    const f = e.target.files[0]; if (!f) return;
    const url = URL.createObjectURL(f); $("#track-list").querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", "false"));
    loadTrack(f.name.replace(/\.[^.]+$/, ""), url, () => f.arrayBuffer());
  });
  bpmIn.addEventListener("change", rebuildGrid);
  $("#x2").addEventListener("click", () => { const v = parseFloat(bpmIn.value); bpmIn.value = v > 110 ? (v / 2).toFixed(1) : (v * 2).toFixed(1); rebuildGrid(); });
  $("#off-").addEventListener("click", () => { nudge(-20); FX.toast("Beats 20 ms earlier"); });
  $("#off\\+").addEventListener("click", () => { nudge(20); FX.toast("Beats 20 ms later"); });
  /* ---------- "Test beats": clicks on the tracked beats over the song, so you can hear whether it is in sync ---------- */
  let testing = false, tAc = null, tNext = 0;
  function stopTest() { testing = false; audio.pause(); $("#testbeat").textContent = "🔔 Test beats"; }
  $("#testbeat").addEventListener("click", () => {
    if (testing) { stopTest(); return; } if (!cur) return;
    tAc = tAc || new (window.AudioContext || window.webkitAudioContext)(); tAc.resume();
    audio.currentTime = Math.max(0, (beat.beats[Math.min(12, beat.beats.length - 1)] || 8) - 1); tNext = 0; audio.play().catch(() => {}); testing = true; $("#testbeat").textContent = "⏹ Stop test";
    (function tick() {
      if (!testing) return; const at = audio.currentTime;
      for (let i = tNext; i < beat.beats.length; i++) {
        const bt = beat.beats[i] + latency; if (bt < at - 0.02) { tNext = i + 1; continue; } if (bt > at + 0.12) break;
        const o = tAc.createOscillator(), gn = tAc.createGain(); o.frequency.value = ((i - beat.down) % 4 === 0) ? 1500 : 1000; o.connect(gn); gn.connect(tAc.destination);
        const when = tAc.currentTime + Math.max(0, bt - at); gn.gain.setValueAtTime(0.0001, when); gn.gain.exponentialRampToValueAtTime(0.35, when + 0.003); gn.gain.exponentialRampToValueAtTime(0.0001, when + 0.05); o.start(when); o.stop(when + 0.06); tNext = i + 1;
      }
      requestAnimationFrame(tick);
    })();
  });
  startBtn.addEventListener("click", () => { if (testing) stopTest(); start(); });
  $("#again").addEventListener("click", start);
  $("#menu-btn").addEventListener("click", () => { audio.pause(); running = false; $("#result").classList.add("hidden"); $("#menu").classList.remove("hidden"); });
})();
