/* Concert page: beat-driven visualiser + Lightstick Hero (3-lane rhythm game) */
(function () {
  const { $, rand, safe } = FX;
  const cv = $("#cv"), g = cv.getContext("2d"), W = cv.width, H = cv.height, audio = $("#song");
  const stick = new Image(); stick.src = "assets/lightstick.png"; const bunny = new Image(); bunny.src = "assets/bunny.png";
  const logo = $("#logo"); [..."Concert"].forEach((c) => { const s = document.createElement("span"); s.className = "ch"; s.textContent = c; logo.appendChild(s); });
  logo.addEventListener("pointerover", (e) => { const c = e.target.closest(".ch"); if (c) FX.squish(c); });

  let mode = "viz", cur = null, beat = { bpm: 100, offset: 0 }, running = false, t = 0, lastA = 0, lastP = 0, flash = 0;
  let analyser = null, freq = null, tracks = [];
  // hero state
  let notes = [], score, combo, maxCombo, hits, total, judge = [], lanePress = [0, 0, 0], over = false;
  const LANES = [W / 2 - 150, W / 2, W / 2 + 150], HIT_Y = H - 110, SPEED = 360, COLS = ["#ffb3dc", "#a9e5ff", "#d8f7ae"];

  /* ---------- audio analyser (optional; falls back to beat-simulated spectrum) ---------- */
  function setupAnalyser() {
    if (analyser) return; safe(() => {
      const ac = new (window.AudioContext || window.webkitAudioContext)(); const src = ac.createMediaElementSource(audio);
      analyser = ac.createAnalyser(); analyser.fftSize = 128; src.connect(analyser); analyser.connect(ac.destination); freq = new Uint8Array(analyser.frequencyBinCount);
    });
  }
  function spectrum(i, n) {
    const p = 60 / beat.bpm, ph = (((t - beat.offset) / p) % 1 + 1) % 1, pulse = Math.max(0, 1 - ph * 2.2);
    if (analyser && freq && !audio.paused) { analyser.getByteFrequencyData(freq); const v = freq[Math.floor((i / n) * freq.length * 0.7)] / 255; if (v > 0.02) return v; }
    return (0.25 + 0.5 * pulse) * (0.5 + 0.5 * Math.abs(Math.sin(i * 1.7 + t * 3)));
  }

  /* ---------- hero notes ---------- */
  function buildNotes(dur) {
    const p = 60 / beat.bpm, step = beat.bpm > 140 ? p : p / (beat.bpm < 105 ? 1 : 1), out = []; let seed = 11, last = 1;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let tb = beat.offset + 2 * p; tb < dur - 1; tb += step) { // start two beats in
      const r = rnd(); if (r < 0.12) continue; // occasional rests
      let lane = Math.floor(rnd() * 3); if (lane === last && rnd() < 0.5) lane = (lane + 1) % 3; last = lane;
      out.push({ t: tb, lane, done: false });
      if (rnd() < 0.15 && beat.bpm < 130) out.push({ t: tb + p / 2, lane: (lane + 1 + Math.floor(rnd() * 2)) % 3, done: false });
    }
    return out;
  }
  function reset() { notes = buildNotes(cur.duration); score = combo = maxCombo = hits = 0; total = notes.length; judge = []; over = false; flash = 0; }
  function press(lane) {
    if (mode !== "hero" || !running) return; lanePress[lane] = 1;
    let best = null, bd = 0.16; for (const n of notes) { if (n.done || n.lane !== lane) continue; const d = Math.abs(n.t - t); if (d < bd) { bd = d; best = n; } }
    if (best) {
      best.done = true; hits++; combo++; maxCombo = Math.max(maxCombo, combo); const perfect = bd < 0.06;
      score += (perfect ? 100 : 50) * (1 + Math.floor(combo / 10)); judge.push({ text: perfect ? "PERFECT" : "GOOD", x: LANES[lane], y: HIT_Y - 40, l: 1, c: perfect ? "#c2307f" : "#1b78a8" });
      FX.pop(1 + lane * 0.3 + (perfect ? 0.4 : 0), "sine", .12); FX.burst(LANES[lane] * (cv.getBoundingClientRect().width / W) + cv.getBoundingClientRect().left, cv.getBoundingClientRect().top + HIT_Y * (cv.getBoundingClientRect().height / H), 5, ["✨", "💙", "⭐"]); flash = 1;
    } else { combo = 0; FX.pop(0.4, "sawtooth", .06); }
  }
  const KEYS = { KeyA: 0, ArrowLeft: 0, KeyS: 1, ArrowDown: 1, KeyD: 2, ArrowRight: 2 };
  addEventListener("keydown", (e) => { if (e.code in KEYS) { e.preventDefault(); if (!e.repeat) press(KEYS[e.code]); } });
  cv.addEventListener("pointerdown", (e) => {
    e.preventDefault(); const r = cv.getBoundingClientRect(), x = ((e.clientX - r.left) / r.width) * W;
    if (mode === "hero") press(x < W / 2 - 75 ? 0 : x > W / 2 + 75 ? 2 : 1); else { flash = 1; FX.pop(1.6, "triangle"); FX.burst(e.clientX, e.clientY, 8, ["💙", "✨", "⭐"]); }
  });

  /* ---------- flow ---------- */
  function start() {
    reset(); $("#menu").classList.add("hidden"); $("#result").classList.add("hidden"); setupAnalyser();
    audio.currentTime = 0; audio.play().catch(() => FX.toast("Tap again to start the music")); running = true; lastP = performance.now(); lastA = 0;
  }
  function finish() {
    if (over) return; over = true; running = false; audio.pause();
    if (mode === "hero") {
      const acc = total ? Math.round((hits / total) * 100) : 0, key = "nj-lh-" + cur.title, prev = parseInt(safe(() => localStorage.getItem(key)) || "0", 10) || 0, nb = score > prev; if (nb) safe(() => localStorage.setItem(key, score));
      $("#res-title").textContent = acc > 85 ? "🌟 Superstar!" : acc > 60 ? "💙 Great show!" : "🪄 Keep waving!";
      $("#res-body").innerHTML = `Score <b>${score}</b>${nb ? " — <b>new best!</b>" : ` (best ${prev})`}<br>Notes ${hits}/${total} (${acc}%) · Best combo ${maxCombo}`;
      if (acc > 60) FX.rain(["💙", "⭐", "🪄"], 26);
    } else { $("#res-title").textContent = "🎤 Encore!"; $("#res-body").textContent = "Thanks for watching the show 💙"; }
    $("#result").classList.remove("hidden");
  }
  audio.addEventListener("ended", finish);

  function loop(now) {
    const at = audio.currentTime; if (at !== lastA) { lastA = at; lastP = now; }
    t = at + (audio.paused ? 0 : Math.min(0.05, (now - lastP) / 1000));
    if (cur) mode === "hero" ? drawHero() : drawViz(); else { g.fillStyle = "#cfe9ff"; g.fillRect(0, 0, W, H); }
    if (running && mode === "hero") for (const n of notes) if (!n.done && t - n.t > 0.16) { n.done = true; combo = 0; judge.push({ text: "miss", x: LANES[n.lane], y: HIT_Y - 40, l: 1, c: "#777" }); }
    if (running && mode === "viz" && audio.ended) finish();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  function bg(pulse) {
    const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, "#1b1840"); gr.addColorStop(.5, "#3a1f6b"); gr.addColorStop(1, "#14304a"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.fillStyle = "rgba(255,255,255,.8)"; for (let i = 0; i < 40; i++) { g.beginPath(); g.arc((i * 211) % W, (i * 97) % (H * .7), 1.5 + ((i + Math.floor(t * 2)) % 3) * .6, 0, 7); g.fill(); }
    g.fillStyle = `rgba(255,150,210,${0.08 + 0.16 * pulse})`; g.fillRect(0, 0, W, H);
  }
  function drawViz() {
    const p = 60 / beat.bpm, ph = (((t - beat.offset) / p) % 1 + 1) % 1, pulse = Math.max(0, 1 - ph * 2.2); bg(pulse);
    const cx = W / 2, cy = H / 2 + 10, N = 56;
    // radial bars
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2 - Math.PI / 2, v = spectrum(i % (N / 2), N / 2), r0 = 120, r1 = r0 + 14 + v * 120;
      g.strokeStyle = `hsl(${(i * 6 + t * 40) % 360},90%,${65 + v * 15}%)`; g.lineWidth = 7; g.lineCap = "round";
      g.beginPath(); g.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); g.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); g.stroke();
    }
    // spinning CD
    g.save(); g.translate(cx, cy); g.rotate(t * 1.4); const cd = g.createConicGradient(0, 0, 0);
    ["#fff", "#a9e5ff", "#fff", "#ffd6f0", "#fff", "#d8f7ae", "#fff", "#a9e5ff", "#fff"].forEach((c, i, a) => cd.addColorStop(i / (a.length - 1), c));
    g.fillStyle = cd; g.strokeStyle = "#23203a"; g.lineWidth = 6; g.beginPath(); g.arc(0, 0, 104 + pulse * 8, 0, 7); g.fill(); g.stroke();
    g.fillStyle = "#ffb3dc"; g.beginPath(); g.arc(0, 0, 34, 0, 7); g.fill(); g.stroke(); g.fillStyle = "#fff"; g.beginPath(); g.arc(0, 0, 12, 0, 7); g.fill(); g.stroke();
    g.fillStyle = "rgba(255,255,255,.7)"; g.beginPath(); g.ellipse(-48, -54, 30, 10, -.5, 0, 7); g.fill(); g.restore();
    // lightsticks left/right waving + flash glow
    [[130, -1], [W - 130, 1]].forEach(([x, d]) => {
      g.save(); g.translate(x, H - 20); g.rotate(d * (0.25 + Math.sin(t * 3 + d) * 0.22)); g.shadowColor = `rgba(255,255,255,${0.4 + 0.6 * Math.max(pulse, flash)})`; g.shadowBlur = 30 + 40 * Math.max(pulse, flash);
      if (stick.complete && stick.naturalWidth) g.drawImage(stick, -45, -200 - pulse * 14, 90, 180); g.restore();
    });
    // bunny bounce
    if (bunny.complete) { const hop = Math.abs(Math.sin(((t - beat.offset) / p) * Math.PI)) * 40; g.drawImage(bunny, cx - 34, 24 - hop * .2, 68, 110); }
    // bubbles
    g.fillStyle = "rgba(255,255,255,.35)"; g.strokeStyle = "rgba(255,255,255,.8)"; g.lineWidth = 2;
    for (let i = 0; i < 18; i++) { const y = H - (((t * (40 + (i % 5) * 14) + i * 61) % (H + 60))), x = (i * 173) % W + Math.sin(t + i) * 20, r = 10 + (i % 4) * 6 + pulse * 4; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.stroke(); }
    flash *= 0.92;
    g.fillStyle = "#fff"; g.font = "700 20px Fredoka, sans-serif"; g.textAlign = "center"; g.fillText("♫ " + (cur ? cur.title : ""), W / 2, H - 14);
  }
  function drawHero() {
    const p = 60 / beat.bpm, ph = (((t - beat.offset) / p) % 1 + 1) % 1, pulse = Math.max(0, 1 - ph * 2.2); bg(pulse);
    // lanes
    LANES.forEach((x, i) => {
      const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(1, COLS[i] + "55"); g.fillStyle = gr; g.fillRect(x - 60, 0, 120, H);
      g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 2; g.strokeRect(x - 60, 0, 120, H);
      lanePress[i] *= 0.85; g.fillStyle = COLS[i]; g.globalAlpha = 0.35 + 0.65 * lanePress[i]; g.strokeStyle = "#fff"; g.lineWidth = 6; g.beginPath(); g.arc(x, HIT_Y, 44 + lanePress[i] * 8, 0, 7); g.fill(); g.stroke(); g.globalAlpha = 1;
      g.fillStyle = "#23203a"; g.font = "700 22px Fredoka, sans-serif"; g.textAlign = "center"; g.fillText(["A", "S", "D"][i], x, HIT_Y + 8);
    });
    // notes
    for (const n of notes) {
      if (n.done) continue; const y = HIT_Y - (n.t - t) * SPEED; if (y < -50 || y > H + 50) continue;
      const x = LANES[n.lane], gr = g.createRadialGradient(x - 10, y - 12, 4, x, y, 38); gr.addColorStop(0, "#fff"); gr.addColorStop(.4, COLS[n.lane]); gr.addColorStop(1, COLS[n.lane]);
      g.fillStyle = gr; g.strokeStyle = "#23203a"; g.lineWidth = 5; g.beginPath(); g.arc(x, y, 36, 0, 7); g.fill(); g.stroke(); g.font = "28px serif"; g.fillStyle = "#23203a"; g.fillText("✨", x, y + 10);
    }
    // judgement
    g.font = "800 28px Baloo 2, Fredoka, sans-serif"; for (const j of judge) { j.l -= 0.03; j.y -= 1.4; g.globalAlpha = Math.max(0, j.l); g.lineWidth = 5; g.strokeStyle = "#fff"; g.strokeText(j.text, j.x, j.y); g.fillStyle = j.c; g.fillText(j.text, j.x, j.y); } g.globalAlpha = 1; judge = judge.filter((j) => j.l > 0);
    // side sticks
    [[110, -1], [W - 110, 1]].forEach(([x, d]) => { g.save(); g.translate(x, H - 10); g.rotate(d * (0.2 + Math.sin(t * 3) * 0.2)); g.shadowColor = "#fff"; g.shadowBlur = 20 + 40 * (pulse * .5 + flash); if (stick.complete) g.drawImage(stick, -40, -180, 80, 160); g.restore(); });
    flash *= 0.9;
    g.textAlign = "left"; g.fillStyle = "#fff"; g.font = "700 26px Fredoka, sans-serif"; g.fillText("Score " + score, 20, 40); g.font = "600 20px Fredoka, sans-serif"; g.fillText(combo > 1 ? "Combo ×" + combo : "", 20, 68);
    const prog = Math.max(0, Math.min(1, t / (cur ? cur.duration : 1))); g.fillStyle = "rgba(255,255,255,.3)"; g.fillRect(20, H - 18, W - 40, 8); g.fillStyle = "#ff9ccf"; g.fillRect(20, H - 18, (W - 40) * prog, 8);
  }

  /* ---------- menu ---------- */
  const status = $("#analysis"), startBtn = $("#start");
  $("#mode-row").addEventListener("click", (e) => { const b = e.target.closest("[data-mode]"); if (!b) return; mode = b.dataset.mode; $("#mode-row").querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", x === b)); FX.pop(1.3); });
  async function loadTrack(title, url, getBuf) {
    startBtn.disabled = true; status.textContent = "Listening to the beat… 🎧";
    try { const info = await Beat.analyse(await getBuf()); audio.src = url; audio.load(); cur = { title, duration: info.duration }; beat.bpm = info.bpm; beat.offset = info.offset; analyser = analyser; reset(); status.textContent = `Detected about ${info.bpm} BPM. Ready!`; startBtn.disabled = false; FX.toast("🎵 " + title + " ready!"); }
    catch (e) { console.error(e); cur = null; status.textContent = "Couldn't read that audio here. Try an mp3/m4a, and open this page from the website (not as a local file)."; }
  }
  fetch("music/tracks.json").then((r) => r.json()).catch(() => [{ title: "Hype Boy", file: "music/Hype%20Boy.m4a", emoji: "🐰", color: "#a9e5ff" }]).then((l) => {
    tracks = l; const box = $("#track-list");
    l.forEach((tr, i) => { const b = document.createElement("button"); b.type = "button"; b.className = "jelly track-btn"; b.style.setProperty("--jc", tr.color || "#a9e5ff"); b.textContent = (tr.emoji || "🎵") + " " + tr.title; b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", () => { box.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", "false")); b.setAttribute("aria-pressed", "true"); loadTrack(tr.title, tr.file, () => fetch(tr.file).then((r) => r.arrayBuffer())); }); box.appendChild(b); if (i === 0) setTimeout(() => b.click(), 50); });
  });
  $("#file").addEventListener("change", (e) => { const f = e.target.files[0]; if (!f) return; $("#track-list").querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", "false")); loadTrack(f.name.replace(/\.[^.]+$/, ""), URL.createObjectURL(f), () => f.arrayBuffer()); });
  startBtn.addEventListener("click", start); $("#again").addEventListener("click", start);
  $("#menu-btn").addEventListener("click", () => { audio.pause(); running = false; $("#result").classList.add("hidden"); $("#menu").classList.remove("hidden"); });
})();
