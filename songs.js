/* Song stories — original write-ups only (no lyrics). */
(function () {
  const { $ } = FX;
  const SONGS = [
    {
      key: "ditto", title: "Ditto", color: "#a9e5ff", emoji: "🌙", album: "OMG", released: "Dec 19, 2022",
      credits: "Produced by 250 · music by 250 & Ylva Dimberg · lyrics by Ylva Dimberg, The Black Skirts, Oohyo & Minji",
      sound: "Wintery, hushed, nostalgic pop with a drifting, late-night feel.",
      story: "A song about a quiet, hopeful kind of love — the nervous feeling of wanting someone to feel the same way back, without being brave enough to say it out loud. The title is the answer it's waiting for: if you feel it too, just say ditto.",
      facts: ["Released ahead of the OMG single album as a gift for the group's first winter with Bunnies.", "Has two music video sides — Side A and Side B — that tell the story from different angles.", "Minji is credited as one of the lyricists.", "It became one of the biggest songs in South Korea."],
      meters: { Sweetness: 80, Energy: 35, Nostalgia: 95 },
      listen: "Ditto"
    },
    {
      key: "bubblegum", title: "Bubble Gum", color: "#ffb3dc", emoji: "🫧", album: "How Sweet", released: "May 24, 2024",
      credits: "Produced by 250 · written by Gigi, Sophie Simmons, Oscar Bell & 250",
      sound: "Light, bouncy, easy pop that's half Korean, half English.",
      story: "Pure candy-coloured fun. The song is all about someone who feels sweet, soft and bouncy — a person you want to float away with. It's less about drama and more about a bright, giddy crush.",
      facts: ["The music video came first, on April 26, 2024, and ADOR described it as showing the members blowing bubble gum and playing pranks on each other.", "It marked their return after a break of about nine months.", "A Japanese version appeared in ads and TV in Japan.", "Released together with How Sweet as a double single."],
      meters: { Sweetness: 98, Energy: 70, Nostalgia: 40 },
      listen: "Bubble Gum"
    },
    {
      key: "howsweet", title: "How Sweet", color: "#fff4a8", emoji: "🍬", album: "How Sweet", released: "May 24, 2024",
      credits: "Produced by 250 · 3:39 long",
      sound: "ADOR called it Miami bass; Billboard described a classy electro-pop number, and NME heard an 80s-inspired feel.",
      story: "A glossy, confident song about falling for someone so completely that everything starts to feel sweet. It's smoother and a little more grown-up than the group's earliest bubbly hits. And yes — it's Minji's favourite NewJeans song.",
      facts: ["The title track of the How Sweet double single (with Bubble Gum).", "Debuted at number one in South Korea.", "Part of a 2024 plan that also included the Japanese single Supernatural.", "Minji says it's her favourite NewJeans song."],
      meters: { Sweetness: 90, Energy: 60, Nostalgia: 65 },
      listen: "How Sweet"
    },
    {
      key: "hurt", title: "Hurt", color: "#dccaff", emoji: "💜", album: "New Jeans (1st EP)", released: "Aug 1, 2022",
      credits: "From the debut EP, alongside Attention, Hype Boy and Cookie",
      sound: "Soft, cool and understated, with a gentle ache underneath.",
      story: "The most tender corner of the debut EP: a song about the small, stinging feelings that come with caring about someone a lot. It doesn't shout — it lingers, which is exactly why fans keep coming back to it.",
      facts: ["Its music video arrived on July 25, 2022, just before the EP's release.", "It has passed 100 million streams.", "Got a remix from producer 250 on the NJWMX remix album (Dec 19, 2023).", "One of four tracks on the group's debut EP."],
      meters: { Sweetness: 55, Energy: 30, Nostalgia: 80 },
      listen: "Hurt"
    }
    ,
    {
      key: "hypeboy", title: "Hype Boy", color: "#bfe6ff", emoji: "🐰", album: "New Jeans (1st EP)", released: "Aug 1, 2022",
      credits: "From the debut EP · the song on this site's music player",
      sound: "Breezy, light-footed pop that feels like a summer afternoon.",
      story: "A bright, nervous-excited song about noticing someone and not being able to stop thinking about them. It's the track that turned a lot of people into Bunnies.",
      facts: ["Its music video came out on July 23, 2022, a week before the debut EP.", "It's the song playing in the corner of this very page.", "Part of a four-song debut EP with Attention, Cookie and Hurt.", "Got a remix from 250 on the NJWMX remix album."],
      meters: { Sweetness: 85, Energy: 75, Nostalgia: 60 }, listen: "Hype Boy"
    },
    {
      key: "attention", title: "Attention", color: "#ffd6e7", emoji: "👀", album: "New Jeans (1st EP)", released: "Jul 22, 2022",
      credits: "The lead single that introduced NewJeans to the world",
      sound: "Smooth, laid-back groove with a cool, almost whispery attitude.",
      story: "The very first song the group ever released. It's a confident-but-shy opener about wanting someone to simply notice you.",
      facts: ["Released July 22, 2022, the group's debut day.", "The full EP, New Jeans, arrived on August 1, 2022.", "Remixed by 250 on NJWMX.", "The group officially debuted with five members."],
      meters: { Sweetness: 60, Energy: 55, Nostalgia: 70 }, listen: "Attention"
    },
    {
      key: "omg", title: "OMG", color: "#ffb3dc", emoji: "💌", album: "OMG (1st single album)", released: "Jan 2, 2023",
      credits: "Title track of the OMG single album, which also features Ditto",
      sound: "Bouncy, playful and a little breathless, like a text that can't wait.",
      story: "A pop song about being totally overwhelmed by a crush, the kind where every notification makes your heart jump.",
      facts: ["It's the first single album from NewJeans.", "It came out on January 2, 2023, after Ditto's December release.", "The single album pairs OMG with Ditto.", "Its title is the text you send when you can't contain your excitement."],
      meters: { Sweetness: 80, Energy: 85, Nostalgia: 45 }, listen: "OMG"
    },
    {
      key: "supershy", title: "Super Shy", color: "#d8f7ae", emoji: "🙈", album: "Get Up (2nd EP)", released: "Jul 21, 2023",
      credits: "Pre-released July 7, 2023 · one of three title tracks on Get Up",
      sound: "Fresh, quick and sparkly with a skippy, upbeat heartbeat.",
      story: "A song about being too shy to say hi to the person you like. Its co-writer has said it was inspired by her own experiences as a shy teenager.",
      facts: ["It was the first song written for the Get Up EP.", "Pre-released on July 7, 2023, two weeks before the EP.", "The performance features powerful whacking-style arm moves.", "One of the three title tracks on Get Up."],
      meters: { Sweetness: 85, Energy: 90, Nostalgia: 35 }, listen: "Super Shy"
    },
    {
      key: "eta", title: "ETA", color: "#fff4a8", emoji: "📱", album: "Get Up (2nd EP)", released: "Jul 21, 2023",
      credits: "One of three title tracks on Get Up",
      sound: "Playful, bouncy beat with a bright, chatty attitude.",
      story: "A song about waiting for someone's reply and wondering where they are. The title is the thing you text when you're impatient: what's your ETA?",
      facts: ["It was performed at a fan meeting before the EP came out.", "One of the three title tracks of Get Up.", "Its dance is dynamic and full of energy.", "In this site's chat, Haerin loves asking “What's your ETA?” 😉"],
      meters: { Sweetness: 65, Energy: 85, Nostalgia: 30 }, listen: "ETA"
    },
    {
      key: "coolwithyou", title: "Cool With You", color: "#a9e5ff", emoji: "🌊", album: "Get Up (2nd EP)", released: "Jul 21, 2023",
      credits: "One of three title tracks on Get Up · has Side A and Side B videos",
      sound: "Dreamy and cool, with a floaty, cinematic feel.",
      story: "A gentle, dreamy song about the feeling of being relaxed and completely at ease with one special person.",
      facts: ["Its music video was released in two versions, a Side A and a Side B.", "The video feels like a short film.", "The dance is contemporary-style and flowing.", "It has passed 100 million streams."],
      meters: { Sweetness: 75, Energy: 40, Nostalgia: 75 }, listen: "Cool With You"
    }
  ];

  /* wobbly title */
  const logo = $("#logo");
  [..."Song"].forEach((c) => { const s = document.createElement("span"); s.className = "ch"; s.textContent = c; logo.appendChild(s); });
  const sub = document.createElement("span"); sub.className = "sub";
  [..."Stories"].forEach((c) => { const s = document.createElement("span"); s.className = "ch"; s.textContent = c; sub.appendChild(s); });
  logo.appendChild(sub);
  logo.addEventListener("pointerover", (e) => { const c = e.target.closest(".ch"); if (c) FX.squish(c); });

  const tabs = $("#tabs"), card = $("#song");
  const enc = encodeURIComponent;

  function show(i) {
    const s = SONGS[i];
    tabs.querySelectorAll("button").forEach((b, j) => b.setAttribute("aria-selected", j === i));
    card.style.setProperty("--c", s.color);
    card.innerHTML = `
      <div class="song-top">
        <div class="cd big" style="--c:${s.color}"><div class="cd-label">${s.emoji}</div></div>
        <div>
          <h2 class="song-title">${s.title}</h2>
          <p class="song-meta">${s.album} · ${s.released}</p>
          <p class="song-credits">${s.credits}</p>
        </div>
      </div>
      <h3 class="section-title">🎧 Sound</h3><p class="song-p">${s.sound}</p>
      <h3 class="section-title">📖 The story</h3><p class="song-p">${s.story}</p>
      <h3 class="section-title">🐰 Bunny meters <small style="font-weight:500;font-size:.8rem">(just for fun)</small></h3>
      <div class="meters">${Object.entries(s.meters).map(([k, v]) => `<div class="meter"><span>${k}</span><div class="meter-bar"><i data-w="${v}"></i></div></div>`).join("")}</div>
      <h3 class="section-title">✨ Fun facts <small style="font-weight:500;font-size:.8rem">(tap a card)</small></h3>
      <div class="fact-grid">${s.facts.map((f, k) => `<button class="fact jelly" type="button" style="--jc:${s.color}"><span class="fact-n">${k + 1}</span><span class="fact-t">${f}</span></button>`).join("")}</div>
      <h3 class="section-title">📝 Lyrics</h3>
      <p class="song-p">Lyrics are copyrighted, so they aren't printed here. Read or hear them the official way:</p>
      <div class="btn-row">
        <a class="jelly link-btn" style="--jc:#fff" target="_blank" rel="noopener noreferrer" href="https://genius.com/search?q=${enc("NewJeans " + s.listen)}">📜 Lyrics on Genius</a>
        <a class="jelly link-btn" style="--jc:#d8f7ae" target="_blank" rel="noopener noreferrer" href="https://open.spotify.com/search/${enc("NewJeans " + s.listen)}">🎧 Spotify</a>
        <a class="jelly link-btn" style="--jc:#ffd6e7" target="_blank" rel="noopener noreferrer" href="https://www.youtube.com/results?search_query=${enc("NewJeans " + s.listen + " official MV")}">▶ Official MV</a>
      </div>`;
    requestAnimationFrame(() => setTimeout(() => card.querySelectorAll(".meter-bar i").forEach((b) => (b.style.width = b.dataset.w + "%")), 60));
    card.querySelectorAll(".fact").forEach((f) => f.addEventListener("click", () => { f.classList.toggle("open"); FX.pop(1.2); }));
    FX.squish(card.querySelector(".cd")); FX.pop(1 + i * 0.15, "triangle");
  }
  SONGS.forEach((s, i) => {
    const b = document.createElement("button");
    b.className = "jelly tab"; b.type = "button"; b.setAttribute("role", "tab"); b.style.setProperty("--jc", s.color);
    b.textContent = s.emoji + " " + s.title; b.addEventListener("click", () => { show(i); FX.burst(b.getBoundingClientRect().left + 30, b.getBoundingClientRect().top, 6, [s.emoji, "✨"]); });
    tabs.appendChild(b);
  });
  const start = Math.max(0, SONGS.findIndex((s) => "#" + s.key === location.hash));
  show(start);

  /* ---------- which song are you? ---------- */
  const Q = [
    { q: "Pick a perfect evening:", a: [["Snowy walk, headphones on", "ditto"], ["Picnic with sweets and games", "bubblegum"], ["Dressed up and glowing", "howsweet"], ["Rooftop, quiet, thinking", "hurt"]] },
    { q: "Your friends describe you as…", a: [["The hopeful dreamer", "ditto"], ["The bouncy one", "bubblegum"], ["The smooth one", "howsweet"], ["The quiet, deep one", "hurt"]] },
    { q: "Pick a snack:", a: [["Hot chocolate", "ditto"], ["Bubble gum, obviously", "bubblegum"], ["Strawberry candy", "howsweet"], ["Blueberry boba", "hurt"]] }
  ];
  const body = $("#quiz-body"); let step = 0, tally = {};
  function renderQ() {
    body.innerHTML = "";
    if (step >= Q.length) {
      const win = Object.entries(tally).sort((a, b) => b[1] - a[1])[0][0], s = SONGS.find((x) => x.key === win);
      body.innerHTML = `<p class="song-p">You are… <b>${s.emoji} ${s.title}</b>! ${s.sound}</p>`;
      const go = document.createElement("button"); go.className = "jelly"; go.style.cssText = "--jc:" + s.color + ";padding:10px 18px;font-weight:700"; go.textContent = "Read " + s.title + "'s story";
      go.addEventListener("click", () => { show(SONGS.indexOf(s)); scrollTo({ top: 0, behavior: "smooth" }); });
      const again = document.createElement("button"); again.className = "jelly"; again.style.cssText = "--jc:#fff;padding:10px 18px;font-weight:700;margin-left:8px"; again.textContent = "Again";
      again.addEventListener("click", () => { step = 0; tally = {}; renderQ(); });
      body.append(go, again); FX.rain([s.emoji, "✨"], 22); return;
    }
    const p = document.createElement("p"); p.className = "song-p"; p.innerHTML = `<b>${step + 1}/${Q.length}</b> ${Q[step].q}`; body.appendChild(p);
    const row = document.createElement("div"); row.className = "btn-row";
    Q[step].a.forEach(([t, k]) => { const b = document.createElement("button"); b.className = "jelly"; b.style.cssText = "--jc:#fff;padding:9px 16px;font-weight:600;font-size:16px"; b.textContent = t; b.addEventListener("click", () => { tally[k] = (tally[k] || 0) + 1; step++; renderQ(); }); row.appendChild(b); });
    body.appendChild(row);
  }
  renderQ();
})();
