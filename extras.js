/* Extras on every page: settings panel, night mode, bunny pet, page transitions, Konami code, PWA */
(function () {
  const { $, rand, safe } = FX;
  const body = document.body;
  const get = (k, d) => { const v = safe(() => localStorage.getItem(k)); return v == null ? d : v; };
  const set = (k, v) => safe(() => localStorage.setItem(k, v));
  const pages = [["index.html", "🏠 Home"], ["songs.html", "🎵 Song stories"], ["game.html", "🎮 Bunny Beat Jump"], ["concert.html", "🪄 Concert & lightstick"], ["photobooth.html", "📸 Photo booth"], ["wall.html", "💌 Fan wall"], ["daily.html", "🌟 Daily club"]];

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
    <label class="st-row"><span>🪄 Lightstick cursor</span><input type="checkbox" id="st-cur" /></label>
    <label class="st-row"><span>🧘 Reduce motion</span><input type="checkbox" id="st-rm" /></label>
    <label class="st-row"><span>🔎 Larger text</span><input type="checkbox" id="st-big" /></label>
    <button type="button" class="jelly st-install" id="st-install" hidden style="--jc:#d8f7ae">📲 Install as an app</button>
    <p class="st-ios" id="st-ios" hidden>📲 To install: tap <b>Share</b> then <b>Add to Home Screen</b>.</p>
    <label class="st-row"><span>🔊 UI sounds</span><input type="range" id="st-vol" min="0" max="1" step="0.05" aria-label="UI sound volume" /></label>`;
  body.append(gear, panel);
  $("#st-cur").checked = FX.cursorOn ? FX.cursorOn() : false; $("#st-cur").disabled = !FX.setCursor;
  $("#st-cur").addEventListener("change", (e) => { FX.setCursor && FX.setCursor(e.target.checked); FX.toast(e.target.checked ? "🪄 Lightstick cursor on" : "Normal cursor"); });
  $("#st-night").checked = FX.isNight(); $("#st-vol").value = FX.vol;
  $("#st-night").addEventListener("change", (e) => { applyNight(e.target.checked); if (e.target.checked) FX.badge("night"); FX.toast(e.target.checked ? "🌙 Night mode" : "☀️ Day mode"); FX.pop(e.target.checked ? 0.6 : 1.5); });
  $("#st-vol").addEventListener("input", (e) => { FX.vol = parseFloat(e.target.value); set("nj-vol", FX.vol); FX.pop(1.2); });
  const eggRow = document.createElement("div"); eggRow.className = "st-eggs"; eggRow.id = "st-eggs"; panel.appendChild(eggRow); const bRow = document.createElement("div"); bRow.className = "st-badges"; bRow.id = "st-badges"; panel.appendChild(bRow);
  gear.addEventListener("click", () => { panel.hidden = !panel.hidden; gear.setAttribute("aria-expanded", String(!panel.hidden)); gear.textContent = panel.hidden ? "🐰" : "✕"; });
  document.addEventListener("pointerdown", (e) => { if (!panel.hidden && !panel.contains(e.target) && e.target !== gear) { panel.hidden = true; gear.textContent = "🐰"; gear.setAttribute("aria-expanded", "false"); } });
  addEventListener("keydown", (e) => { if (e.key === "Escape" && !panel.hidden) { panel.hidden = true; gear.textContent = "🐰"; } });



  /* ---------- badges ---------- */
  const BADGES = [
    ["hello", "👋", "Hello bunny", "Visit the site"],
    ["game", "🎮", "Beat jumper", "Finish a song in Bunny Beat Jump"],
    ["legend", "🌟", "Bunny legend", "Collect 90% of the pearls in a song"],
    ["synced", "🎤", "Lyric wizard", "Sync lyrics in the Lyric lab"],
    ["sing", "🎙", "Studio bunny", "Record a sing-along"],
    ["listener", "🎧", "Music lover", "Listen to 3 different songs"],
    ["egg1", "🥚", "Egg hunter", "Find a secret"],
    ["egg6", "🏆", "Master hunter", "Find every secret"],
    ["booth", "📸", "Say cheese", "Save a photo from the Photo booth"],
    ["wall", "💌", "Dear bunnies", "Post on the Fan wall"],
    ["night", "🌙", "Night owl", "Switch on night mode"],
    ["chat", "💬", "Chatterbox", "Use a chat command"],
    ["streak3", "🔥", "On fire", "3-day check-in streak"],
    ["streak7", "💎", "Week of bunnies", "7-day check-in streak"],
    ["cards10", "🃏", "Card collector", "Collect 10 photo cards"],
    ["cardsall", "👑", "Full binder", "Complete the photo-card binder"],
    ["installed", "📲", "App bunny", "Install the site as an app"]
  ];
  FX.BADGES = BADGES;
  const gotB = () => { try { return JSON.parse(get("nj-badges", "[]")); } catch (err) { return []; } };
  FX.hasBadge = (id) => gotB().includes(id);
  FX.badge = function (id) {
    const b = BADGES.find((x) => x[0] === id); if (!b) return; const list = gotB(); if (list.includes(id)) return;
    list.push(id); set("nj-badges", JSON.stringify(list)); FX.toast("🏅 Badge: " + b[1] + " " + b[2]); FX.pop(1.8, "triangle"); renderBadgeCount();
    document.dispatchEvent(new CustomEvent("nj-badge", { detail: id }));
  };
  function renderBadgeCount() { const el = $("#st-badges"); if (el) el.innerHTML = `🏅 <a href="daily.html#badges">Badges: ${gotB().length}/${BADGES.length}</a>`; }
  FX.badge("hello");
  // sticker for CD hubs (unlocked by streaks on the Daily page)
  { const hub = get("nj-hub", ""); if (hub) document.documentElement.style.setProperty("--hub", JSON.stringify(hub)); }
  FX.setHub = (em) => { set("nj-hub", em); document.documentElement.style.setProperty("--hub", JSON.stringify(em || "🐰")); };

  /* ---------- accessibility: reduce motion, larger text, keyboard ---------- */
  const osRM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function applyRM(on) {
    body.classList.toggle("rm", on); FX.reduced = on; set("nj-rm", on ? "1" : "0");
  }
  function applyBig(on) { body.classList.toggle("big", on); set("nj-big", on ? "1" : "0"); }
  const _burst = FX.burst, _rain = FX.rain;
  if (_burst) FX.burst = function () { if (FX.reduced) return; return _burst.apply(this, arguments); };
  if (_rain) FX.rain = function (a, n) { if (FX.reduced) return; return _rain.call(this, a, n); };
  applyRM(get("nj-rm", osRM ? "1" : "0") === "1"); applyBig(get("nj-big", "0") === "1");
  $("#st-rm").checked = body.classList.contains("rm"); $("#st-big").checked = body.classList.contains("big");
  $("#st-rm").addEventListener("change", (e) => { applyRM(e.target.checked); FX.toast(e.target.checked ? "🧘 Motion reduced" : "Motion back on"); });
  $("#st-big").addEventListener("change", (e) => { applyBig(e.target.checked); FX.toast(e.target.checked ? "🔎 Larger text" : "Normal text size"); });

  // skip link + landmark
  const mainEl = document.querySelector("main"); if (mainEl) { mainEl.id = mainEl.id || "main"; mainEl.setAttribute("tabindex", "-1"); }
  const skip = document.createElement("a"); skip.className = "skip-link"; skip.href = "#" + (mainEl ? mainEl.id : "main"); skip.textContent = "Skip to content";
  skip.addEventListener("click", (e) => { if (mainEl) { e.preventDefault(); mainEl.focus(); mainEl.scrollIntoView({ block: "start" }); } });
  body.prepend(skip);
  // keyboard users get a clear focus ring; mouse users never see one
  addEventListener("keydown", (e) => { if (e.key === "Tab") body.classList.add("kbd"); });
  addEventListener("pointerdown", () => body.classList.remove("kbd"));
  // arrow keys move along rows of buttons (members, CDs)
  document.addEventListener("keydown", (e) => {
    if (!["ArrowLeft", "ArrowRight"].includes(e.key) || e.target.matches("input,textarea,select,[role=slider]")) return;
    const row = e.target.closest && e.target.closest(".member-grid, .cd-rack, .cd-row, .tv-list"); if (!row) return;
    const items = [...row.querySelectorAll("button")]; const i = items.indexOf(e.target.closest("button")); if (i < 0) return;
    e.preventDefault(); items[(i + (e.key === "ArrowRight" ? 1 : -1) + items.length) % items.length].focus();
  });
  // let the Escape key close the menu popup in the player
  addEventListener("keydown", (e) => { if (e.key === "Escape") { const m = document.getElementById("mp-menu"); if (m && !m.hidden) { m.hidden = true; } } });

  /* ---------- easter-egg hunt ---------- */
  const EGGS = [
    ["konami", "🎮", "Old-school code", "Try a famous cheat code on your keyboard…"],
    ["ditto", "🌙", "Say the magic word", "Type a certain song title while looking at the page."],
    ["credit", "💙", "Meet the maker", "Someone signed the home page. Give them a poke."],
    ["gear", "🐰", "Bunny button", "The bunny in the corner likes lots of attention."],
    ["sparkle", "✨", "Hidden sparkle", "One page has a faint sparkle hiding near an edge."],
    ["spin", "💿", "Disc jockey", "Keep tapping a spinning CD."]
  ];
  const found = () => { try { return JSON.parse(get("nj-eggs", "[]")); } catch (e) { return []; } };
  function renderEggs() {
    const f = found(); const el = $("#st-eggs"); if (!el) return;
    el.innerHTML = `<b>🥚 Secrets found: ${f.length}/${EGGS.length}</b><div class="egg-row">${EGGS.map(([k, em, nm, hint]) => `<span class="egg ${f.includes(k) ? "got" : ""}" title="${f.includes(k) ? nm : hint}" aria-label="${f.includes(k) ? nm + " found" : "Hint: " + hint}">${f.includes(k) ? em : "❔"}</span>`).join("")}</div>${f.length < EGGS.length ? `<small>Hover a ❔ for a hint.</small>` : `<small>You found them all! 🏆</small>`}`;
  }
  FX.egg = function (k) {
    const f = found(); if (f.includes(k)) return; const e = EGGS.find((x) => x[0] === k); if (!e) return;
    f.push(k); set("nj-eggs", JSON.stringify(f)); renderEggs(); FX.badge("egg1"); if (f.length === EGGS.length) FX.badge("egg6");
    FX.toast(e[1] + " Secret found: " + e[2] + " (" + f.length + "/" + EGGS.length + ")"); FX.pop(2, "triangle");
    if (!FX.reduced) FX.rain([e[1], "✨", "🥚"], 24);
    if (f.length === EGGS.length) setTimeout(() => { FX.toast("🏆 All secrets found! You're a true Bunny!"); FX.party && FX.party(); }, 1200);
  };
  renderEggs(); renderBadgeCount();
  // 2: type "ditto" outside text fields
  let typed = "";
  addEventListener("keydown", (e) => { if (e.target.matches && e.target.matches("input,textarea,select")) return; if (e.key.length === 1) { typed = (typed + e.key.toLowerCase()).slice(-5); if (typed === "ditto") FX.egg("ditto"); } });
  // 3: the credit tag
  document.addEventListener("click", (e) => { if (e.target.closest && e.target.closest("#credit")) FX.egg("credit"); });
  // 4: bunny gear x7
  let gc = 0, gt; gear.addEventListener("click", () => { gc++; clearTimeout(gt); gt = setTimeout(() => (gc = 0), 2500); if (gc >= 7) { gc = 0; FX.egg("gear"); } });
  // 6: tap CDs 10 times
  let sc = 0, st; document.addEventListener("click", (e) => { if (e.target.closest && e.target.closest(".cd-disc, .cd-item, .k-disc")) { sc++; clearTimeout(st); st = setTimeout(() => (sc = 0), 4000); if (sc >= 10) { sc = 0; FX.egg("spin"); } } });
  // 5: a faint sparkle on one page
  { const spots = { "index.html": [97, 62], "songs.html": [3, 88], "wall.html": [95, 90], "photobooth.html": [4, 70], "game.html": [96, 40], "concert.html": [4, 45] }; const sp = spots[here] || [3, 92];
    const b = document.createElement("button"); b.className = "egg-sparkle"; b.type = "button"; b.textContent = "✨"; b.setAttribute("aria-label", "A hidden sparkle");
    b.style.left = sp[0] + "%"; b.style.top = sp[1] + "%"; b.addEventListener("click", () => { b.classList.add("popped"); FX.egg("sparkle"); }); body.appendChild(b); }
  // 1: Konami (hook existing party)

  /* ---------- loading screen (once per visit) ---------- */
  if (!safe(() => sessionStorage.getItem("nj-loaded"))) {
    safe(() => sessionStorage.setItem("nj-loaded", "1"));
    const ld = document.createElement("div"); ld.className = "loader"; ld.setAttribute("role", "status"); ld.setAttribute("aria-label", "Loading");
    ld.innerHTML = `<div class="ld-stage"><img class="ld-cd" src="assets/cd-howsweet.png" alt="" /><img class="ld-bunny" src="assets/bunny.png" alt="" /></div><b class="ld-text">Loading<span>.</span><span>.</span><span>.</span></b><div class="ld-bar"><i></i></div>`;
    body.appendChild(ld);
    const t0 = performance.now(); let gone = false;
    const hide = () => { if (gone) return; gone = true; ld.classList.add("out"); setTimeout(() => ld.remove(), 600); };
    const done = () => setTimeout(hide, Math.max(0, 900 - (performance.now() - t0)));
    if (document.readyState === "complete") done(); else addEventListener("load", done, { once: true });
    setTimeout(hide, 4500);
  }

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
    if (ci === code.length) { ci = 0; party(); FX.egg && FX.egg("konami"); }
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

  /* ---------- install prompt ---------- */
  { const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone; let dip = null;
    const inst = $("#st-install"), ios = $("#st-ios");
    if (!standalone && /iphone|ipad|ipod/i.test(navigator.userAgent)) ios.hidden = false;
    addEventListener("beforeinstallprompt", (ev) => { ev.preventDefault(); dip = ev; if (!standalone) inst.hidden = false; });
    inst.addEventListener("click", async () => { if (!dip) return; dip.prompt(); try { const r = await dip.userChoice; if (r.outcome === "accepted") { FX.toast("📲 Installed! Find the bunny on your home screen"); FX.badge && FX.badge("installed"); } } catch (e) {} dip = null; inst.hidden = true; });
    addEventListener("appinstalled", () => { inst.hidden = true; FX.badge && FX.badge("installed"); }); }

  /* ---------- PWA ---------- */
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) navigator.serviceWorker.register("sw.js").catch(() => {});
})();
