(function () {
  const { $, rand, safe } = FX;
  const logo = $("#logo"); [..."Dear"].forEach((c) => { const s = document.createElement("span"); s.className = "ch"; s.textContent = c; logo.appendChild(s); });
  const sub = document.createElement("span"); sub.className = "sub"; [..."Bunnies"].forEach((c) => { const s = document.createElement("span"); s.className = "ch"; s.textContent = c; sub.appendChild(s); }); logo.appendChild(sub);
  logo.addEventListener("pointerover", (e) => { const c = e.target.closest(".ch"); if (c) FX.squish(c); });
  const COLS = ["#ffb3dc", "#a9e5ff", "#d8f7ae", "#fff4a8", "#dccaff"]; let col = COLS[0];
  COLS.forEach((c, i) => { const b = document.createElement("button"); b.type = "button"; b.className = "jelly wc"; b.style.setProperty("--jc", c); b.setAttribute("role", "radio"); b.setAttribute("aria-checked", i === 0); b.setAttribute("aria-label", "colour " + (i + 1)); b.addEventListener("click", () => { col = c; $("#wcolors").querySelectorAll("button").forEach((x) => x.setAttribute("aria-checked", x === b)); FX.pop(1 + i * 0.15); }); $("#wcolors").appendChild(b); });
  const SEED = [["Minji", "thank you for being here 💙"], ["Hanni", "boba for everyone 🧋"], ["Danielle", "you're doing great ☀️"], ["Haerin", "meow."], ["Hyein", "hello from the moon 👽"]].map(([n, t], i) => ({ n, t, c: COLS[i % 5], seed: true }));
  let mine = JSON.parse(safe(() => localStorage.getItem("nj-wall")) || "[]");
  const stage = $("#stage");
  function bubble(m, delay) {
    const el = document.createElement("button"); el.type = "button"; el.className = "jelly wb"; el.style.setProperty("--jc", m.c);
    el.style.left = rand(2, 72) + "%"; el.style.animationDuration = rand(16, 30) + "s"; el.style.animationDelay = (delay != null ? delay : -rand(0, 20)) + "s";
    const n = document.createElement("b"); n.textContent = m.n ? m.n : "A bunny"; const t = document.createElement("span"); t.textContent = m.t; el.append(n, t);
    el.addEventListener("click", (e) => { FX.pop(1.6, "triangle"); FX.burst(e.clientX, e.clientY, 7, ["🫧", "✨", "💙"]); el.classList.toggle("big"); });
    stage.appendChild(el);
  }
  SEED.concat(mine).forEach((m) => bubble(m));
  $("#wf").addEventListener("submit", (e) => { FX.badge && FX.badge("wall");
    e.preventDefault(); const t = $("#wmsg").value.trim(); if (!t) return;
    const m = { n: $("#wname").value.trim(), t, c: col }; mine.push(m); mine = mine.slice(-40); safe(() => localStorage.setItem("nj-wall", JSON.stringify(mine)));
    bubble(m, 0); $("#wmsg").value = ""; FX.pop(1.8, "triangle"); FX.rain(["🫧", "💙", "✨"], 10); FX.toast("Your note is floating up! 🫧");
  });
  $("#wclear").addEventListener("click", () => { mine = []; safe(() => localStorage.removeItem("nj-wall")); stage.innerHTML = ""; SEED.forEach((m) => bubble(m)); FX.toast("Cleared"); });
})();
