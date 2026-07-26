import { firebaseConfig, firebaseReady } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getDatabase,
  ref,
  get,
  set,
  update,
  remove,
  onValue,
  onDisconnect,
  runTransaction,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const state = {
  auth: null,
  db: null,
  user: null,
  roomCode: null,
  role: null,
  playerName: "",
  serverOffset: 0,
  meta: null,
  players: {},
  publicQuestion: null,
  reveal: null,
  allAnswers: {},
  ownAnswer: null,
  questions: null,
  countdown: null,
  unsubs: [],
  ownAnswerUnsub: null,
  revealInFlight: false
};

function showView(id) {
  $$(".view").forEach(view => view.classList.toggle("active", view.id === id));
}

function showHostState(id) {
  $$(".host-state").forEach(panel => panel.classList.toggle("active", panel.id === id));
}

function showPlayerState(id) {
  $$(".player-state").forEach(panel => panel.classList.toggle("active", panel.id === id));
}

function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 2200);
}

function showError(message) {
  $("#errorMessage").textContent = message;
  showView("errorView");
}

function cleanupListeners() {
  state.unsubs.forEach(unsub => {
    try { unsub(); } catch {}
  });
  state.unsubs = [];
  if (state.ownAnswerUnsub) {
    try { state.ownAnswerUnsub(); } catch {}
    state.ownAnswerUnsub = null;
  }
  clearInterval(state.countdown);
}

function cleanName(value) {
  return value.trim().replace(/\s+/g, " ").slice(0, 24);
}

function cleanCode(value) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}

function randomRoomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return result;
}

function roomPath(suffix = "") {
  return `rooms/${state.roomCode}${suffix ? `/${suffix}` : ""}`;
}

function inviteLink(code = state.roomCode) {
  const url = new URL("live.html", window.location.href);
  url.search = "";
  url.searchParams.set("mode", "join");
  url.searchParams.set("room", code);
  return url.toString();
}

async function ensureAnonymousUser(auth) {
  return await new Promise((resolve, reject) => {
    let unsubscribe = () => {};
    unsubscribe = onAuthStateChanged(auth, async currentUser => {
      unsubscribe();
      if (currentUser) {
        resolve(currentUser);
        return;
      }
      try {
        const credential = await signInAnonymously(auth);
        resolve(credential.user);
      } catch (error) {
        reject(error);
      }
    }, reject);
  });
}

async function initialise() {
  if (!firebaseReady) {
    $("#connectionBadge").textContent = "Firebase mangler";
    $("#connectionBadge").className = "connection-badge offline";
    showView("setupView");
    return;
  }

  try {
    const app = initializeApp(firebaseConfig);
    state.auth = getAuth(app);
    state.db = getDatabase(app);
    state.user = await ensureAnonymousUser(state.auth);

    state.unsubs.push(onValue(ref(state.db, ".info/connected"), snapshot => {
      const online = snapshot.val() === true;
      $("#connectionBadge").textContent = online ? "Online" : "Ingen forbindelse";
      $("#connectionBadge").className = `connection-badge ${online ? "online" : "offline"}`;
    }));

    state.unsubs.push(onValue(ref(state.db, ".info/serverTimeOffset"), snapshot => {
      state.serverOffset = snapshot.val() || 0;
    }));

    const params = new URLSearchParams(location.search);
    const code = cleanCode(params.get("room") || "");
    if (code) {
      $("#roomCodeInput").value = code;
    }
    showView("landingView");
    if (params.get("mode") === "join" && code) {
      $("#playerNameInput").focus();
    }
  } catch (error) {
    console.error(error);
    showError("Firebase-forbindelsen kunne ikke startes. Kontrollér konfigurationen og de autoriserede domæner.");
  }
}

async function loadQuestions() {
  if (!state.questions) {
    const module = await import("./quiz-data.js");
    state.questions = module.quizQuestions;
  }
  return state.questions;
}

