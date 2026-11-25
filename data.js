/* Shared data for every page */
window.MEMBERS = {
  minji: {
    name: "Minji", avatar: "images/minji.jpg", page: "minji.html",
    color: "#ff9ccf", soft: "#ffd9ec", dark: "#c2307f", emoji: "✨",
    tagline: "soft, dreamy & sparkly",
    lines: [
      { text: "hi bunnies ✨", small: true, time: "11:55" },
      { text: "Today it feels soft, dreamy, and sparkly. I must be very happy!", time: "11:56" },
      { text: "My favouritie song from NewJeans is How Sweet.", small: true, time: "11:57" }
    ],
    replies: ["soft and dreamy vibes only ✨", "hi bunnies!! 🐰", "How Sweet is on repeat today", "sparkle sparkle ✨✨", "i must be very happy!"]
  },
  hanni: {
    name: "Hanni", avatar: "images/hanni.jpg", page: "hanni.html",
    color: "#7fd8ff", soft: "#d3f1ff", dark: "#1b78a8", emoji: "🧋",
    tagline: "boba. always boba.",
    lines: [
      { text: "boba!!! 🧋", small: true, time: "11:55" },
      { text: "..............", time: "11:56" },
      { text: "look it's a new me, switched it up, who's this?", small: true, time: "11:57" }
    ],
    replies: ["boba!!! 🧋", "today is a boba party", "..............", "who's this? new me 👀", "extra pearls please"]
  },
  danielle: {
    name: "Danielle", avatar: "images/danielle.jpg", page: "danielle.html",
    color: "#ffd84d", soft: "#fff2b8", dark: "#a67c00", emoji: "☀️",
    tagline: "sunny energy only",
    lines: [
      { text: "hehe 💛", small: true, time: "11:55" },
      { text: "Sunny energy only today ☀️", time: "11:56" },
      { text: "Oh say it ditto :)", small: true, time: "11:57" }
    ],
    replies: ["hehe 💛", "sunny energy only today ☀️", "bubble tea time <3", "Oh say it ditto :)", "aww you're sweet!"]
  },
  haerin: {
    name: "Haerin", avatar: "images/haerin.jpg", page: "haerin.html",
    color: "#b79cff", soft: "#e6dcff", dark: "#5a3bb8", emoji: "🐱",
    tagline: "a sly but shy cat",
    lines: [
      { text: "와", small: true, time: "11:55" },
      { text: "People say I remind them of a very sly but shy cat ;)", time: "11:56" },
      { text: "What's your ETA?", small: true, time: "11:57" }
    ],
    replies: ["와", "Meow >.<", "What's your ETA?", "...hi. 🐱", "sly but shy ;)"]
  },
  hyein: {
    name: "Hyein", avatar: "images/hyein.jpg", page: "hyein.html",
    color: "#7ff0b0", soft: "#d4fae4", dark: "#13885a", emoji: "👽",
    tagline: "playful, random & cute",
    lines: [
      { text: "hello 👽", small: true, time: "11:55" },
      { text: "this page should feel playful, random, and cute", time: "11:56" },
      { text: "Passion by PinkPantheress is one of the best solo-produced songs in the last decade.", small: true, time: "11:57" }
    ],
    replies: ["alien mode 👽", "Hello Bunnies <3", "random thought: pizza", "playful, random, cute. that's me", "have you heard Passion by PinkPantheress?"]
  }
};

window.CHAT_LINES = [
  ["minji", "hi bunnies ✨"], ["hanni", "boba!!! 🧋"], ["danielle", "hehe"],
  ["haerin", "와"], ["hyein", "alien mode 👽"], ["hanni", "today is a boba party"],
  ["danielle", "bubble tea time <3"], ["minji", "It is a soft and dreamy day today"],
  ["haerin", "Meow >.<"], ["hyein", "Hello Bunnies <3"], ["danielle", "Sunny energy only today ☀️"],
  ["hanni", "look it's a new me, who's this?"], ["haerin", "What's your ETA?"],
  ["minji", "How Sweet is my favourite 🍬"], ["hyein", "Music is the FUTURE!!"]
];

