// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBhFWa9B44CYs-r-5nFQfdRP46e96iR1yY",
  authDomain: "gastronome-f0a35.firebaseapp.com",
  projectId: "gastronome-f0a35",
  storageBucket: "gastronome-f0a35.firebasestorage.app",
  messagingSenderId: "669921783469",
  appId: "1:669921783469:web:b1e48deb2c199829682024",
  measurementId: "G-84KW6VSV5X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

export {app, auth, analytics};
