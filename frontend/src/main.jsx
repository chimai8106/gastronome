import React from 'react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from "./contexts/authContext";
import { BrowserRouter } from 'react-router-dom'
import { CreateProvider } from './contexts/CreateContext';
import { AddToCollectionProvider } from './contexts/AddToCollectionContext.jsx'




createRoot(document.getElementById('root')).render(
  <StrictMode>  
    <BrowserRouter>
      <AuthProvider>
        <CreateProvider>
        <AddToCollectionProvider>
          <App />
        </AddToCollectionProvider>
        </CreateProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)