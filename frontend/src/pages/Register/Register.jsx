import React from "react";
import { useState } from "react";
import { useAuth } from "../../contexts/authContext";
import { doCreateUserWithEmailAndPassWord, doSignInWithGoogle } from "../../firebase/auth";
import { Navigate } from "react-router-dom";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Link,
    useNavigate,
    Outlet,
} from "react-router-dom";
import {toast} from "react-hot-toast";


export default function Register() {
  const { userLoggedIn, isSigningIn, setIsSigningIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');


  const onSubmit = async (e) => {
    e.preventDefault();
    if (password === confirmPassword){
    if (!isSigningIn) {
      setIsSigningIn(true);
      try {
        await doCreateUserWithEmailAndPassWord(email, password);
      } catch (err) {
        setErrorMessage(err.message);
        setIsSigningIn(false);
      }
    }
    
}
    else{
        setErrorMessage("Passwords do not match");
        toast.error(errorMessage);
        return;
    }

  };

  if (userLoggedIn) return <Navigate to="/dashboard" />;

  return (
    <div>
      <h1>Register</h1>
      <form onSubmit={onSubmit}>
        <input type = "email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
        <input type = "password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
        <input type = "password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm password" />
        <button type="submit" disabled={isSigningIn}>Register</button>
      </form>
       <Link to="/login">Already have an account? Sign in</Link>
      {errorMessage && <p>{errorMessage}</p>}
    </div>
  );
}
