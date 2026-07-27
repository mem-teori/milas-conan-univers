# Milas Conan-univers v0.11 — Mila-preview

Denne version er lavet til den første fremvisning for Mila.

Nyt:

- personlig velkomst på forsiden
- “Mit input” i hovedmenuen
- flydende feedbackknap på alle sider
- vurdering af seks dele af hjemmesiden
- fritekstfelter til konkrete ændringer og idéer
- en helt fri “Hvis siden kunne gøre hvad som helst…”-idé
- automatisk lokal lagring
- kopiering af feedback
- download af `Milas_input_til_Conan-universet.txt`
- Milas top 5-sange kommer med i den eksporterede feedback

---

# Milas Conan-univers v0.10 — fuld musikside

Nyt i v0.10:

- selvstændig Musik-side i hovedmenuen
- albumfaner for Sunset Season, Kid Krow, Superache, Found Heaven, Wishbone og Wishbone Deluxe
- komplette tracklister
- officielle Spotify-afspillere
- YouTube- og Spotify-knapper ved hver sang
- Mila’s top 5 gemmes lokalt i browseren
- Wishbone Deluxe 2026 er med som den nyeste fane

---

# Milas Conan-univers v0.9 — musiklinks

Nyt i v0.9:

- 10 direkte links til officielle Conan Gray-videoer på YouTube
- en samlet “Lyt til Conan”-sektion
- link til Conans officielle YouTube-kanal
- galleriet åbner på “Bedste kvalitet”
- MINI-billederne er stadig tilgængelige under “Miniarkiv”
- “Alle” viser fortsat hele samlingen

Musikken hostes ikke på GitHub-siden. Knapperne åbner officielle YouTube-sider i en ny fane.

---

# Milas Conan-univers v0.8 — skarphedsrettelse

Denne version retter forskellen mellem de oprindelige højopløselige billeder og de mindre billeder, der blev beskåret fra samlede billedvægge.

## Nyt
- HD, MINI og GRAFIK-mærkning
- miniarkiv-billeder åbner i en mindre modal
- miniarkiv bruger `background-size: contain` i stor visning
- moderat kontrast- og skarphedsforbedring uden aggressiv AI-opskalering
- HD-billeder får større visning
- miniarkiv sendes primært til mindre collageprint

Vigtigt: Et lille kildebillede kan ikke få ægte nye detaljer alene gennem et skarphedsfilter. Derfor undgår v0.8 at blæse de små kilder unødigt op.

---

# Milas Conan-univers v0.7

- 65 gallerikort
- 60 kort med billeder
- nye filtre: Live, Candids og Photoshoots
- 12 billeder ad gangen
- Vis flere og Overrask mig

---

# Milas Conan-univers v0.6 — stort galleri

v0.6 expands the gallery from 10 cards to **34 gallery cards**, including 29 image-based fan-art entries.

The new thumbnails are organized under `images/gallery/more/`.

---

# Milas Conan-univers v0.5 — AI fan-art gallery

This version integrates five original AI-generated Conan Gray-inspired fan images into:

- the Conan archive hero;
- the era gallery;
- favourites;
- the large image modal;
- the print studio.

The website clearly labels the images as unofficial AI-generated fan illustrations and not authentic photographs.

See `IMAGE_CREDITS.md`.

---

# Milas Conan-univers v0.3

Denne version udvider Conan-delen med galleri, æra-kort, favoritter og lysboksvisning.

# Milas Conan-univers v0.2

GitHub Pages-klar prøveudgave med:

- den oprindelige fødselsdagsside
- printstudie
- lokalt quiz-flow
- separat ægte multiplayer-side i `live.html`
- anonym Firebase-login til quizgæster
- Realtime Database-synkronisering
- værtstyring, nedtælling, svar, point og leaderboard
- database-regler
- GitHub Actions-workflow til Pages
- tydelig sikkerhedsgrænse for familieområdet

## Start her

Læs:

`OPSÆTNING_FIREBASE_OG_GITHUB.md`

## Vigtigt

Livequizzen viser en opsætningsbesked, indtil `firebase-config.js` er udfyldt.

Den private PIN-sektion i `index.html` er fortsat kun en lokal visuel prototype. Der er ikke lagt familiebilleder eller dagbogsdata i pakken.
