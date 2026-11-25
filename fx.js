/* Shared effects: background, cursor, sparkles, jelly squish, sounds, toast, music player */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const rand = (a, b) => a + Math.random() * (b - a);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(pointer: fine)").matches;
  const safe = (fn) => { try { return fn(); } catch (e) { return null; } };

  const FX = (window.FX = {});
  FX.$ = $; FX.rand = rand; FX.safe = safe;

  /* ---------- theme (accent colour) ---------- */
  FX.setTheme = function (key, quiet) {
    const m = (window.MEMBERS || {})[key];
    const r = document.documentElement.style;
    if (!m) {
      r.setProperty("--accent", "#ff9ccf"); r.setProperty("--accent-soft", "#ffd9ec"); r.setProperty("--accent-dark", "#c2307f");
    } else {
      r.setProperty("--accent", m.color); r.setProperty("--accent-soft", m.soft); r.setProperty("--accent-dark", m.dark);
      if (!quiet) FX.toast(`${m.emoji} ${m.name} theme on!`);
    }
    safe(() => localStorage.setItem("nj-theme", key || ""));
  };

  /* ---------- sound ---------- */
  let ctx, muted = safe(() => localStorage.getItem("nj-muted")) === "1";
  FX.isMuted = () => muted;
  FX.setMuted = (v) => { muted = v; safe(() => localStorage.setItem("nj-muted", v ? "1" : "0")); };
  FX.pop = function (pitch = 1, type = "sine", dur = 0.13) {
    if (muted) return;
    safe(() => {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === "suspended") ctx.resume();
      const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime;
      o.type = type;
      o.frequency.setValueAtTime(320 * pitch, t);
      o.frequency.exponentialRampToValueAtTime(900 * pitch, t + dur * 0.8);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.16, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(ctx.destination);
      o.start(t); o.stop(t + dur + 0.02);
    });
  };

  /* ---------- particles ---------- */
  const EMOJI = ["⭐", "💿", "🐰", "🫧", "💛", "✨", "🧋", "🍬"];
  FX.burst = function (x, y, n = 8, set = EMOJI) {
    if (reduce) return;
    for (let i = 0; i < n; i++) {
      const p = document.createElement("div");
      p.className = "particle";
      p.textContent = set[Math.floor(Math.random() * set.length)];
      p.style.left = x + "px"; p.style.top = y + "px";
      document.body.appendChild(p);
      const a = rand(0, Math.PI * 2), d = rand(40, 120);
      p.animate(
        [
          { transform: "translate(-50%,-50%) scale(.3)", opacity: 1 },
          { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d - 30}px)) scale(1.2) rotate(${rand(-90, 90)}deg)`, opacity: 1, offset: 0.6 },
          { transform: `translate(calc(-50% + ${Math.cos(a) * d * 1.2}px), calc(-50% + ${Math.sin(a) * d + 40}px)) scale(.6)`, opacity: 0 }
        ],
        { duration: rand(700, 1100), easing: "cubic-bezier(.2,.8,.3,1)" }
      ).onfinish = () => p.remove();
    }
  };
  FX.rain = function (set = ["🐰", "💙", "✨", "🫧", "🧋"], count = 36) {
    if (reduce) return;
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const p = document.createElement("div");
        p.className = "particle";
        p.textContent = set[Math.floor(Math.random() * set.length)];
        p.style.left = rand(0, innerWidth) + "px"; p.style.top = "-40px"; p.style.fontSize = rand(24, 46) + "px";
        document.body.appendChild(p);
        p.animate(
          [{ transform: "translateY(0) rotate(0)" }, { transform: `translateY(${innerHeight + 80}px) rotate(${rand(-360, 360)}deg)` }],
          { duration: rand(1800, 3200), easing: "cubic-bezier(.4,0,.8,.6)" }
        ).onfinish = () => p.remove();
      }, i * 60);
    }
  };

  /* ---------- toast ---------- */
  let toastEl, toastT;
  FX.toast = function (text) {
    if (!toastEl) { toastEl = document.createElement("div"); toastEl.className = "toast jelly"; toastEl.setAttribute("role", "status"); document.body.appendChild(toastEl); }
    toastEl.textContent = text; toastEl.classList.add("show");
    clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove("show"), 2200);
  };

  /* ---------- jelly squish helper ---------- */
  FX.squish = function (el) {
    if (!el || reduce) return;
    el.classList.remove("wobble"); void el.offsetWidth; el.classList.add("wobble");
    el.addEventListener("animationend", () => el.classList.remove("wobble"), { once: true });
  };

  /* ---------- background layers ---------- */
  function buildBackground() {
    const blobs = document.createElement("div");
    blobs.className = "blobs";
    blobs.innerHTML = '<div class="blob b1"></div><div class="blob b2"></div><div class="blob b3"></div>';
    document.body.prepend(blobs);
    const dots = document.createElement("div"); dots.className = "dots"; document.body.prepend(dots);
    ["⭐", "💿", "🐰", "🫧", "💛", "✨"].forEach((e, i) => {
      const s = document.createElement("div");
      s.className = "sticker"; s.textContent = e;
      s.style.left = 8 + i * 17 + "%"; s.style.animationDelay = -i * 3 + "s"; s.style.animationDuration = 16 + i * 2 + "s";
      document.body.appendChild(s);
    });
  }

  /* ---------- bunny cursor ---------- */
  function buildCursor() {
    if (!finePointer) return;
    const c = document.createElement("img");
    c.id = "cursor"; c.src = "assets/bunny.png"; c.alt = ""; c.setAttribute("aria-hidden", "true");
    document.body.appendChild(c);
    document.body.classList.add("has-cursor");
    let tx = -100, ty = -100, x = -100, y = -100, lx = 0, ly = 0;
    addEventListener("mousemove", (e) => {
      tx = e.clientX; ty = e.clientY;
      const hot = e.target.closest && e.target.closest("button, a, input, .floater, .bubble, .progress, #lightstick");
      c.classList.toggle("hot", !!hot);
      if (Math.hypot(tx - lx, ty - ly) > 38) {
        lx = tx; ly = ty;
        const s = document.createElement("div");
        s.className = "particle"; s.style.fontSize = rand(12, 20) + "px";
        s.textContent = ["✨", "💙", "⭐", "🫧"][Math.floor(Math.random() * 4)];
        s.style.left = tx + "px"; s.style.top = ty + "px"; document.body.appendChild(s);
        s.animate([{ transform: "translate(-50%,-50%) scale(1)", opacity: 0.9 }, { transform: `translate(-50%, calc(-50% + 26px)) scale(.2) rotate(${rand(-120, 120)}deg)`, opacity: 0 }], { duration: 750 }).onfinish = () => s.remove();
      }
    });
    addEventListener("mousedown", () => c.classList.add("down"));
    addEventListener("mouseup", () => c.classList.remove("down"));
    (function loop() { x += (tx - x) * 0.28; y += (ty - y) * 0.28; c.style.left = x + "px"; c.style.top = y + "px"; requestAnimationFrame(loop); })();
  }

  /* ---------- global click: burst + wobble ---------- */
  function buildClicks() {
    addEventListener("pointerdown", (e) => {
      const jel = e.target.closest && e.target.closest(".jelly:not(.floater):not(.overlay):not(.card):not(.music-player)");
      if (jel && jel.tagName !== "INPUT") { FX.squish(jel); }
      if (e.target.closest && e.target.closest("button, a, .bubble, .floater, .avatar")) FX.pop(0.8 + Math.random() * 0.8);
      FX.burst(e.clientX, e.clientY, e.target.closest && e.target.closest(".fall") ? 0 : 6);
    });
  }

  /* ---------- music player ---------- */
  function buildPlayer() {
    const mp = document.createElement("div");
    mp.className = "music-player jelly"; mp.setAttribute("role", "region"); mp.setAttribute("aria-label", "Music player");
    mp.innerHTML = `
      <button class="jelly play-btn idle" id="mp-play" aria-label="Play music">▶</button>
      <div class="mp-title"><span>♫ Hype Boy</span><span class="bars" aria-hidden="true">${"<i></i>".repeat(6)}</span></div>
      <div class="mp-mid"><div class="progress" id="mp-prog" role="slider" aria-label="Seek" tabindex="0"><i></i></div><button class="mute" id="mp-mute" aria-label="Mute sound effects" title="Sound effects on/off">${muted ? "🔇" : "🔊"}</button></div>
      <div class="mp-status" id="mp-status" role="status" aria-live="polite">Press ▶ to play music</div>
      <audio id="bg-music" loop preload="metadata"><source src="music/Hype%20Boy.m4a" type="audio/mp4"></audio>`;
    document.body.appendChild(mp);
    const au = $("#bg-music"), btn = $("#mp-play"), status = $("#mp-status"), prog = $("#mp-prog"), bars = [...mp.querySelectorAll(".bars i")];
    let barT;
    const setUI = (playing) => {
      btn.textContent = playing ? "❚❚" : "▶"; btn.classList.toggle("idle", !playing); btn.setAttribute("aria-label", playing ? "Pause music" : "Play music");
      status.textContent = playing ? "♫ Playing" : "Paused — press ▶ to resume";
      clearInterval(barT);
      if (playing) barT = setInterval(() => bars.forEach((b) => (b.style.height = rand(4, 22) + "px")), 130);
      else bars.forEach((b) => (b.style.height = "4px"));
    };
    btn.addEventListener("click", () => {
      if (au.paused) au.play().catch(() => (status.textContent = "Couldn't play — check music/Hype Boy.m4a")); else au.pause();
    });
    au.addEventListener("play", () => { setUI(true); safe(() => sessionStorage.setItem("nj-play", "1")); });
    au.addEventListener("pause", () => { setUI(false); safe(() => sessionStorage.setItem("nj-play", "0")); });
    au.addEventListener("error", () => (status.textContent = "Audio could not load. Check music/Hype Boy.m4a"), true);
    au.addEventListener("timeupdate", () => { if (au.duration) $("i", prog).style.width = (au.currentTime / au.duration) * 100 + "%"; });
    const seek = (e) => { const r = prog.getBoundingClientRect(); if (au.duration) au.currentTime = ((e.clientX - r.left) / r.width) * au.duration; };
    prog.addEventListener("click", seek);
    prog.addEventListener("keydown", (e) => { if (e.key === "ArrowRight") au.currentTime += 5; if (e.key === "ArrowLeft") au.currentTime -= 5; });
    $("#mp-mute").addEventListener("click", (e) => { FX.setMuted(!muted); e.currentTarget.textContent = muted ? "🔇" : "🔊"; FX.toast(muted ? "Sound effects off" : "Sound effects on"); });

    // continue the song across pages
    const t = parseFloat(safe(() => sessionStorage.getItem("nj-time")) || "0");
    au.addEventListener("loadedmetadata", () => { if (t && t < au.duration) au.currentTime = t; }, { once: true });
    addEventListener("pagehide", () => safe(() => sessionStorage.setItem("nj-time", au.currentTime)));
    if (safe(() => sessionStorage.getItem("nj-play")) === "1") au.play().catch(() => {});
    FX.audio = au;
  }

  document.addEventListener("DOMContentLoaded", () => {
    buildBackground(); buildCursor(); buildClicks(); buildPlayer();
    const saved = safe(() => localStorage.getItem("nj-theme"));
    if (saved && !document.body.dataset.member) FX.setTheme(saved, true);
  });
})();
