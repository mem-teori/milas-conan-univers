// Firebase web-konfigurationen er offentlig klientkonfiguration.
// Adgangen beskyttes af Authentication og database.rules.json — ikke ved at skjule denne fil.
export const firebaseConfig = {
  apiKey: "PASTE_FIREBASE_API_KEY_HERE",
  authDomain: "PASTE_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://PASTE_DATABASE_NAME.REGION.firebasedatabase.app",
  projectId: "PASTE_PROJECT_ID",
  appId: "PASTE_FIREBASE_APP_ID"
};

export const firebaseReady =
  !Object.values(firebaseConfig).some(value =>
    typeof value !== "string" ||
    value.includes("PASTE_") ||
    value.trim() === ""
  );
