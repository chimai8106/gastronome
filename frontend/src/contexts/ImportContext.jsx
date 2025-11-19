import React, { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Popup from 'reactjs-popup';
import { toast } from 'react-hot-toast';
import "./ImportContext.css";
import { importRecipe } from '../services/RecipeServices';
import { useAuth } from './authContext';
import { addRecipe } from '../services/RecipeServices';

const ImportContext = createContext();

export const useImport = () => {
  const context = useContext(ImportContext);
  if (!context) {
    throw new Error('useImport must be used within ImportProvider');
  }
  return context;
};

export const ImportProvider = ({ children }) => {
  const { uid, userLoggedIn } = useAuth();
  const [isImportPopupOpen, setIsImportPopupOpen] = useState(false);  
  const [recipe, setRecipe] = useState(null);
  const [link, setLink] = useState('');  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();

  const openImportPopup = () => {
  setIsImportPopupOpen(true);
    // Reset state when opening
    setRecipe(null);
    setLink('');
    setError(null);
  };

  const closeImportPopup = () => {
    setIsImportPopupOpen(false);
    setRecipe(null);
    setLink('');
    setError(null);
  };

  // Handle link import
  const handleImportLink = async (e) => {
    e.preventDefault();
    

    if (!link || link.trim() === '') {
      toast.error('Please enter a valid link');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const res = await importRecipe(link);  
      const recipeData = typeof res === 'string' ? JSON.parse(res) : res;
      
      setRecipe(recipeData);
      toast.success('Recipe imported successfully!');
    } catch (err) {
      setError('Failed to import recipe. Please check the link and try again.');
      toast.error('Failed to import recipe');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToMyRecipes = async (recipe) => {
    // Double-check authentication
    if (!uid || !userLoggedIn) {
      toast.error("Please log in to save recipes");
      closeImportPopup();
      navigate("/login");
      return;
    }
  
    try {
      // Prepare recipe data
      const formData = new FormData();
      formData.append("title", recipe.title);
      formData.append("instruction", recipe.instruction);
      formData.append("ingredients", JSON.stringify(recipe.ingredients));
      formData.append("isPublic", "false");
      formData.append("numServings", recipe.servings || 0);
      formData.append("sourceName", link);
      formData.append("timePrepared", recipe.timePrepared || 0);
      formData.append("rating", 0);
      formData.append("cuisine", recipe.cuisines?.[0] || "");
      formData.append("difficulty", 0);
      formData.append("nutrition", "");
      formData.append("comments", JSON.stringify([]));
      formData.append("authorName", recipe.authorName);
      
      // Fetch and add image if available - with CORS handling
      if (recipe.image) {
        try {
          const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(recipe.image)}`;
          const imageResponse = await fetch(proxyUrl);
          
          if (imageResponse.ok) {
            const imageBlob = await imageResponse.blob();
            const imageFile = new File([imageBlob], `${recipe.title}.jpg`, { type: 'image/jpeg' });
            formData.append("image", imageFile);
          } else {
            console.warn("Failed to fetch image, saving recipe without image");
          }
        } catch (imgError) {
          console.warn("Image fetch failed, saving recipe without image:", imgError);
        }
      }

      await addRecipe(formData);
      closeImportPopup();
      toast.success("Successfully added to my recipe");
      navigate('/dashboard', { 
        state: { refresh: true },
        replace: true 
      });
      
    } catch (err) {
      toast.error(`Failed to save recipe: ${err?.message || err}`);
    }
  };

  return (
    <ImportContext.Provider
      value={{
        isImportPopupOpen,
        openImportPopup,
        closeImportPopup
      }}
    >
      {children}

      {/* Import Pop Up */}
      <Popup
        className="import"
        overlayClassName="popup-overlay"
        open={isImportPopupOpen}
        onClose={closeImportPopup}
        modal
        nested
        closeOnDocumentClick={true}
      >
        {(close) => (
          <div className="popup-content-wrapper">
            {/* Close Button */}
            <button 
              className="popup-close-btn" 
              onClick={closeImportPopup}
              type="button"
              aria-label="Close"
            >
              ×
            </button>

            {/* Form */}
            <form
              className="recipe-collection-form"
              onSubmit={handleImportLink}
            >        
              <div className="inline-checkbox-container">
                <label className="inline-label">Import Recipe Link</label>
                <input 
                  type="url" 
                  placeholder="https://www.allrecipes.com/recipe/..."
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="submit-button"
                disabled={isLoading}
              >
                {isLoading ? 'Importing...' : 'Get Recipe'}
              </button>
            </form>

            {/* Loading State */}
            {isLoading && (
              <div className="loading-state">
                <p>Parsing recipe... This may take a few seconds.</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="error-message">
                <p>{error}</p>
              </div>
            )}

            {/* Recipe Display */}
            {recipe && !isLoading && (
              <div className="recipe-card-search">
                {/* Recipe Image */}
                {recipe.image && (
                  <img
                    src={`https://corsproxy.io/?${encodeURIComponent(recipe.image)}`}
                    alt={recipe.title}
                    className="recipe-image-search"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                )}

                {/* Recipe Header */}
                <div className="recipe-header-search">
                  <h3>{recipe.title}</h3>
                  <div className="recipe-meta">
                    {recipe.timePrepared && (
                      <span>⏱️ {recipe.timePrepared} min</span>
                    )}
                    {recipe.numServings && (
                      <span>🍽️ {recipe.numServings}</span>
                    )}
                    {recipe.authorName && (
                      <span>👨‍🍳 {recipe.authorName}</span>
                    )}
                  </div>
                </div>

                {/* Ingredients */}
                <div className="recipe-details-expanded">
                  {recipe.ingredients && recipe.ingredients.length > 0 && (
                    <div className="ingredients-list">
                      <h4>Ingredients</h4>
                      <ul className="ingredients-list">
                        {recipe.ingredients.map((ing, i) => (
                          <li key={i}>{ing}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* Instructions */}
                {(recipe.instructions || recipe.instruction) ? (
                  <div className="section">
                    <h4>Instructions</h4>
                    <ol className="instructions-list">
                      {(recipe.instructions || recipe.instruction)
                        .split('\n')
                        .filter(step => step.trim())
                        .map((step, i) => (
                          <li key={i}>{step.trim()}</li>
                        ))}
                    </ol>
                  </div>
                ) : (
                  <p className="no-content">No instructions available</p>
                )}
              </div>

                {/* Action Buttons */}
                <table className="recipe-actions">
                  <tbody>
                  <tr>
                    <td>
                      <button
                      onClick={() => handleAddToMyRecipes(recipe)}
                      className="save-recipe-btn"
                        >
                      Save Recipe
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <button
                        onClick={() => {
                          setRecipe(null);
                          setLink('');
                        }}
                        className="secondary-button"
                      >
                        Import Another
                      </button>
                    </td>
                  </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Popup>
    </ImportContext.Provider>
  );
};