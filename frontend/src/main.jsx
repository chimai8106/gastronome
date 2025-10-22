import React from 'react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from "./contexts/authContext";
import { BrowserRouter } from 'react-router-dom'
import { CreateProvider } from './contexts/CreateContext';


createRoot(document.getElementById('root')).render(
  <StrictMode>  
    <BrowserRouter>
      <AuthProvider>
        <CreateProvider>
          <App />
        </CreateProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)