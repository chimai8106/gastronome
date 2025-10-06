import React, { useRef } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from "../contexts/authContext";
import { toast } from "react-hot-toast";

function ProtectedRoute() {
  const { userLoggedIn } = useAuth();
  const hasShownToast = useRef(false); 

  if (userLoggedIn) {
    return <Outlet />;
  } else {
    if (!hasShownToast.current) {
      toast.error("You have to log in first", { duration: 1000 });
      hasShownToast.current = true; 
    }
    return <Navigate to="/login" replace />;
  }
}

export default ProtectedRoute;
