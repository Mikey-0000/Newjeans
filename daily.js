/* Daily club: check-in streak, fortune, photo-card pulls, sticker box, trophy shelf, countdown calendar. All saved on this device. */
(function () {
  const { $, rand, safe } = FX;
  const M = window.MEMBERS, KEYS = Object.keys(M);
  const get = (k, d) => { const v = safe(() => localStorage.getItem(k)); return v == null ? d : v; };
  const set = (k, v) => safe(() => localStorage.setItem(k, v));
  const J = (k, d) => { try { return JSON.parse(get(k, "")) || d; } catch (e) { return d; } };
  const ymd = (d) => d.toLocaleDateString("en-CA");
  const today = () => ymd(new Date());
  const yesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return ymd(d); };

  /* wobbly title */
  const logo = $("#logo"); [..."Daily"].forEach((c) => { const s = document.createElement("span"); s.className = "ch"; s.textContent = c; logo.appendChild(s); });
  const sub = document.createElement("span"); sub.className = "sub"; [..."Club"].forEach((c) => { const s = document.createElement("span"); s.className = "ch"; s.textContent = c; sub.appendChild(s); }); logo.appendChild(sub);
  logo.addEventListener("pointerover", (e) => { const c = e.target.closest(".ch"); if (c) FX.squish(c); });

  /* ---------- fortunes (original lines) ---------- */
  const FORTUNES = [
    "A tiny win is hiding in your afternoon. Look for it. 🍀", "Someone is about to smile because of something you said. 💙", "Today's lucky snack: anything boba-shaped. 🧋",
    "You will hum a song and not know why. That's the universe vibing. 🎵", "Be a little bit brave before lunch. 🐰", "A good playlist is closer than you think. 🎧",
    "Soft shoes, soft heart, big day. 👟", "Your next idea arrives while you're not looking for it. 💡", "Say hi first. The bunnies would. 👋",
    "Water the plant, drink the water, repeat. 🌱", "A message from an old friend is on its way. 💌", "Today is a good day to start the thing. ✨",
    "Don't skip the sunny spot. ☀️", "A small detour leads somewhere sweet. 🍬", "You are allowed to take it slow today. 🐢",
    "Dance in the kitchen. No one's judging. 💃", "The answer you want comes after a short walk. 🚶", "Lucky number: the one on your favourite jersey. 🔢",
    "Tonight's sky has a surprise. Check it. 🌙", "Be kind to the version of you from yesterday. 🫶", "Something you made will make someone's day. 🎨",
    "A cup of something warm fixes more than you'd think. ☕", "Stretch. Seriously. Right now. 🤸", "Today's vibe: jelly. Bendy, bouncy, hard to break. 🫧",
    "A song you forgot you loved comes back around. 💿", "You'll find exactly what you needed in the last place you look. 🔍", "Compliments are free. Spend generously. 💝",
    "Your laugh is today's best sound effect. 😆", "Try the other flavour. 🍓", "Keep going. The chorus is coming. 🎶", "Pack an umbrella of good luck. ☔",
    "A tiny bunny believes in you. 🐇", "Tidy one drawer. Feel ten times lighter. 🗂", "Your next favourite thing is one click away. 🖱", "Today, be the lightstick in somebody's crowd. 🪄"
  ];
  const hashStr = (s) => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };

  /* ---------- cards ---------- */
  const THEMES = [["Everyday", "🧋", "C"], ["Sunny Day", "☀️", "C"], ["Stage Lights", "🎤", "R"], ["Moonlit", "🌙", "H"]];
  const CARDS = []; KEYS.forEach((k) => THEMES.forEach(([t, st, r], i) => CARDS.push({ id: k + "-" + i, key: k, title: t, sticker: st, rar: r, img: M[k].avatar, color: M[k].color, name: M[k].name })));
  CARDS.push({ id: "secret-0", key: "secret", title: "Secret Bunny", sticker: "🐰", rar: "H", img: "images/bunny.jpg", color: "#a9e5ff", name: "Bunny" });
  const RN = { C: "Common", R: "Rare", H: "Holo" };
  const owned = () => J("nj-cards", {});
  function cardEl(c, n) {
    const el = document.createElement("div"); el.className = "pcard r" + c.rar; el.style.setProperty("--c", c.color);
    el.innerHTML = `<div class="pc-img"><img src="${c.img}" alt="" /></div><b>${c.name}</b><small>${c.title}</small><i class="pc-st">${c.sticker}</i><span class="pc-r">${RN[c.rar]}</span>${n > 1 ? `<span class="pc-n">×${n}</span>` : ""}`;
    return el;
  }
  function renderBinder() {
    const o = owned(), box = $("#binder"); box.innerHTML = "";
    CARDS.forEach((c) => {
      const n = o[c.id] || 0; const slot = document.createElement("div"); slot.className = "slot" + (n ? " got" : "");
      if (n) slot.appendChild(cardEl(c, n)); else { slot.innerHTML = `<div class="pcard blank" aria-label="Not collected yet"><div class="pc-img">❔</div><small>${c.key === "secret" ? "???" : c.name}</small></div>`; }
      box.appendChild(slot);
    });
    const have = CARDS.filter((c) => o[c.id]).length; $("#binder-count").textContent = `${have}/${CARDS.length}`;
    if (have >= 10) FX.badge("cards10"); if (have === CARDS.length) FX.badge("cardsall");
  }
  function pull(label) {
    const roll = Math.random() * 100, rar = roll < 58 ? "C" : roll < 88 ? "R" : "H";
    const pool = CARDS.filter((c) => c.rar === rar); const c = pool[Math.floor(Math.random() * pool.length)];
    const o = owned(), isNew = !o[c.id]; o[c.id] = (o[c.id] || 0) + 1; set("nj-cards", JSON.stringify(o));
    const stage = $("#pull"); stage.innerHTML = "";
    const wrap = document.createElement("div"); wrap.className = "pull-wrap"; wrap.innerHTML = `<div class="flip"><div class="back">🐰</div><div class="front"></div></div><p class="pull-msg">${label} ${isNew ? "<b>NEW!</b>" : "(duplicate ×" + o[c.id] + ")"}</p>`;
    wrap.querySelector(".front").appendChild(cardEl(c, 0)); stage.appendChild(wrap);
    setTimeout(() => { wrap.classList.add("turn"); FX.pop(c.rar === "H" ? 2.4 : 1.6, "triangle"); if (c.rar !== "C") FX.rain([c.sticker, "✨", "💙"], c.rar === "H" ? 40 : 18); }, 350);
    renderBinder(); return c;
  }

  /* ---------- check-in ---------- */
  const MILES = [[3, "🍓"], [7, "🌸"], [14, "💎"], [30, "👑"]];
  const state = () => J("nj-streak", { last: "", n: 0 });
  function renderTop() {
    const s = state(), live = s.last === today() || s.last === yesterday();
    $("#streak").textContent = "🔥 " + (live ? s.n : 0); $("#streak-sub").textContent = s.n === 1 && live ? "day streak" : "day streak";
    const tok = parseInt(get("nj-tokens", "0"), 10) || 0; $("#tok").textContent = "🎟 " + tok; $("#bonus").hidden = tok < 1;
    const done = s.last === today(); const b = $("#checkin"); b.disabled = done; b.textContent = done ? "✅ Checked in — see you tomorrow!" : "✨ Check in";
    if (done) { const f = $("#fortune"); f.hidden = false; f.textContent = FORTUNES[hashStr(today()) % FORTUNES.length]; }
    renderStickers();
  }
  $("#checkin").addEventListener("click", () => {
    const s = state(); if (s.last === today()) return;
    s.n = s.last === yesterday() ? s.n + 1 : 1; s.last = today(); set("nj-streak", JSON.stringify(s));
    if (s.n >= 3) FX.badge("streak3"); if (s.n >= 7) FX.badge("streak7");
    const best = Math.max(s.n, parseInt(get("nj-streak-best", "0"), 10) || 0); set("nj-streak-best", best);
    let msg = "Day " + s.n + "! ";
    if (s.n % 7 === 0) { set("nj-tokens", (parseInt(get("nj-tokens", "0"), 10) || 0) + 1); msg += "🎟 Bonus pull earned! "; }
    const unlocked = MILES.find(([n]) => n === s.n); if (unlocked) msg += unlocked[1] + " sticker unlocked! ";
    FX.toast("🔥 " + msg); renderTop(); pull("Today's card:");
  });
  $("#bonus").addEventListener("click", () => { const t = parseInt(get("nj-tokens", "0"), 10) || 0; if (t < 1) return; set("nj-tokens", t - 1); renderTop(); pull("Bonus card:"); });

  /* ---------- stickers ---------- */
  function renderStickers() {
    const best = Math.max(state().n, parseInt(get("nj-streak-best", "0"), 10) || 0), cur = get("nj-hub", "🐰") || "🐰", box = $("#stickers"); box.innerHTML = "";
    [[0, "🐰"], ...MILES].forEach(([n, em]) => {
      const ok = best >= n, b = document.createElement("button"); b.type = "button"; b.className = "jelly stk"; b.disabled = !ok; b.setAttribute("role", "radio"); b.setAttribute("aria-checked", String(cur === em));
      b.style.setProperty("--jc", cur === em ? "#ffb3dc" : "#fff"); b.innerHTML = ok ? em : `🔒<small>${n}d</small>`; b.setAttribute("aria-label", ok ? "Sticker " + em : "Locked until a " + n + "-day streak");
      b.addEventListener("click", () => { FX.setHub(em); FX.toast("Sticker set " + em); renderStickers(); }); box.appendChild(b);
    });
  }

  /* ---------- trophies ---------- */
  function renderTrophies() {
    const got = J("nj-badges", []), box = $("#trophies"); box.innerHTML = "";
    FX.BADGES.forEach(([id, em, name, desc]) => {
      const ok = got.includes(id), d = document.createElement("div"); d.className = "trophy" + (ok ? " got" : ""); d.title = desc;
      d.innerHTML = `<span class="te">${ok ? em : "🔒"}</span><b>${name}</b><small>${desc}</small>`; box.appendChild(d);
    });
    $("#badge-count").textContent = `${got.length}/${FX.BADGES.length}`;
  }
  document.addEventListener("nj-badge", renderTrophies);

  /* ---------- calendar ---------- */
  const MON = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
  const parse = (s) => { const m = s.match(/(\w{3})\w*\s+(\d+),\s*(\d{4})/); return m ? { y: +m[3], mo: MON[m[1]], d: +m[2] } : null; };
  function baseEvents() {
    const ev = []; KEYS.forEach((k) => { const p = parse(M[k].born || ""); if (p) ev.push({ name: M[k].name + "'s birthday", em: "🎂", ...p, yearly: true, kind: "bday" }); });
    (window.ALBUMS || []).forEach((a) => { const p = parse(a.date || ""); if (p) ev.push({ name: a.title + " release", em: a.emoji || "💿", ...p, yearly: true, kind: "rel" }); });
    J("nj-events", []).forEach((e, i) => { const [y, mo, d] = e.date.split("-").map(Number); ev.push({ name: e.name, em: "⭐", y, mo: mo - 1, d, yearly: !!e.yearly, kind: "mine", idx: i }); });
    return ev;
  }
  const DAY = 86400000;
  function nextOcc(e) {
    const now = new Date(); const t0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (!e.yearly) { const t = new Date(e.y, e.mo, e.d); return { date: t, days: Math.round((t - t0) / DAY) }; }
    let t = new Date(t0.getFullYear(), e.mo, e.d); if (t < t0) t = new Date(t0.getFullYear() + 1, e.mo, e.d);
    return { date: t, days: Math.round((t - t0) / DAY) };
  }
  const ord = (n) => { const v = n % 100; return n + (["th", "st", "nd", "rd"][(v - 20) % 10] || ["th", "st", "nd", "rd"][v] || "th"); };
  function renderCal() {
    const list = baseEvents().map((e) => ({ ...e, ...nextOcc(e) })).filter((e) => e.days >= 0).sort((a, b) => a.days - b.days);
    const label = (e) => { const yrs = e.date.getFullYear() - e.y; return e.yearly && yrs > 0 ? (e.kind === "bday" ? `turns ${yrs}` : `${ord(yrs)} anniversary`) : ""; };
    const when = (e) => (e.days === 0 ? "TODAY! 🎉" : e.days === 1 ? "tomorrow" : "in " + e.days + " days");
    const n = list[0]; $("#nextup").innerHTML = n ? `<span class="nu-em">${n.em}</span><div><small>Next up</small><b>${n.name}</b><span>${when(n)} · ${n.date.toLocaleDateString(undefined, { day: "numeric", month: "long" })} ${label(n) ? "· " + label(n) : ""}</span></div>` : "Add a date below!";
    const box = $("#cal"); box.innerHTML = "";
    list.slice(0, 14).forEach((e) => {
      const r = document.createElement("div"); r.className = "cal-row" + (e.days === 0 ? " today" : ""); r.innerHTML = `<span>${e.em}</span><b></b><small>${label(e)}</small><em>${when(e)}</em>`; r.querySelector("b").textContent = e.name;
      if (e.kind === "mine") { const x = document.createElement("button"); x.type = "button"; x.className = "cal-x"; x.textContent = "✕"; x.setAttribute("aria-label", "Remove " + e.name); x.addEventListener("click", () => { const a = J("nj-events", []); a.splice(e.idx, 1); set("nj-events", JSON.stringify(a)); renderCal(); }); r.appendChild(x); }
      box.appendChild(r);
    });
  }
  $("#cal-form").addEventListener("submit", (ev) => {
    ev.preventDefault(); const a = J("nj-events", []); a.push({ name: $("#ev-name").value.trim(), date: $("#ev-date").value, yearly: $("#ev-yr").checked }); set("nj-events", JSON.stringify(a)); $("#ev-name").value = ""; FX.toast("📅 Added!"); renderCal();
  });

  renderTop(); renderBinder(); renderTrophies(); renderCal();
  // test hooks
  FX.__daily = { pull, CARDS };
})();
