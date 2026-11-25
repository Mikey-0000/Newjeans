/* Member page logic */
(function () {
  const key = document.body.dataset.member, M = window.MEMBERS, m = M[key], KEYS = Object.keys(M);
  FX.setTheme(key, true);
  const $ = FX.$;
  document.title = m.name + " · NewJeans Chat Archive";
  $("#m-photo").src = m.avatar; $("#m-photo").alt = m.name + " avatar";
  $("#m-name").textContent = m.name; $("#m-sub").textContent = m.emoji + " " + m.tagline;
  const box = $("#m-msgs");
  function add(l, instant) {
    const d = document.createElement("div"); d.className = "msg" + (instant ? "" : " live-in");
    const a = document.createElement("img"); a.className = "avatar hoverable"; a.src = m.avatar; a.alt = m.name + " avatar";
    const c = document.createElement("div"); c.className = "msg-content";
    const n = document.createElement("div"); n.className = "name"; n.textContent = m.name;
    const b = document.createElement("div"); b.className = "bubble" + (l.small ? " small" : ""); b.textContent = l.text; b.style.setProperty("--jc", m.soft);
    const t = document.createElement("span"); t.className = "time"; t.textContent = l.time;
    c.append(n, b, t); d.append(a, c); box.appendChild(d);
  }
  m.lines.forEach((l, i) => setTimeout(() => { add(l); FX.pop(1 + i * 0.15, "triangle"); }, 250 + i * 450));

  let n = 0;
  function poke() {
    const r = m.replies[Math.floor(Math.random() * m.replies.length)];
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
    add({ text: r, small: true, time: now }); FX.squish($("#m-photo")); FX.pop(1.3);
    const el = $("#m-photo").getBoundingClientRect();
    FX.burst(el.left + el.width / 2, el.top + el.height / 2, 6, [m.emoji, "💙", "✨"]);
    if (++n % 6 === 0) FX.rain([m.emoji, "🐰"], 20);
  }
  $("#m-photo").addEventListener("click", poke); $("#m-poke").addEventListener("click", poke);

  const nav = $("#m-nav");
  KEYS.forEach((k) => {
    const a = document.createElement("a"); a.href = M[k].page; a.className = "jelly" + (k === key ? " here" : ""); a.style.setProperty("--jc", M[k].color);
    a.setAttribute("aria-label", M[k].name); a.innerHTML = `<img src="${M[k].avatar}" alt="" />`; nav.appendChild(a);
  });
  const i = KEYS.indexOf(key);
  $("#m-prev").href = M[KEYS[(i + KEYS.length - 1) % KEYS.length]].page; $("#m-next").href = M[KEYS[(i + 1) % KEYS.length]].page;
})();
