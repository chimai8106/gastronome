import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import Popup from "reactjs-popup";
import RecipeForm from "./RecipeForm";
import { getRecipeById, deleteRecipe, updateRecipe } from "../services/RecipeServices";
import { getMyRecipeCollection, addRecipeCollection } from "../services/RecipeCollectionServices";
import "./RecipeCard.css";
import { useAuth } from "../contexts/authContext";

export default function RecipeCard() {
  const { id } = useParams(); 
  const { uid } = useAuth();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [changed, setChanged] = useState(false);
  const [recipeCollections, setRecipeCollections] = useState([]);
  const [selectedCollections, setSelectedCollections] = useState({});
  const [showCollectionDropdown, setShowCollectionDropdown] = useState({});
  const [creatingNewCollection, setCreatingNewCollection] = useState({});
  const [newCollectionName, setNewCollectionName] = useState({});

  const currentUserId = uid;
  const recipeId = id;

  useEffect(() => {
    async function fetchRecipe() {
      try {
        setLoading(true);
        const data = await getRecipeById(id);
        setRecipe(data);
      } catch (err) {
        toast.error(`Failed to load recipe: ${err?.message || err}`);
      } finally {
        setLoading(false);
      }
    }

    fetchRecipe();
  }, [id, changed]);

  useEffect(() => {
    async function fetchCollections() {
      try {
        const collectionsData = await getMyRecipeCollection();
        setRecipeCollections(collectionsData);
      } catch (err) {
        console.error("Failed to load collections:", err);
      }
    }
    
    fetchCollections();
  }, [changed]);

  const isOwner = (recipe) => recipe?.uid === currentUserId;

  // These are the SAVED collections (persisted in database)
  const savedCollectionIds = recipe?.recipeCollectionID || [];
  const savedCollectionNames = recipe?.recipeCollectionName || [];
  const currentSelections = selectedCollections[recipeId] || { ids: [], names: [] };
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const dropdownContainers = document.querySelectorAll('.collection-dropdown-container');
      let clickedInside = false;

      dropdownContainers.forEach(container => {
        if (container.contains(event.target)) {
          clickedInside = true;
        }
      });

      if (!clickedInside) {
        setShowCollectionDropdown({});
        setCreatingNewCollection({});
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Position dropdown to prevent overflow
  useEffect(() => {
    const dropdown = document.querySelector('.collection-dropdown');
    const newCollectionForm = document.querySelector('.new-collection-form');
    const elementToPosition = dropdown || newCollectionForm;
    
    if (elementToPosition && (showCollectionDropdown[recipeId] || creatingNewCollection[recipeId])) {
      const rect = elementToPosition.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      
      // If element overflows right edge, align it to the right of its container
      if (rect.right > viewportWidth) {
        elementToPosition.style.right = '0';
        elementToPosition.style.left = 'auto';
      }
    }
  }, [showCollectionDropdown, creatingNewCollection, recipeId]);

  // Remove a collection from the recipe (saved to database)
  const handleRemoveCollection = async (recipeId, collectionId) => {
    try {
      const recipe = await getRecipeById(recipeId);
      
      const updatedCollectionIds = (recipe.recipeCollectionID || []).filter(id => id !== collectionId);
      const collectionIndex = (recipe.recipeCollectionID || []).indexOf(collectionId);
      const updatedCollectionNames = (recipe.recipeCollectionName || []).filter((_, idx) => idx !== collectionIndex);
      
      const formData = new FormData();
      formData.append("title", recipe.title);
      formData.append("instruction", recipe.instruction);
      formData.append("isPublic", recipe.isPublic);
      formData.append("numServings", recipe.numServings);
      formData.append("timePrepared", recipe.timePrepared);
      formData.append("sourceName", recipe.sourceName);
      formData.append("rating", recipe.rating);
      formData.append("likes", recipe.likes);
      formData.append("cuisine", recipe.cuisine);
      formData.append("difficulty", recipe.difficulty);
      formData.append("nutrition", recipe.nutrition);
      formData.append("recipeCollectionID", JSON.stringify(updatedCollectionIds));
      formData.append("recipeCollectionName", JSON.stringify(updatedCollectionNames));
      formData.append("ingredients", JSON.stringify(recipe.ingredients));
      formData.append("comments", JSON.stringify(recipe.comments));
      
      await updateRecipe(recipeId, formData);
      toast.success("Removed from collection!");
      setChanged(!changed);
    } catch (err) {
      toast.error(`Failed to remove from collection: ${err?.message || err}`);
    }
  };

  // Toggle temporary selection in dropdown
  const handleCollectionToggle = (recipeId, collectionId, collectionName) => {
    const currentSelections = selectedCollections[recipeId] || { ids: [], names: [] };
    
    if (currentSelections.ids.includes(collectionId)) {
      setSelectedCollections({
        ...selectedCollections,
        [recipeId]: {
          ids: currentSelections.ids.filter(id => id !== collectionId),
          names: currentSelections.names.filter(name => name !== collectionName)
        }
      });
    } else {
      setSelectedCollections({
        ...selectedCollections,
        [recipeId]: {
          ids: [...currentSelections.ids, collectionId],
          names: [...currentSelections.names, collectionName]
        }
      });
    }
  };

  const handleAddToCollections = async (recipeId) => {
    const selections = selectedCollections[recipeId];
    
    if (!selections || selections.ids.length === 0) {
      toast.error("Please select at least one collection");
      return;
    }

    try {
      const recipe = await getRecipeById(recipeId);
      
      // Merge existing collections with new selections (avoid duplicates)
      const existingCollectionIds = recipe.recipeCollectionID || [];
      const existingCollectionNames = recipe.recipeCollectionName || [];
      
      const updatedCollectionIds = [...new Set([...existingCollectionIds, ...selections.ids])];
      const updatedCollectionNames = [...new Set([...existingCollectionNames, ...selections.names])];
      
      const formData = new FormData();
      formData.append("title", recipe.title);
      formData.append("instruction", recipe.instruction);
      formData.append("isPublic", recipe.isPublic);
      formData.append("numServings", recipe.numServings);
      formData.append("sourceName", recipe.sourceName);
      formData.append("timePrepared", recipe.timePrepared);
      formData.append("rating", recipe.rating);
      formData.append("likes", recipe.likes);
      formData.append("cuisine", recipe.cuisine);
      formData.append("difficulty", recipe.difficulty);
      formData.append("nutrition", recipe.nutrition);
      formData.append("recipeCollectionID", JSON.stringify(updatedCollectionIds));
      formData.append("recipeCollectionName", JSON.stringify(updatedCollectionNames));
      formData.append("ingredients", JSON.stringify(recipe.ingredients));
      formData.append("comments", JSON.stringify(recipe.comments));
      
      await updateRecipe(recipeId, formData);
      
      toast.success(`Added to ${selections.names.length} collection(s)!`);
      setShowCollectionDropdown({ ...showCollectionDropdown, [recipeId]: false });
      setSelectedCollections({ ...selectedCollections, [recipeId]: { ids: [], names: [] } });
      setChanged(!changed);
    } catch (err) {
      toast.error(`Failed to add to collections: ${err?.message || err}`);
    }
  };

  const handleCreateNewCollection = async (recipeId) => {
    const collectionName = newCollectionName[recipeId];
    if (!collectionName || collectionName.trim() === '') {
      toast.error("Please enter a collection name");
      return;
    }

    try {
      const newCol = await addRecipeCollection({
        title: collectionName,
        description: "",
        isPublic: false,
      });
      
      setRecipeCollections([...recipeCollections, newCol]);
      
      const currentSelections = selectedCollections[recipeId] || { ids: [], names: [] };
      setSelectedCollections({
        ...selectedCollections,
        [recipeId]: {
          ids: [...currentSelections.ids, newCol._id],
          names: [...currentSelections.names, newCol.title]
        }
      });
      
      setCreatingNewCollection({ ...creatingNewCollection, [recipeId]: false });
      setNewCollectionName({ ...newCollectionName, [recipeId]: "" });
      toast.success("Collection created and selected!");
    } catch (err) {
      toast.error(`Failed to create collection: ${err?.message || err}`);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this recipe?")) {
      try {
        await deleteRecipe(id);
        toast.success("Recipe deleted successfully");
        navigate("/dashboard");
      } catch (err) {
        toast.error(`Failed to delete recipe: ${err?.message || err}`);
      }
    }
  };

  const handleUpdate = async (id, recipeData) => {
    try {
      await updateRecipe(id, recipeData);
      setChanged(!changed);
      toast.success("Successfully updated recipe!");
      return true;
    } catch (err) {
      toast.error(`Failed to update recipe: ${err?.message || err}`);
      return false;
    }
  };

  if (loading) {
    return null;
  }

  if (!recipe) {
    return (
      <div className="no-recipe-error-container">
        <p className="recipe-not-found">No recipe found</p>
      </div>
    );
  }

  return (
    <div className="recipe-container">
      {/* Header with Title and Action Buttons */}
      <div className="recipe-header">
        <div className="recipe-title-section">
          <h1 className="recipe-title">{recipe.title}</h1>
          
          {/* Action Buttons Table */}
          <table className="recipe-actions-card">
            <tbody >
              {isOwner(recipe) && (
                <>
                  <tr>
                    <td>
                      <Popup
                        className="pop-up"
                        overlayClassName="popup-overlay"
                        trigger={
                          <button className="update-recipe-btn">
                            Update
                          </button>
                        }
                        modal
                        nested
                      >
                        {close => (
                          <div className="detail-recipe bg-white p-6 rounded-lg max-w-2xl max-h-[80vh] overflow-y-auto">
                            <RecipeForm
                              initialRecipe={recipe}
                              initialId={recipe._id}
                              onSubmit={async (id, recipeData) => {
                                const success = await handleUpdate(id, recipeData);
                                if (success) close();
                              }}
                              submitButtonText="Update Recipe"
                            />
                          </div>
                        )}
                      </Popup>
                    </td>
                  </tr>

                  <tr>
                    <td>
                      <button
                        onClick={() => handleDelete()}
                        className="delete-recipe-btn"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                </>
              )}
              
              {/* Add to Collection Section */}
              <tr>
                <td>
                  <div className="collection-dropdown-container">
                    {!creatingNewCollection[recipeId] ? (
                      <>
                        <button 
                          type="button" 
                          onClick={() => setShowCollectionDropdown({ 
                            ...showCollectionDropdown, 
                            [recipeId]: !showCollectionDropdown[recipeId] 
                          })}
                          className="toggle-collection-btn"
                        >
                          {showCollectionDropdown[recipeId] ? '− Hide Collections' : '+ Add to Collection'}
                        </button>

                        {showCollectionDropdown[recipeId] && (
                          <div className="collection-dropdown">
                            {/* Header with action buttons */}
                            <div className="dropdown-header">
                              <button
                                onClick={() => setCreatingNewCollection({ 
                                  ...creatingNewCollection, 
                                  [recipeId]: true 
                                })}
                                className="new-collection-header-btn"
                              >
                                + New Collection
                              </button>
                              <button
                                onClick={() => handleAddToCollections(recipeId)}
                                disabled={currentSelections.ids.length === 0}
                                className={`add-selected-btn ${currentSelections.ids.length === 0 ? 'disabled' : ''}`}
                              >
                                Add Selected {currentSelections.ids.length > 0 && `(${currentSelections.ids.length})`}
                              </button>
                            </div>

                            {/* Temporary selections preview */}
                            {currentSelections.names.length > 0 && (
                              <div className="temp-selections-preview">
                                <p className="temp-selections-label">Ready to add:</p>
                                <div className="temp-selections-tags">
                                  {currentSelections.names.map((name, idx) => (
                                    <span key={idx} className="temp-selection-tag">
                                      {name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Saved Collections Display */}
                            {savedCollectionNames.length > 0 && (
                              <div className="saved-collections-in-dropdown">
                                <p className="saved-collections-label">Your Collections:</p>
                                <div className="saved-collections-tags">
                                  {savedCollectionNames.map((name, idx) => (
                                    <span key={idx} className="saved-collection-tag">
                                      <span 
                                        onClick={() => navigate(`/collections/${savedCollectionIds[idx]}`)}
                                        className="collection-tag-name"
                                      >
                                        {name}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRemoveCollection(recipeId, savedCollectionIds[idx]);
                                        }}
                                        className="remove-collection-btn"
                                        title="Remove from collection"
                                      >
                                        ×
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Scrollable collection list */}
                            <div className="collection-list">
                              {recipeCollections.length === 0 ? (
                                <div className="empty-collections">
                                  No collections yet. Create one now!
                                </div>
                              ) : (
                                recipeCollections.map((c) => {
                                  const isAlreadySaved = savedCollectionIds.includes(c._id);
                                  const isSelected = currentSelections.ids.includes(c._id);
                                  
                                  return (
                                    <div 
                                      key={c._id}
                                      className={`collection-item ${isAlreadySaved ? 'already-saved' : ''} ${isSelected ? 'selected' : ''}`}
                                    >
                                      <div 
                                        onClick={() => !isAlreadySaved && handleCollectionToggle(recipeId, c._id, c.title)}
                                        className="collection-item-main"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          disabled={isAlreadySaved}
                                          onChange={() => {}}
                                          className="collection-checkbox"
                                        />
                                        <span className="collection-name">{c.title}</span>
                                        {isAlreadySaved && (
                                          <span className="already-saved-badge">
                                            ✓ Added
                                          </span>
                                        )}
                                      </div>
                                      {isAlreadySaved && (
                                        <button
                                          onClick={() => handleRemoveCollection(recipeId, c._id)}
                                          className="remove-from-list-btn"
                                          title="Remove from collection"
                                        >
                                          Remove
                                        </button>
                                      )}
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="new-collection-form">
                        <input
                          type="text"
                          placeholder="New collection name"
                          value={newCollectionName[recipeId] || ""}
                          onChange={(e) => setNewCollectionName({ 
                            ...newCollectionName, 
                            [recipeId]: e.target.value 
                          })}
                          className="new-collection-input"
                        />
                        <div className="new-collection-actions">
                          <button
                            onClick={() => handleCreateNewCollection(recipeId)}
                            className="save-new-collection-btn"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setCreatingNewCollection({ ...creatingNewCollection, [recipeId]: false });
                              setNewCollectionName({ ...newCollectionName, [recipeId]: "" });
                            }}
                            className="cancel-new-collection-btn"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className={`recipe-main-grid ${recipe.image ? 'with-image' : ''}`}>
        {/* Image */}
        {recipe.image && (
          <div className="recipe-image-container">
            <img 
              src={recipe.image} 
              alt={recipe.title} 
              className="recipe-image"
            />
          </div>
        )}

        {/* Recipe Info */}
        <div className="recipe-info-card">
          <h2 className="section-title">Recipe Details</h2>
          
          <div className="recipe-details-grid">
            {(recipe.authorName) && (
              <div className="detail-item">
                <span className="detail-label">Author:</span>
                <span className="detail-value">{recipe.authorName}</span>
              </div>
            )}
            
            {(recipe.sourceName) && (
              <div className="detail-item">
                <span className="detail-label">Source:</span>
                <span className="detail-value">{recipe.sourceName}</span>
              </div>
            )}

            {(recipe.timePrepared || recipe.readyInMinutes) && (
              <div className="detail-item">
                <span className="detail-label">Ready in:</span>
                <span className="detail-value">{recipe.timePrepared || recipe.readyInMinutes} minutes</span>
              </div>
            )}

            {(recipe.numServings || recipe.servings) && (
              <div className="detail-item">
                <span className="detail-label">Servings:</span>
                <span className="detail-value">{recipe.numServings || recipe.servings}</span>
              </div>
            )}

            {recipe.cuisine && (
              <div className="detail-item">
                <span className="detail-label">Cuisine:</span>
                <span className="detail-value">{recipe.cuisine}</span>
              </div>
            )}

            {recipe.difficulty !== 0 && (
              <div className="detail-item">
                <span className="detail-label">Difficulty:</span>
                <span className="detail-value">{recipe.difficulty}/5</span>
              </div>
            )}

            {recipe.rating !== 0 && (
              <div className="detail-item">
                <span className="detail-label">Rating:</span>
                <span className="detail-value">⭐ {recipe.rating}/5</span>
              </div>
            )}

            {recipe.likes != null && (
              <div className="detail-item">
                <span className="detail-label">Likes:</span>
                <span className="detail-value">❤️ {recipe.likes}</span>
              </div>
            )}

            {recipe.nutrition && (
              <div className="detail-item full-width">
                <span className="detail-label">Nutrition:</span>
                <span className="detail-value">{recipe.nutrition}</span>
              </div>
            )}
          </div>
          {/* Collections Tags */}
          <p className="detail-label">Collections:</p>
          {recipe.recipeCollectionName?.length > 0 && recipe.recipeCollectionID?.length > 0 && (
            <div className="recipe-collections">
              {Array.isArray(recipe.recipeCollectionName)
                ? recipe.recipeCollectionName.map((name, i) => (
                    <Link
                      key={recipe.recipeCollectionID[i]}
                      to={`/collections/${recipe.recipeCollectionID[i]}`}
                      className="collection-tag"
                    >
                      {name}
                    </Link>
                  ))
                : (
                    <Link
                      to={`/collections/${recipe.recipeCollectionID}`}
                      className="collection-tag"
                    >
                      {recipe.recipeCollectionName}
                    </Link>
                  )}
            </div>
          )}
        </div>
      </div>

      {/* Ingredients */}
      {(recipe.ingredients?.length > 0 || recipe.usedIngredients?.length > 0) && (
        <div className="recipe-card">
          <h2 className="section-title">Ingredients</h2>
          
          {recipe.ingredients && recipe.ingredients.length > 0 && (
            <ul className="ingredients-list">
              {Array.isArray(recipe.ingredients) 
                ? recipe.ingredients.map((ing, i) => <li key={i}>{ing}</li>)
                : <li>{recipe.ingredients}</li>
              }
            </ul>
          )}

          {recipe.usedIngredients?.length > 0 && (
            <div className="ingredients-section">
              <h3 className="ingredients-subtitle used">✓ Used Ingredients:</h3>
              <ul className="ingredients-list">
                {recipe.usedIngredients.map((ing, i) => (
                  <li key={i}>{ing.original}</li>
                ))}
              </ul>
            </div>
          )}

          {recipe.missedIngredients?.length > 0 && (
            <div className="ingredients-section">
              <h3 className="ingredients-subtitle missed">✗ Missing Ingredients:</h3>
              <ul className="ingredients-list">
                {recipe.missedIngredients.map((ing, i) => (
                  <li key={i}>{ing.original}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="recipe-card">
        <h2 className="section-title">Instructions</h2>
        
        {recipe.instruction ? (
          <p className="instructions-text">{recipe.instruction}</p>
        ) : recipe.analyzedInstructions?.length > 0 ? (
          <ol className="instructions-list">
            {recipe.analyzedInstructions[0].steps.map(step => (
              <li key={step.number}>
                <span>{step.step}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="no-content">No instructions available</p>
        )}
      </div>

      {/* Comments */}
      {recipe.comments?.length > 0 && (
        <div className="recipe-card">
          <h2 className="section-title">Comments</h2>
          <div className="comments-container">
            {recipe.comments.map((comment, index) => (
              <div key={index} className="comment-item">
                <p>{comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}