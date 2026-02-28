import React from "react";
import { useEffect } from "react";
import { useAuth } from "../../contexts/authContext";
import { doSignOut } from "../../firebase/auth";
import { Navigate } from "react-router-dom";


export default function Logout() {
  const { userLoggedIn} = useAuth();
  useEffect(()=>{
    doSignOut();
  },[]);

  if (!userLoggedIn) return <Navigate to="/" />;
  return null;

}
