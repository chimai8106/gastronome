import React, { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Popup from 'reactjs-popup';
import { toast } from 'react-hot-toast';

import RecipeForm from '../components/RecipeForm';
import RecipeCollectionForm from '../components/RecipeCollectionForm';
import { addRecipe } from '../services/RecipeServices';
import { addRecipeCollection } from '../services/RecipeCollectionServices';

const CreateContext = createContext();

export const useCreate = () => {
  const context = useContext(CreateContext);
  if (!context) {
    throw new Error('useCreate must be used within CreateProvider');
  }
  return context;
};

export const CreateProvider = ({ children }) => {
  const [isRecipePopupOpen, setIsRecipePopupOpen] = useState(false);
  const [isCollectionPopupOpen, setIsCollectionPopupOpen] = useState(false);
  const navigate = useNavigate();

  const openRecipePopup = () => setIsRecipePopupOpen(true);
  const openCollectionPopup = () => setIsCollectionPopupOpen(true);
  const closeRecipePopup = () => setIsRecipePopupOpen(false);
  const closeCollectionPopup = () => setIsCollectionPopupOpen(false);

  const handleSubmitRecipe = async (recipeData) => {
    try {
      await addRecipe(recipeData);
      closeRecipePopup();
      navigate('/dashboard', {
        state: { message: 'Successfully created recipe!' },
      });
    } catch (err) {
      toast.error(err?.message || 'Failed to create recipe');
    }
  };

  const handleSubmitRecipeCollection = async (recipeCollectionData) => {
    try {
      await addRecipeCollection(recipeCollectionData);
      closeCollectionPopup();
      navigate('/user', {
        state: { message: 'Successfully created Recipe Collection!' },
      });
    } catch (err) {
      toast.error(err?.message || 'Failed to create Recipe Collection');
    }
  };

  return (
    <CreateContext.Provider
      value={{
        isRecipePopupOpen,
        isCollectionPopupOpen,
        openRecipePopup,
        openCollectionPopup,
        closeRecipePopup,
        closeCollectionPopup,
      }}
    >
      {children}

      {/* Recipe Popup */}
      <Popup
        className="pop-up"
        overlayClassName="popup-overlay"
        open={isRecipePopupOpen}
        onClose={closeRecipePopup}
        modal
        nested
      >
        {(close) => (
          <RecipeForm
            onSubmit={async (data) => {
              await handleSubmitRecipe(data);
              close();
            }}
            submitButtonText="Create Recipe"
          />
        )}
      </Popup>

      {/* Recipe Collection Popup */}
      <Popup
        className="pop-up"
        overlayClassName="popup-overlay"
        open={isCollectionPopupOpen}
        onClose={closeCollectionPopup}
        modal
        nested
      >
        {(close) => (
          <RecipeCollectionForm
            onSubmit={async (data) => {
              await handleSubmitRecipeCollection(data);
              close();
            }}
            submitButtonText="Create Collection"
          />
        )}
      </Popup>
    </CreateContext.Provider>
  );
};