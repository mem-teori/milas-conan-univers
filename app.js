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
  galleryFilter: "alle",
  favoriteGallery: new Set(JSON.parse(localStorage.getItem("milaGalleryFavorites") || "[\"Kid Krow Portrait\", \"Wishbone Blue\", \"Superache Roses\"]")),
  currentGalleryItem: null
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
      const era = source?.dataset.era || "";
      const item = document.createElement("div");
      item.className = `print-item ${posterStyles[name] || "p1"}`;
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
  }));
  $$("[data-promote]").forEach(button => button.addEventListener("click", () => {
    const note = state.notes.find(n => n.id === button.dataset.promote);
    if (note) note.project = !note.project;
    saveNotes();
    renderNotes();
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


const heroArchive = {
  title: "CONAN<br>GRAY",
  subtitle: "fan archive edition",
  image: "images/hero/conan-hero.jpg"
};

const galleryItems = [
  { title: "Kid Krow Portrait", era: "Kid Krow", caption: "Mørk og enkel Conan-stemning til galleri og print.", style: "g2", label: "kid krow", image: "images/gallery/kid-krow-1.jpg" },
  { title: "Heather Mood", era: "Kid Krow", caption: "En mere rolig, følelsesladet stemning fra Kid Krow-universet.", style: "g11", label: "heather mood", image: "images/gallery/kid-krow-2.jpg" },
  { title: "Superache Roses", era: "Superache", caption: "Røde toner og et mere sårbart, dramatisk udtryk.", style: "g3", label: "superache", image: "images/gallery/superache-1.jpg" },
  { title: "Found Heaven Lights", era: "Found Heaven", caption: "Lys, retro og scenefornemmelse i Found Heaven-æraen.", style: "g10", label: "found heaven", image: "images/gallery/found-heaven-1.jpg" },
  { title: "Wishbone Blue", era: "Wishbone", caption: "Blå, rolig og drømmende Conan-stemning.", style: "g5", label: "wishbone", image: "images/gallery/wishbone-1.jpg" },
  { title: "Sunset Season Glow", era: "Sunset Season", caption: "Varm og tidlig æra med orange/lilla solnedgangsenergi.", style: "g1", label: "sunset season", image: "images/gallery/sunset-season-1.jpg" },
  { title: "Late Night Confession", era: "Kid Krow", caption: "Et mørkere fan-card, som også fungerer uden et rigtigt billede endnu.", style: "g6", label: "night confession", image: "" },
  { title: "This Song Letters", era: "Wishbone", caption: "Et blidere motiv, fint til polaroidark eller collage.", style: "g7", label: "letters + blue", image: "" },
  { title: "Heart Notes", era: "Superache", caption: "Klar til at blive udskiftet med et rigtigt Superache-billede senere.", style: "g8", label: "heart notes", image: "" },
  { title: "Lonely Dancers", era: "Found Heaven", caption: "Placeholder-kort indtil et rigtigt æra-billede lægges ind.", style: "g4", label: "dance floor", image: "" }
];

function setVisualBackground(el, item) {
  if (!el) return;
  el.classList.remove("has-image");
  el.style.backgroundImage = "";
  if (item && item.image) {
    el.classList.add("has-image");
    el.style.backgroundImage = `url("${item.image}")`;
  }
}

function renderArchiveHero() {
  const visual = document.querySelector("#archiveHeroVisual");
  const title = document.querySelector("#archiveHeroTitle");
  const subtitle = document.querySelector("#archiveHeroSubtitle");
  if (!visual || !title || !subtitle) return;
  title.innerHTML = heroArchive.title;
  subtitle.textContent = heroArchive.subtitle;
  setVisualBackground(visual, heroArchive);
}

// Startup
const initialRoute = location.hash.replace("#", "");
routeTo(["home", "conan", "print", "quiz", "private"].includes(initialRoute) ? initialRoute : "home");
renderPrintSheet();
renderPlayers();
renderNotes();

setTimeout(() => {
  if (!sessionStorage.getItem("milaWelcome")) {
    confetti(90);
    sessionStorage.setItem("milaWelcome", "1");
  }
}, 450);


window.__milaImageReady = true;
