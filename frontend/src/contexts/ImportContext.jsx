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
  const [isPopUpComment, setIsPopUpComment] = useState(false);
  const [myComment, setMyComment] = useState('');
  const [loadingMessage, setLoadingMessage] = useState('');

  const navigate = useNavigate();

  const openImportPopup = () => {
    setIsImportPopupOpen(true);
    // Reset state when opening
    setRecipe(null);
    setLink('');
    setError(null);
    setIsPopUpComment(false);
    setMyComment('');
    setLoadingMessage('');
  };

  const closeImportPopup = () => {
    setIsImportPopupOpen(false);
    setRecipe(null);
    setLink('');
    setError(null);
    setIsPopUpComment(false);
    setMyComment('');
    setLoadingMessage('');
  };

  // Wake up the parser service
  const wakeUpParserService = async () => {
    // Use import.meta.env for Vite (works on server)
    const pythonHealthUrl = import.meta.env.VITE_PYTHON_HEALTH || "http://127.0.0.1:5000/health"
    const maxAttempts = 12; // ~2 minutes total
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        setLoadingMessage(`Waking up service)`);
        
        const response = await fetch(pythonHealthUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0 Safari/537.36",
          }
        });
        
        // Check if response is OK (status 200-299)
        if (response.ok) {
          return true;
        }
        
      } catch (error) {
        console.log(`Attempt ${attempt + 1} failed:`, error.message);
      }
      
      // Wait 10 seconds between attempts
      if (attempt < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
    
    return false;
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
      // First, wake up the parser service
      const isAwake = await wakeUpParserService();
      
      if (!isAwake) {
        setError('Parser service unavailable. Please try again in a moment.');
        toast.error('Parser service unavailable');
        setIsLoading(false);
        return;
      }
      
      // Service is awake, now import the recipe
      setLoadingMessage('Parsing recipe...');
      const res = await importRecipe(link);  
      const recipeData = typeof res === 'string' ? JSON.parse(res) : res;
      
      setRecipe(recipeData);
      setLoadingMessage('');
      toast.success('Recipe imported successfully!');
    } catch (err) {
      console.error('Import error:', err);
      setError('Failed to import recipe. Please check the link and try again.');
      toast.error('Failed to import recipe');
      setLoadingMessage('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToMyRecipes = async (recipe, withComment = false) => {
    // Double-check authentication
    if (!uid || !userLoggedIn) {
      toast.error("Please log in to save recipes");
      closeImportPopup();
      navigate("/login");
      return;
    }
  
    try {
      setIsLoading(true);
      setLoadingMessage('Saving recipe...');
      
      // Prepare recipe data
      const formData = new FormData();
      formData.append("title", recipe.title);
      formData.append("instruction", recipe.instructions || recipe.instruction || "");
      formData.append("ingredients", JSON.stringify(recipe.ingredients || []));
      formData.append("isPublic", "false");
      formData.append("numServings", recipe.numServings || recipe.servings || 0);
      formData.append("sourceName", link);
      formData.append("timePrepared", recipe.timePrepared || 0);
      formData.append("rating", 0);
      formData.append("cuisine", recipe.cuisines?.[0] || "");
      formData.append("difficulty", 0);
      formData.append("nutrition", "");
      formData.append("authorName", recipe.authorName || "");
      
      // Add comment if provided
      if (withComment && myComment.trim()) {
        formData.append("myComment", myComment.trim());
      }
      
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
      
      // Save the recipe
      const savedRecipe = await addRecipe(formData);
      
      if (!savedRecipe) { 
        throw new Error("Failed to save recipe");
      }

      // Success!
      setIsLoading(false);
      setLoadingMessage('');
      closeImportPopup();
      
      toast.success("Successfully added to my recipe");
      
      navigate(`/recipe/${savedRecipe._id}`, { 
        state: { refresh: true },
        replace: true 
      });
      
    } catch (err) {
      console.error('Save recipe error:', err);
      setIsLoading(false);
      setLoadingMessage('');
      
      // Display user-friendly error message
      const errorMessage = err?.response?.data?.message 
        || err?.message 
        || "Failed to save recipe. Please try again.";
      
      toast.error(errorMessage);
      
      // Don't close popup so user can try again
      setError(errorMessage);
    }
  };

  const handleCommentAndSave = () => {
    if (!myComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }
    setIsPopUpComment(false);
    handleAddToMyRecipes(recipe, true);
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
        closeOnDocumentClick={!isLoading}
      >
        {(close) => (
          <div className="popup-content-wrapper">
            {/* Close Button */}
            <button 
              className="popup-close-btn" 
              onClick={closeImportPopup}
              type="button"
              aria-label="Close"
              disabled={isLoading}
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
                {isLoading ? 'Processing...' : 'Get Recipe'}
              </button>
            </form>

            {/* Loading State */}
            {isLoading && (
              <div className="loading-state">
                <p>{loadingMessage || 'Starting...'}</p>
                <p style={{ fontSize: '0.9em', color: '#666', marginTop: '10px' }}>
                  This may take up to 2 minutes if the service is sleeping.
                </p>
              </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <div className="error-message">
                <p>{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="secondary-button"
                  style={{ marginTop: '10px' }}
                >
                  Dismiss
                </button>
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
                    {(recipe.numServings || recipe.servings) && (
                      <span>🍽️ {recipe.numServings || recipe.servings}</span>
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
                          onClick={() => handleAddToMyRecipes(recipe, false)}
                          className="save-recipe-btn"
                          disabled={isLoading}
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
                            setIsPopUpComment(false);
                            setMyComment('');
                            setError(null);
                          }}
                          className="secondary-button"
                          disabled={isLoading}
                        >
                          Import Another
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <button
                          onClick={() => setIsPopUpComment(true)} 
                          className="add-save-btn"
                          disabled={isLoading}
                        >
                          Add Comment & Save
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

      {/* Comment Popup */}
      <Popup
        className="import"
        overlayClassName="popup-overlay"
        open={isPopUpComment}
        onClose={() => {
          setIsPopUpComment(false);
          setMyComment('');
        }}
        modal
        nested
        closeOnDocumentClick={true}
      >
        {(close) => (
          <div className="popup-content-wrapper">
            {/* Close Button */}
            <button 
              className="popup-close-btn" 
              onClick={() => {
                setIsPopUpComment(false);
                setMyComment('');
              }}
              type="button"
              aria-label="Close"
            >
              ×
            </button>

            <h3 style={{ marginBottom: '20px' }}>Add Your Comment</h3>
            
            <div className="form-group">
              <label className="form-label">Comment</label>
              <textarea 
                className="form-textarea"
                rows="6"
                placeholder="What do you think about this recipe? Any modifications or tips?"
                value={myComment} 
                onChange={(e) => setMyComment(e.target.value)}
                autoFocus
              />
            </div>

            <table className="recipe-actions">
              <tbody>
                <tr>
                  <td>
                    <button
                      onClick={handleCommentAndSave}
                      className="save-recipe-btn"
                      style={{ flex: 1 }}
                    >
                      Save Recipe with Comment
                    </button>
                  </td>
                </tr>
                <tr>
                  <td>
                    <button
                      onClick={() => {
                        setIsPopUpComment(false);
                        setMyComment('');
                      }}
                      className="secondary-button"
                      style={{ flex: 1 }}
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </Popup>
    </ImportContext.Provider>
  );
};