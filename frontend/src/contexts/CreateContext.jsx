import React, { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Popup from 'reactjs-popup';
import { toast } from 'react-hot-toast';

import RecipeForm from '../components/RecipeForm';
import RecipeCollectionForm from '../components/RecipeCollectionForm';
import { addRecipe, updateRecipe } from '../services/RecipeServices';
import { addRecipeCollection } from '../services/RecipeCollectionServices';
import './CreateContext.css';
import {useAddMutation, useUpdateMutation} from "../hooks/useMutation"

const CreateContext = createContext();

export const useCreate = () => {
  const context = useContext(CreateContext);
  if (!context) {
    throw new Error('useCreate must be used within CreateProvider');
  }
  return context;
};

export const CreateProvider = ({ children }) => {
  //mutation
  const { mutate: addMutation } = useAddMutation();
  const { mutate: updateMutation } = useUpdateMutation();
  const [isRecipePopupOpen, setIsRecipePopupOpen] = useState(false);
  const [isCollectionPopupOpen, setIsCollectionPopupOpen] = useState(false);
  
  // Store the recipe being edited
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [editingRecipeId, setEditingRecipeId] = useState(null);
  
  // Store callback for successful update
  const [onSuccessCallback, setOnSuccessCallback] = useState(null);
  
  const navigate = useNavigate();

  // Open for CREATE (no data)
  const openRecipePopup = () => {
    setEditingRecipe(null);
    setEditingRecipeId(null);
    setOnSuccessCallback(null);
    setIsRecipePopupOpen(true);
  };

  // Open for UPDATE (with recipe data and optional callback)
  const openUpdateRecipePopup = (recipeData, onSuccess) => {
    setEditingRecipe(recipeData);
    setEditingRecipeId(recipeData._id || recipeData.id);
    setOnSuccessCallback(() => onSuccess);
    setIsRecipePopupOpen(true);
  };

  const openCollectionPopup = () => setIsCollectionPopupOpen(true);
  
  const handleRecipePopupClose = () => {
    setIsRecipePopupOpen(false);
    setTimeout(() => {
      setEditingRecipe(null);
      setEditingRecipeId(null);
      setOnSuccessCallback(null);
    }, 100);
  };
  
  const closeCollectionPopup = () => setIsCollectionPopupOpen(false);

  // This handles both CREATE and UPDATE
  const handleSubmitRecipe = async (recipeIdOrData, recipeData) => {
    
    try {
      // If two arguments, it's UPDATE mode: (id, formData)
      if (recipeData) {
        await updateMutation(recipeIdOrData, recipeData);
        toast.success('Successfully updated recipe!');
        
        handleRecipePopupClose();
        
        // Call the success callback after closing
        if (onSuccessCallback) {
          onSuccessCallback();
        }
      } 
      // If one argument, it's CREATE mode: (formData)
      else {
       
        await addMutation(recipeIdOrData);
        toast.success('Successfully created recipe!');
        
        // Use forceClose to bypass the warning check
        handleRecipePopupClose();
        
        navigate('/dashboard', { 
        state: { refresh: true },
        replace: true 
        });
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to save recipe');
    }
  };

  const handleSubmitRecipeCollection = async (recipeCollectionData) => {
    try {
      await addRecipeCollection(recipeCollectionData);
      toast.success('Successfully created Recipe Collection!');
      closeCollectionPopup();
      navigate('/user');
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
        openUpdateRecipePopup,
        handleRecipePopupClose,
        closeCollectionPopup,
      }}
    >
      {children}

      {/* Recipe Popup (handles both CREATE and UPDATE) */}
      <Popup
        className="pop-up"
        overlayClassName="popup-overlay"
        open={isRecipePopupOpen}
        onClose={handleRecipePopupClose}
        modal
        nested
        closeOnDocumentClick={true}
      >
        {(close) => (
          <div style={{ position: 'relative' }}>
            <RecipeForm
              initialRecipe={editingRecipe}
              initialId={editingRecipeId}
              onSubmit={async (...args) => {
                await handleSubmitRecipe(...args);
                close();
              }}
              submitButtonText={editingRecipe ? "Update Recipe" : "Create Recipe"}
            />
          </div>
            
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
        closeOnDocumentClick={true}
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