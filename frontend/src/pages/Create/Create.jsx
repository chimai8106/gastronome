import React, { useState, useRef, useEffect } from 'react';
import { useCreate } from '../../contexts/CreateContext';
import { useImport } from '../../contexts/ImportContext';
import './Create.css';
import { useAuth } from '../../contexts/authContext';
import { useNavigate } from 'react-router-dom';

export default function CreateDropdown() {
  const {uid} = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { openRecipePopup, openCollectionPopup, closeCollectionPopup, handleRecipePopupClose} = useCreate();
  const {openImportPopup, closeImportPopup} = useImport();
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRecipeClick = () => {
    setIsDropdownOpen(false);
    if (!uid){
      navigate('/login', { 
        state: { message: 'Please log in to continue' } 
      });
    }
    openRecipePopup();
    
  };

  const handleCollectionClick = () => {
    setIsDropdownOpen(false);
    if (!uid){
      navigate('/login', { 
        state: { message: 'Please log in to continue' } 
      });
    }
    openCollectionPopup();

  };
  const handleImportClick =() =>{
    setIsDropdownOpen(false);
    if (!uid){
      navigate('/login', { 
        state: { message: 'Please log in to continue' } 
      });
    }
    openImportPopup();

  }

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
          <button className="dropdown-item" onClick={handleRecipeClick}>
            Recipe
          </button>

          <button className="dropdown-item" onClick={handleCollectionClick}>
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