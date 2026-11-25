/* CD shelf + karaoke. Lyrics are never bundled: they come from your own .lrc files or text you paste. */
(function () {
  const { $, safe } = FX;
  const DISCS = [
    { key: "ditto", title: "Ditto", img: "assets/cd-ditto.png?v=6", audio: ["music/ditto.m4a", "music/Ditto.m4a", "music/ditto.mp3"] },
    { key: "howsweet", title: "How Sweet", img: "assets/cd-howsweet.png?v=8", audio: ["music/how-sweet.m4a", "music/how-sweet.mp3"], inst: ["music/how-sweet-instrumental.m4a"] },
    { key: "bubblegum", title: "Bubble Gum", img: "assets/cd-howsweet.png?v=8", audio: ["music/bubble-gum.m4a", "music/bubble-gum.mp3"], inst: ["music/bubble-gum-instrumental.m4a"] }
  ];
  const rack = $("#cd-rack"), ov = $("#cd-overlay"), au = $("#k-audio"), lines = $("#k-lines");
  let cur = null, data = [], active = -1, rafId = 0, syncing = false, syncIdx = 0, stamps = [], rawLines = [];

  DISCS.forEach((d, i) => {
    const b = document.createElement("button"); b.type = "button"; b.className = "cd-disc"; b.setAttribute("aria-label", "Play " + d.title);
    b.innerHTML = `<span class="cd-wrap"><img src="${d.img}" alt="" /></span><span>${d.title}</span>`; b.querySelector("img").style.animationDuration = 7 + i * 3 + "s";
    b.addEventListener("click", () => open(d)); rack.appendChild(b);
  });

  const fmt = (t) => { const m = Math.floor(t / 60), s = t - m * 60; return `[${String(m).padStart(2, "0")}:${s.toFixed(2).padStart(5, "0")}]`; };
  function parseLRC(txt) {
    const out = []; txt.split(/\r?\n/).forEach((ln) => { const m = ln.match(/^\s*\[(\d+):(\d+(?:\.\d+)?)\]\s*(.*)$/); if (m && m[3].trim()) out.push({ t: +m[1] * 60 + parseFloat(m[2]), text: m[3].trim() }); });
    return out.sort((a, b) => a.t - b.t);
  }
  function render() {
    lines.innerHTML = ""; if (typeof buildNudge === "function") setTimeout(() => { if (!syncing) buildNudge(); }, 0);
    if (!data.length) { const p = document.createElement("p"); p.className = "hint"; p.style.textAlign = "center"; p.textContent = "No lyrics loaded yet. Open the Lyric lab to add your own, or put lyrics/" + cur.key + ".lrc in the repo."; lines.appendChild(p); return; }
    data.forEach((l, i) => { const d = document.createElement("div"); d.className = "k-line"; d.dataset.i = i; d.textContent = l.text; lines.appendChild(d); });
    active = -1;
  }
  async function loadLyrics() {
    const saved = safe(() => localStorage.getItem("nj-lrc-" + cur.key)); if (saved) { data = parseLRC(saved); render(); return; }
    try { const r = await fetch("lyrics/" + cur.key + ".lrc"); if (r.ok) { data = parseLRC(await r.text()); render(); return; } } catch (e) {}
    data = []; render();
  }
  let inst = false;
  function setAudio(i, listOverride, keep) {
    const list = listOverride || (inst && cur.inst ? cur.inst : cur.audio); if (i >= list.length) { $("#k-status").textContent = `No audio found. Add your file as ${list[0].replace(/%20/g, " ")} (a copy of a song you own).`; $("#k-play").disabled = true; return; }
    au.onerror = () => setAudio(i + 1, listOverride, keep); au.src = list[i]; au.load(); $("#k-play").disabled = false; $("#k-status").textContent = inst ? "Instrumental ready — press play 🎹" : "Ready — press play 🎵";
    if (keep) { const { t, playing } = keep; au.addEventListener("loadedmetadata", () => { au.currentTime = t; if (playing) au.play().catch(() => {}); }, { once: true }); }
  }
  function open(d) {
    cur = d; if (FX.audio) FX.audio.pause();
    $("#k-title").textContent = d.title; $("#k-disc").src = d.img; $("#k-disc").classList.remove("playing"); $("#k-labpanel").hidden = true; syncing = false;
    $("#k-text").value = (safe(() => localStorage.getItem("nj-lrc-" + d.key)) ? parseLRC(localStorage.getItem("nj-lrc-" + d.key)).map((x) => x.text).join("\n") : "");
    inst = false; $("#k-inst").hidden = !d.inst; $("#k-inst").textContent = "🎹 Instrumental: off"; stopRec(true); $("#k-recout").hidden = true; $("#k-nudgebox").hidden = true;
    setAudio(0); loadLyrics(); ov.classList.add("open"); ov.setAttribute("aria-hidden", "false"); FX.pop(1.3, "triangle");
  }
  function close() { stopRec(true); au.pause(); cancelAnimationFrame(rafId); ov.classList.remove("open"); ov.setAttribute("aria-hidden", "true"); }
  addEventListener("keydown", (e) => { if (e.key === "Escape" && ov.classList.contains("open")) close(); });
  ov.addEventListener("click", (e) => { if (e.target === ov || e.target.closest("[data-close]")) close(); });

  $("#k-play").addEventListener("click", () => (au.paused ? au.play().catch(() => FX.toast("Couldn't play that file")) : au.pause()));
  au.addEventListener("play", () => { $("#k-play").textContent = "❚❚ Pause"; $("#k-disc").classList.add("playing"); tick(); });
  au.addEventListener("pause", () => { $("#k-play").textContent = "▶ Play"; $("#k-disc").classList.remove("playing"); });
  au.addEventListener("ended", () => { $("#k-play").textContent = "▶ Play"; $("#k-disc").classList.remove("playing"); if (syncing) finishSync(); });
  $("#k-prog").addEventListener("click", (e) => { const r = e.currentTarget.getBoundingClientRect(); if (au.duration) au.currentTime = ((e.clientX - r.left) / r.width) * au.duration; });

  function tick() {
    cancelAnimationFrame(rafId);
    (function loop() {
      const t = au.currentTime; if (au.duration) $("#k-prog i").style.width = (t / au.duration) * 100 + "%";
      if (data.length) {
        let idx = -1; for (let i = 0; i < data.length; i++) if (data[i].t <= t) idx = i; else break;
        const els = lines.children;
        for (let i = 0; i < data.length && els[i] && els[i].classList; i++) {
          const el = els[i]; let p = 0;
          if (i < idx) p = 1; else if (i === idx) { const end = data[i + 1] ? Math.min(data[i + 1].t, data[i].t + 5) : data[i].t + 4; p = Math.min(1, (t - data[i].t) / Math.max(0.5, (end - data[i].t) * 0.85)); }
          el.style.setProperty("--p", p); el.classList.toggle("now", i === idx); el.classList.toggle("done", i < idx);
        }
        if (idx !== active) { active = idx; const el = lines.children[idx]; if (el && el.scrollIntoView) lines.scrollTo({ top: el.offsetTop - lines.clientHeight / 2 + el.clientHeight / 2, behavior: "smooth" }); }
      }
      if (!au.paused) rafId = requestAnimationFrame(loop);
    })();
  }

  /* ---------- lyric lab: tap to time your own lyrics ---------- */
  $("#k-lab").addEventListener("click", () => { $("#k-labpanel").hidden = !$("#k-labpanel").hidden; });
  $("#k-sync").addEventListener("click", () => {
    rawLines = $("#k-text").value.split(/\r?\n/).map((s) => s.trim()).filter(Boolean); if (!rawLines.length) { FX.toast("Paste some lyrics first ✍️"); return; }
    syncing = true; syncIdx = 0; stamps = []; data = rawLines.map((t) => ({ t: 1e9, text: t })); render(); lines.children[0].classList.add("next");
    au.currentTime = 0; au.play(); $("#k-tap").disabled = false; $("#k-status").textContent = "Syncing — tap “Next line” when each line starts"; $("#k-tap").focus();
  });
  function tap() {
    if (!syncing || syncIdx >= rawLines.length) return;
    stamps[syncIdx] = au.currentTime; data[syncIdx].t = au.currentTime; lines.children[syncIdx].classList.remove("next"); syncIdx++; FX.pop(1.4);
    if (syncIdx < rawLines.length) lines.children[syncIdx].classList.add("next"); else finishSync();
  }
  function finishSync() {
    if (!syncing) return; syncing = false; $("#k-tap").disabled = true;
    data = data.filter((l) => l.t < 1e8); safe(() => localStorage.setItem("nj-lrc-" + cur.key, data.map((l) => fmt(l.t) + l.text).join("\n")));
    $("#k-status").textContent = "Saved on this device ✅ Press play to sing along"; FX.toast("🎤 Lyrics synced!"); FX.badge && FX.badge("synced"); au.pause(); au.currentTime = 0; render();
  }

  /* ---------- auto-sync: estimate phrase starts from the audio's energy ---------- */
  async function detectPhrases(ab) {
    const AC = window.AudioContext || window.webkitAudioContext; const ctx = new AC(); const buf = await ctx.decodeAudioData(ab); ctx.close && ctx.close();
    const sr = buf.sampleRate, ch = buf.getChannelData(0), hop = Math.floor(sr * 0.02), n = Math.floor(ch.length / hop);
    const env = new Float32Array(n); let prev = 0, hp = 0;
    for (let i = 0; i < n; i++) { let s = 0; for (let j = 0; j < hop; j += 2) { const x = ch[i * hop + j]; hp = x - prev * 0.97; prev = x; s += hp * hp; } env[i] = Math.log(1e-6 + Math.sqrt(s / (hop / 2))); }
    // smooth ~120ms
    const sm = new Float32Array(n), w = 3; for (let i = 0; i < n; i++) { let a = 0, c = 0; for (let k = -w; k <= w; k++) { const j = i + k; if (j >= 0 && j < n) { a += env[j]; c++; } } sm[i] = a / c; }
    // novelty: how much louder the next 0.4s is than the previous 0.4s
    const L = 20, nov = new Float32Array(n);
    for (let i = L; i < n - L; i++) { let a = 0, b = 0; for (let k = 1; k <= L; k++) { a += sm[i - k]; b += sm[i + k]; } nov[i] = (b - a) / L; }
    const peaks = []; for (let i = L; i < n - L; i++) if (nov[i] > 0.12 && nov[i] >= nov[i - 1] && nov[i] > nov[i + 1]) { if (peaks.length && i - peaks[peaks.length - 1].i < 60) { if (nov[i] > peaks[peaks.length - 1].v) peaks[peaks.length - 1] = { i, v: nov[i] }; } else peaks.push({ i, v: nov[i] }); }
    return { times: peaks.map((p) => ({ t: p.i * 0.02, v: p.v })), duration: buf.duration };
  }
  function assignLines(cands, N, dur) {
    const sorted = cands.slice().sort((a, b) => a.t - b.t); const strong = sorted.filter((c) => c.v > 0.2);
    const late = sorted.filter((c) => c.t > 3), start = (strong.find((c) => c.t > 3) || late[0] || { t: 8 }).t; const end = Math.max(start + N * 2, dur - 12); const step = (end - start) / N;
    const out = []; let last = start - 1;
    for (let i = 0; i < N; i++) {
      const e = start + i * step; let best = null, bd = step * 0.4;
      for (const c of sorted) { if (c.t <= last + 0.8) continue; const d = Math.abs(c.t - e); if (d < bd) { bd = d; best = c; } }
      const t = Math.max(last + 0.8, best ? best.t : e); out.push(+t.toFixed(2)); last = t;
    }
    return out;
  }
  function saveData() { safe(() => localStorage.setItem("nj-lrc-" + cur.key, data.map((l) => fmt(l.t) + l.text).join("\n"))); }
  function buildNudge() {
    const box = $("#k-nudge"); box.innerHTML = ""; $("#k-nudgebox").hidden = !data.length;
    data.forEach((l, i) => {
      const row = document.createElement("div"); row.className = "nj-row";
      row.innerHTML = `<button type="button" class="nb" data-d="-0.1" aria-label="Earlier">−</button><button type="button" class="nb" data-d="0.1" aria-label="Later">+</button><code>${fmt(l.t).slice(1, -1)}</code><span></span><button type="button" class="nb go" aria-label="Play from this line">▶</button>`;
      row.querySelector("span").textContent = l.text;
      row.addEventListener("click", (e) => {
        const b = e.target.closest("button"); if (!b) return;
        if (b.dataset.d) { l.t = Math.max(0, +(l.t + parseFloat(b.dataset.d)).toFixed(2)); row.querySelector("code").textContent = fmt(l.t).slice(1, -1); saveData(); }
        else { au.currentTime = Math.max(0, l.t - 0.3); au.play().catch(() => {}); }
      });
      box.appendChild(row);
    });
  }
  $("#k-auto").addEventListener("click", async () => {
    const txt = $("#k-text").value.split(/\r?\n/).map((s) => s.trim()).filter(Boolean); if (!txt.length) { FX.toast("Paste your lyrics first ✍️"); return; }
    if (!au.src) { FX.toast("No audio loaded for this disc"); return; }
    const st = $("#k-status"); st.textContent = "Listening to the song… 🎧"; $("#k-auto").disabled = true;
    try {
      const ab = await fetch(au.src).then((r) => { if (!r.ok) throw new Error("fetch"); return r.arrayBuffer(); });
      const { times, duration } = await detectPhrases(ab); const T = assignLines(times, txt.length, duration);
      data = txt.map((text, i) => ({ t: T[i], text })); saveData(); render(); buildNudge();
      st.textContent = "Auto-synced (estimate) — play it and nudge any line that's off ✨"; FX.toast("✨ Lyrics auto-synced!"); FX.badge && FX.badge("synced");
    } catch (e) { console.error(e); st.textContent = "Couldn't analyse that audio. Try the tap-to-sync instead."; }
    $("#k-auto").disabled = false;
  });

  /* ---------- instrumental switch ---------- */
  $("#k-inst").addEventListener("click", () => {
    if (!cur || !cur.inst) return; inst = !inst; $("#k-inst").textContent = "🎹 Instrumental: " + (inst ? "on" : "off");
    setAudio(0, null, { t: au.currentTime || 0, playing: !au.paused });
  });

  /* ---------- sing-along recording (mic + song mixed, stays on your device) ---------- */
  let actx = null, songNode = null, rec = null, micStream = null, chunks = [], recName = "";
  async function startRec() {
    if (!navigator.mediaDevices || !window.MediaRecorder) { FX.toast("Recording isn't supported in this browser"); return; }
    try { micStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); }
    catch (e) { $("#k-rechint").textContent = "Couldn't use the microphone — allow it in your browser and try again."; return; }
    const AC = window.AudioContext || window.webkitAudioContext; actx = actx || new AC(); await actx.resume();
    if (!songNode) { songNode = actx.createMediaElementSource(au); songNode.connect(actx.destination); }
    const dest = actx.createMediaStreamDestination(), micNode = actx.createMediaStreamSource(micStream), mg = actx.createGain(), sg = actx.createGain(); mg.gain.value = 1.2; sg.gain.value = 0.85;
    micNode.connect(mg); mg.connect(dest); songNode.connect(sg); sg.connect(dest);
    const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"]; const mime = types.find((t) => MediaRecorder.isTypeSupported(t)) || "";
    chunks = []; rec = new MediaRecorder(dest.stream, mime ? { mimeType: mime } : undefined); rec.__nodes = [micNode, mg, sg, dest];
    rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    rec.onstop = () => {
      const type = rec.mimeType || "audio/webm"; const blob = new Blob(chunks, { type }); const url = URL.createObjectURL(blob);
      $("#k-recplay").src = url; const a = $("#k-recdl"); a.href = url; a.download = "my-" + cur.key + "-sing-along." + (type.includes("mp4") ? "m4a" : type.includes("ogg") ? "ogg" : "webm"); $("#k-recout").hidden = false;
      try { rec.__nodes.forEach((n) => n.disconnect && n.disconnect()); songNode.connect(actx.destination); } catch (e) {} micStream.getTracks().forEach((t) => t.stop()); rec = null;
      $("#k-recbtn").textContent = "🎙 Record again"; $("#k-rechint").textContent = "Saved! Listen back or download it. It never leaves your device."; FX.badge && FX.badge("sing");
    };
    au.currentTime = 0; await au.play().catch(() => {}); rec.start(); $("#k-recbtn").textContent = "⏹ Stop recording"; $("#k-recbtn").classList.add("recording"); $("#k-rechint").textContent = "Recording… sing! 🎤"; $("#k-recout").hidden = true;
  }
  function stopRec(silent) {
    if (rec && rec.state !== "inactive") { if (silent) rec.onstop = () => { try { rec.__nodes.forEach((n) => n.disconnect && n.disconnect()); songNode.connect(actx.destination); } catch (e) {} micStream && micStream.getTracks().forEach((t) => t.stop()); rec = null; }; rec.stop(); }
    $("#k-recbtn").classList.remove("recording"); if (silent) { $("#k-recbtn").textContent = "🎙 Record my singing"; $("#k-rechint").textContent = "Wear headphones so the song doesn't leak into the mic. Recordings stay on your device."; }
  }
  $("#k-recbtn").addEventListener("click", () => { if (rec) { au.pause(); stopRec(false); } else startRec(); });
  au.addEventListener("ended", () => { if (rec) stopRec(false); });
  $("#k-tap").addEventListener("click", tap);
  addEventListener("keydown", (e) => { if (syncing && e.key === "Enter" && ov.classList.contains("open")) { e.preventDefault(); tap(); } });
  $("#k-export").addEventListener("click", () => {
    if (!data.length) { FX.toast("Nothing to export yet"); return; }
    const blob = new Blob([data.map((l) => fmt(l.t) + l.text).join("\n")], { type: "text/plain" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = cur.key + ".lrc"; a.click();
  });
  $("#k-file").addEventListener("change", async (e) => { const f = e.target.files[0]; if (!f) return; const txt = await f.text(); const parsed = parseLRC(txt); if (!parsed.length) { FX.toast("That file has no timestamps"); return; } safe(() => localStorage.setItem("nj-lrc-" + cur.key, txt)); data = parsed; render(); FX.toast("Lyrics loaded"); });
  $("#k-clear").addEventListener("click", () => { safe(() => localStorage.removeItem("nj-lrc-" + cur.key)); data = []; $("#k-text").value = ""; render(); loadLyrics(); });
})();
