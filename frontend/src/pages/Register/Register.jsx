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
import { toast } from "react-hot-toast";
import './Register.css';

export default function Register() {
  const { userLoggedIn, isSigningIn, setIsSigningIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    if (password === confirmPassword) {
      if (!isSigningIn) {
        setIsSigningIn(true);
        try {
          await doCreateUserWithEmailAndPassWord(email, password);
        } catch (err) {
          setErrorMessage(err.message);
          setIsSigningIn(false);
        }
      }
    } else {
      setErrorMessage("Passwords do not match");
      toast.error("Passwords do not match");
      return;
    }
  };

  if (userLoggedIn) return <Navigate to="/dashboard" />;

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <h1>Create Account</h1>
          <p>Sign up to get started</p>
        </div>

        {errorMessage && (
          <div className="error-message">
            <p>{errorMessage}</p>
          </div>
        )}

        <form onSubmit={onSubmit} className="register-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={isSigningIn}>
            {isSigningIn ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <div className="login-link">
          <Link to="/login">
            Already have an account? Sign in
          </Link>
        </div>
      </div>

      <p className="footer-text">
        Protected by industry-standard security
      </p>
    </div>
  );
}