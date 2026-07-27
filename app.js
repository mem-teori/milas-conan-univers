const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const state = {
  route: "home",
  selectedPosters: new Set(["Heather nights", "Wishbone blue", "Found Heaven glow", "Superache roses"]),
  players: ["Mila"],
  questionIndex: 0,
  score: 0,
  timer: null,
  timeLeft: 15,
  answered: false,
  notes: JSON.parse(localStorage.getItem("milaNotes") || "[]"),
  galleryFilter: "bedste",
  favoriteGallery: new Set(JSON.parse(localStorage.getItem("milaGalleryFavorites") || "[\"Kid Krow Star Guitar\", \"Wishbone Blue\", \"Superache Roses\"]")),
  currentGalleryItem: null,
  galleryLimit: 12,
  activeMusicAlbum: "sunset",
  musicFavorites: JSON.parse(localStorage.getItem("milaMusicFavorites") || "[]"),
  milaFeedback: JSON.parse(localStorage.getItem("milaSiteFeedback") || "{}")
};

const quizQuestions = [
  {
    question: "Hvilken sang blev Conan Grays første store Billboard Hot 100-hit?",
    answers: ["Maniac", "Heather", "Astronomy", "Memories"],
    correct: 1,
    explanation: "“Heather” voksede blandt andet via TikTok og blev hans første sang på Billboard Hot 100.",
    host: "“Den her er næsten obligatorisk for enhver Conan-fan.”"
  },
  {
    question: "Hvad hedder Conan Grays debutalbum fra 2020?",
    answers: ["Superache", "Found Heaven", "Kid Krow", "Wishbone"],
    correct: 2,
    explanation: "Kid Krow udkom i marts 2020 og indeholder blandt andet “Maniac” og “Heather”.",
    host: "“Tilbage til begyndelsen… eller næsten.”"
  },
  {
    question: "I hvilken amerikansk stat voksede Conan primært op?",
    answers: ["Texas", "New York", "Oregon", "Florida"],
    correct: 0,
    explanation: "Han voksede især op i Georgetown, Texas, som inspirerede meget af hans tidlige musik.",
    host: "“Small-town memories incoming.”"
  },
  {
    question: "Hvad hedder EP’en fra 2018?",
    answers: ["Sunset Season", "Idle Summer", "Generation Why", "Crush Culture"],
    correct: 0,
    explanation: "Sunset Season var hans fem-numres EP og indeholder blandt andet “Idle Town”.",
    host: "“De ægte arkivfans får point her.”"
  },
  {
    question: "Hvilket album udkom i 2022?",
    answers: ["Wishbone", "Superache", "Found Heaven", "Kid Krow"],
    correct: 1,
    explanation: "Superache udkom i juni 2022.",
    host: "“Røde roser. Store følelser. I ved det.”"
  },
  {
    question: "Hvilken kunstner har Conan ofte kaldt sin største sangskrivningsinspiration?",
    answers: ["Adele", "Lorde", "Taylor Swift", "Billie Eilish"],
    correct: 2,
    explanation: "Han har gentagne gange fremhævet Taylor Swift som sin største sangskrivningsinspiration.",
    host: "“Swifties, dette er jeres øjeblik.”"
  },
  {
    question: "Hvilket album har et stærkt retropræget 70’er/80’er-udtryk?",
    answers: ["Found Heaven", "Sunset Season", "Kid Krow", "Superache"],
    correct: 0,
    explanation: "Found Heaven fra 2024 markerede en tydelig retroinspireret visuel og musikalsk retning.",
    host: "“Neonlys på. Hurtige dansesko på.”"
  },
  {
    question: "Hvilken af disse sange forbindes med Wishbone-æraen?",
    answers: ["Jigsaw", "Vodka Cranberry", "Comfort Crowd", "Lookalike"],
    correct: 1,
    explanation: "“Vodka Cranberry” er fra Wishbone-æraen.",
    host: "“Sidste spørgsmål. Gør det dramatisk.”"
  }
];

const hostLines = [
  "“Okay, Mila… den her burde du vide.”",
  "“Someone has clearly been listening.”",
  "“Det her bliver tættere, end jeg havde regnet med.”",
  "“Ingen panik. Store følelser er tilladt.”",
  "“Tre rigtige i træk? Meget hovedperson-agtigt.”"
];

function routeTo(route) {
  state.route = route;
  $$(".view").forEach(view => view.classList.toggle("active", view.id === route));
  $$("[data-route]").forEach(button => button.classList.toggle("active", button.dataset.route === route));
  $("#mainNav").classList.remove("open");
  $("#menuButton").setAttribute("aria-expanded", "false");
  window.scrollTo({ top: 0, behavior: "smooth" });
  history.replaceState(null, "", `#${route}`);
}

$$("[data-route]").forEach(button => {
  button.addEventListener("click", event => {
    event.preventDefault();
    routeTo(button.dataset.route);
  });
});

$("#menuButton").addEventListener("click", () => {
  const nav = $("#mainNav");
  const open = nav.classList.toggle("open");
  $("#menuButton").setAttribute("aria-expanded", String(open));
});

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => toast.classList.remove("show"), 2200);
}

$$("[data-toast]").forEach(button => button.addEventListener("click", () => showToast(button.dataset.toast)));

function confetti(count = 70) {
  const colors = ["#6f4ad1", "#f3a3bd", "#80aee8", "#f3db67", "#b7384f"];
  const layer = $("#confetti");
  for (let i = 0; i < count; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = `${Math.random() * .7}s`;
    piece.style.animationDuration = `${1.8 + Math.random() * 1.8}s`;
    layer.appendChild(piece);
    setTimeout(() => piece.remove(), 4000);
  }
}

// Print studio
const posterStyles = {
  "Heather nights": "p1",
  "Wishbone blue": "p2",
  "Found Heaven glow": "p3",
  "Superache roses": "p4",
  "Idle Town sunset": "p5",
  "Conan quiz night": "p6"
};

function renderPrintSheet() {
  const sheet = $("#printSheet");
  const selected = [...state.selectedPosters];
  const layout = $("#printLayout").value;
  const limits = { one: 1, two: 2, four: 4, polaroid: 4 };
  const visible = selected.slice(0, limits[layout]);
  sheet.className = `print-sheet layout-${layout}`;
  sheet.innerHTML = "";

  if (!visible.length) {
    sheet.innerHTML = '<div class="print-item"><b>Vælg et motiv</b><small>Dit printark er tomt</small></div>';
  } else {
    visible.forEach(name => {
      const source = $(`[data-poster="${CSS.escape(name)}"]`);
      const galleryItem = galleryItems?.find(entry => entry.title === name);
      const era = source?.dataset.era || galleryItem?.era || "";
      const item = document.createElement("div");
      item.className = `print-item ${posterStyles[name] || "p1"}`;
      const imagePath = posterImages?.[name] || "";
      if (imagePath) {
        item.classList.add("has-print-image");
        item.style.backgroundImage = `url("${imagePath}")`;
      }
      item.innerHTML = `<b>${name.toUpperCase()}</b><small>${era} · Mila’s archive</small>`;
      sheet.appendChild(item);
    });
  }
  $("#selectedCount").textContent = `${selected.length} valgt`;
}

$$(".poster-card").forEach(card => {
  card.addEventListener("click", () => {
    const name = card.dataset.poster;
    if (state.selectedPosters.has(name)) state.selectedPosters.delete(name);
    else state.selectedPosters.add(name);
    card.classList.toggle("selected", state.selectedPosters.has(name));
    renderPrintSheet();
  });
});
$("#printLayout").addEventListener("change", renderPrintSheet);
$("#clearPrint").addEventListener("click", () => {
  state.selectedPosters.clear();
  $$(".poster-card").forEach(card => card.classList.remove("selected"));
  renderPrintSheet();
});
$("#printButton").addEventListener("click", () => window.print());

