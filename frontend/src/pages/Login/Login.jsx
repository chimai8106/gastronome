import React from "react"
import { useAuth } from "../../contexts/authContext";
import { doSignInWithEmailAndPassWord, doSignInWithGoogle } from "../../firebase/auth";
import {useState} from "react"
import { Navigate } from "react-router-dom";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Link,
    useNavigate,
    Outlet,
} from "react-router-dom";


export default function Login() {
  const { userLoggedIn, isSigningIn, setIsSigningIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!isSigningIn) {
      setIsSigningIn(true);
      try {
        await doSignInWithEmailAndPassWord(email, password);
      } catch (err) {
        setErrorMessage(err.message);
        setIsSigningIn(false);
      }
    }
  };

  const onGoogleSignIn = async (e) => {
    e.preventDefault();
    if (!isSigningIn) {
      setIsSigningIn(true);
      try {
        await doSignInWithGoogle();
      } catch (err) {
        setErrorMessage(err.message);
        setIsSigningIn(false);
      }
    }
  };

  if (userLoggedIn) return <Navigate to="/dashboard" />;

  return (
    <div>
      <h1>Login</h1>
      <form onSubmit={onSubmit}>
        <input type = "email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
        <input type = "password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
        <button type="submit" disabled={isSigningIn}>Login</button>
      </form>
      <button onClick={onGoogleSignIn} disabled={isSigningIn}>Sign in with Google</button>
       <Link to="/register">Never had an account? Register now</Link>
      {errorMessage && <p>{errorMessage}</p>}
    </div>
  );
}