async function createRoom() {
  const hostName = cleanName($("#hostNameInput").value) || "Mila";
  $("#createRoomButton").disabled = true;
  $("#createRoomButton").textContent = "Opretter…";

  try {
    await loadQuestions();
    let created = false;
    let lastError = null;

    for (let attempt = 0; attempt < 8 && !created; attempt++) {
      state.roomCode = randomRoomCode();
      const now = Date.now();
      const room = {
        meta: {
          hostUid: state.user.uid,
          hostName,
          title: "Den store Conan-quiz",
          createdAt: serverTimestamp(),
          expiresAt: now + 24 * 60 * 60 * 1000,
          status: "lobby",
          currentQuestion: -1,
          totalQuestions: state.questions.length,
          durationMs: 20000
        }
      };

      try {
        await set(ref(state.db, roomPath()), room);
        created = true;
      } catch (error) {
        lastError = error;
      }
    }

    if (!created) throw lastError || new Error("Kunne ikke oprette rumkode.");

    state.role = "host";
    state.playerName = hostName;
    sessionStorage.setItem("milaHostRoom", state.roomCode);
    attachHostListeners();
    $("#hostRoomCode").textContent = state.roomCode;
    $("#inviteUrl").textContent = inviteLink();
    showView("hostView");
    toast("Quizrummet er oprettet");
  } catch (error) {
    console.error(error);
    showError("Quizrummet kunne ikke oprettes. Kontrollér Firebase-reglerne og prøv igen.");
  } finally {
    $("#createRoomButton").disabled = false;
    $("#createRoomButton").textContent = "Opret quizrum";
  }
}

async function joinRoom() {
  const code = cleanCode($("#roomCodeInput").value);
  const name = cleanName($("#playerNameInput").value);

  if (!code) return toast("Skriv rumkoden");
  if (!name) return toast("Vælg et kaldenavn");

  $("#joinRoomButton").disabled = true;
  $("#joinRoomButton").textContent = "Går ind…";
  state.roomCode = code;

  try {
    const metaSnapshot = await get(ref(state.db, roomPath("meta")));
    if (!metaSnapshot.exists()) throw new Error("Rummet findes ikke eller er udløbet.");
    const meta = metaSnapshot.val();
    if (meta.status !== "lobby") throw new Error("Quizzen er allerede begyndt.");
    if (meta.expiresAt <= Date.now() + state.serverOffset) throw new Error("Rummet er udløbet.");

    const playerRef = ref(state.db, roomPath(`players/${state.user.uid}`));
    await set(playerRef, {
      name,
      score: 0,
      joinedAt: serverTimestamp()
    });
    await onDisconnect(playerRef).remove();

    state.role = "player";
    state.playerName = name;
    sessionStorage.setItem("milaPlayerRoom", code);
    attachPlayerListeners();
    $("#playerRoomCode").textContent = code;
    $("#playerGreeting").textContent = `Hej, ${name}!`;
    showView("playerView");
    toast("Du er med i quizzen");
  } catch (error) {
    console.error(error);
    toast(error.message || "Rummet kunne ikke åbnes");
  } finally {
    $("#joinRoomButton").disabled = false;
    $("#joinRoomButton").textContent = "Gå ind i rummet";
  }
}

function attachHostListeners() {
  cleanupRoomListenersOnly();

  state.unsubs.push(onValue(ref(state.db, roomPath("meta")), snapshot => {
    if (!snapshot.exists()) return showError("Quizrummet er blevet lukket.");
    state.meta = snapshot.val();
    renderHost();
  }, error => handleRoomReadError(error)));

  state.unsubs.push(onValue(ref(state.db, roomPath("players")), snapshot => {
    state.players = snapshot.val() || {};
    renderHost();
  }));

  state.unsubs.push(onValue(ref(state.db, roomPath("publicQuestion")), snapshot => {
    state.publicQuestion = snapshot.val() || null;
    renderHost();
  }));

  state.unsubs.push(onValue(ref(state.db, roomPath("reveal")), snapshot => {
    state.reveal = snapshot.val() || null;
    renderHost();
  }));

  state.unsubs.push(onValue(ref(state.db, roomPath("answers")), snapshot => {
    state.allAnswers = snapshot.val() || {};
    renderHost();
  }));
}

function attachPlayerListeners() {
  cleanupRoomListenersOnly();

  state.unsubs.push(onValue(ref(state.db, roomPath("meta")), snapshot => {
    if (!snapshot.exists()) return showError("Quizrummet er blevet lukket.");
    const previousQuestion = state.meta?.currentQuestion;
    state.meta = snapshot.val();
    if (previousQuestion !== state.meta.currentQuestion) attachOwnAnswerListener();
    renderPlayer();
  }, error => handleRoomReadError(error)));

  state.unsubs.push(onValue(ref(state.db, roomPath("players")), snapshot => {
    state.players = snapshot.val() || {};
    renderPlayer();
  }));

  state.unsubs.push(onValue(ref(state.db, roomPath("publicQuestion")), snapshot => {
    state.publicQuestion = snapshot.val() || null;
    attachOwnAnswerListener();
    renderPlayer();
  }));

  state.unsubs.push(onValue(ref(state.db, roomPath("reveal")), snapshot => {
    state.reveal = snapshot.val() || null;
    renderPlayer();
  }));
}

