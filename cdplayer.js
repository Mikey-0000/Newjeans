/* CD shelf + karaoke. Lyrics are never bundled: they come from your own .lrc files or text you paste. */
(function () {
  const { $, safe } = FX;
  const DISCS = [
    { key: "ditto", title: "Ditto", img: "assets/cd-ditto.png", audio: ["music/ditto.m4a", "music/Ditto.m4a", "music/ditto.mp3"] },
    { key: "howsweet", title: "How Sweet", img: "assets/cd-howsweet.png", audio: ["music/how-sweet.mp3", "music/How Sweet.mp3", "music/How%20Sweet.mp3", "music/howsweet.mp3", "music/how-sweet.m4a", "music/How%20Sweet.m4a"] }
  ];
  const rack = $("#cd-rack"), ov = $("#cd-overlay"), au = $("#k-audio"), lines = $("#k-lines");
  let cur = null, data = [], active = -1, rafId = 0, syncing = false, syncIdx = 0, stamps = [], rawLines = [];

  DISCS.forEach((d, i) => {
    const b = document.createElement("button"); b.type = "button"; b.className = "cd-disc"; b.setAttribute("aria-label", "Play " + d.title);
    b.innerHTML = `<img src="${d.img}" alt="" /><span>${d.title}</span>`; b.querySelector("img").style.animationDuration = 7 + i * 3 + "s";
    b.addEventListener("click", () => open(d)); rack.appendChild(b);
  });

  const fmt = (t) => { const m = Math.floor(t / 60), s = t - m * 60; return `[${String(m).padStart(2, "0")}:${s.toFixed(2).padStart(5, "0")}]`; };
  function parseLRC(txt) {
    const out = []; txt.split(/\r?\n/).forEach((ln) => { const m = ln.match(/^\s*\[(\d+):(\d+(?:\.\d+)?)\]\s*(.*)$/); if (m && m[3].trim()) out.push({ t: +m[1] * 60 + parseFloat(m[2]), text: m[3].trim() }); });
    return out.sort((a, b) => a.t - b.t);
  }
  function render() {
    lines.innerHTML = "";
    if (!data.length) { const p = document.createElement("p"); p.className = "hint"; p.style.textAlign = "center"; p.textContent = "No lyrics loaded yet. Open the Lyric lab to add your own, or put lyrics/" + cur.key + ".lrc in the repo."; lines.appendChild(p); return; }
    data.forEach((l, i) => { const d = document.createElement("div"); d.className = "k-line"; d.dataset.i = i; d.textContent = l.text; lines.appendChild(d); });
    active = -1;
  }
  async function loadLyrics() {
    const saved = safe(() => localStorage.getItem("nj-lrc-" + cur.key)); if (saved) { data = parseLRC(saved); render(); return; }
    try { const r = await fetch("lyrics/" + cur.key + ".lrc"); if (r.ok) { data = parseLRC(await r.text()); render(); return; } } catch (e) {}
    data = []; render();
  }
  function setAudio(i) {
    const list = cur.audio; if (i >= list.length) { $("#k-status").textContent = `No audio found. Add your file as ${list[0].replace(/%20/g, " ")} (a copy of a song you own).`; $("#k-play").disabled = true; return; }
    au.onerror = () => setAudio(i + 1); au.src = list[i]; au.load(); $("#k-play").disabled = false; $("#k-status").textContent = "Ready — press play 🎵";
  }
  function open(d) {
    cur = d; if (FX.audio) FX.audio.pause();
    $("#k-title").textContent = d.title; $("#k-disc").src = d.img; $("#k-disc").classList.remove("playing"); $("#k-labpanel").hidden = true; syncing = false;
    $("#k-text").value = (safe(() => localStorage.getItem("nj-lrc-" + d.key)) ? parseLRC(localStorage.getItem("nj-lrc-" + d.key)).map((x) => x.text).join("\n") : "");
    setAudio(0); loadLyrics(); ov.classList.add("open"); ov.setAttribute("aria-hidden", "false"); FX.pop(1.3, "triangle");
  }
  function close() { au.pause(); cancelAnimationFrame(rafId); ov.classList.remove("open"); ov.setAttribute("aria-hidden", "true"); }
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
    $("#k-status").textContent = "Saved on this device ✅ Press play to sing along"; FX.toast("🎤 Lyrics synced!"); au.pause(); au.currentTime = 0; render();
  }
  $("#k-tap").addEventListener("click", tap);
  addEventListener("keydown", (e) => { if (syncing && e.key === "Enter" && ov.classList.contains("open")) { e.preventDefault(); tap(); } });
  $("#k-export").addEventListener("click", () => {
    if (!data.length) { FX.toast("Nothing to export yet"); return; }
    const blob = new Blob([data.map((l) => fmt(l.t) + l.text).join("\n")], { type: "text/plain" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = cur.key + ".lrc"; a.click();
  });
  $("#k-file").addEventListener("change", async (e) => { const f = e.target.files[0]; if (!f) return; const txt = await f.text(); const parsed = parseLRC(txt); if (!parsed.length) { FX.toast("That file has no timestamps"); return; } safe(() => localStorage.setItem("nj-lrc-" + cur.key, txt)); data = parsed; render(); FX.toast("Lyrics loaded"); });
  $("#k-clear").addEventListener("click", () => { safe(() => localStorage.removeItem("nj-lrc-" + cur.key)); data = []; $("#k-text").value = ""; render(); loadLyrics(); });
})();
