// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, setDoc, updateDoc, onSnapshot, addDoc, deleteDoc, query, orderBy, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";


// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAhDYyECaz96lxSitthkJNRFa_kEoA34-M",
    authDomain: "ferreteria-pehuen-db.firebaseapp.com",
    projectId: "ferreteria-pehuen-db",
    storageBucket: "ferreteria-pehuen-db.firebasestorage.app",
    messagingSenderId: "1031355004226",
    appId: "1:1031355004226:web:eb11daa543ec71e629c4db"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth, collection, getDocs, doc, setDoc, updateDoc, onSnapshot, addDoc, deleteDoc, query, orderBy, where, signInWithEmailAndPassword, signOut, onAuthStateChanged };
