import React, { useState, useRef, useEffect } from 'react';
import { useCreate } from '../../contexts/CreateContext';
import './Create.css';

export default function CreateDropdown() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { openRecipePopup, openCollectionPopup } = useCreate();
  const dropdownRef = useRef(null);

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
    openRecipePopup();
  };

  const handleCollectionClick = () => {
    setIsDropdownOpen(false);
    openCollectionPopup();
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
          <button className="dropdown-item" onClick={handleRecipeClick}>
            Recipe
          </button>

          <button className="dropdown-item" onClick={handleCollectionClick}>
            Recipe Collection
          </button>
        </div>
      )}
    </div>
  );
}