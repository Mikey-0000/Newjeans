/* Home page logic: live chat, replies, reactions, members, floaters, lightstick, boba game */
(function () {
  const { $, rand, safe } = FX;
  const M = window.MEMBERS, KEYS = Object.keys(M);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- wobbly logo ---------- */
  const logo = $("#logo");
  function letters(text, parent) {
    [...text].forEach((c) => {
      const s = document.createElement("span");
      if (c === " ") { s.className = "sp"; } else { s.className = "ch"; s.textContent = c; }
      parent.appendChild(s);
    });
  }
  letters("NewJeans", logo);
  const sub = document.createElement("span"); sub.className = "sub"; letters("Chat Archive", sub); logo.appendChild(sub);
  let logoClicks = 0;
  logo.addEventListener("pointerover", (e) => {
    const ch = e.target.closest(".ch");
    if (ch && !ch.classList.contains("wobble")) FX.squish(ch);
  });
  logo.addEventListener("click", (e) => {
    const ch = e.target.closest(".ch"); if (ch) FX.squish(ch);
    if (++logoClicks >= 5) { logoClicks = 0; FX.rain(); FX.toast("🐰 Bunny shower!"); }
  });

  /* ---------- chat ---------- */
  const chat = $("#live-chat"), typing = $("#typing"), typingName = $("#typing-name");
  const hhmm = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  let paused = false, lastRow = null, lastSpeaker = null, busy = false;

  function addMessage({ key, text, me }) {
    const m = key ? M[key] : null;
    const row = document.createElement("div");
    row.className = "msg live-in" + (me ? " me" : "");
    const av = document.createElement("img");
    av.className = "avatar hoverable"; av.alt = me ? "You" : m.name + " avatar";
    av.src = me ? "assets/bunny.png" : m.avatar;
    if (me) av.style.background = "#fff";
    else { av.style.cursor = "pointer"; av.addEventListener("click", () => openProfile(key)); }
    const box = document.createElement("div"); box.className = "msg-content";
    const nm = document.createElement("div"); nm.className = "name"; nm.textContent = me ? "You" : m.name;
    const b = document.createElement("div"); b.className = "bubble small"; b.textContent = text;
    if (!me) b.style.setProperty("--jc", m.soft);
    const tm = document.createElement("span"); tm.className = "time"; tm.textContent = hhmm();
    const rx = document.createElement("div"); rx.className = "reactions";
    const bar = document.createElement("div"); bar.className = "react-bar";
    ["💙", "😂", "🧋", "✨", "🐰"].forEach((em) => {
      const bt = document.createElement("button"); bt.type = "button"; bt.textContent = em; bt.setAttribute("aria-label", "React " + em);
      bt.addEventListener("click", (ev) => { ev.stopPropagation(); react(rx, em); row.classList.remove("react-open"); FX.burst(ev.clientX, ev.clientY, 5, [em]); });
      bar.appendChild(bt);
    });
    b.addEventListener("click", () => {
      const open = !row.classList.contains("react-open");
      chat.querySelectorAll(".react-open").forEach((r) => r.classList.remove("react-open"));
      row.classList.toggle("react-open", open);
    });
    b.addEventListener("dblclick", (ev) => { react(rx, "💙"); FX.burst(ev.clientX, ev.clientY, 6, ["💙"]); });
    box.append(nm, b, rx, tm);
    row.append(av, box, bar);
    chat.appendChild(row);
    while (chat.children.length > 60) chat.removeChild(chat.firstChild);
    chat.scrollTop = chat.scrollHeight;
    lastRow = { row, rx };
  }
  function react(container, emoji) {
    let chip = [...container.children].find((c) => c.dataset.e === emoji);
    if (chip) { chip.dataset.n = +chip.dataset.n + 1; }
    else { chip = document.createElement("span"); chip.className = "chip"; chip.dataset.e = emoji; chip.dataset.n = 1; container.appendChild(chip); }
    chip.textContent = chip.dataset.n > 1 ? `${emoji} ${chip.dataset.n}` : emoji;
    FX.pop(1.3);
  }

  function say(key, text, delay = 1200) {
    return new Promise((res) => {
      typingName.textContent = M[key].name; typing.classList.remove("hidden");
      setTimeout(() => { typing.classList.add("hidden"); addMessage({ key, text }); FX.pop(1.1, "triangle"); res(); }, delay);
    });
  }

  // starter messages + randomised, personality-driven chatter
  CHAT_LINES.slice(0, 3).forEach(([k, t]) => addMessage({ key: k, text: t }));
  lastSpeaker = "danielle";
  setTimeout(async () => {
    if (busy) return; busy = true;
    const best = parseInt(safe(() => localStorage.getItem("nj-best")) || "0", 10) || 0;
    if (userName) {
      await say("minji", `${timeGreeting()}, ${userName}! 💙`, 900);
      if (best > 0) await say("hanni", `your boba high score is ${best}, can you beat it?? 🧋`, 900);
      else await say("hyein", `${userName}, have you played the Bunny Beat Jump game yet?`, 900);
    } else {
      await say("minji", `${timeGreeting()}, bunny! ✨`, 900); await say("danielle", "what should we call you? type your name!", 900); expectName = true;
    }
    busy = false;
  }, 2600);
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const recentText = [];
  function freshLine(k) {
    const pl = personalLine(); if (pl) return pl;
    const pool = VOICE[k].concat(M[k].replies, FX.isNight() ? NIGHT[k].concat(NIGHT[k]) : []);
    for (let i = 0; i < 6; i++) { const t = pick(pool); if (!recentText.includes(t)) { recentText.push(t); if (recentText.length > 14) recentText.shift(); return t; } }
    return pick(pool);
  }
  async function playThread() {
    const th = pick(THREADS);
    for (const [k, t] of th) { await say(k, t, rand(800, 1500)); lastSpeaker = k; await new Promise((r) => setTimeout(r, rand(200, 600))); }
  }
  async function ambientOnce() {
    if (busy || paused || document.hidden) return;
    busy = true;
    const r = Math.random();
    try {
      if (r < 0.22) await playThread();
      else if (r < 0.34 && lastRow) { // a member reacts to the last message
        const k = pick(KEYS.filter((x) => x !== lastSpeaker)); react(lastRow.rx, pick(["💙", "😂", "✨", "🧋", "🐰", "💛"])); FX.pop(1.3);
      } else {
        const k = pick(KEYS.filter((x) => x !== lastSpeaker)); await say(k, freshLine(k), rand(700, 1300)); lastSpeaker = k;
        if (Math.random() < 0.3) { const k2 = pick(KEYS.filter((x) => x !== k)); await say(k2, freshLine(k2), rand(700, 1200)); lastSpeaker = k2; }
      }
    } finally { busy = false; }
  }
  (function loopAmbient() { setTimeout(() => { ambientOnce().finally(loopAmbient); }, rand(1600, 3400)); })();

  /* ---------- the bunnies remember you ---------- */
  let userName = safe(() => localStorage.getItem("nj-name")) || "";
  let memory = JSON.parse(safe(() => localStorage.getItem("nj-mem")) || "[]");
  let expectName = false;
  const saveMem = () => safe(() => localStorage.setItem("nj-mem", JSON.stringify(memory.slice(-6))));
  const NIGHT = {
    minji: ["it's so late, are you drinking water? 💧", "late-night thoughts hit different ✨", "the moon is out, say hi 🌙"],
    hanni: ["why are we awake... boba at midnight is a mood", "midnight snack time 🧋", "..............sleepy"],
    danielle: ["night owls unite 🦉", "late-night chats are the best 💛", "stars are out, so are we ✨"],
    haerin: ["night is better. quiet.", "meow. 🌙", "the cat is awake. unfortunately."],
    hyein: ["3am thoughts: are clouds just sky socks?", "aliens are most active at night 👽", "ghost hours, let's go 🛸"]
  };
  function timeGreeting() { const h = new Date().getHours(); return h < 5 ? "it's so late" : h < 12 ? "good morning" : h < 18 ? "good afternoon" : h < 22 ? "good evening" : "good night"; }
  function nameFromText(text) {
    const m = text.match(/(?:my name is|i am|i'm|im|call me)\s+([A-Za-z][A-Za-z\-']{1,15})/i);
    if (m) return m[1];
    if (expectName && /^[A-Za-z][A-Za-z\-' ]{0,15}$/.test(text.trim()) && text.trim().split(/\s+/).length <= 2) return text.trim();
    return "";
  }
  function personalLine() {
    const r = Math.random();
    if (userName && r < 0.35) return pick([`${userName}!! 💙`, `hi ${userName}, we missed you`, `${userName} is here! everyone say hi`, `${userName}, you okay? ✨`, `${userName}, tell us about your day`, `we love you, ${userName} 🐰`]);
    if (memory.length && r < 0.55) { const m = pick(memory); return pick([`wait, ${userName || "you"} said "${m}" earlier, I'm still thinking about that`, `going back to "${m}" — honestly relatable`, `ok but ${userName || "bunny"}, about "${m}"...`]); }
    return null;
  }

  // keyword brain for replies
  function pickReplies(text) {
    const t = text.toLowerCase();
    const named = KEYS.find((k) => t.includes(k));
    if (named) return [named];
    const rules = [
      [/boba|bubble|tea|pearl|🧋/, ["hanni", "danielle"]],
      [/meow|cat|kitty|🐱/, ["haerin"]],
      [/alien|👽|pizza|random/, ["hyein"]],
      [/sweet|sparkle|dream|soft|✨/, ["minji"]],
      [/sun|hehe|ditto|☀/, ["danielle"]],
      [/hype boy|music|song|bop/, ["hyein", "minji"]],
      [/love|💙|💛|<3|bunn|cute/, ["minji", "danielle", "hanni"]],
      [/hi|hello|hey/, ["minji", "hyein"]]
    ];
    for (const [re, who] of rules) if (re.test(t)) return who;
    return [KEYS[Math.floor(Math.random() * KEYS.length)]];
  }
  const SPECIAL = {
    ditto: ["Oh say it ditto :)", "danielle"],
    "hype boy": ["Hype Boy!! turn it up 🎵", "hyein"],
    eta: ["What's your ETA?", "haerin"]
  };
  async function userSays(text) {
    text = text.trim(); if (!text) return;
    addMessage({ me: true, text }); FX.pop(1.5); paused = true; busy = true;
    const nm = nameFromText(text);
    if (nm && !userName) {
      userName = nm[0].toUpperCase() + nm.slice(1); safe(() => localStorage.setItem("nj-name", userName)); expectName = false;
      await say("minji", `nice to meet you, ${userName}!! 💙`, 900); await say("danielle", `${userName}!! welcome to the chat 🐰`, 800);
      paused = false; busy = false; return;
    }
    if (text.length > 8 && text.length < 80) { memory.push(text); saveMem(); }
    const low = text.toLowerCase();
    const sp = Object.keys(SPECIAL).find((k) => low.includes(k));
    const who = sp ? [SPECIAL[sp][1]] : pickReplies(text);
    for (let i = 0; i < Math.min(who.length, 2); i++) {
      const k = who[i];
      const pool = M[k].replies.concat(VOICE[k]);
      const line = sp && i === 0 ? SPECIAL[sp][0] : pool[Math.floor(Math.random() * pool.length)];
      await say(k, line, 900 + i * 500);
    }
    paused = false; busy = false;
  }
  $("#composer").addEventListener("submit", (e) => { e.preventDefault(); const i = $("#msg-input"); const v = i.value; i.value = ""; userSays(v); });
  $("#quick").addEventListener("click", (e) => { const b = e.target.closest("[data-say]"); if (b) userSays(b.dataset.say); });
  $("#msg-input").addEventListener("input", () => (paused = true));
  $("#msg-input").addEventListener("blur", () => (paused = false));

  /* ---------- online avatars + member buttons ---------- */
  KEYS.forEach((k) => {
    const im = document.createElement("img"); im.src = M[k].avatar; im.alt = ""; $("#online-stack").appendChild(im);
    const b = document.createElement("button");
    b.className = "jelly member-btn"; b.style.setProperty("--jc", M[k].color); b.setAttribute("aria-label", "Open " + M[k].name + " profile");
    b.innerHTML = `<img src="${M[k].avatar}" alt="" /><span class="tag">${M[k].name}</span>`;
    b.addEventListener("click", () => { FX.setTheme(k); openProfile(k); });
    $("#members").appendChild(b);
  });

  /* ---------- profile modal ---------- */
  const pOv = $("#profile-overlay");
  let currentKey = null;
  function openProfile(key) {
    const m = M[key]; currentKey = key;
    $("#pf-img").src = m.avatar; $("#pf-name").textContent = m.name; $("#pf-tag").textContent = m.emoji + " " + m.tagline;
    $("#pf-link").href = m.page; $("#pf-link").style.setProperty("--jc", m.color);
    $("#pf-poke").style.setProperty("--jc", m.soft);
    $("#pf-summary").textContent = m.summary;
    renderShelf($("#pf-shelf")); renderJourney($("#pf-journey"), m, 3);
    const box = $("#pf-msgs"); box.innerHTML = "";
    m.lines.forEach((l) => {
      const d = document.createElement("div"); d.className = "msg"; d.style.margin = "10px 0";
      const c = document.createElement("div"); c.className = "msg-content";
      const b = document.createElement("div"); b.className = "bubble small"; b.textContent = l.text; b.style.setProperty("--jc", m.soft);
      c.appendChild(b); d.appendChild(c); box.appendChild(d);
    });
    openOverlay(pOv);
  }
  $("#pf-poke").addEventListener("click", () => {
    const m = M[currentKey], pool = m.replies.concat(VOICE[currentKey]), r = pool[Math.floor(Math.random() * pool.length)];
    const d = document.createElement("div"); d.className = "msg live-in"; d.style.margin = "10px 0";
    const c = document.createElement("div"); c.className = "msg-content";
    const b = document.createElement("div"); b.className = "bubble small"; b.textContent = r; b.style.setProperty("--jc", m.color);
    c.appendChild(b); d.appendChild(c); $("#pf-msgs").appendChild(d);
    FX.squish($("#pf-img"));
  });

  function openOverlay(o) { o.classList.add("open"); o.setAttribute("aria-hidden", "false"); }
  function closeOverlay(o) { o.classList.remove("open"); o.setAttribute("aria-hidden", "true"); if (o.id === "game-overlay") endGame(true); }
  document.querySelectorAll(".overlay").forEach((o) => {
    o.addEventListener("click", (e) => { if (e.target === o || e.target.closest("[data-close]")) closeOverlay(o); });
  });
  addEventListener("keydown", (e) => { if (e.key === "Escape") document.querySelectorAll(".overlay.open").forEach(closeOverlay); });

  /* ---------- bunny love counter ---------- */
  let love = parseInt(safe(() => localStorage.getItem("nj-love")) || "0", 10) || 0;
  const loveEl = $("#love-count"); loveEl.textContent = love;
  $("#love-btn").addEventListener("click", (e) => {
    love++; loveEl.textContent = love; safe(() => localStorage.setItem("nj-love", love));
    const r = e.currentTarget.getBoundingClientRect();
    FX.burst(r.left + r.width / 2, r.top, 7, ["💙", "💛", "💗", "🐰"]); FX.pop(1 + (love % 10) / 12);
    if (love % 25 === 0) { FX.rain(["💙", "🐰"], 24); FX.toast(`🎉 ${love} hearts!`); if (!busy) { busy = true; say(pick(KEYS), `${love} hearts?! ${userName ? userName + ", " : ""}you really love us 🥹`, 900).then(() => (busy = false)); } }
  });

  $("#rain-btn").addEventListener("click", () => FX.rain());

  /* ---------- draggable floating jelly bubbles with physics ---------- */
  const FLOATS = ["boba!!! 🧋", "hehe", "와", "Music is the FUTURE!!", "bubble tea time", "Meow >.<", "alien mode 👽", "How Sweet 🍬", "ditto :)", "✨"];
  const layer = $("#floaters"), bodies = [];
  const colors = ["#d8f7ae", "#ffb3dc", "#a9e5ff", "#fff4a8", "#dccaff"];
  FLOATS.slice(0, innerWidth < 640 ? 5 : FLOATS.length).forEach((t, i) => {
    const el = document.createElement("div");
    el.className = "floater jelly"; el.textContent = t; el.style.setProperty("--jc", colors[i % colors.length]);
    layer.appendChild(el);
    const b = { el, x: rand(0, innerWidth - 120), y: rand(0, innerHeight - 60), vx: rand(-.7, .7) || .4, vy: rand(-.6, .6) || .3, drag: false, w: 0, h: 0 };
    bodies.push(b);
    let ox = 0, oy = 0, lastX = 0, lastY = 0, lastT = 0;
    el.addEventListener("pointerdown", (e) => {
      e.stopPropagation(); b.drag = true; el.classList.add("drag"); el.setPointerCapture(e.pointerId);
      ox = e.clientX - b.x; oy = e.clientY - b.y; lastX = e.clientX; lastY = e.clientY; lastT = performance.now();
      FX.squish(el); FX.pop(1.4);
    });
    el.addEventListener("pointermove", (e) => {
      if (!b.drag) return;
      const now = performance.now(), dt = Math.max(1, now - lastT);
      b.vx = ((e.clientX - lastX) / dt) * 16; b.vy = ((e.clientY - lastY) / dt) * 16;
      lastX = e.clientX; lastY = e.clientY; lastT = now;
      b.x = e.clientX - ox; b.y = e.clientY - oy;
    });
    const up = () => { if (!b.drag) return; b.drag = false; el.classList.remove("drag"); };
    el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
  });
  function measure() { bodies.forEach((b) => { b.w = b.el.offsetWidth; b.h = b.el.offsetHeight; }); }
  measure(); addEventListener("resize", measure);
  let skew = 0;
  (function tick() {
    for (const b of bodies) {
      if (!b.drag && !reduce) {
        b.x += b.vx; b.y += b.vy;
        const sp = Math.hypot(b.vx, b.vy);
        if (sp > 1.2) { b.vx *= 0.985; b.vy *= 0.985; }
        else if (sp < 0.35) { b.vx += rand(-.05, .05); b.vy += rand(-.05, .05); }
        if (b.x < 0) { b.x = 0; b.vx = Math.abs(b.vx); FX.squish(b.el); }
        if (b.x > innerWidth - b.w) { b.x = innerWidth - b.w; b.vx = -Math.abs(b.vx); FX.squish(b.el); }
        if (b.y < 0) { b.y = 0; b.vy = Math.abs(b.vy); FX.squish(b.el); }
        if (b.y > innerHeight - b.h) { b.y = innerHeight - b.h; b.vy = -Math.abs(b.vy); FX.squish(b.el); }
      }
      b.el.style.transform = `translate(${b.x}px, ${b.y}px)`;
    }
    requestAnimationFrame(tick);
  })();
  $("#shuffle-btn").addEventListener("click", () => {
    bodies.forEach((b) => { b.vx = rand(-12, 12); b.vy = rand(-12, 12); FX.squish(b.el); }); FX.toast("🫧 Wheee!");
  });

  /* ---------- lightstick concert mode ---------- */
  const ls = $("#lightstick");
  function concert() {
    const on = document.body.classList.toggle("concert");
    FX.toast(on ? "💙 Concert mode ON — start the music!" : "Concert mode off");
    if (on) { FX.rain(["💙", "⭐", "✨"], 30); if (FX.audio && FX.audio.paused) FX.audio.play().catch(() => {}); }
    $("#ls-tip").textContent = on ? "click to stop" : "click me ✨";
  }
  ls.addEventListener("click", concert);
  ls.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); concert(); } });

  /* ---------- Boba Pop game ---------- */
  const gOv = $("#game-overlay"), arena = $("#arena"), gMsg = $("#g-msg");
  let score = 0, time = 20, spawnT, clockT, running = false;
  let best = parseInt(safe(() => localStorage.getItem("nj-best")) || "0", 10) || 0; $("#g-best").textContent = best;
  $("#game-btn").addEventListener("click", () => { openOverlay(gOv); gMsg.classList.remove("hidden"); $("#g-msg-text").textContent = "Pop 🧋 +1 and ⭐ +3. Dodge 🌶️ (−2)!"; });
  $("#g-start").addEventListener("click", startGame);
  function startGame() {
    score = 0; time = 20; running = true; $("#g-score").textContent = 0; $("#g-time").textContent = time; gMsg.classList.add("hidden");
    arena.querySelectorAll(".fall").forEach((n) => n.remove());
    spawnT = setInterval(spawn, 420);
    clockT = setInterval(() => { time--; $("#g-time").textContent = time; if (time <= 0) endGame(); }, 1000);
  }
  function spawn() {
    const r = Math.random(), kind = r < 0.1 ? "⭐" : r < 0.27 ? "🌶️" : "🧋";
    const el = document.createElement("button");
    el.type = "button"; el.className = "fall"; el.textContent = kind; el.setAttribute("aria-label", kind === "🌶️" ? "chili, avoid" : "pop");
    el.style.left = rand(2, 88) + "%"; el.style.animationDuration = rand(2.4, 4.2) + "s";
    el.addEventListener("pointerdown", (e) => {
      e.stopPropagation(); if (!running || el.classList.contains("pop")) return;
      const d = kind === "⭐" ? 3 : kind === "🌶️" ? -2 : 1;
      score = Math.max(0, score + d); $("#g-score").textContent = score;
      el.classList.add("pop"); setTimeout(() => el.remove(), 300);
      const br = el.getBoundingClientRect();
      FX.burst(br.left + br.width / 2, br.top + br.height / 2, 5, d > 0 ? ["🫧", "✨", "💙"] : ["💥", "😵"]);
      FX.pop(d > 0 ? 1.2 + d / 8 : 0.4, d > 0 ? "sine" : "sawtooth");
    });
    el.addEventListener("animationend", () => el.remove());
    arena.appendChild(el);
  }
  function endGame(silent) {
    if (!running && silent) return;
    running = false; clearInterval(spawnT); clearInterval(clockT);
    arena.querySelectorAll(".fall").forEach((n) => n.remove());
    if (silent) return;
    const newBest = score > best;
    if (newBest) { best = score; safe(() => localStorage.setItem("nj-best", best)); $("#g-best").textContent = best; FX.rain(["🧋", "⭐"], 20); }
    $("#g-msg-text").textContent = `${newBest ? "🎉 New best! " : ""}You scored ${score}. ${score > 25 ? "Boba legend!" : score > 12 ? "Nice pops!" : "Try again!"}`;
    $("#g-start").textContent = "Play again"; gMsg.classList.remove("hidden");
  }
})();