// Quiz setup and play
function newRoomCode() {
  const words = ["HEATHER", "KROW", "ROSE", "CONAN", "WISH", "HEAVEN"];
  const word = words[Math.floor(Math.random() * words.length)];
  const number = Math.floor(10 + Math.random() * 89);
  $("#roomCode").textContent = `${word}${number}`;
}
$("#newRoom").addEventListener("click", newRoomCode);

$("#copyInvite").addEventListener("click", async () => {
  const code = $("#roomCode").textContent;
  const invite = `Kom med i Milas Conan Gray-quiz! Åbn siden og brug rumkoden ${code}.`;
  try {
    await navigator.clipboard.writeText(invite);
    showToast("Invitationen er kopieret");
  } catch {
    showToast(invite);
  }
});

const demoNames = ["Freja", "Alma", "Sofia", "Nora", "Ida", "Ella"];
$("#addDemoPlayer").addEventListener("click", () => {
  const available = demoNames.filter(name => !state.players.includes(name));
  if (!available.length) return showToast("Alle demospillere er allerede med");
  state.players.push(available[0]);
  renderPlayers();
});

function renderPlayers() {
  $("#playerList").innerHTML = state.players.map((name, i) =>
    `<span class="player ${i === 0 ? "host-player" : ""}">${i === 0 ? "👑 " : "★ "}${name}</span>`
  ).join("");
  $("#playerCount").textContent = `${state.players.length} ${state.players.length === 1 ? "spiller" : "spillere"}`;
}

function showQuizScreen(id) {
  $$(".quiz-screen").forEach(screen => screen.classList.toggle("active", screen.id === id));
}

$("#startQuiz").addEventListener("click", () => {
  state.questionIndex = 0;
  state.score = 0;
  confetti(35);
  loadQuestion();
});

function loadQuestion() {
  clearInterval(state.timer);
  state.answered = false;
  state.timeLeft = 15;
  const q = quizQuestions[state.questionIndex];
  $("#questionNumber").textContent = `Spørgsmål ${state.questionIndex + 1} / ${quizQuestions.length}`;
  $("#questionText").textContent = q.question;
  $("#hostLine").textContent = q.host;
  $("#timer").textContent = state.timeLeft;
  $("#timer").classList.remove("urgent");
  $("#answerGrid").innerHTML = q.answers.map((answer, index) =>
    `<button class="answer" data-answer="${index}">${answer}</button>`
  ).join("");
  $$(".answer").forEach(button => button.addEventListener("click", () => answerQuestion(Number(button.dataset.answer))));
  showQuizScreen("quizQuestion");
  state.timer = setInterval(() => {
    state.timeLeft--;
    $("#timer").textContent = state.timeLeft;
    if (state.timeLeft <= 5) $("#timer").classList.add("urgent");
    if (state.timeLeft <= 0) answerQuestion(-1);
  }, 1000);
}

function answerQuestion(index) {
  if (state.answered) return;
  state.answered = true;
  clearInterval(state.timer);
  const q = quizQuestions[state.questionIndex];
  const correct = index === q.correct;
  const speedBonus = correct ? state.timeLeft * 12 : 0;
  const earned = correct ? 600 + speedBonus : 0;
  state.score += earned;
  $("#resultTitle").textContent = correct ? "Rigtigt! ✦" : index === -1 ? "Tiden løb ud" : "Ikke helt";
  $("#resultExplanation").textContent = q.explanation;
  $("#scoreFlash").textContent = correct ? `+${earned} point · I alt ${state.score}` : `0 point · I alt ${state.score}`;
  $("#hostLine").textContent = correct
    ? hostLines[Math.floor(Math.random() * hostLines.length)]
    : "“Ikke helt — men nu ved du det til næste runde.”";
  showQuizScreen("quizResult");
}

$("#nextQuestion").addEventListener("click", () => {
  state.questionIndex++;
  if (state.questionIndex >= quizQuestions.length) finishQuiz();
  else loadQuestion();
});

function finishQuiz() {
  const scores = state.players.map((name, i) => ({
    name,
    score: i === 0 ? state.score : Math.max(500, Math.round((state.score * (.55 + Math.random() * .38)) / 50) * 50)
  })).sort((a, b) => b.score - a.score);
  $("#leaderboard").innerHTML = scores.map((row, i) =>
    `<div class="rank"><span>${["🥇", "🥈", "🥉"][i] || "★"} ${row.name}</span><strong>${row.score} point</strong></div>`
  ).join("");
  $("#hostLine").textContent = "“Det var dramatisk. Præcis som det skulle være.”";
  showQuizScreen("quizFinal");
  confetti(100);
}
$("#restartQuiz").addEventListener("click", () => {
  $("#hostLine").textContent = "“Er vi klar til revanche?”";
  showQuizScreen("quizSetup");
});

// Private demo
$("#unlockButton").addEventListener("click", () => {
  if ($("#pinInput").value === "1234") {
    $("#privateLock").classList.add("hidden");
    $("#privateContent").classList.remove("hidden");
    $("#pinError").textContent = "";
    confetti(25);
  } else {
    $("#pinError").textContent = "Prøvekoden er 1234.";
  }
});
$("#pinInput").addEventListener("keydown", e => {
  if (e.key === "Enter") $("#unlockButton").click();
});
$("#lockAgain").addEventListener("click", () => {
  $("#privateContent").classList.add("hidden");
  $("#privateLock").classList.remove("hidden");
  $("#pinInput").value = "";
});

$$("[data-private-tab]").forEach(button => {
  button.addEventListener("click", () => {
    $$("[data-private-tab]").forEach(b => b.classList.toggle("active", b === button));
    $$(".private-tab").forEach(tab => tab.classList.remove("active"));
    const target = button.dataset.privateTab;
    $(`#${target}Tab`).classList.add("active");
    if (target === "projects") renderProjects();
  });
});

$("#photoUpload").addEventListener("change", event => {
  const file = event.target.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) return showToast("Vælg en billedfil");
  const reader = new FileReader();
  reader.onload = () => {
    $("#photoPreview").classList.remove("empty");
    $("#photoPreview").innerHTML = `<img src="${reader.result}" alt="Lokalt valgt privat billede">`;
    showToast("Billedet vises kun lokalt i prøven");
  };
  reader.readAsDataURL(file);
});

// Idea book
function saveNotes() {
  localStorage.setItem("milaNotes", JSON.stringify(state.notes));
}

function conductorSuggestion(type, text, tags) {
  const lower = `${text} ${tags}`.toLowerCase();
  if (type === "spørgsmål" || text.includes("?")) {
    return "Det lyder som et spørgsmål, der ikke behøver et hurtigt svar. Jeg lægger det i Spørgsmålsskuffen. Du kan senere vælge: undersøg selv, spørg nogen eller lad det modne.";
  }
  if (type === "projekt" || /(bygge|lave|tegne|skrive|side|projekt|video)/.test(lower)) {
    return "Den her tanke vil måske gerne blive til noget. Jeg har markeret den til Projektbordet. Første skridt må gerne være meget lille.";
  }
  if (/(conan|musik|sang|album)/.test(lower)) {
    return "Jeg hører en musiktråd. Jeg foreslår mærket “Conan/musik”, så den kan finde de andre tanker i samme familie.";
  }
  if (/(maxi|hund)/.test(lower)) {
    return "Den hænger måske sammen med Maxi-minder eller en kreativ idé. Gem den først — forbindelserne kan komme bagefter.";
  }
  if (type === "husk") {
    return "Godt fanget. Det her er en huskenote. I den færdige udgave kan den få en rolig påmindelse uden streaks eller pres.";
  }
  return "Tanken er gemt uden at blive tvunget på plads. Når flere tanker kommer til, kan jeg hjælpe med at se, hvilke der hører sammen.";
}

