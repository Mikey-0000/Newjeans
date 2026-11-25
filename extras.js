/* Extras on every page: settings panel, night mode, bunny pet, page transitions, Konami code, PWA */
(function () {
  const { $, rand, safe } = FX;
  const body = document.body;
  const get = (k, d) => { const v = safe(() => localStorage.getItem(k)); return v == null ? d : v; };
  const set = (k, v) => safe(() => localStorage.setItem(k, v));
  const pages = [["index.html", "🏠 Home"], ["songs.html", "🎵 Song stories"], ["game.html", "🎮 Bunny Beat Jump"], ["concert.html", "🪄 Concert & lightstick"], ["photobooth.html", "📸 Photo booth"], ["wall.html", "💌 Fan wall"]];

  /* ---------- night mode ---------- */
  function applyNight(on) {
    body.classList.toggle("night", on); set("nj-night", on ? "1" : "0");
    const tc = document.querySelector('meta[name="theme-color"]'); if (tc) tc.content = on ? "#1b1840" : "#ff9ccf";
  }
  FX.isNight = () => body.classList.contains("night");
  const stars = document.createElement("div"); stars.className = "stars"; stars.setAttribute("aria-hidden", "true");
  for (let i = 0; i < 40; i++) { const s = document.createElement("i"); s.style.cssText = `left:${rand(0, 100)}%;top:${rand(0, 100)}%;animation-delay:${rand(0, 4)}s;scale:${rand(.5, 1.4)}`; stars.appendChild(s); }
  body.prepend(stars);
  let nightPref = get("nj-night", null);
  if (nightPref == null) { const h = new Date().getHours(); nightPref = h >= 21 || h < 6 ? "1" : "0"; }
  applyNight(nightPref === "1");

  /* ---------- settings panel ---------- */
  const gear = document.createElement("button");
  gear.className = "jelly gear"; gear.type = "button"; gear.setAttribute("aria-label", "Menu and settings"); gear.setAttribute("aria-expanded", "false"); gear.textContent = "🐰";
  const panel = document.createElement("div"); panel.className = "settings jelly"; panel.hidden = true; panel.setAttribute("role", "dialog"); panel.setAttribute("aria-label", "Menu and settings");
  const here = location.pathname.split("/").pop() || "index.html";
  panel.innerHTML = `
    <div class="st-links">${pages.map(([h, t]) => `<a class="jelly st-link${h === here ? " here" : ""}" href="${h}">${t}</a>`).join("")}</div>
    <label class="st-row"><span>🌙 Night mode</span><input type="checkbox" id="st-night" /></label>
    <label class="st-row"><span>🔊 UI sounds</span><input type="range" id="st-vol" min="0" max="1" step="0.05" aria-label="UI sound volume" /></label>`;
  body.append(gear, panel);
  $("#st-night").checked = FX.isNight(); $("#st-vol").value = FX.vol;
  $("#st-night").addEventListener("change", (e) => { applyNight(e.target.checked); FX.toast(e.target.checked ? "🌙 Night mode" : "☀️ Day mode"); FX.pop(e.target.checked ? 0.6 : 1.5); });
  $("#st-vol").addEventListener("input", (e) => { FX.vol = parseFloat(e.target.value); set("nj-vol", FX.vol); FX.pop(1.2); });
  gear.addEventListener("click", () => { panel.hidden = !panel.hidden; gear.setAttribute("aria-expanded", String(!panel.hidden)); gear.textContent = panel.hidden ? "🐰" : "✕"; });
  document.addEventListener("pointerdown", (e) => { if (!panel.hidden && !panel.contains(e.target) && e.target !== gear) { panel.hidden = true; gear.textContent = "🐰"; gear.setAttribute("aria-expanded", "false"); } });
  addEventListener("keydown", (e) => { if (e.key === "Escape" && !panel.hidden) { panel.hidden = true; gear.textContent = "🐰"; } });

  /* ---------- page transitions ---------- */
  const wipe = document.createElement("div"); wipe.className = "wipe"; wipe.innerHTML = "<i></i>"; body.appendChild(wipe);
  if (get("nj-wipe", "0") === "1") { set("nj-wipe", "0"); wipe.classList.add("reveal"); wipe.addEventListener("animationend", () => wipe.classList.remove("reveal"), { once: true }); }
  document.addEventListener("click", (e) => {
    const a = e.target.closest && e.target.closest("a[href]");
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === "_blank" || a.hasAttribute("download")) return;
    const u = new URL(a.href, location.href); if (u.origin !== location.origin || (u.pathname === location.pathname && u.hash) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    e.preventDefault(); set("nj-wipe", "1"); wipe.classList.add("go"); FX.whoosh();
    // navigate quickly; if anything goes wrong, clear the overlay so the page never gets stuck
    setTimeout(() => { try { location.assign(u.href); } catch (err) { wipe.classList.remove("go"); } }, 320);
    setTimeout(() => wipe.classList.remove("go"), 4000);
  });
  addEventListener("pageshow", (e) => { if (e.persisted) wipe.classList.remove("go"); });

  /* ---------- Konami code ---------- */
  const code = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "KeyB", "KeyA"]; let ci = 0;
  addEventListener("keydown", (e) => {
    ci = e.code === code[ci] ? ci + 1 : (e.code === code[0] ? 1 : 0);
    if (ci === code.length) { ci = 0; party(); }
  });
  function party() {
    FX.toast("🎉 Secret bunny party unlocked!"); FX.rain(["🐰", "💿", "🧋", "⭐", "💙", "✨"], 70);
    for (let i = 0; i < 9; i++) {
      const b = document.createElement("img"); b.src = "assets/bunny.png"; b.className = "dancer"; b.alt = ""; b.style.left = 5 + i * 11 + "%"; b.style.animationDelay = i * 0.12 + "s"; body.appendChild(b);
      setTimeout(() => b.remove(), 6000);
    }
    FX.pop(1.6, "triangle"); setTimeout(() => FX.pop(2, "triangle"), 160); setTimeout(() => FX.pop(2.4, "triangle"), 320);
  }
  FX.party = party;

  /* ---------- PWA ---------- */
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) navigator.serviceWorker.register("sw.js").catch(() => {});
})();
