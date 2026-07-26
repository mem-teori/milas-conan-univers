# Opsætning: GitHub Pages + Firebase Livequiz

Denne pakke er klar til GitHub Pages. Livequizzen virker, når et Firebase-projekt er koblet på.

## 1. Opret GitHub-repository

1. Opret et nyt repository, fx `milas-conan-univers`.
2. Upload **indholdet** af mappen `milas_conan_univers` til roden af repositoryet.
3. Behold mappen `.github/workflows/pages.yml`.
4. Åbn repositoryets **Settings → Pages**.
5. Vælg **GitHub Actions** som kilde.
6. Et push til `main` udgiver siden automatisk.

Forsiden bliver typisk:

`https://DIT-GITHUB-NAVN.github.io/milas-conan-univers/`

Livequizzen bliver:

`https://DIT-GITHUB-NAVN.github.io/milas-conan-univers/live.html`

## 2. Opret Firebase-projekt

1. Gå til Firebase Console og opret et projekt.
2. Analytics er ikke nødvendig for denne side.
3. Tilføj en **Web app**.
4. Kopiér konfigurationsobjektet fra Firebase.

## 3. Indsæt Firebase-konfiguration

Åbn `firebase-config.js` og erstat alle `PASTE_...`-værdier.

Eksempel på form — brug kun værdierne fra dit eget projekt:

```js
export const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "mit-projekt.firebaseapp.com",
  databaseURL: "https://mit-projekt-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "mit-projekt",
  appId: "1:123456789:web:abcdef"
};
```

Firebase-webkonfigurationen er ikke et server-password. Sikkerheden skal ligge i Authentication og Security Rules. Læg aldrig service-account-nøgler eller private servernøgler i GitHub.

## 4. Aktivér anonym login

I Firebase Console:

1. Åbn **Authentication**.
2. Vælg **Sign-in method**.
3. Aktivér **Anonymous**.
4. Under **Authentication → Settings → Authorized domains** tilføjes:
   - `DIT-GITHUB-NAVN.github.io`
   - eventuelt dit eget domæne senere

Veninderne får midlertidige Firebase-identiteter i baggrunden. De skal ikke oplyse e-mail, telefonnummer eller fuldt navn.

## 5. Opret Realtime Database

1. Åbn **Realtime Database**.
2. Vælg **Create database**.
3. Vælg en europæisk region, hvis muligt.
4. Start i **Locked mode**.
5. Åbn fanen **Rules**.
6. Erstat reglerne med indholdet af `database.rules.json`.
7. Udgiv reglerne.

Reglerne betyder blandt andet:

- kun værten kan ændre quizforløbet og point
- en deltager kan kun oprette/slette sit eget kaldenavn
- en deltager kan kun aflevere ét svar til det aktive spørgsmål
- deltagerne kan ikke læse hinandens svar
- rum er højst læsbare i 24 timer
- værten kan slette rummet efter quizzen

## 6. Test på to enheder

1. Åbn `live.html` på en computer og vælg **Jeg er quizvært**.
2. Opret rummet.
3. Kopiér invitationen.
4. Åbn linket på en telefon — gerne i mobildata eller en anden browser.
5. Skriv et kaldenavn og deltag.
6. Start quizzen på værtsenheden.

## 7. Privat område og familiebilleder

Den private sektion i den nuværende prototype er stadig en lokal demonstration.

**Læg ikke** følgende i GitHub-repositoryet:

- billeder af Balder, Kali, Maxi, Mila eller mor
- dagbogsnoter
- private dokumenter
- Firebase service-account-filer
- adgangskoder

Den rigtige private sektion bør senere bruge:

- Firebase Authentication med faste konti til Mila og mor
- en separat databasegren med ejerbaserede regler
- Cloud Storage-regler til familiebilleder
- eksport og sletning af dagbogsdata

Quizgæster skal aldrig kunne nå den private databasegren.

## 8. Rumdata og oprydning

Quizrummene får et udløbstidspunkt på 24 timer. Reglerne afviser læsning efter udløb. Værten har desuden knappen **Luk og slet rum**, som bør bruges efter quizzen.

Automatisk fysisk sletning af forladte rum kræver senere en planlagt serverfunktion. Til en lille fødselsdagsside er manuel sletning tilstrækkelig i første udgave.

## 9. Ændring af quizspørgsmål

Spørgsmålene ligger i `quiz-data.js`.

Hvert spørgsmål har:

- `question`
- fire `options`
- `correctIndex` fra 0 til 3
- `explanation`
- `hostLine`

Filen importeres kun af værtssiden under en quizrunde. Deltagernes skærme modtager kun det aktive spørgsmål og ser facit efter afsløringen.

## 10. Vigtigt om Conan-billeder

Brug kun billeder, som må genbruges eller indlejres, og angiv fotograf/kilde/licens. Massekopiér ikke billeder fra Google, Pinterest, Getty eller sociale medier til GitHub-repositoryet.
