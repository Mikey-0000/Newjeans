/* Music video theatre: YouTube embeds, your own video files, or videos listed in videos/videos.json */
(function () {
  const $ = (s) => document.querySelector(s);
  const screen = $("#tv-screen"), list = $("#tv-list"), note = $("#tv-note");
  if (!screen) return;
  let blobUrl = null;

  const pauseMusic = () => { try { if (FX.audio && !FX.audio.paused) FX.audio.pause(); } catch (e) {} };
  const ytId = (u) => {
    u = (u || "").trim(); if (/^[\w-]{11}$/.test(u)) return u;
    try {
      const x = new URL(u.startsWith("http") ? u : "https://" + u), h = x.hostname.replace(/^www\.|^m\./, "");
      if (h === "youtu.be") return x.pathname.slice(1, 12);
      if (h.endsWith("youtube.com") || h.endsWith("youtube-nocookie.com")) {
        if (x.searchParams.get("v")) return x.searchParams.get("v").slice(0, 11);
        const m = x.pathname.match(/\/(embed|shorts|live)\/([\w-]{11})/); if (m) return m[2];
      }
    } catch (e) {}
    return null;
  };
  const clear = () => { screen.innerHTML = ""; if (blobUrl) { URL.revokeObjectURL(blobUrl); blobUrl = null; } };
  const mark = (btn) => list.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b === btn));

  function playYT(id, btn) {
    clear(); pauseMusic(); mark(btn);
    const f = document.createElement("iframe");
    f.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0&playsinline=1";
    f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen"; f.allowFullscreen = true; f.title = "Music video";
    screen.appendChild(f); note.textContent = "";
  }
  function playFile(src, btn, isBlob) {
    clear(); pauseMusic(); mark(btn);
    const v = document.createElement("video"); v.controls = true; v.playsInline = true; v.autoplay = true; v.src = src;
    v.addEventListener("error", () => { note.textContent = "Couldn't load that video — check the file name in the videos folder."; });
    if (isBlob) blobUrl = src;
    screen.appendChild(v); v.play().catch(() => {}); note.textContent = "";
  }

  $("#tv-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const id = ytId($("#tv-url").value);
    if (!id) { note.textContent = "That doesn't look like a YouTube link. Try copying it from the Share button."; return; }
    playYT(id, null); FX.toast && FX.toast("Now playing 🎬");
  });
  $("#tv-file").addEventListener("change", (e) => {
    const f = e.target.files[0]; if (!f) return;
    playFile(URL.createObjectURL(f), null, true); note.textContent = "Playing from your device: " + f.name + " (not uploaded anywhere).";
  });

  // videos you list yourself in videos/videos.json: [{ "title": "Ditto", "youtube": "ID or link" }, { "title": "How Sweet", "file": "videos/how-sweet.mp4" }]
  const colors = ["#ffb3dc", "#d8f7ae", "#dccaff", "#fff4a8", "#bfe6ff"];
  fetch("videos/videos.json", { cache: "no-cache" }).then((r) => (r.ok ? r.json() : [])).catch(() => []).then((items) => {
    if (!Array.isArray(items) || !items.length) { list.innerHTML = '<p class="hint">Add your videos to <b>videos/videos.json</b> to get quick-pick buttons here, or paste a link / pick a file below.</p>'; return; }
    items.forEach((it, i) => {
      const b = document.createElement("button"); b.type = "button"; b.className = "jelly"; b.style.setProperty("--jc", colors[i % colors.length]);
      b.textContent = "▶ " + it.title;
      b.addEventListener("click", () => { const id = it.youtube && ytId(it.youtube); if (id) playYT(id, b); else if (it.file) playFile(it.file, b); });
      list.appendChild(b);
    });
  });
})();
