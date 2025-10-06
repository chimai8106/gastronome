import React, { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged, getAuth } from "firebase/auth";
import { auth } from "../../firebase/firebase"; 

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [userLoggedIn, setUserLoggedIn] = useState(null); 
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [userName, setUserName] = useState("");
  


  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserLoggedIn(true);
        setUserName(user.displayName || user.email); 
      } else {
        setUserLoggedIn(false);
        setUserName("");
      }
    });
    return () => unsubscribe();
  }, []);


  return (
    <AuthContext.Provider
      value={{ userLoggedIn, setUserLoggedIn, isSigningIn, setIsSigningIn, userName, setUserName }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
