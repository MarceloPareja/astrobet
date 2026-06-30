import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import fs from "fs";
import path from "path";

const configPath = path.join(process.cwd(), "firebase-applet-config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

const firebaseApp = initializeApp({
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectId,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  appId: config.appId
});

// If firestoreDatabaseId is set, pass it to getFirestore. Otherwise, defaults to (default)
export const db = getFirestore(firebaseApp, config.firestoreDatabaseId || "(default)");