/* ---------- discography (CD shelf) ---------- */
window.ALBUMS = [
  { key: "nj", title: "New Jeans", type: "1st EP", date: "Aug 1, 2022", color: "#a9e5ff", emoji: "👖", tracks: ["Attention", "Hype Boy", "Cookie", "Hurt"], blurb: "The debut. Four songs that started everything." },
  { key: "omg", title: "OMG", type: "1st single album", date: "Jan 2, 2023", color: "#ffb3dc", emoji: "💌", tracks: ["OMG", "Ditto"], blurb: "Home of Ditto — the winter song Minji helped write." },
  { key: "getup", title: "Get Up", type: "2nd EP", date: "Jul 21, 2023", color: "#d8f7ae", emoji: "⏰", tracks: ["New Jeans", "Super Shy", "ETA", "Cool With You", "Get Up", "ASAP"], blurb: "Six tracks, six moods: UK garage, Jersey club, house and more." },
  { key: "hs", title: "How Sweet", type: "2nd single album", date: "May 24, 2024", color: "#fff4a8", emoji: "🍬", tracks: ["How Sweet", "Bubble Gum", "How Sweet (Inst.)", "Bubble Gum (Inst.)"], blurb: "A double single: Miami bass sweetness plus a bouncy bubble gum pop track." },
  { key: "sn", title: "Supernatural", type: "Japanese single", date: "Jun 21, 2024", color: "#dccaff", emoji: "🪐", tracks: ["Supernatural", "Right Now"], blurb: "Their first Japanese-language release." }
];

