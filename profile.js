/* Shared renderers: spinning CD shelf, flip-card photo gallery, idol-journey timeline */
(function () {
  const el = (t, c, txt) => { const e = document.createElement(t); if (c) e.className = c; if (txt != null) e.textContent = txt; return e; };

  window.renderShelf = function (host, accent) {
    host.innerHTML = "";
    const row = el("div", "cd-row");
    const info = el("div", "cd-info jelly");
    const show = (a, disc) => {
      row.querySelectorAll(".cd-item").forEach((i) => i.classList.remove("active"));
      disc.classList.add("active");
      info.style.setProperty("--jc", a.color);
      info.innerHTML = "";
      info.append(el("b", "", `${a.emoji} ${a.title}`), el("span", "", ` · ${a.type} · ${a.date}`), el("p", "", a.blurb));
      const ol = el("ol", "tracks"); a.tracks.forEach((t) => ol.appendChild(el("li", "", t))); info.appendChild(ol);
    };
    ALBUMS.forEach((a, i) => {
      const item = el("button", "cd-item"); item.type = "button"; item.setAttribute("aria-label", `${a.title}, ${a.type}`);
      item.style.setProperty("--c", a.color);
      const cd = el("div", "cd"); cd.style.animationDuration = 5 + i * 1.3 + "s";
      const lab = el("div", "cd-label", a.emoji); cd.appendChild(lab);
      item.append(cd, el("span", "cd-title", a.title), el("span", "cd-date", a.date));
      item.addEventListener("click", () => { show(a, item); FX.pop(1 + i * 0.12, "triangle"); const r = item.getBoundingClientRect(); FX.burst(r.left + r.width / 2, r.top + 30, 5, [a.emoji, "✨"]); });
      row.appendChild(item);
      if (i === 0) setTimeout(() => show(a, item), 0);
    });
    host.append(row, info);
  };

  window.renderGallery = function (host, m) {
    host.innerHTML = "";
    const wrap = el("div", "polaroids");
    const looks = [
      { f: "none", cap: "everyday bunny", sticker: "🐰", rot: -4 },
      { f: "saturate(1.4) contrast(1.05)", cap: m.tagline, sticker: m.emoji, rot: 3 },
      { f: "sepia(.35) saturate(1.2) hue-rotate(-12deg)", cap: "film mode 📷", sticker: "⭐", rot: -2 }
    ];
    looks.forEach((l, i) => {
      const card = el("button", "polaroid"); card.type = "button"; card.style.setProperty("--rot", l.rot + "deg");
      card.setAttribute("aria-label", "Flip photo to read a fact about " + m.name);
      const inner = el("div", "pol-inner");
      const front = el("div", "pol-face pol-front");
      const img = document.createElement("img"); img.src = m.avatar; img.alt = m.name; img.style.filter = l.f; img.loading = "lazy";
      front.append(el("span", "tape"), img, el("span", "pol-cap", l.cap), el("span", "pol-sticker", l.sticker));
      const back = el("div", "pol-face pol-back"); back.style.setProperty("--jc", m.soft);
      back.append(el("b", "", `Fact #${i + 1}`), el("p", "", m.facts[i] || m.summary));
      inner.append(front, back); card.appendChild(inner);
      card.addEventListener("click", () => { card.classList.toggle("flipped"); FX.pop(1.2 + i * 0.1); });
      wrap.appendChild(card);
    });
    host.appendChild(wrap);
  };

  window.renderJourney = function (host, m, limit) {
    host.innerHTML = "";
    const ol = el("ol", "timeline");
    (limit ? m.journey.slice(0, limit) : m.journey).forEach((j, i) => {
      const li = el("li", "tl-item live-in"); li.style.animationDelay = i * 90 + "ms";
      const dot = el("span", "tl-dot", m.emoji); dot.style.setProperty("--jc", m.color);
      const box = el("div", "tl-box");
      box.append(el("span", "tl-when", j.when), el("b", "", j.title), el("p", "", j.text));
      li.append(dot, box); ol.appendChild(li);
    });
    host.appendChild(ol);
  };
})();
