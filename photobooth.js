/* Photo booth: all drawing happens locally on a canvas */
(function () {
  const { $, safe } = FX;
  const cv = $("#bc"), g = cv.getContext("2d"), S = cv.width;
  const logo = $("#logo"); [..."Photo"].forEach((c) => { const s = document.createElement("span"); s.className = "ch"; s.textContent = c; logo.appendChild(s); });
  const sub = document.createElement("span"); sub.className = "sub"; [..."Booth"].forEach((c) => { const s = document.createElement("span"); s.className = "ch"; s.textContent = c; sub.appendChild(s); }); logo.appendChild(sub);
  logo.addEventListener("pointerover", (e) => { const c = e.target.closest(".ch"); if (c) FX.squish(c); });

  let img = null, items = [], sel = -1, filter = 0, frame = 0, stream = null;
  const FILTERS = [["Normal", "none"], ["Dreamy", "brightness(1.1) saturate(1.3) contrast(.95)"], ["Film", "sepia(.35) saturate(1.2) hue-rotate(-12deg)"], ["Cool", "saturate(1.1) hue-rotate(15deg) brightness(1.05)"], ["B&W", "grayscale(1) contrast(1.1)"]];
  const FRAMES = ["No frame", "Jelly pink", "Polaroid", "Stars", "Bubbles"];
  const STICKERS = ["⭐", "💿", "🧋", "💙", "✨", "🫧", "👽", "🐱", "☀️", "🍬", "🎀", "💛"];

  const row = (host, labels, onPick, cur) => labels.forEach((l, i) => {
    const b = document.createElement("button"); b.type = "button"; b.className = "jelly bb"; b.textContent = l; b.style.setProperty("--jc", i === cur ? "var(--accent)" : "#fff");
    b.addEventListener("click", () => { onPick(i); host.querySelectorAll("button").forEach((x, j) => x.style.setProperty("--jc", j === i ? "var(--accent)" : "#fff")); FX.pop(1 + i * 0.1); draw(); });
    host.appendChild(b);
  });
  row($("#filters"), FILTERS.map((f) => f[0]), (i) => (filter = i), 0);
  row($("#frames"), FRAMES, (i) => (frame = i), 0);
  STICKERS.forEach((e) => { const b = document.createElement("button"); b.type = "button"; b.className = "jelly bb"; b.style.cssText = "--jc:#fff;font-size:22px;padding:4px 10px"; b.textContent = e; b.addEventListener("click", () => add(e)); $("#stickers").appendChild(b); });
  ["minji", "hanni", "danielle", "haerin", "hyein"].forEach((k) => {
    const b = document.createElement("button"); b.type = "button"; b.className = "jelly bb"; b.style.cssText = "--jc:" + MEMBERS[k].color + ";padding:4px 12px"; b.textContent = MEMBERS[k].emoji + " " + MEMBERS[k].name;
    b.addEventListener("click", () => load(MEMBERS[k].avatar)); $("#bunnies").appendChild(b);
  });

  function load(src) { const i = new Image(); i.onload = () => { img = i; draw(); FX.toast("📸 Photo ready!"); }; i.onerror = () => FX.toast("Couldn't load that image"); i.src = src; }
  $("#bfile").addEventListener("change", (e) => { const f = e.target.files[0]; if (f) load(URL.createObjectURL(f)); });
  $("#bcam").addEventListener("click", async () => {
    try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } }); const v = $("#bvid"); v.srcObject = stream; await v.play(); $("#bsnap").hidden = false; FX.toast("Camera on — press Snap!");
      (function live() { if (!stream) return; img = v; draw(); requestAnimationFrame(live); })(); }
    catch (e) { FX.toast("Camera not available — try Upload"); }
  });
  $("#bsnap").addEventListener("click", () => { const v = $("#bvid"), c = document.createElement("canvas"); c.width = v.videoWidth; c.height = v.videoHeight; c.getContext("2d").drawImage(v, 0, 0); stream && stream.getTracks().forEach((t) => t.stop()); stream = null; $("#bsnap").hidden = true; const i = new Image(); i.onload = () => { img = i; draw(); }; i.src = c.toDataURL(); FX.pop(2, "triangle"); });

  const history = [];
  function add(emoji) { items.push({ e: emoji, x: S / 2 + (Math.random() * 120 - 60), y: S / 2 + (Math.random() * 120 - 60), size: +$("#bsize").value, rot: +$("#brot").value }); sel = items.length - 1; FX.pop(1.4); draw(); }
  $("#bears").addEventListener("click", () => { items.push({ e: "ears", x: S / 2, y: 150, size: 260, rot: 0 }); sel = items.length - 1; FX.pop(1.6, "triangle"); draw(); });
  $("#bdel").addEventListener("click", () => { if (sel >= 0) { items.splice(sel, 1); sel = -1; draw(); } });
  $("#bundo").addEventListener("click", () => { items.pop(); sel = -1; draw(); });
  $("#bsize").addEventListener("input", (e) => { if (sel >= 0) { items[sel].size = +e.target.value; draw(); } });
  $("#brot").addEventListener("input", (e) => { if (sel >= 0) { items[sel].rot = +e.target.value; draw(); } });

  function ears(sz) { // jelly bunny ears centred at origin (width ≈ sz)
    const w = sz * 0.3, h = sz * 0.75;
    [[-sz * 0.2, -8], [sz * 0.2, 8]].forEach(([x, r]) => {
      g.save(); g.translate(x, 0); g.rotate((r * Math.PI) / 180);
      g.fillStyle = "#fff"; g.strokeStyle = "#23203a"; g.lineWidth = 6; g.beginPath(); g.ellipse(0, -h / 2, w / 2, h / 2, 0, 0, 7); g.fill(); g.stroke();
      g.fillStyle = "#ffb3dc"; g.beginPath(); g.ellipse(0, -h / 2 + 8, w / 4, h / 2.6, 0, 0, 7); g.fill();
      g.fillStyle = "rgba(255,255,255,.8)"; g.beginPath(); g.ellipse(-w / 5, -h * .72, w / 14, h / 9, 0, 0, 7); g.fill();
      g.restore();
    });
  }
  function draw() {
    g.clearRect(0, 0, S, S); g.fillStyle = "#ffd6e7"; g.fillRect(0, 0, S, S);
    if (img) {
      const iw = img.videoWidth || img.naturalWidth, ih = img.videoHeight || img.naturalHeight, m = Math.min(iw, ih);
      g.save(); g.filter = FILTERS[filter][1]; g.drawImage(img, (iw - m) / 2, (ih - m) / 2, m, m, 0, 0, S, S); g.restore();
    } else { g.fillStyle = "#23203a"; g.font = "700 30px Fredoka, sans-serif"; g.textAlign = "center"; g.fillText("Pick a photo to start 📸", S / 2, S / 2); }
    items.forEach((it, i) => {
      g.save(); g.translate(it.x, it.y); g.rotate((it.rot * Math.PI) / 180);
      if (it.e === "ears") ears(it.size); else { g.font = it.size + "px serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(it.e, 0, 0); }
      if (i === sel) { g.strokeStyle = "rgba(35,32,58,.7)"; g.setLineDash([10, 8]); g.lineWidth = 3; const r = it.e === "ears" ? it.size * 0.45 : it.size * 0.6; g.strokeRect(-r, it.e === "ears" ? -it.size * .8 : -r, r * 2, it.e === "ears" ? it.size * .85 : r * 2); g.setLineDash([]); }
      g.restore();
    });
    // frames
    g.save(); g.lineWidth = 3; g.strokeStyle = "#23203a";
    if (frame === 1) { g.lineWidth = 34; g.strokeStyle = "#ffb3dc"; g.strokeRect(17, 17, S - 34, S - 34); g.lineWidth = 6; g.strokeStyle = "#23203a"; g.strokeRect(2, 2, S - 4, S - 4); g.strokeRect(34, 34, S - 68, S - 68); }
    if (frame === 2) { g.fillStyle = "#fff"; g.fillRect(0, 0, S, 26); g.fillRect(0, 0, 26, S); g.fillRect(S - 26, 0, 26, S); g.fillRect(0, S - 110, S, 110); g.strokeRect(26, 26, S - 52, S - 136); g.fillStyle = "#23203a"; g.font = "700 30px Fredoka, sans-serif"; g.textAlign = "center"; g.fillText("NewJeans Chat Archive 🐰", S / 2, S - 48); }
    if (frame === 3) { g.font = "34px serif"; g.textAlign = "center"; for (let i = 0; i < 14; i++) { g.fillText(i % 2 ? "⭐" : "✨", 28 + i * 44, 34); g.fillText(i % 2 ? "✨" : "⭐", 28 + i * 44, S - 14); } for (let i = 1; i < 13; i++) { g.fillText("⭐", 24, 40 + i * 44); g.fillText("✨", S - 24, 40 + i * 44); } }
    if (frame === 4) { for (let i = 0; i < 46; i++) { const a = (i / 46) * Math.PI * 2, r = S * 0.5 * 1.35; g.beginPath(); g.arc(S / 2 + Math.cos(a) * r * 0.74, S / 2 + Math.sin(a) * r * 0.74, 18 + (i % 4) * 8, 0, 7); g.fillStyle = ["rgba(169,229,255,.75)", "rgba(255,179,220,.75)", "rgba(216,247,174,.75)"][i % 3]; g.fill(); g.lineWidth = 3; g.stroke(); } }
    g.restore();
  }
  // dragging
  let drag = null;
  const pos = (e) => { const r = cv.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * S, ((e.clientY - r.top) / r.height) * S]; };
  cv.addEventListener("pointerdown", (e) => {
    const [x, y] = pos(e); let hit = -1;
    for (let i = items.length - 1; i >= 0; i--) { const it = items[i], r = it.size * (it.e === "ears" ? 0.6 : 0.55); const cy = it.e === "ears" ? it.y - it.size * 0.35 : it.y; if (Math.hypot(x - it.x, y - cy) < r) { hit = i; break; } }
    sel = hit; if (hit >= 0) { drag = { dx: x - items[hit].x, dy: y - items[hit].y }; cv.setPointerCapture(e.pointerId); $("#bsize").value = items[hit].size; $("#brot").value = items[hit].rot; }
    draw();
  });
  cv.addEventListener("pointermove", (e) => { if (!drag || sel < 0) return; const [x, y] = pos(e); items[sel].x = x - drag.dx; items[sel].y = y - drag.dy; draw(); });
  cv.addEventListener("pointerup", () => (drag = null));
  $("#bsave").addEventListener("click", () => {
    const keep = sel; sel = -1; draw();
    cv.toBlob((b) => { const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "bunny-photo.png"; a.click(); FX.toast("⬇ Saved!"); FX.badge && FX.badge("booth"); FX.rain(["📸", "✨", "💙"], 14); sel = keep; draw(); });
  });
  draw(); load("images/hyein.jpg");
})();