/* ---------- profiles: facts + idol journey ---------- */
Object.assign(window.MEMBERS.minji, {
  born: "May 7, 2004", from: "Chuncheon, South Korea", role: "The eldest bunny",
  summary: "Minji is the eldest member of NewJeans and the group's soft, dreamy older sister. She also helped write the lyrics to Ditto.",
  facts: ["Born May 7, 2004 — the eldest of the five.", "Co-wrote the lyrics to Ditto.", "Her favourite NewJeans song is How Sweet 🍬"],
  journey: [
    { when: "2004", title: "Born in Chuncheon", text: "Kim Min-ji is born on May 7, the oldest of the future NewJeans." },
    { when: "2021", title: "A BTS music video cameo", text: "Appears in BTS's “Permission to Dance” video before her own debut." },
    { when: "Aug 2022", title: "Debut at 18", text: "NewJeans debuts with “Attention” and the New Jeans EP. Minji is the eldest of the group." },
    { when: "Dec 2022", title: "Co-writes Ditto", text: "Her name appears in the lyric credits of one of the group's biggest songs." },
    { when: "Jul 2026", title: "Back on camera", text: "Appears in ADOR's “2026 Summer of NewJeans” videos for the 4th anniversary. ADOR said her future activities were still under discussion." }
  ]
});
Object.assign(window.MEMBERS.hanni, {
  born: "Oct 6, 2004", from: "Grew up in Australia", role: "The boba queen",
  summary: "Hanni is a Vietnamese-Australian member who grew up in Australia. She joined after the Plus Global Auditions and is fluent in English and Korean.",
  facts: ["Born Oct 6, 2004 and raised in Australia.", "The only Plus Global Auditions trainee who made it into NewJeans.", "Fluent in English and Korean."],
  journey: [
    { when: "2004", title: "Born Oct 6", text: "Hanni Pham is born and grows up in Australia, with Vietnamese-Australian roots." },
    { when: "2021", title: "A BTS music video cameo", text: "Has a cameo in BTS's “Permission to Dance” video." },
    { when: "Audition", title: "Plus Global Auditions", text: "Becomes the only trainee from the Plus Global Auditions who joined NewJeans." },
    { when: "Aug 2022", title: "Debut at 17", text: "Debuts with NewJeans and quickly becomes a fan favourite and fashion ambassador." },
    { when: "Dec 2025", title: "Returns to ADOR", text: "Announces her return to the agency after the court rulings." },
    { when: "2026", title: "Summer of NewJeans", text: "Appears in the 4th anniversary videos; ADOR confirmed Hanni, Haerin and Hyein travelled to Copenhagen in April with staff and filming equipment." }
  ]
});
Object.assign(window.MEMBERS.danielle, {
  born: "Apr 11, 2005", from: "Grew up in Australia", role: "The sunshine bunny",
  summary: "Danielle Marsh is a Korean-Australian member who trained at YG Entertainment before passing a Source Music audition in 2020.",
  facts: ["Born Apr 11, 2005 and raised in Australia.", "A former YG Entertainment trainee.", "Passed a Source Music audition in July 2020."],
  journey: [
    { when: "2005", title: "Born Apr 11", text: "Danielle Marsh (Mo Ji-hye) is born, and grows up in Australia." },
    { when: "Trainee", title: "YG trainee days", text: "Spends time as a trainee at YG Entertainment." },
    { when: "Jul 2020", title: "Source Music audition", text: "Passes a separate Source Music audition, on the road to NewJeans." },
    { when: "Aug 2022", title: "Debut at 17", text: "Debuts with NewJeans and goes on to represent Burberry and YSL Beauty." },
    { when: "Dec 2025", title: "A new chapter", text: "ADOR announced it ended its contract with Danielle. Her sunny energy is all over this archive, forever. ☀️" }
  ]
});
Object.assign(window.MEMBERS.haerin, {
  born: "May 15, 2006", from: "Seoul, South Korea", role: "The shy cat",
  summary: "Haerin was a pansori performer as a kid, earning the nickname “voice fairy”, and was street-cast at the end of 2019.",
  facts: ["Born May 15, 2006 in Seoul.", "Used to perform pansori, a traditional Korean storytelling style.", "Her fan nickname is “voice fairy”."],
  journey: [
    { when: "2006", title: "Born in Seoul", text: "Gang Hae-rin is born on May 15." },
    { when: "Childhood", title: "Pansori performer", text: "Performs pansori, traditional Korean musical storytelling, earning the nickname “voice fairy”." },
    { when: "Late 2019", title: "Street-cast", text: "Is street-cast and becomes a trainee, three years before debut." },
    { when: "Aug 2022", title: "Debut at 16", text: "NewJeans is her first time in a group." },
    { when: "Nov 2025", title: "Returns to ADOR", text: "Announces, together with Hyein, that she will resume activities under ADOR." },
    { when: "2026", title: "Summer of NewJeans", text: "Appears in the 4th anniversary videos and the Copenhagen trip with staff." }
  ]
});
Object.assign(window.MEMBERS.hyein, {
  born: "Apr 21, 2008", from: "Seoul, South Korea", role: "The alien maknae",
  summary: "Hyein is the youngest of NewJeans — just 14 when the group debuted — and the playful, random heart of the chat.",
  facts: ["Born Apr 21, 2008 in Seoul.", "The maknae (youngest) — debuted at 14.", "Works with Louis Vuitton."],
  journey: [
    { when: "2008", title: "Born in Seoul", text: "Lee Hye-in is born on April 21, making her the youngest." },
    { when: "Aug 2022", title: "Debut at 14", text: "Debuts as the youngest member of NewJeans." },
    { when: "2023", title: "Fashion face", text: "Becomes a Louis Vuitton ambassador while the group's songs climb the charts." },
    { when: "Nov 2025", title: "Returns to ADOR", text: "Announces, together with Haerin, that she will resume activities under ADOR." },
    { when: "Jul 2026", title: "Anniversary videos", text: "Appears in “2026 Summer of NewJeans” for the 4th debut anniversary." }
  ]
});
