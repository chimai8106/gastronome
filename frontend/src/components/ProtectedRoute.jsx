import React from 'react'
import { Navigate, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from "../contexts/authContext";
import { toast } from "react-hot-toast";
import { useEffect } from 'react';

export default function ProtectedRoute() {

  const { userLoggedIn, loading} = useAuth(); 
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!userLoggedIn) navigate("/login");
  }, [userLoggedIn, navigate]);  
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