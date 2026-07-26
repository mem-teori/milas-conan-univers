# Milas Conan-univers — klikbart prøveudkast

Dette er en statisk prototype, som kan åbnes lokalt eller lægges på GitHub Pages.

## Åbn den lokalt

1. Pak ZIP-filen ud.
2. Dobbeltklik på `index.html`.
3. Den private demonstrationskode er `1234`.

## Det virker allerede i prøven

- Responsiv fødselsdagsforside
- Album-/æraoversigt
- Valg af printmotiver og A4-printvisning
- Kahoot-lignende quizflow på én enhed
- Generering af rumkode og kopiering af invitation
- Demospillere og pointtavle
- Privat demonstrationslås
- Lokal forhåndsvisning af et familiebillede
- Idébog med lokal lagring i browseren
- En regelbaseret “lille Dirigent”
- Projektbord

## Det er bevidst kun simuleret

### Livequiz på flere telefoner
Kræver Firebase Realtime Database eller Firestore. Den færdige struktur bør have:

- anonym gæsteadgang til quizrum
- kortlivede rumkoder
- værtsrolle til Mila
- samme spørgsmål/timer på alle enheder
- serversidevalidering eller Cloud Functions til point
- automatisk sletning af quizrum

### Privat familieområde
En kode i JavaScript er **ikke sikker**. Rigtig udgave kræver:

- Firebase Authentication
- Firestore/Storage Security Rules
- særskilte roller for Mila og mor
- ingen familiebilleder i GitHub-repositoriet
- backup/eksport
- mulighed for at slette alt

### Billeder af Conan Gray
Prototypegrafikken er hjemmelavet og generisk. Før offentliggørelse skal rigtige billeder:

- have genbrugstilladelse eller komme fra en kilde, der må indlejres
- krediteres korrekt
- ikke massehentes fra Google, Pinterest, Getty eller sociale medier
- holdes adskilt fra private familiebilleder

## GitHub Pages

1. Opret et nyt repository, fx `milas-conan-univers`.
2. Upload `index.html`, `styles.css` og `app.js`.
3. Åbn **Settings → Pages**.
4. Vælg **Deploy from a branch**, `main` og `/root`.
5. Gem. Siden bliver tilgængelig på din GitHub Pages-adresse.

## Næste tekniske trin

1. Opdele siden i rigtige undersider/datafiler.
2. Tilføje faktatjekket Conan-indhold.
3. Tilføje lovlige billedkilder og upload til privat storage.
4. Bygge Firebase-projekt og sikkerhedsregler.
5. Gøre quizzen ægte multiplayer.
6. Tilføje adminside til quizspørgsmål og billeder.
7. Tilføje eksport af Idébog som PDF/JSON.