function cleanupRoomListenersOnly() {
  const keep = state.unsubs.slice(0, 2); // connection and server offset
  state.unsubs.slice(2).forEach(unsub => {
    try { unsub(); } catch {}
  });
  state.unsubs = keep;
  if (state.ownAnswerUnsub) {
    try { state.ownAnswerUnsub(); } catch {}
    state.ownAnswerUnsub = null;
  }
}

function attachOwnAnswerListener() {
  if (state.role !== "player" || !state.meta || state.meta.currentQuestion < 0) return;
  if (state.ownAnswerUnsub) {
    try { state.ownAnswerUnsub(); } catch {}
  }
  const answerRef = ref(state.db, roomPath(`answers/${state.meta.currentQuestion}/${state.user.uid}`));
  state.ownAnswerUnsub = onValue(answerRef, snapshot => {
    state.ownAnswer = snapshot.val() || null;
    renderPlayer();
  });
}

function handleRoomReadError(error) {
  console.error(error);
  showError("Adgangen til rummet blev afvist. Kontrollér, at database-reglerne er indsat korrekt.");
}

function sortedPlayers() {
  return Object.entries(state.players || {})
    .map(([uid, player]) => ({ uid, ...player }))
    .sort((a, b) => (b.score || 0) - (a.score || 0) || (a.joinedAt || 0) - (b.joinedAt || 0));
}

function playerCardsHtml() {
  const players = sortedPlayers();
  if (!players.length) return '<div class="empty-people">Ingen deltagere endnu — invitationslinket er klar.</div>';
  return players.map(player => `<div class="person">★ ${escapeHtml(player.name)}</div>`).join("");
}

function leaderboardHtml(limit = 20) {
  const medals = ["🥇", "🥈", "🥉"];
  return sortedPlayers().slice(0, limit).map((player, index) => `
    <div class="rank-row">
      <span>${medals[index] || "★"} ${escapeHtml(player.name)}</span>
      <strong>${Number(player.score || 0)} point</strong>
    </div>
  `).join("") || '<div class="empty-people">Ingen point endnu.</div>';
}

function renderHost() {
  if (!state.meta) return;
  const players = sortedPlayers();
  $("#hostPlayerList").innerHTML = playerCardsHtml();
  $("#hostPlayerCount").textContent = `${players.length} ${players.length === 1 ? "deltager" : "deltagere"}`;
  $("#startLiveQuizButton").disabled = players.length === 0;

  if (state.meta.status === "lobby") {
    showHostState("hostLobbyPanel");
    $("#hostQuote").textContent = "“Vi venter bare på resten af dramatikken.”";
    return;
  }

  if (state.meta.status === "question" && state.publicQuestion) {
    showHostState("hostQuestionPanel");
    $("#hostQuestionNumber").textContent = `Spørgsmål ${state.publicQuestion.number} / ${state.publicQuestion.total}`;
    $("#hostQuestionText").textContent = state.publicQuestion.text;
    $("#hostAnswerOptions").innerHTML = state.publicQuestion.options
      .map(option => `<div>${escapeHtml(option)}</div>`).join("");

    const answersForQuestion = state.allAnswers?.[state.meta.currentQuestion] || {};
    const count = Object.keys(answersForQuestion).length;
    $("#answerCount").textContent = count;
    $("#answerProgressBar").style.width = `${players.length ? Math.min(100, count / players.length * 100) : 0}%`;
    startCountdown(state.publicQuestion, $("#hostTimer"), true);
    return;
  }

  if (state.meta.status === "reveal" && state.reveal) {
    clearInterval(state.countdown);
    showHostState("hostRevealPanel");
    $("#hostRevealTitle").textContent = `Rigtigt svar: ${state.reveal.correctText}`;
    $("#hostExplanation").textContent = state.reveal.explanation;
    $("#hostMiniLeaderboard").innerHTML = leaderboardHtml(5);
    $("#hostQuote").textContent = state.reveal.hostLine || "“Det var dramatisk. Præcis som det skulle være.”";
    const last = state.meta.currentQuestion >= state.meta.totalQuestions - 1;
    $("#nextLiveQuestionButton").textContent = last ? "Vis slutstillingen" : "Næste spørgsmål";
    return;
  }

  if (state.meta.status === "finished") {
    clearInterval(state.countdown);
    showHostState("hostFinishedPanel");
    $("#hostFinalLeaderboard").innerHTML = leaderboardHtml();
    $("#hostQuote").textContent = "“Tak for kampen. Jeg accepterer applaus.”";
  }
}

