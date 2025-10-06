import {auth} from "./firebase";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword } from "firebase/auth";
export const doCreateUserWithEmailAndPassWord =async (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
};
export const doSignInWithEmailAndPassWord =async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
};
export const doSignInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return result;
};
export const doSignOut = () => {
    return auth.signOut();
};
export const doPasswordReset = (email) =>{
    return sendPasswordResetEmail(auth, email);
};
export const doPasswordChange = (password) =>{
    return updatePassword(auth.currentUser, password);
};
export const doSendEmailVerification = () =>{
    return sendEmailVerification(auth.currentUser, {
        urel: `${window.location.origin}/home`,
    });
};

