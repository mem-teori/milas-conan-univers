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
  favoriteGallery: new Set(JSON.parse(localStorage.getItem("milaGalleryFavorites") || "[\"Kid Krow Monochrome\", \"Wishbone Blue Window\", \"Superache Roses\"]")),
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
renderGallery();
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
renderGallery();
  }));
  $$("[data-promote]").forEach(button => button.addEventListener("click", () => {
    const note = state.notes.find(n => n.id === button.dataset.promote);
    if (note) note.project = !note.project;
    saveNotes();
    renderNotes();
renderGallery();
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
  { title: "Sunset Motel Glow", era: "Sunset Season", caption: "En varm, begyndende æra med small-town sunset-stemning.", style: "g1", label: "archive glow" },
  { title: "Kid Krow Monochrome", era: "Kid Krow", caption: "Mørkt, enkelt og mere dramatisk — perfekt som mini-plakat.", style: "g2", label: "monochrome mood" },
  { title: "Superache Roses", era: "Superache", caption: "Røde toner, knuste hjerter og store følelser.", style: "g3", label: "rose letter" },
  { title: "Found Heaven Spotlight", era: "Found Heaven", caption: "Scenelys og retro-pop vibes med mere show.", style: "g4", label: "retro glow" },
  { title: "Wishbone Blue Window", era: "Wishbone", caption: "Blå, rolig og drømmende — den type motiv der inviterer til print.", style: "g5", label: "blue memory" },
  { title: "Late Night Confession", era: "Kid Krow", caption: "En mørk fanplakat til natte-spillelisten og quiz-aftenen.", style: "g6", label: "night confession" },
  { title: "This Song Letters", era: "Wishbone", caption: "Et mere stille og nostalgisk kort med breve og blå farver.", style: "g7", label: "letters + blue" },
  { title: "Heart Notes", era: "Superache", caption: "Et følelsesladet motiv, der passer til favoritmapper og collager.", style: "g8", label: "heart notes" },
  { title: "Idle Town Dusk", era: "Sunset Season", caption: "Solnedgang og veje ud af byen — en tidlig Conan-stemning.", style: "g9", label: "sunset drive" },
  { title: "Lonely Dancers Lights", era: "Found Heaven", caption: "Lys, fart og dansegulv i et mere showet univers.", style: "g10", label: "dance floor" },
  { title: "Heather Notes", era: "Kid Krow", caption: "En mere klassisk, mørk fan-card med notebook-stemning.", style: "g11", label: "notebook mood" },
  { title: "Wishbone Polaroid", era: "Wishbone", caption: "Lyse farver og polaroid-vibe til A4-ark eller moodboard.", style: "g12", label: "polaroid card" }
];

galleryItems.forEach(item => {
  if (!(item.title in posterStyles)) posterStyles[item.title] = item.style;
});

function saveFavoriteGallery() {
  localStorage.setItem("milaGalleryFavorites", JSON.stringify([...state.favoriteGallery]));
}

function filteredGalleryItems() {
  if (state.galleryFilter === "alle") return galleryItems;
  if (state.galleryFilter === "favoritter") return galleryItems.filter(item => state.favoriteGallery.has(item.title));
  return galleryItems.filter(item => item.era === state.galleryFilter);
}

function renderFavoritesStrip() {
  const strip = $("#favoritesStrip");
  if (!strip) return;
  const favorites = galleryItems.filter(item => state.favoriteGallery.has(item.title)).slice(0, 3);
  strip.innerHTML = favorites.length ? favorites.map(item => `
    <article class="favorite-mini">
      <div class="favorite-mini-visual gallery-visual ${item.style}">
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
}

function renderGallery() {
  const grid = $("#galleryGrid");
  if (!grid) return;
  grid.innerHTML = filteredGalleryItems().map(item => `
    <article class="gallery-card">
      <button class="gallery-visual ${item.style}" data-open-gallery="${escapeHtml(item.title)}">
        <strong>${escapeHtml(item.title.toUpperCase())}</strong>
        <small>${escapeHtml(item.label)}</small>
      </button>
      <div class="gallery-card-copy">
        <div class="gallery-meta">
          <span>${escapeHtml(item.era)}</span>
          <span>${state.favoriteGallery.has(item.title) ? '♥ gemt' : '☆ klar til favorit'}</span>
        </div>
        <h4>${escapeHtml(item.title)}</h4>
        <p>${escapeHtml(item.caption)}</p>
        <div class="gallery-actions">
          <button data-open-gallery="${escapeHtml(item.title)}">Åbn</button>
          <button data-favorite-gallery="${escapeHtml(item.title)}" class="${state.favoriteGallery.has(item.title) ? 'active-fav' : ''}">${state.favoriteGallery.has(item.title) ? 'Favorit' : 'Hjerte'}</button>
          <button data-gallery-print="${escapeHtml(item.title)}">Til print</button>
        </div>
      </div>
    </article>`).join("");
  $$('[data-open-gallery]').forEach(button => button.addEventListener('click', () => openGalleryItem(button.dataset.openGallery)));
  $$('[data-favorite-gallery]').forEach(button => button.addEventListener('click', () => toggleGalleryFavorite(button.dataset.favoriteGallery)));
  $$('[data-gallery-print]').forEach(button => button.addEventListener('click', () => addGalleryItemToPrint(button.dataset.galleryPrint)));
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
  $("#modalVisual").className = `modal-visual gallery-visual ${item.style}`;
  $("#modalVisual").innerHTML = `<strong>${escapeHtml(item.title.toUpperCase())}</strong><small>${escapeHtml(item.label)}</small>`;
  $("#modalEra").textContent = item.era;
  $("#modalTitle").textContent = item.title;
  $("#modalCaption").textContent = item.caption;
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
  showToast('Motivet er sendt videre til printarket');
}

$("#galleryFilters")?.addEventListener('click', event => {
  const button = event.target.closest('[data-gallery-filter]');
  if (!button) return;
  state.galleryFilter = button.dataset.galleryFilter;
  $$('[data-gallery-filter]').forEach(chip => chip.classList.toggle('active', chip === button));
  renderGallery();
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

// Startup
const initialRoute = location.hash.replace("#", "");
routeTo(["home", "conan", "print", "quiz", "private"].includes(initialRoute) ? initialRoute : "home");
renderPrintSheet();
renderPlayers();
renderNotes();
renderGallery();

setTimeout(() => {
  if (!sessionStorage.getItem("milaWelcome")) {
    confetti(90);
    sessionStorage.setItem("milaWelcome", "1");
  }
}, 450);
