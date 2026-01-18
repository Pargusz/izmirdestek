import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyDTiQkeej7Dzbbtt8ML2GYNQ4JZlq0akfY",
    authDomain: "izmirdestek-2c198.firebaseapp.com",
    databaseURL: "https://izmirdestek-2c198-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "izmirdestek-2c198",
    storageBucket: "izmirdestek-2c198.firebasestorage.app",
    messagingSenderId: "860366741704",
    appId: "1:860366741704:web:7aa75bd58f3b3ba7f4c5fd",
    measurementId: "G-Q4PEZYZ07Q"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const rtdb = getDatabase(app);
const analytics = getAnalytics(app);

export { db, storage, rtdb, analytics };
