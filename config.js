/* ================================================
   สำนักงานต้องสาป — FIREBASE CONFIGURATION
   js/config.js
   ================================================ */

const firebaseConfig = {
  apiKey:            "AIzaSyAX-dgub2tBPebPrDPy-rAWZZcLseIzZSQ",
  authDomain:        "haunted-insurance.firebaseapp.com",
  projectId:         "haunted-insurance",
  storageBucket:     "haunted-insurance.firebasestorage.app",
  messagingSenderId: "163536861152",
  appId:             "1:163536861152:web:23eada82e929fd47dd1d85",
};

/* ================================================
   INITIALIZE FIREBASE
   After this runs, two globals are available
   to ALL js files loaded after this one:
     firebase  — the Firebase SDK
     db        — your Firestore database instance
   ================================================ */
try {
  firebase.initializeApp(firebaseConfig);
  window.db = firebase.firestore();
  console.log('🔥 Firebase connected to project:', firebaseConfig.projectId);
} catch (e) {
  console.error('❌ Firebase failed to initialize. Check your config keys.', e);
  window.db = null;
}