import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from "../contexts/authContext";
import { toast } from "react-hot-toast";

function ProtectedRoute() {

  const { userLoggedIn, loading} = useAuth(); 
  
  // Wait until auth is confirmed before making decisions
  if (loading) {
    return null; 
  }

  if (userLoggedIn) {
    return <Outlet />;
  } else {
    toast.error("You have to log in first", { duration: 1000 });
    return <Navigate to='/login' replace />;
  }
}

export default ProtectedRoute;