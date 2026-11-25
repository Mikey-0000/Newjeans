/* Browser-side beat tracking (no uploads). Window.Beat.analyse(arrayBuffer) ->
   { bpm, offset, duration, beats[], accents[], down }
   Onset strength from a multi-band spectral flux, tempo from a harmonic autocorrelation, then a dynamic-programming
   beat tracker (Ellis 2007) so the beat grid follows the real recording instead of one fixed metronome. */
(function () {
  const N = 512, HOP = 110, FR = 100; // frame size, hop (at 11.025 kHz -> 100 frames/s)

  function fft(re, im) {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
    for (let len = 2; len <= n; len <<= 1) {
      const ang = (-2 * Math.PI) / len, wr = Math.cos(ang), wi = Math.sin(ang);
      for (let i = 0; i < n; i += len) {
        let cr = 1, ci = 0;
        for (let k = 0; k < len / 2; k++) {
          const a = i + k, b = a + len / 2, xr = re[b] * cr - im[b] * ci, xi = re[b] * ci + im[b] * cr;
          re[b] = re[a] - xr; im[b] = im[a] - xi; re[a] += xr; im[a] += xi; const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
        }
      }
    }
  }

  // PCM (mono, any sample rate) -> analysis
  function analysePCM(x, sr, opts) {
    opts = opts || {};
    // downsample to ~11.025 kHz by block-averaging
    const f = Math.max(1, Math.round(sr / 11025)), srd = sr / f, len = Math.floor(x.length / f), d = new Float32Array(len);
    for (let i = 0; i < len; i++) { let s = 0; for (let k = 0; k < f; k++) s += x[i * f + k]; d[i] = s / f; }
    const hop = Math.round(srd / FR), nF = Math.max(0, Math.floor((len - N) / hop));
    const win = new Float32Array(N); for (let i = 0; i < N; i++) win[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1));
    // band edges (bins of srd/N Hz ~ 21.5 Hz): log-spaced from ~40 Hz to 5 kHz
    const edges = [1, 3, 5, 8, 13, 21, 34, 55, 90, 150, 230]; const NB = edges.length - 1;
    const bands = new Float32Array(nF * NB), re = new Float32Array(N), im = new Float32Array(N);
    for (let t = 0; t < nF; t++) {
      for (let i = 0; i < N; i++) { re[i] = d[t * hop + i] * win[i]; im[i] = 0; }
      fft(re, im);
      for (let b = 0; b < NB; b++) { let e = 0; for (let k = edges[b]; k < edges[b + 1]; k++) e += re[k] * re[k] + im[k] * im[k]; bands[t * NB + b] = Math.log(1 + 400 * Math.sqrt(e / (edges[b + 1] - edges[b]))); }
    }
    // onset strength = positive flux per band, band-normalised, low bands weighted a bit more
    const env = new Float32Array(nF);
    for (let b = 0; b < NB; b++) {
      const fl = new Float32Array(nF); let m = 0;
      for (let t = 2; t < nF; t++) { fl[t] = Math.max(0, bands[t * NB + b] - Math.max(bands[(t - 1) * NB + b], bands[(t - 2) * NB + b] * 0.9)); m += fl[t]; }
      m = m / nF + 1e-6; const w = b < 3 ? 1.35 : 1; for (let t = 0; t < nF; t++) env[t] += (w * fl[t]) / m;
    }
    // subtract local mean (1 s) and clip
    const on = new Float32Array(nF); { const W = 50; let s = 0; const pre = new Float64Array(nF + 1); for (let i = 0; i < nF; i++) pre[i + 1] = pre[i] + env[i]; for (let i = 0; i < nF; i++) { const a = Math.max(0, i - W), b = Math.min(nF, i + W + 1); on[i] = Math.max(0, env[i] - (pre[b] - pre[a]) / (b - a)); } }
    let sd = 0, mu = 0; for (let i = 0; i < nF; i++) mu += on[i]; mu /= nF; for (let i = 0; i < nF; i++) sd += (on[i] - mu) ** 2; sd = Math.sqrt(sd / nF) + 1e-6; for (let i = 0; i < nF; i++) on[i] /= sd;
    // frame -> time: the flux peaks once the onset is well inside the window
    const T0 = (0.5 * N) / srd; const tOf = (i) => (i * hop) / srd + T0 - 0.011 + 0.022;

    // ---- tempo: harmonic autocorrelation with a broad log prior around 110 BPM
    const ac = (lag) => { let s = 0; for (let i = lag; i < nF; i++) s += on[i] * on[i - lag]; return s / (nF - lag); };
    let bestT = 0, bpm = 100;
    for (let b = 60; b <= 180; b += 0.5) {
      const lag = (60 * FR) / b; const l0 = Math.round(lag);
      const v = ac(l0) + 0.5 * ac(Math.round(lag * 2)) + 0.33 * ac(Math.round(lag * 3)) + 0.25 * ac(Math.round(lag * 4));
      const pr = Math.exp(-0.5 * Math.pow(Math.log2(b / 112) / 0.6, 2)); const sc = v * (0.5 + 0.5 * pr);
      if (sc > bestT) { bestT = sc; bpm = b; }
    }
    const per = (60 * FR) / bpm;

    // ---- DP beat tracker
    const sm = new Float32Array(nF); { const g = [0.1, 0.25, 0.4, 0.25, 0.1]; for (let i = 0; i < nF; i++) { let s = 0; for (let k = -2; k <= 2; k++) { const j = i + k; if (j >= 0 && j < nF) s += g[k + 2] * on[j]; } sm[i] = s; } }
    const C = new Float64Array(nF), back = new Int32Array(nF).fill(-1), TIGHT = 100;
    for (let t = 0; t < nF; t++) {
      let best = 0, bi = -1; const lo = Math.max(0, Math.round(t - 2 * per)), hi = Math.round(t - per / 2);
      for (let s = lo; s <= hi; s++) { if (s < 0) continue; const r = Math.log((t - s) / per); const v = C[s] - TIGHT * r * r; if (bi < 0 || v > best) { best = v; bi = s; } }
      C[t] = sm[t] + (bi >= 0 ? best : 0); back[t] = bi;
    }
    // best end: strongest cumulative score in the last 2 periods
    let end = nF - 1, bv = -1e18; for (let t = Math.max(0, nF - Math.round(2 * per)); t < nF; t++) if (C[t] > bv) { bv = C[t]; end = t; }
    const idx = []; for (let t = end; t >= 0; t = back[t]) { idx.push(t); if (back[t] < 0) break; } idx.reverse();
    // refine each beat to the nearest local onset peak (±40 ms)
    const beats = idx.map((i) => { let b = i, v = on[i]; for (let k = -4; k <= 4; k++) { const j = i + k; if (j > 0 && j < nF && on[j] > v) { v = on[j]; b = j; } } return tOf(b); });
    // studio music sits on a steady grid: smooth DP jitter with a robust local line fit (follows real tempo changes slowly)
    const fitted = beats.map((_, i) => {
      let pts = []; for (let j = Math.max(0, i - 8); j <= Math.min(beats.length - 1, i + 8); j++) pts.push([j, beats[j]]);
      let a = 0, b = medP0();
      for (let it = 0; it < 3; it++) {
        const n = pts.length; let sx = 0, sy = 0, sxx = 0, sxy = 0; for (const [x, y] of pts) { sx += x; sy += y; sxx += x * x; sxy += x * y; }
        const den = n * sxx - sx * sx; b = den ? (n * sxy - sx * sy) / den : b; a = (sy - b * sx) / n;
        if (it < 2) { const rs = pts.map(([x, y]) => [Math.abs(y - (a + b * x)), x, y]).sort((p, q) => p[0] - q[0]); pts = rs.slice(0, Math.max(4, Math.ceil(rs.length * 0.7))).map((r) => [r[1], r[2]]); }
      }
      return a + b * i;
    });
    function medP0() { return 60 / bpm; }
    const raw = beats.slice(); if (opts.smooth !== false) beats.splice(0, beats.length, ...fitted);
    // keep the grid regular where the music is quiet: extend the grid back to 0 and forward to the end with the local period
    const dur = x.length / sr; const out = beats.slice();
    const medP = (() => { const dd = []; for (let i = 1; i < beats.length; i++) dd.push(beats[i] - beats[i - 1]); dd.sort((a, b) => a - b); return dd.length ? dd[dd.length >> 1] : 60 / bpm; })();
    while (out[0] - medP > 0.05) out.unshift(out[0] - medP);
    while (out[out.length - 1] + medP < dur + 1) out.push(out[out.length - 1] + medP);
    // downbeat: which of every 4 beats carries the most low-band energy flux
    const sc4 = [0, 0, 0, 0]; out.forEach((tb, i) => { const fi = Math.round((tb - T0 + 0.011) * FR); if (fi > 0 && fi < nF) sc4[i % 4] += on[fi]; }); const down = sc4.indexOf(Math.max(...sc4));
    // accents: strong onsets that are not on a beat
    const acc = []; for (let i = 3; i < nF - 3; i++) { if (on[i] > 2.2 && on[i] >= on[i - 1] && on[i] > on[i + 1]) { const tt = tOf(i); let near = 1e9; for (const tb of out) { const dd = Math.abs(tb - tt); if (dd < near) near = dd; if (tb > tt + 1) break; } if (near > 0.13) acc.push({ t: tt, s: on[i] }); } }
    let onB = 0, onH = 0, cn = 0; for (let i = 0; i < out.length - 1; i++) { const f1 = Math.round((out[i] - T0 + 0.011 - 0.022) * FR), f2 = Math.round(((out[i] + out[i + 1]) / 2 - T0 + 0.011 - 0.022) * FR); if (f1 > 1 && f2 < nF - 1) { onB += Math.max(on[f1 - 1], on[f1], on[f1 + 1]); onH += Math.max(on[f2 - 1], on[f2], on[f2 + 1]); cn++; } }
    const bpmFinal = Math.round((60 / medP) * 10) / 10;
    return { bpm: bpmFinal, offset: out[0], duration: dur, beats: out, accents: acc, down, frames: nF, env: on, tOf0: T0 - 0.011 + 0.022, onBeat: cn ? onB / cn : 0, offBeat: cn ? onH / cn : 0 };
  }

  async function analyse(arrayBuffer) {
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    const buf = await ac.decodeAudioData(arrayBuffer); ac.close && ac.close();
    const a = buf.getChannelData(0), b = buf.numberOfChannels > 1 ? buf.getChannelData(1) : a; const mono = new Float32Array(a.length); for (let i = 0; i < a.length; i++) mono[i] = (a[i] + b[i]) * 0.5;
    return analysePCM(mono, buf.sampleRate);
  }
  const api = { analyse, analysePCM };
  if (typeof window !== "undefined") window.Beat = api; if (typeof module !== "undefined") module.exports = api;
})();