$("#ideaForm").addEventListener("submit", event => {
  event.preventDefault();
  const type = $("#ideaType").value;
  const text = $("#ideaText").value.trim();
  const tags = $("#ideaTags").value.trim();
  if (!text) return showToast("Skriv bare nogle få ord først");
  const note = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    type,
    text,
    tags: tags ? tags.split(",").map(tag => tag.trim()).filter(Boolean) : [],
    created: new Date().toISOString(),
    project: type === "projekt"
  };
  state.notes.unshift(note);
  saveNotes();
  $("#conductorMessage").textContent = conductorSuggestion(type, text, tags);
  $("#ideaText").value = "";
  $("#ideaTags").value = "";
  renderNotes();
renderHeroArchive();
renderGallery();
renderMusicAlbum();
renderMusicFavorites();
renderMilaFeedback();
  showToast("Tanken er fanget");
});

$$("[data-idea-prompt]").forEach(button => {
  button.addEventListener("click", () => {
    $("#ideaText").value = `${button.dataset.ideaPrompt}\n`;
    $("#ideaText").focus();
  });
});

$("#noteFilter").addEventListener("change", renderNotes);

function formatDate(iso) {
  return new Intl.DateTimeFormat("da-DK", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

function renderNotes() {
  const filter = $("#noteFilter").value;
  const notes = filter === "alle" ? state.notes : state.notes.filter(note => note.type === filter);
  $("#noteSummary").textContent = state.notes.length
    ? `${state.notes.length} ${state.notes.length === 1 ? "tanke" : "tanker"} gemt lokalt`
    : "Ingen noter endnu.";
  $("#notesList").innerHTML = notes.length ? notes.map(note => `
    <article class="note-card" data-note-id="${note.id}">
      <header>
        <span class="note-type">${note.type}</span>
        <span class="note-date">${formatDate(note.created)}</span>
      </header>
      <p>${escapeHtml(note.text)}</p>
      <div class="tag-row">${note.tags.map(tag => `<span class="tag">#${escapeHtml(tag)}</span>`).join("")}</div>
      <div class="note-actions">
        <button data-promote="${note.id}">${note.project ? "På projektbordet" : "Gør til projekt"}</button>
        <button data-delete="${note.id}">Slet</button>
      </div>
    </article>
  `).join("") : '<p class="fine-print">Ingen tanker i denne skuffe endnu.</p>';

  $$("[data-delete]").forEach(button => button.addEventListener("click", () => {
    state.notes = state.notes.filter(note => note.id !== button.dataset.delete);
    saveNotes();
    renderNotes();
renderHeroArchive();
renderGallery();
renderMusicAlbum();
renderMusicFavorites();
renderMilaFeedback();
  }));
  $$("[data-promote]").forEach(button => button.addEventListener("click", () => {
    const note = state.notes.find(n => n.id === button.dataset.promote);
    if (note) note.project = !note.project;
    saveNotes();
    renderNotes();
renderHeroArchive();
renderGallery();
renderMusicAlbum();
renderMusicFavorites();
renderMilaFeedback();
    showToast(note?.project ? "Flyttet til Projektbordet" : "Fjernet fra Projektbordet");
  }));
}

function renderProjects() {
  const projects = state.notes.filter(note => note.project);
  $("#projectBoard").innerHTML = projects.length ? projects.map(note => `
    <article class="project-card">
      <span class="note-type">${note.type}</span>
      <h4>${escapeHtml(note.text.slice(0, 80))}${note.text.length > 80 ? "…" : ""}</h4>
      <div class="project-steps">
        <span>1. Hvad vil jeg gerne ende med?</span>
        <span>2. Hvad er det mindste første skridt?</span>
        <span>3. Hvad skal jeg finde eller spørge om?</span>
      </div>
    </article>
  `).join("") : '<p class="fine-print">Projektbordet er tomt. En tanke kan flyttes hertil fra Idébogen.</p>';
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
}


const galleryItems = [
  {
    title: "Sunset Season Live",
    era: "Sunset Season",
    caption: "Rød og intim koncertstemning til den tidlige Conan-periode.",
    style: "g1",
    label: "early live era",
    image: "images/gallery/sunset-season-1.png",
    quality: "hd"
  },
  {
    title: "Kid Krow Star Guitar",
    era: "Kid Krow",
    caption: "Mørk scenestemning, sort guitar og stjernedetalje.",
    style: "g2",
    label: "star guitar",
    image: "images/gallery/kid-krow-1.png",
    quality: "hd"
  },
  {
    title: "Superache Roses",
    era: "Superache",
    caption: "Roser, levende lys og den store følelsesmæssige Superache-stemning.",
    style: "g3",
    label: "roses + candlelight",
    image: "images/gallery/superache-1.png",
    quality: "hd"
  },
  {
    title: "Found Heaven Gold",
    era: "Found Heaven",
    caption: "Gyldent scenelys og et mere stort, poleret live-show.",
    style: "g4",
    label: "golden spotlight",
    image: "images/gallery/found-heaven-1.png",
    quality: "hd"
  },
  {
    title: "Wishbone Blue",
    era: "Wishbone",
    caption: "Blåt scenelys, guitar og et roligere drømmende udtryk.",
    style: "g5",
    label: "blue live mood",
    image: "images/gallery/wishbone-1.png",
    quality: "hd"
  },
  {
    title: "Late Night Confession",
    era: "Kid Krow",
    caption: "En mørk grafisk fanplakat til natte-spillelisten og quiz-aftenen.",
    style: "g6",
    label: "night confession",
    image: "",
    quality: "graphic"
  },
  {
    title: "This Song Letters",
    era: "Wishbone",
    caption: "Et stille og nostalgisk grafisk kort med breve og blå farver.",
    style: "g7",
    label: "letters + blue",
    image: "",
    quality: "graphic"
  },
  {
    title: "Heart Notes",
    era: "Superache",
    caption: "Et grafisk motiv til favoritmapper, moodboards og collager.",
    style: "g8",
    label: "heart notes",
    image: "",
    quality: "graphic"
  },
  {
    title: "Idle Town Dusk",
    era: "Sunset Season",
    caption: "Solnedgang og veje ud af byen i et tidligt Conan-inspireret motiv.",
    style: "g9",
    label: "sunset drive",
    image: "",
    quality: "graphic"
  },
  {
    title: "Lonely Dancers Lights",
    era: "Found Heaven",
    caption: "Lys, fart og dansegulv i et mere showpræget univers.",
    style: "g10",
    label: "dance floor",
    image: "",
    quality: "graphic"
  },
  {
    title: "Ivory Window",
    era: "Wishbone",
    caption: "Et lyst og roligt portræt med blød dagslysstemning.",
    style: "g5",
    label: "soft daylight",
    image: "images/gallery/more/wb-02.jpg",
    quality: "mini"
  },
  {
    title: "Striped Silence",
    era: "Kid Krow",
    caption: "Sort-hvidt, stille portræt med mørk Kid Krow-følelse.",
    style: "g2",
    label: "monochrome quiet",
    image: "images/gallery/more/kk-02.jpg",
    quality: "mini"
  },
  {
    title: "Heart Stage",
    era: "Sunset Season",
    caption: "Rød koncertenergi og et tidligt, ungdommeligt liveudtryk.",
    style: "g1",
    label: "red live",
    image: "images/gallery/more/ss-02.jpg",
    quality: "mini"
  },
  {
    title: "Sticker Close-up",
    era: "Superache",
    caption: "Et intenst nærportræt med små hjertedetaljer.",
    style: "g3",
    label: "heart detail",
    image: "images/gallery/more/sa-02.jpg",
    quality: "mini"
  },
  {
    title: "Red Stripes",
    era: "Kid Krow",
    caption: "Et mørkt og eftertænksomt portræt i røde og sorte striber.",
    style: "g2",
    label: "red stripes",
    image: "images/gallery/more/kk-03.jpg",
    quality: "mini"
  },
  {
    title: "Blue Guitar Stage",
    era: "Wishbone",
    caption: "Blåt scenelys og guitar i et stort liveøjeblik.",
    style: "g5",
    label: "blue stage",
    image: "images/gallery/more/wb-03.jpg",
    quality: "mini"
  },
  {
    title: "Golden Piano",
    era: "Found Heaven",
    caption: "En varm silhuet ved klaveret i gyldent lys.",
    style: "g4",
    label: "golden piano",
    image: "images/gallery/more/fh-02.jpg",
    quality: "mini"
  },
  {
    title: "Heart Face",
    era: "Superache",
    caption: "Et enkelt portræt med små røde hjertemarkeringer.",
    style: "g3",
    label: "heart portrait",
    image: "images/gallery/more/sa-03.jpg",
    quality: "mini"
  },
  {
    title: "Warm Candid",
    era: "Sunset Season",
    caption: "Et varmt og mere afslappet portræt med tidlig fan-archive-stemning.",
    style: "g1",
    label: "warm candid",
    image: "images/gallery/more/ss-03.jpg",
    quality: "mini"
  },
  {
    title: "Red Guitar Night",
    era: "Sunset Season",
    caption: "Rød livebelysning og guitar i en tæt koncertscene.",
    style: "g1",
    label: "night guitar",
    image: "images/gallery/more/ss-04.jpg",
    quality: "mini"
  },
  {
    title: "Flowers Studio",
    era: "Superache",
    caption: "Blomster og et blødt studioportræt i Superache-farver.",
    style: "g3",
    label: "flowers studio",
    image: "images/gallery/more/sa-04.jpg",
    quality: "mini"
  },
  {
    title: "Side Profile",
    era: "Kid Krow",
    caption: "Et mørkt sideportræt med enkelt, filmisk lys.",
    style: "g2",
    label: "cinematic profile",
    image: "images/gallery/more/kk-04.jpg",
    quality: "mini"
  },
  {
    title: "Retro Suit",
    era: "Found Heaven",
    caption: "Et mere poleret og retropræget portræt i jakkesæt.",
    style: "g4",
    label: "retro suit",
    image: "images/gallery/more/fh-03.jpg",
    quality: "mini"
  },
  {
    title: "Gold Vocal",
    era: "Found Heaven",
    caption: "Gyldent scenelys og et stort vokaløjeblik.",
    style: "g4",
    label: "gold vocal",
    image: "images/gallery/more/fh-04.jpg",
    quality: "mini"
  },
  {
    title: "Black-and-white Thought",
    era: "Kid Krow",
    caption: "Et sort-hvidt nærportræt med rolig intensitet.",
    style: "g2",
    label: "black and white",
    image: "images/gallery/more/kk-05.jpg",
    quality: "mini"
  },
  {
    title: "Blue Hands Up",
    era: "Wishbone",
    caption: "Et bredt livebillede i blå toner med armene løftet.",
    style: "g5",
    label: "blue live",
    image: "images/gallery/more/wb-04.jpg",
    quality: "mini"
  },
  {
    title: "Autumn Walk",
    era: "Sunset Season",
    caption: "Et udendørs portræt med blød efterårsstemning.",
    style: "g1",
    label: "autumn candid",
    image: "images/gallery/more/ss-05.jpg",
    quality: "mini"
  },
  {
    title: "Black-and-white Guitar",
    era: "Kid Krow",
    caption: "Et tæt sort-hvidt guitarøjeblik.",
    style: "g2",
    label: "guitar close-up",
    image: "images/gallery/more/kk-06.jpg",
    quality: "mini"
  },
  {
    title: "Archive Tee",
    era: "Kid Krow",
    caption: "Et fan-archive-inspireret portræt med guitar og grafisk T-shirt.",
    style: "g2",
    label: "archive tee",
    image: "images/gallery/more/kk-07.jpg",
    quality: "mini"
  },
  {
    title: "Dark Hoodie",
    era: "Kid Krow",
    caption: "Et mørkt, enkelt hoodie-portræt.",
    style: "g2",
    label: "dark hoodie",
    image: "images/gallery/more/kk-08.jpg",
    quality: "mini"
  },
  {
    title: "Red Sweater",
    era: "Superache",
    caption: "Et roligt portræt i dyb rød farve.",
    style: "g3",
    label: "red sweater",
    image: "images/gallery/more/sa-05.jpg",
    quality: "mini"
  },
  {
    title: "Blue Festival",
    era: "Wishbone",
    caption: "Et blåt festivaløjeblik med guitar og scenelys.",
    style: "g5",
    label: "blue festival",
    image: "images/gallery/more/wb-05.jpg",
    quality: "mini"
  },
  {
    title: "Heart Hands",
    era: "Wishbone",
    caption: "Et afslappet candid-øjeblik med hænder formet som et hjerte.",
    style: "g5",
    label: "heart hands",
    image: "images/gallery/more/wb-06.jpg",
    quality: "mini"
  },
  {
    title: "Midnight Guitar Suit",
    era: "Found Heaven",
    caption: "Sort-hvid guitar og et mere elegant sceneudtryk.",
    style: "g4",
    label: "midnight suit",
    image: "images/gallery/more/fh-05.jpg",
    quality: "mini"
  },
  {
    title: "Blue Star Guitar",
    era: "Live",
    caption: "Blåt scenelys og sort guitar i et stort liveøjeblik.",
    style: "g6",
    label: "blue live",
    image: "images/gallery/v07/live-blue-guitar.jpg",
    quality: "mini"
  },
  {
    title: "Midnight Studio",
    era: "Photoshoots",
    caption: "Et mørkt, klassisk studioportræt.",
    style: "g11",
    label: "dark studio",
    image: "images/gallery/v07/photo-dark-studio.jpg",
    quality: "mini"
  },
  {
    title: "Grey Suit Archive",
    era: "Photoshoots",
    caption: "Et elegant portræt i grå jakkestil.",
    style: "g11",
    label: "grey archive",
    image: "images/gallery/v07/photo-grey-suit.jpg",
    quality: "mini"
  },
  {
    title: "Red Candle Close-up",
    era: "Superache",
    caption: "Røde toner, blomster og levende lys.",
    style: "g3",
    label: "red candle",
    image: "images/gallery/v07/superache-red-candle.jpg",
    quality: "mini"
  },
  {
    title: "Purple Stage Guitar",
    era: "Live",
    caption: "Lilla koncertlys og et energisk guitarøjeblik.",
    style: "g6",
    label: "purple stage",
    image: "images/gallery/v07/live-purple-guitar.jpg",
    quality: "mini"
  },
  {
    title: "White Wings Stage",
    era: "Live",
    caption: "En drømmende fan-fantasi med scenevinger.",
    style: "g6",
    label: "stage fantasy",
    image: "images/gallery/v07/live-white-wings.jpg",
    quality: "mini"
  },
  {
    title: "Café Notebook",
    era: "Candids",
    caption: "Et roligt caféøjeblik med notesbog.",
    style: "g7",
    label: "café candid",
    image: "images/gallery/v07/candid-cafe.jpg",
    quality: "mini"
  },
  {
    title: "Garden White Shirt",
    era: "Candids",
    caption: "Et blødt udendørs portræt i grønne omgivelser.",
    style: "g7",
    label: "garden candid",
    image: "images/gallery/v07/candid-garden.jpg",
    quality: "mini"
  },
  {
    title: "Red Backstage Glow",
    era: "Sunset Season",
    caption: "Rød backstage-stemning med tidlig liveenergi.",
    style: "g1",
    label: "red backstage",
    image: "images/gallery/v07/sunset-red-backstage.jpg",
    quality: "mini"
  },
  {
    title: "Green Shirt Portrait",
    era: "Candids",
    caption: "Et afslappet portræt i grønne toner.",
    style: "g7",
    label: "green candid",
    image: "images/gallery/v07/candid-green-shirt.jpg",
    quality: "mini"
  },
  {
    title: "Blue Wings Guitar",
    era: "Live",
    caption: "Et blåt fan-fantasi-motiv med guitar og vinger.",
    style: "g6",
    label: "blue fantasy",
    image: "images/gallery/v07/live-blue-wings.jpg",
    quality: "mini"
  },
  {
    title: "Warm Window Portrait",
    era: "Photoshoots",
    caption: "Et filmisk portræt i varmt vindueslys.",
    style: "g11",
    label: "warm window",
    image: "images/gallery/v07/photo-warm-window.jpg",
    quality: "mini"
  },
  {
    title: "Candlelight Tee",
    era: "Candids",
    caption: "Et afslappet motiv i varmt levende lys.",
    style: "g7",
    label: "candle candid",
    image: "images/gallery/v07/candid-candle-tee.jpg",
    quality: "mini"
  },
  {
    title: "White Jacket Corridor",
    era: "Photoshoots",
    caption: "Et rent modeportræt i en mørk korridor.",
    style: "g11",
    label: "white jacket",
    image: "images/gallery/v07/photo-white-jacket.jpg",
    quality: "mini"
  },
  {
    title: "Sunset Season Poster",
    era: "Sunset Season",
    caption: "Et lodret rødt æraportræt til galleri eller print.",
    style: "g1",
    label: "era poster",
    image: "images/gallery/v07/era-sunset-poster.jpg",
    quality: "mini"
  },
  {
    title: "Kid Krow Poster",
    era: "Kid Krow",
    caption: "Et sort-hvidt Kid Krow-kort med klassisk arkivlook.",
    style: "g2",
    label: "era poster",
    image: "images/gallery/v07/era-kid-krow-poster.jpg",
    quality: "mini"
  },
  {
    title: "Superache Poster",
    era: "Superache",
    caption: "Roser og dybe røde farver samlet som æraplakat.",
    style: "g3",
    label: "era poster",
    image: "images/gallery/v07/era-superache-poster.jpg",
    quality: "mini"
  },
  {
    title: "Found Heaven Poster",
    era: "Found Heaven",
    caption: "Gyldent scenelys i en lodret Found Heaven-plakat.",
    style: "g4",
    label: "era poster",
    image: "images/gallery/v07/era-found-heaven-poster.jpg",
    quality: "mini"
  },
  {
    title: "Wishbone Poster",
    era: "Wishbone",
    caption: "Et blåt Wishbone-kort med vokal og scenelys.",
    style: "g5",
    label: "era poster",
    image: "images/gallery/v07/era-wishbone-poster.jpg",
    quality: "mini"
  },
  {
    title: "Crimson Favourite",
    era: "Superache",
    caption: "Et varmt rødt favoritportræt.",
    style: "g3",
    label: "Mila favourite",
    image: "images/gallery/v07/fav-red-suit.jpg",
    quality: "mini"
  },
  {
    title: "White Tee Favourite",
    era: "Candids",
    caption: "Et afslappet fan-archive-portræt.",
    style: "g7",
    label: "Mila favourite",
    image: "images/gallery/v07/fav-white-tee.jpg",
    quality: "mini"
  },
  {
    title: "Monochrome Favourite",
    era: "Kid Krow",
    caption: "Et sort-hvidt favoritkort med mørk stemning.",
    style: "g2",
    label: "Mila favourite",
    image: "images/gallery/v07/fav-mono-suit.jpg",
    quality: "mini"
  },
  {
    title: "Golden Brown Favourite",
    era: "Found Heaven",
    caption: "Et varmt gyldent portræt til favoritvæggen.",
    style: "g4",
    label: "Mila favourite",
    image: "images/gallery/v07/fav-brown-sweater.jpg",
    quality: "mini"
  },
  {
    title: "Sunset Season Collection",
    era: "Sunset Season",
    caption: "Seks små røde og varme motiver samlet i ét archive-kort.",
    style: "g1",
    label: "six-image collection",
    image: "images/gallery/v07/collage-sunset.jpg",
    quality: "mini"
  },
  {
    title: "Kid Krow Collection",
    era: "Kid Krow",
    caption: "En sort-hvid mini-samling til Kid Krow-arkivet.",
    style: "g2",
    label: "six-image collection",
    image: "images/gallery/v07/collage-kid-krow.jpg",
    quality: "mini"
  },
  {
    title: "Superache Collection",
    era: "Superache",
    caption: "Roser, rødt lys og portrætter samlet i én collage.",
    style: "g3",
    label: "six-image collection",
    image: "images/gallery/v07/collage-superache.jpg",
    quality: "mini"
  },
  {
    title: "Found Heaven Collection",
    era: "Found Heaven",
    caption: "Gyldne live- og portrætmotiver samlet i et æraark.",
    style: "g4",
    label: "six-image collection",
    image: "images/gallery/v07/collage-found-heaven.jpg",
    quality: "mini"
  },
  {
    title: "Wishbone Collection",
    era: "Wishbone",
    caption: "En blå samling med guitar, scene og portrætter.",
    style: "g5",
    label: "six-image collection",
    image: "images/gallery/v07/collage-wishbone.jpg",
    quality: "mini"
  },
  {
    title: "Live Collection",
    era: "Live",
    caption: "Lilla og blå koncertøjeblikke samlet i ét kort.",
    style: "g6",
    label: "six-image collection",
    image: "images/gallery/v07/collage-live.jpg",
    quality: "mini"
  },
  {
    title: "Candid Collection",
    era: "Candids",
    caption: "Udendørs og afslappede øjeblikke samlet som miniarkiv.",
    style: "g7",
    label: "six-image collection",
    image: "images/gallery/v07/collage-candids.jpg",
    quality: "mini"
  },
  {
    title: "Photoshoot Collection",
    era: "Photoshoots",
    caption: "Mode- og studioportrætter samlet i én billedvæg.",
    style: "g11",
    label: "six-image collection",
    image: "images/gallery/v07/collage-photoshoots.jpg",
    quality: "mini"
  }
];

const heroArchive = {
  image: "images/hero/conan-hero.png"
};

const posterImages = Object.fromEntries(
  galleryItems.filter(item => item.image).map(item => [item.title, item.image])
);

function applyGalleryImage(element, item) {
  if (!element) return;
  element.classList.remove("has-image");
  element.style.backgroundImage = "";
  if (item?.image) {
    element.classList.add("has-image");
    element.style.backgroundImage = `url("${item.image}")`;
  }
}

function renderHeroArchive() {
  const hero = $("#archiveHeroVisual");
  if (!hero) return;
  applyGalleryImage(hero, heroArchive);
}

galleryItems.forEach(item => {
  if (!(item.title in posterStyles)) posterStyles[item.title] = item.style;
});

function saveFavoriteGallery() {
  localStorage.setItem("milaGalleryFavorites", JSON.stringify([...state.favoriteGallery]));
}

function filteredGalleryItems() {
  if (state.galleryFilter === "bedste") {
    return galleryItems.filter(item => item.quality !== "mini");
  }
  if (state.galleryFilter === "alle") return galleryItems;
  if (state.galleryFilter === "mini") {
    return galleryItems.filter(item => item.quality === "mini");
  }
  if (state.galleryFilter === "favoritter") {
    return galleryItems.filter(item => state.favoriteGallery.has(item.title));
  }
  return galleryItems.filter(item => item.era === state.galleryFilter);
}

function renderFavoritesStrip() {
  const strip = $("#favoritesStrip");
  if (!strip) return;
  const favorites = galleryItems.filter(item => state.favoriteGallery.has(item.title)).slice(0, 3);
  strip.innerHTML = favorites.length ? favorites.map(item => `
    <article class="favorite-mini">
      <div class="favorite-mini-visual gallery-visual ${item.style}" data-favorite-visual="${escapeHtml(item.title)}">
        <strong>${escapeHtml(item.title.toUpperCase())}</strong>
        <small>${escapeHtml(item.label)}</small>
      </div>
      <div>
        <span class="note-type">${escapeHtml(item.era)}</span>
        <h4>${escapeHtml(item.title)}</h4>
        <p>${escapeHtml(item.caption)}</p>
        <button data-open-gallery-title="${escapeHtml(item.title)}">Åbn motiv →</button>
      </div>
    </article>`).join("") : '<p class="fine-print">Ingen favoritter endnu — klik på hjertet i galleriet, så dukker de op her.</p>';
  $$('[data-open-gallery-title]').forEach(button => button.addEventListener('click', () => openGalleryItem(button.dataset.openGalleryTitle)));
  $$('[data-favorite-visual]').forEach(node => {
    const item = galleryItems.find(entry => entry.title === node.dataset.favoriteVisual);
    applyGalleryImage(node, item);
  });
}

function renderGallery() {
  const grid = $("#galleryGrid");
  if (!grid) return;

  const filtered = filteredGalleryItems();
  const visible = filtered.slice(0, state.galleryLimit);

  grid.innerHTML = visible.map(item => `
    <article class="gallery-card quality-${item.quality}">
      <button class="gallery-visual ${item.style}" data-open-gallery="${escapeHtml(item.title)}" data-gallery-visual="${escapeHtml(item.title)}" aria-label="Åbn ${escapeHtml(item.title)}">
        <strong>${escapeHtml(item.title.toUpperCase())}</strong>
        <small>${escapeHtml(item.label)}</small>
      </button>
      <div class="gallery-card-copy">
        <div class="gallery-meta">
          <span>${escapeHtml(item.era)}</span>
          <span class="quality-badge ${item.quality}">${item.quality === "hd" ? "HD" : item.quality === "mini" ? "MINI" : "GRAFIK"}</span>
          <span>${state.favoriteGallery.has(item.title) ? '♥ gemt' : '☆ klar til favorit'}</span>
        </div>
        <h4>${escapeHtml(item.title)}</h4>
        <p>${escapeHtml(item.caption)}</p>
        <div class="gallery-actions">
          <button data-open-gallery="${escapeHtml(item.title)}">Åbn</button>
          <button data-favorite-gallery="${escapeHtml(item.title)}" class="${state.favoriteGallery.has(item.title) ? 'active-fav' : ''}">${state.favoriteGallery.has(item.title) ? 'Favorit' : 'Hjerte'}</button>
          <button data-gallery-print="${escapeHtml(item.title)}">${item.quality === "mini" ? "Til collage" : "Til print"}</button>
        </div>
      </div>
    </article>`).join("");

  $$('[data-open-gallery]').forEach(button => button.addEventListener('click', () => openGalleryItem(button.dataset.openGallery)));
  $$('[data-gallery-visual]').forEach(node => {
    const item = galleryItems.find(entry => entry.title === node.dataset.galleryVisual);
    applyGalleryImage(node, item);
  });
  $$('[data-favorite-gallery]').forEach(button => button.addEventListener('click', () => toggleGalleryFavorite(button.dataset.favoriteGallery)));
  $$('[data-gallery-print]').forEach(button => button.addEventListener('click', () => addGalleryItemToPrint(button.dataset.galleryPrint)));

  const count = $("#galleryCount");
  if (count) count.textContent = `${visible.length} af ${filtered.length} motiver vist`;

  const moreButton = $("#showMoreGallery");
  if (moreButton) {
    moreButton.hidden = visible.length >= filtered.length;
    moreButton.textContent = `Vis flere (${Math.min(12, filtered.length - visible.length)})`;
  }
  renderFavoritesStrip();
}

function toggleGalleryFavorite(title) {
  if (state.favoriteGallery.has(title)) state.favoriteGallery.delete(title);
  else state.favoriteGallery.add(title);
  saveFavoriteGallery();
  renderGallery();
  showToast(state.favoriteGallery.has(title) ? 'Gemt som favorit' : 'Fjernet fra favoritter');
}

function openGalleryItem(title) {
  const item = galleryItems.find(entry => entry.title === title);
  if (!item) return;
  state.currentGalleryItem = item;
  $("#modalVisual").className = `modal-visual gallery-visual ${item.style} quality-${item.quality}`;
  $("#modalVisual").innerHTML = `<strong>${escapeHtml(item.title.toUpperCase())}</strong><small>${escapeHtml(item.label)}</small>`;
  applyGalleryImage($("#modalVisual"), item);
  $("#galleryModal")?.querySelector(".gallery-modal-card")?.classList.toggle("mini-source", item.quality === "mini");
  $("#galleryModal")?.querySelector(".gallery-modal-card")?.classList.toggle("hd-source", item.quality === "hd");
  $("#modalEra").textContent = `${item.era} · ${item.quality === "hd" ? "HD" : item.quality === "mini" ? "MINIARKIV" : "GRAFIK"}`;
  $("#modalTitle").textContent = item.title;
  const qualityNote = item.quality === "mini"
    ? " Dette motiv kommer fra en samlet billedvæg og vises derfor i en mindre størrelse for at bevare skarpheden."
    : item.quality === "hd"
      ? " Dette er et højopløseligt motiv, der egner sig bedst til stor visning og print."
      : "";
  $("#modalCaption").textContent = item.caption + qualityNote;
  $("#modalPrint").textContent = item.quality === "mini" ? "Send til lille collage" : "Send til print";
  $("#modalFavorite").textContent = state.favoriteGallery.has(item.title) ? 'Fjern favorit' : 'Gem som favorit';
  $("#galleryModal").classList.add('open');
  $("#galleryModal").setAttribute('aria-hidden', 'false');
}

function closeGalleryModal() {
  $("#galleryModal")?.classList.remove('open');
  $("#galleryModal")?.setAttribute('aria-hidden', 'true');
}

function addGalleryItemToPrint(title) {
  state.selectedPosters.add(title);
  renderPrintSheet();
  routeTo('print');
  const item = galleryItems.find(entry => entry.title === title);
  showToast(item?.quality === "mini"
    ? "Miniarkiv-motivet er sendt til print — brug helst et 4-billeders collage-layout"
    : "Motivet er sendt videre til printarket");
}

$("#galleryFilters")?.addEventListener('click', event => {
  const button = event.target.closest('[data-gallery-filter]');
  if (!button) return;
  state.galleryFilter = button.dataset.galleryFilter;
  state.galleryLimit = 12;
  $$('[data-gallery-filter]').forEach(chip => chip.classList.toggle('active', chip === button));
  renderGallery();
});

$("#showMoreGallery")?.addEventListener("click", () => {
  state.galleryLimit += 12;
  renderGallery();
});

$("#randomGallery")?.addEventListener("click", () => {
  const choices = filteredGalleryItems();
  if (!choices.length) return;
  openGalleryItem(choices[Math.floor(Math.random() * choices.length)].title);
});

$("#jumpToGallery")?.addEventListener('click', () => {
  $("#galleryAnchor")?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});
$("#closeGalleryModal")?.addEventListener('click', closeGalleryModal);
$("#galleryModal")?.addEventListener('click', event => {
  if (event.target.id === 'galleryModal') closeGalleryModal();
});
$("#modalFavorite")?.addEventListener('click', () => {
  if (!state.currentGalleryItem) return;
  toggleGalleryFavorite(state.currentGalleryItem.title);
  if (state.currentGalleryItem) $("#modalFavorite").textContent = state.favoriteGallery.has(state.currentGalleryItem.title) ? 'Fjern favorit' : 'Gem som favorit';
});
$("#modalPrint")?.addEventListener('click', () => {
  if (!state.currentGalleryItem) return;
  closeGalleryModal();
  addGalleryItemToPrint(state.currentGalleryItem.title);
});


const musicAlbums = [{"id": "sunset", "title": "Sunset Season", "year": "2018", "kind": "EP", "theme": "sunset", "spotify": "https://open.spotify.com/album/16pubXUlqRziVWRsT6lLNz", "embed": "https://open.spotify.com/embed/album/16pubXUlqRziVWRsT6lLNz?utm_source=generator", "note": "Begyndelsen: småby, ungdom, længsel og tidlige Conan-fortællinger.", "tracks": [["Idle Town", "3:57"], ["Generation Why", "3:39"], ["Crush Culture", "3:24"], ["Greek God", "3:56"], ["Lookalike", "3:40"]]}, {"id": "kid", "title": "Kid Krow", "year": "2020", "kind": "Album", "theme": "kid", "spotify": "https://open.spotify.com/album/2CMlkzFI2oDAy5MbyV7OV5", "embed": "https://open.spotify.com/embed/album/2CMlkzFI2oDAy5MbyV7OV5?utm_source=generator", "note": "Det mørke gennembrudsalbum med blandt andet Heather og Maniac.", "tracks": [["Comfort Crowd", "2:54"], ["Wish You Were Sober", "2:48"], ["Maniac", "3:05"], ["(Online Love)", "0:37"], ["Checkmate", "2:28"], ["The Cut That Always Bleeds", "3:51"], ["Fight or Flight", "2:51"], ["Affluenza", "3:19"], ["(Can We Be Friends?)", "0:57"], ["Heather", "3:18"], ["Little League", "3:14"], ["The Story", "4:05"]]}, {"id": "superache", "title": "Superache", "year": "2022", "kind": "Album", "theme": "super", "spotify": "https://open.spotify.com/album/7FC09mQFRxQnKhNXDikU6p", "embed": "https://open.spotify.com/embed/album/7FC09mQFRxQnKhNXDikU6p?utm_source=generator", "note": "Roser, hjerteknus og sange, der føles som breve, man næsten ikke tør sende.", "tracks": [["Movies", "3:34"], ["People Watching", "2:38"], ["Disaster", "2:33"], ["Best Friend", "2:28"], ["Astronomy", "4:03"], ["Yours", "3:24"], ["Jigsaw", "3:28"], ["Family Line", "3:36"], ["Summer Child", "2:59"], ["Footnote", "3:44"], ["Memories", "4:08"], ["The Exit", "3:41"]]}, {"id": "heaven", "title": "Found Heaven", "year": "2024", "kind": "Album", "theme": "heaven", "spotify": "https://open.spotify.com/album/39gMxRpFKgIVvw3krIIam5", "embed": "https://open.spotify.com/embed/album/39gMxRpFKgIVvw3krIIam5?utm_source=generator", "note": "Retro-pop, stærkt scenelys og en mere storladen visuel æra.", "tracks": [["Found Heaven", "2:57"], ["Never Ending Song", "2:34"], ["Fainted Love", "2:50"], ["Lonely Dancers", "2:28"], ["Alley Rose", "3:28"], ["The Final Fight", "2:09"], ["Miss You", "2:23"], ["Bourgeoisieses", "2:31"], ["Forever With Me", "3:35"], ["Eye Of The Night", "2:21"], ["Boys & Girls", "2:22"], ["Killing Me", "3:24"], ["Winner", "3:36"]]}, {"id": "wishbone", "title": "Wishbone", "year": "2025", "kind": "Album", "theme": "wishbone", "spotify": "https://open.spotify.com/album/6xg3zSgRcJDnPagx8cmXeA", "embed": "https://open.spotify.com/embed/album/1Q0kTJx8DrQd8RJW9L7eIN?utm_source=generator", "note": "Blå nostalgi, kærlighed og et nyt personligt kapitel.", "tracks": [["Actor", "3:44"], ["This Song", "3:33"], ["Vodka Cranberry", "4:05"], ["Romeo", "3:32"], ["My World", "3:44"], ["Class Clown", "3:17"], ["Nauseous", "3:43"], ["Caramel", "3:54"], ["Connell", "3:32"], ["Sunset Tower", "3:18"], ["Eleven Eleven", "3:29"], ["Care", "3:28"]]}, {"id": "wishbone-deluxe", "title": "Wishbone Deluxe", "year": "2026", "kind": "Deluxe album", "theme": "deluxe", "spotify": "https://open.spotify.com/album/18BxfsH93SUb77MlISUt60", "embed": "https://open.spotify.com/embed/album/01FqYKXIKnGNh2dqdB4fjD?utm_source=generator", "note": "Wishbone udvidet med fem nye sange — den nyeste albumfane på siden.", "tracks": [["Actor", "3:44"], ["This Song", "3:33"], ["Vodka Cranberry", "4:05"], ["Romeo", "3:32"], ["My World", "3:44"], ["Class Clown", "3:17"], ["Nauseous", "3:43"], ["Caramel", "3:54"], ["Connell", "3:32"], ["Sunset Tower", "3:18"], ["Eleven Eleven", "3:29"], ["Care", "3:28"], ["Do I Dare", "3:43"], ["House That Always Rains", "3:35"], ["Door", "3:54"], ["Moths", "3:04"], ["The Best", "3:48"]]}];
const directMusicYouTube = {"Idle Town": "https://www.youtube.com/watch?v=BI5_hpUxDrM", "Heather": "https://www.youtube.com/watch?v=24u3NoPvgMw", "Maniac": "https://www.youtube.com/watch?v=-E-_IRJU5w0", "Memories": "https://www.youtube.com/watch?v=2lSyHZLzNYA", "Yours": "https://www.youtube.com/watch?v=W5vz8kMxx4A", "Alley Rose": "https://www.youtube.com/watch?v=M6dsZ_2v40s", "Never Ending Song": "https://www.youtube.com/watch?v=a0q6JMuLBYQ", "This Song": "https://www.youtube.com/watch?v=qgFNCy6u4UQ", "Vodka Cranberry": "https://www.youtube.com/watch?v=Yzbvv8WdP9k", "Caramel": "https://www.youtube.com/watch?v=hYZk9Xz25AQ"};

function musicKey(albumTitle, trackTitle) {
  return `${albumTitle}::${trackTitle}`;
}

function youtubeLinkFor(trackTitle) {
  if (directMusicYouTube[trackTitle]) return directMusicYouTube[trackTitle];
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`Conan Gray ${trackTitle} official`)}`;
}

function spotifySearchFor(trackTitle) {
  return `https://open.spotify.com/search/${encodeURIComponent(`Conan Gray ${trackTitle}`)}`;
}

function saveMusicFavorites() {
  localStorage.setItem("milaMusicFavorites", JSON.stringify(state.musicFavorites));
}

function toggleMusicFavorite(albumTitle, trackTitle) {
  const key = musicKey(albumTitle, trackTitle);
  const existing = state.musicFavorites.findIndex(item => item.key === key);

  if (existing >= 0) {
    state.musicFavorites.splice(existing, 1);
    showToast("Fjernet fra Milas top 5");
  } else {
    if (state.musicFavorites.length >= 5) {
      showToast("Milas top 5 er fuld — fjern først en anden sang");
      return;
    }
    state.musicFavorites.push({ key, album: albumTitle, title: trackTitle });
    showToast("Gemt i Milas top 5");
  }

  saveMusicFavorites();
  renderMusicAlbum();
  renderMusicFavorites();
renderMilaFeedback();
}

function renderMusicFavorites() {
  const list = $("#musicFavoritesList");
  const hint = $("#musicFavoriteHint");
  if (!list) return;

  if (!state.musicFavorites.length) {
    list.innerHTML = '<p class="empty-music-favorites">Ingen sange gemt endnu.</p>';
    if (hint) hint.hidden = false;
    return;
  }

  if (hint) hint.hidden = true;
  list.innerHTML = state.musicFavorites.map((item, index) => `
    <article class="music-favorite-row">
      <span>${index + 1}</span>
      <div>
        <strong>${escapeHtml(item.title)}</strong>
        <small>${escapeHtml(item.album)}</small>
      </div>
      <button data-remove-music-favorite="${escapeHtml(item.key)}" aria-label="Fjern ${escapeHtml(item.title)}">×</button>
    </article>
  `).join("");

  $$("[data-remove-music-favorite]").forEach(button => button.addEventListener("click", () => {
    state.musicFavorites = state.musicFavorites.filter(item => item.key !== button.dataset.removeMusicFavorite);
    saveMusicFavorites();
    renderMusicFavorites();
renderMilaFeedback();
    renderMusicAlbum();
  }));
}

function renderMusicAlbum() {
  const panel = $("#musicAlbumPanel");
  if (!panel) return;

  const album = musicAlbums.find(item => item.id === state.activeMusicAlbum) || musicAlbums[0];

  panel.className = `music-album-panel theme-${album.theme}`;
  panel.innerHTML = `
    <div class="music-album-header">
      <div>
        <span class="eyebrow">${escapeHtml(album.kind)} · ${escapeHtml(album.year)}</span>
        <h3>${escapeHtml(album.title)}</h3>
        <p>${escapeHtml(album.note)}</p>
        <div class="button-row compact-row">
          <a class="primary compact link-button" href="${album.spotify}" target="_blank" rel="noopener noreferrer">Åbn albummet på Spotify ↗</a>
          <a class="secondary compact link-button" href="https://www.youtube.com/results?search_query=${encodeURIComponent(`Conan Gray ${album.title} official playlist`)}" target="_blank" rel="noopener noreferrer">Find albummet på YouTube ↗</a>
        </div>
      </div>
      <div class="album-number">${String(musicAlbums.indexOf(album) + 1).padStart(2, "0")}</div>
    </div>

    <div class="music-album-layout">
      <div class="spotify-embed-wrap">
        <iframe
          title="${escapeHtml(album.title)} på Spotify"
          src="${album.embed}"
          width="100%"
          height="420"
          frameborder="0"
          allowfullscreen=""
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"></iframe>
      </div>

      <div class="track-list-wrap">
        <div class="track-list-heading">
          <strong>Trackliste</strong>
          <span>${album.tracks.length} sange</span>
        </div>
        <ol class="music-track-list">
          ${album.tracks.map((track, index) => {
            const title = track[0];
            const duration = track[1];
            const key = musicKey(album.title, title);
            const favorite = state.musicFavorites.some(item => item.key === key);
            return `
              <li>
                <span class="track-number">${String(index + 1).padStart(2, "0")}</span>
                <div class="track-name">
                  <strong>${escapeHtml(title)}</strong>
                  <small>${escapeHtml(duration)}</small>
                </div>
                <div class="track-actions">
                  <button class="track-heart ${favorite ? "active" : ""}"
                          data-music-favorite-album="${escapeHtml(album.title)}"
                          data-music-favorite-title="${escapeHtml(title)}"
                          aria-label="${favorite ? "Fjern" : "Gem"} ${escapeHtml(title)}">${favorite ? "♥" : "♡"}</button>
                  <a href="${youtubeLinkFor(title)}" target="_blank" rel="noopener noreferrer">YouTube</a>
                  <a href="${spotifySearchFor(title)}" target="_blank" rel="noopener noreferrer">Spotify</a>
                </div>
              </li>
            `;
          }).join("")}
        </ol>
      </div>
    </div>
  `;

  $$("[data-music-favorite-title]").forEach(button => button.addEventListener("click", () => {
    toggleMusicFavorite(button.dataset.musicFavoriteAlbum, button.dataset.musicFavoriteTitle);
  }));
}

$("#musicAlbumTabs")?.addEventListener("click", event => {
  const button = event.target.closest("[data-music-album]");
  if (!button) return;

  state.activeMusicAlbum = button.dataset.musicAlbum;
  $$(".music-album-tab").forEach(tab => tab.classList.toggle("active", tab === button));
  renderMusicAlbum();
  $("#musicAlbumPanel")?.scrollIntoView({ behavior: "smooth", block: "start" });
});



const feedbackLabels = {
  1: "Skal ændres",
  2: "Godt på vej",
  3: "Elsker det"
};

function saveMilaFeedback() {
  localStorage.setItem("milaSiteFeedback", JSON.stringify(state.milaFeedback));
  const status = $("#feedbackSaveStatus");
  if (status) status.textContent = "Gemt automatisk ✓";
  updateFeedbackProgress();
}

function updateFeedbackProgress() {
  const areas = $$(".feedback-card");
  const answered = areas.filter(card => {
    const entry = state.milaFeedback[card.dataset.feedbackArea] || {};
    return Boolean(entry.rating || entry.note?.trim());
  }).length;
  const count = $("#feedbackAnswered");
  if (count) count.textContent = answered;
}

function renderMilaFeedback() {
  $$(".feedback-card").forEach(card => {
    const area = card.dataset.feedbackArea;
    const entry = state.milaFeedback[area] || {};
    const textarea = card.querySelector("textarea");

    if (textarea) textarea.value = entry.note || "";
    card.querySelectorAll("[data-rating]").forEach(button => {
      button.classList.toggle("active", Number(button.dataset.rating) === Number(entry.rating));
    });
  });

  const bigIdea = $("#milaBigIdea");
  if (bigIdea) bigIdea.value = state.milaFeedback.__bigIdea || "";
  updateFeedbackProgress();
}

function feedbackAsText() {
  const lines = [
    "MILAS INPUT TIL CONAN-UNIVERSET",
    `Gemt: ${new Intl.DateTimeFormat("da-DK", { dateStyle: "long", timeStyle: "short" }).format(new Date())}`,
    ""
  ];

  $$(".feedback-card").forEach(card => {
    const area = card.dataset.feedbackArea;
    const entry = state.milaFeedback[area] || {};
    lines.push(area.toUpperCase());
    lines.push(`Vurdering: ${entry.rating ? feedbackLabels[entry.rating] : "Ikke valgt"}`);
    lines.push(`Kommentar: ${entry.note?.trim() || "Ingen kommentar"}`);
    lines.push("");
  });

  lines.push("DEN HELT FRIE IDÉ");
  lines.push(state.milaFeedback.__bigIdea?.trim() || "Ingen idé skrevet endnu");
  lines.push("");
  lines.push("MILAS TOP 5-SANGE");
  if (state.musicFavorites.length) {
    state.musicFavorites.forEach((item, index) => lines.push(`${index + 1}. ${item.title} — ${item.album}`));
  } else {
    lines.push("Ingen favoritsange gemt endnu");
  }

  return lines.join("\n");
}

$$(".feedback-card").forEach(card => {
  const area = card.dataset.feedbackArea;
  const textarea = card.querySelector("textarea");

  card.querySelectorAll("[data-rating]").forEach(button => button.addEventListener("click", () => {
    state.milaFeedback[area] ||= {};
    state.milaFeedback[area].rating = Number(button.dataset.rating);
    saveMilaFeedback();
    renderMilaFeedback();
  }));

  textarea?.addEventListener("input", () => {
    state.milaFeedback[area] ||= {};
    state.milaFeedback[area].note = textarea.value;
    saveMilaFeedback();
  });
});

$("#milaBigIdea")?.addEventListener("input", event => {
  state.milaFeedback.__bigIdea = event.target.value;
  saveMilaFeedback();
});

$("#copyMilaFeedback")?.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(feedbackAsText());
    showToast("Milas input er kopieret");
  } catch {
    showToast("Browseren kunne ikke kopiere — brug Hent mit input");
  }
});

$("#downloadMilaFeedback")?.addEventListener("click", () => {
  const blob = new Blob([feedbackAsText()], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "Milas_input_til_Conan-universet.txt";
  link.click();
  URL.revokeObjectURL(url);
  showToast("Milas input er hentet som tekstfil");
});

$("#clearMilaFeedback")?.addEventListener("click", () => {
  if (!confirm("Vil du nulstille alt input på denne side?")) return;
  state.milaFeedback = {};
  localStorage.removeItem("milaSiteFeedback");
  renderMilaFeedback();
  showToast("Inputtet er nulstillet");
});


// Startup
const initialRoute = location.hash.replace("#", "");
routeTo(["home", "conan", "music", "feedback", "print", "quiz", "private"].includes(initialRoute) ? initialRoute : "home");
renderPrintSheet();
renderPlayers();
renderNotes();
renderHeroArchive();
renderGallery();
renderMusicAlbum();
renderMusicFavorites();
renderMilaFeedback();

setTimeout(() => {
  if (!sessionStorage.getItem("milaWelcome")) {
    confetti(90);
    sessionStorage.setItem("milaWelcome", "1");
  }
}, 450);
