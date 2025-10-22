import React, { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase/firebase"; 

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [userLoggedIn, setUserLoggedIn] = useState(false); 
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserLoggedIn(true);
        setUserName(user.displayName || user.email); 
        setUserId(user.uid);
      } else {
        setUserLoggedIn(false);
        setUserName("");
        setUserId(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  //let components handle loading themselves
  return (
    <AuthContext.Provider
      value={{ userLoggedIn, setUserLoggedIn, isSigningIn, setIsSigningIn, userName, setUserName, loading, uid: userId }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}