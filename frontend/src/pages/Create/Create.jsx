import React, { useState, useRef, useEffect } from 'react';
import { useCreate } from '../../contexts/CreateContext';
import { useImport } from '../../contexts/ImportContext';
import './Create.css';
import { useAuth } from '../../contexts/authContext';
import { useNavigate } from 'react-router-dom';
import { toast } from "react-hot-toast";

export default function CreateDropdown() {
  const { userLoggedIn } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { openRecipePopup, openCollectionPopup } = useCreate();
  const { openImportPopup } = useImport();
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  
  //Track if we've already shown the login error to prevent duplicates
  const hasShownLoginError = useRef(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  //Reset the login error flag when user logs in
  useEffect(() => {
    if (userLoggedIn) {
      hasShownLoginError.current = false;
    }
  }, [userLoggedIn]);

  const handleRecipeClick = () => {
    //Close dropdown immediately
    setIsDropdownOpen(false); 
    
    if (!userLoggedIn) {
      //Navigate after a small delay
      setTimeout(() => {
        navigate('/login', { 
          state: { message: 'Please log in to create recipes' } 
        });
      }, 100);
      
      return;
    }
    
    //Only open popup if logged in
    openRecipePopup();
  };

  const handleCollectionClick = () => {
    //Close dropdown immediately
    setIsDropdownOpen(false); 
    
    if (!userLoggedIn) {

      //Navigate after a small delay
      setTimeout(() => {
        navigate('/login', { 
          state: { message: 'Please log in to create collections' } 
        });
      }, 100);
      
      return;
    }
    
    //Only open popup if logged in
    openCollectionPopup();
  };

  const handleImportClick = () => {
    //Close dropdown immediately
    setIsDropdownOpen(false); 
    
    if (!userLoggedIn) {
      //Show error only once
      if (!hasShownLoginError.current) {
        hasShownLoginError.current = true;
        toast.error('Please log in to continue');
      }
      
      //Navigate after a small delay
      setTimeout(() => {
        navigate('/login', { 
          state: { message: 'Please log in to import recipes' } 
        });
      }, 100);
      
      return;
    }
    
    //Only open popup if logged in
    openImportPopup();
  };

  return (
    <div className="create-dropdown-container" ref={dropdownRef}>
      <button
        className="create-nav-btn"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        Create +
      </button>

      {isDropdownOpen && (
        <div className="dropdown-menu">
          <button className="dropdown-item" 
          onClick={() => {
            handleRecipeClick()}}>
            Recipe
          </button>

          <button className="dropdown-item" 
          onClick={() => {
            handleCollectionClick();}}>
            Recipe Collection
          </button>

          <button className="dropdown-item" onClick={handleImportClick}>
            Import Recipe
          </button>
        </div>
      )}
    </div>
  );
}