function renderPlayer() {
  if (!state.meta) return;
  $("#playerLobbyNames").innerHTML = playerCardsHtml();

  if (state.meta.status === "lobby") {
    showPlayerState("playerLobbyState");
    return;
  }

  if (state.meta.status === "question" && state.publicQuestion) {
    showPlayerState("playerQuestionState");
    $("#playerQuestionNumber").textContent = `Spørgsmål ${state.publicQuestion.number} / ${state.publicQuestion.total}`;
    $("#playerQuestionText").textContent = state.publicQuestion.text;
    const grid = $("#playerAnswerGrid");
    grid.innerHTML = "";
    state.publicQuestion.options.forEach((option, index) => {
      const button = document.createElement("button");
      button.className = "answer-button";
      button.textContent = option;
      button.disabled = Boolean(state.ownAnswer);
      if (state.ownAnswer?.choice === index) button.classList.add("chosen");
      button.addEventListener("click", () => submitAnswer(index));
      grid.appendChild(button);
    });
    $("#answerStatus").textContent = state.ownAnswer ? "Dit svar er afleveret ✓" : "Vælg ét svar";
    startCountdown(state.publicQuestion, $("#playerTimer"), false);
    return;
  }

  if (state.meta.status === "reveal" && state.reveal) {
    clearInterval(state.countdown);
    showPlayerState("playerRevealState");
    const correct = state.ownAnswer?.choice === state.reveal.correctIndex;
    $("#resultMark").textContent = correct ? "★" : "×";
    $("#resultMark").classList.toggle("wrong", !correct);
    $("#playerResultTitle").textContent = correct ? "Rigtigt!" : state.ownAnswer ? "Ikke helt" : "Du nåede ikke at svare";
    $("#playerResultExplanation").textContent = state.reveal.explanation;
    const ownPlayer = state.players?.[state.user.uid];
    $("#playerScore").textContent = Number(ownPlayer?.score || 0);
    return;
  }

  if (state.meta.status === "finished") {
    clearInterval(state.countdown);
    showPlayerState("playerFinishedState");
    $("#playerFinalLeaderboard").innerHTML = leaderboardHtml();
  }
}

function startCountdown(question, element, isHost) {
  clearInterval(state.countdown);
  const tick = () => {
    const serverNow = Date.now() + state.serverOffset;
    const end = Number(question.startedAt || serverNow) + Number(question.durationMs || 20000);
    const remainingMs = Math.max(0, end - serverNow);
    const seconds = Math.ceil(remainingMs / 1000);
    element.textContent = seconds;
    element.classList.toggle("urgent", seconds <= 5);

    if (remainingMs <= 0) {
      clearInterval(state.countdown);
      if (isHost && state.meta?.status === "question") revealQuestion();
    }
  };
  tick();
  state.countdown = setInterval(tick, 250);
}

async function publishQuestion(index) {
  const questions = await loadQuestions();
  const question = questions[index];
  if (!question) return finishQuiz();

  state.revealInFlight = false;
  await update(ref(state.db, roomPath()), {
    "meta/status": "question",
    "meta/currentQuestion": index,
    "publicQuestion": {
      number: index + 1,
      total: questions.length,
      text: question.question,
      options: question.options,
      startedAt: serverTimestamp(),
      durationMs: 20000
    },
    "reveal": null
  });
  $("#hostQuote").textContent = question.hostLine;
}

async function submitAnswer(choice) {
  if (state.ownAnswer || state.meta?.status !== "question") return;
  try {
    const answerRef = ref(state.db, roomPath(`answers/${state.meta.currentQuestion}/${state.user.uid}`));
    await set(answerRef, {
      choice,
      answeredAt: serverTimestamp()
    });
    toast("Svar afleveret");
  } catch (error) {
    console.error(error);
    toast("Svaret kunne ikke afleveres");
  }
}

