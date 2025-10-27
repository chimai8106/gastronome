import React, { createContext, useContext, useState, useEffect } from 'react';

const AddToCollectionContext = createContext();

export const useAddToCollection = () => {
  const context = useContext(AddToCollectionContext);
  if (!context) {
    throw new Error('useAddToCollection must be used within AddToCollectionProvider');
  }
  return context;
};

export const AddToCollectionProvider = ({ children }) => {
  const [openDropdownRecipeId, setOpenDropdownRecipeId] = useState(null);
  
  const closeCollectionDropdown = () => {
    setOpenDropdownRecipeId(null);
  }
  
  const toggleCollectionDropdown = (recipeId) => {
    setOpenDropdownRecipeId(prev => prev === recipeId ? null : recipeId);
  }
  
  const isDropdownOpen = (recipeId) => {
    return openDropdownRecipeId === recipeId;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Only close if a dropdown is open
      if (openDropdownRecipeId) {
        // Check if click is outside the dropdown container
        if (!event.target.closest('.collection-dropdown-container')) {
          closeCollectionDropdown();
        }
      }
    };

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdownRecipeId]);

  return (
    <AddToCollectionContext.Provider
      value={{
        toggleCollectionDropdown,
        closeCollectionDropdown,
        isDropdownOpen,
      }}
    >
      {children}
    </AddToCollectionContext.Provider>
  );
};