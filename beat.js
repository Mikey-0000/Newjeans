/* Browser-side beat detection: returns {bpm, offset, duration} for an audio ArrayBuffer */
(function () {
  async function analyse(arrayBuffer) {
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    const buf = await ac.decodeAudioData(arrayBuffer);
    ac.close && ac.close();
    const sr = buf.sampleRate, a = buf.getChannelData(0), b = buf.numberOfChannels > 1 ? buf.getChannelData(1) : a;
    const hop = Math.floor(sr / 100), n = Math.floor(a.length / hop);
    const full = new Float32Array(n), low = new Float32Array(n);
    let lp = 0;
    for (let i = 0; i < n; i++) {
      let ef = 0, el = 0;
      for (let j = i * hop; j < (i + 1) * hop; j++) {
        const x = (a[j] + b[j]) * 0.5; lp += 0.03 * (x - lp);
        ef += x * x; el += lp * lp;
      }
      full[i] = Math.log(1 + 30 * Math.sqrt(ef / hop)); low[i] = Math.log(1 + 60 * Math.sqrt(el / hop));
    }
    const flux = new Float32Array(n);
    for (let i = 1; i < n; i++) flux[i] = Math.max(0, full[i] - full[i - 1]) + 1.5 * Math.max(0, low[i] - low[i - 1]);
    // subtract local average
    const env = new Float32Array(n), win = 50; let sum = 0;
    for (let i = 0; i < n; i++) { sum += flux[i]; if (i >= 2 * win) sum -= flux[i - 2 * win]; const m = sum / Math.min(i + 1, 2 * win); env[i] = Math.max(0, flux[i] - m); }
    const scoreFor = (bpm) => {
      const p = 6000 / bpm; let best = 0, bp = 0;
      for (let ph = 0; ph < p; ph += 0.5) {
        let s = 0, c = 0; for (let t = ph; t < n - 1; t += p) { s += env[Math.round(t)]; c++; }
        s /= c; if (s > best) { best = s; bp = ph; }
      }
      return [best, bp];
    };
    let top = [0, 100, 0];
    for (let bpm = 70; bpm <= 170; bpm += 0.25) {
      const [s, ph] = scoreFor(bpm); const prior = Math.exp(-Math.pow(Math.log2(bpm / 112), 2) / 0.55);
      const v = s * (0.6 + 0.4 * prior); if (v > top[0]) top = [v, bpm, ph];
    }
    let best = top;
    for (let bpm = top[1] - 0.4; bpm <= top[1] + 0.4; bpm += 0.02) { const [s, ph] = scoreFor(bpm); if (s > best[0] * 0.98 && s >= best[0] - 1e-9) best = [s, bpm, ph]; }
    return { bpm: Math.round(best[1] * 10) / 10, offset: best[2] / 100, duration: buf.duration };
  }
  window.Beat = { analyse };
})();