async function revealQuestion() {
  if (state.revealInFlight || state.meta?.status !== "question") return;
  state.revealInFlight = true;

  try {
    const index = state.meta.currentQuestion;
    const scoredRef = ref(state.db, roomPath(`scored/${index}`));
    const transaction = await runTransaction(scoredRef, current => current === true ? undefined : true);
    if (!transaction.committed) return;

    const questions = await loadQuestions();
    const question = questions[index];
    const [answersSnapshot, playersSnapshot, publicQuestionSnapshot] = await Promise.all([
      get(ref(state.db, roomPath(`answers/${index}`))),
      get(ref(state.db, roomPath("players"))),
      get(ref(state.db, roomPath("publicQuestion")))
    ]);

    const answers = answersSnapshot.val() || {};
    const players = playersSnapshot.val() || {};
    const publicQuestion = publicQuestionSnapshot.val() || {};
    const startedAt = Number(publicQuestion.startedAt || Date.now());
    const duration = Number(publicQuestion.durationMs || 20000);
    const updates = {};

    Object.entries(players).forEach(([uid, player]) => {
      const answer = answers[uid];
      let earned = 0;
      if (answer && answer.choice === question.correctIndex) {
        const elapsed = Math.max(0, Number(answer.answeredAt || startedAt + duration) - startedAt);
        const speedRatio = Math.max(0, Math.min(1, 1 - elapsed / duration));
        earned = 600 + Math.round(speedRatio * 400);
      }
      updates[`players/${uid}/score`] = Number(player.score || 0) + earned;
      updates[`scoreLedger/${index}/${uid}`] = earned;
    });

    updates["meta/status"] = "reveal";
    updates["reveal"] = {
      correctIndex: question.correctIndex,
      correctText: question.options[question.correctIndex],
      explanation: question.explanation,
      hostLine: question.hostLine,
      revealedAt: serverTimestamp()
    };
    await update(ref(state.db, roomPath()), updates);
  } catch (error) {
    console.error(error);
    toast("Facit kunne ikke vises");
  } finally {
    state.revealInFlight = false;
  }
}

async function nextQuestion() {
  const next = state.meta.currentQuestion + 1;
  if (next >= state.meta.totalQuestions) {
    await finishQuiz();
  } else {
    await publishQuestion(next);
  }
}

async function finishQuiz() {
  await update(ref(state.db, roomPath()), {
    "meta/status": "finished",
    "meta/finishedAt": serverTimestamp()
  });
}

async function resetQuiz() {
  const updates = {
    "meta/status": "lobby",
    "meta/currentQuestion": -1,
    "publicQuestion": null,
    "reveal": null,
    "answers": null,
    "scored": null,
    "scoreLedger": null
  };
  Object.keys(state.players || {}).forEach(uid => {
    updates[`players/${uid}/score`] = 0;
  });
  await update(ref(state.db, roomPath()), updates);
}

async function deleteRoomAndReturn() {
  if (!state.roomCode) return returnToStart();
  try {
    cleanupRoomListenersOnly();
    await remove(ref(state.db, roomPath()));
  } catch (error) {
    console.error(error);
  }
  returnToStart();
}

async function leaveRoom() {
  try {
    if (state.role === "player" && state.roomCode && state.user) {
      await remove(ref(state.db, roomPath(`players/${state.user.uid}`)));
    }
  } catch (error) {
    console.error(error);
  }
  returnToStart();
}

function returnToStart() {
  cleanupRoomListenersOnly();
  clearInterval(state.countdown);
  state.roomCode = null;
  state.role = null;
  state.meta = null;
  state.players = {};
  state.publicQuestion = null;
  state.reveal = null;
  state.allAnswers = {};
  state.ownAnswer = null;
  history.replaceState(null, "", "live.html");
  showView("landingView");
}

$("#createRoomButton").addEventListener("click", createRoom);
$("#joinRoomButton").addEventListener("click", joinRoom);
$("#roomCodeInput").addEventListener("input", event => {
  event.target.value = cleanCode(event.target.value);
});
$("#roomCodeInput").addEventListener("keydown", event => {
  if (event.key === "Enter") joinRoom();
});
$("#playerNameInput").addEventListener("keydown", event => {
  if (event.key === "Enter") joinRoom();
});

$("#copyInviteButton").addEventListener("click", async () => {
  const text = `Kom med i Milas Conan Gray-quiz: ${inviteLink()} — rumkode ${state.roomCode}`;
  try {
    await navigator.clipboard.writeText(text);
    toast("Invitationen er kopieret");
  } catch {
    toast("Kopiér linket fra feltet");
  }
});

$("#startLiveQuizButton").addEventListener("click", () => publishQuestion(0));
$("#revealNowButton").addEventListener("click", revealQuestion);
$("#nextLiveQuestionButton").addEventListener("click", nextQuestion);
$("#playAgainButton").addEventListener("click", resetQuiz);
$("#closeRoomButton").addEventListener("click", deleteRoomAndReturn);
$("#finishDeleteButton").addEventListener("click", deleteRoomAndReturn);
$("#leaveRoomButton").addEventListener("click", leaveRoom);
$("#backToStartButton").addEventListener("click", returnToStart);

initialise();
