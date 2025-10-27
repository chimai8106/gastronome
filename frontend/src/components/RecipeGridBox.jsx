import React from "react";
import Popup from "reactjs-popup";
import RecipeIntro from "./RecipeIntro";
import RecipeForm from "./RecipeForm";
import "./RecipeGridBox.css";

export default function RecipeGridBox({
  recipe,
  currentUserId,
  isOwner,
  selectedCollections,
  showCollectionDropdown,
  creatingNewCollection,
  newCollectionName,
  recipeCollections,
  onCollectionToggle,
  onRemoveCollection,
  onShowCollectionDropdown,
  onAddToCollections,
  onCreateNewCollection,
  onSetCreatingNewCollection,
  onSetNewCollectionName,
  onUpdate,
  onDelete,
  onNavigate, disabledButton
}) {
  const recipeId = recipe._id;
  const currentSelections = selectedCollections[recipeId] || { ids: [], names: [] };
  
  // These are the SAVED collections (persisted in database)
  const savedCollectionIds = recipe.recipeCollectionID || [];
  const savedCollectionNames = recipe.recipeCollectionName || [];

  return (
    <div className="recipe-grid-box">
      {/* Recipe Image */}
      <div className="recipe-image-container">
        {recipe.imageUrl ? (
          <img 
            src={recipe.imageUrl} 
            alt={recipe.title}
            className="recipe-image"
          />
        ) : (
          <div className="recipe-image-placeholder">
            <svg 
              width="64" 
              height="64" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.5"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <span className="no-image-text">No image</span>
          </div>
        )}
      </div>

      <div className="recipe-content">
        <RecipeIntro recipe={recipe} />
      </div>

      {/* Action Buttons Table */}
      {!disabledButton && <table className="recipe-actions-grid-box">
        <tbody className = "tbody-grid-box">
          <tr>
            {/* Add to Collection Section */}
            <td>
              <div className="collection-dropdown-container">
                {!creatingNewCollection[recipeId] ? (
                  <>
                    <button 
                      type="button" 
                      onClick={() => onShowCollectionDropdown(recipeId)}
                      className="toggle-collection-btn"
                    >
                      {showCollectionDropdown ? '− Hide Collections' : '+ Add to Collection'}
                    </button>

                    {showCollectionDropdown && (
                      <div className="collection-dropdown">
                        {/* Header with action buttons - ALWAYS VISIBLE */}
                        <div className="dropdown-header">
                          <button
                            onClick={() => onSetCreatingNewCollection(recipeId, true)}
                            className="new-collection-header-btn"
                          >
                            + New Collection
                          </button>
                          <button
                            onClick={() => onAddToCollections(recipeId)}
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

                        {/* Saved Collections Display - Inside dropdown */}
                        {savedCollectionNames.length > 0 && (
                          <div className="saved-collections-in-dropdown">
                            <p className="saved-collections-label">Your Collections:</p>
                            <div className="saved-collections-tags">
                              {savedCollectionNames.map((name, idx) => (
                                <span key={idx} className="saved-collection-tag">
                                  <span 
                                    onClick={() => onNavigate(`/collection/${savedCollectionIds[idx]}`)}
                                    className="collection-tag-name"
                                  >
                                    {name}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onRemoveCollection(recipeId, savedCollectionIds[idx]);
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
                                    onClick={() => !isAlreadySaved && onCollectionToggle(recipeId, c._id, c.title)}
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
                                      onClick={() => onRemoveCollection(recipeId, c._id)}
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
                      onChange={(e) => onSetNewCollectionName(recipeId, e.target.value)}
                      className="new-collection-input"
                    />
                    <div className="new-collection-actions">
                      <button
                        onClick={() => onCreateNewCollection(recipeId)}
                        className="save-new-collection-btn"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          onSetCreatingNewCollection(recipeId, false);
                          onSetNewCollectionName(recipeId, "");
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

            {/* Owner Actions */}
            {isOwner(recipe) ? (
              <>
              <tr>
                <td>
                  <button onClick={onUpdate} className="update-recipe-btn">
                    Update
                  </button>
                </td>
              </tr>
              <tr>
                <td>
                  <button
                    onClick={() => onDelete(recipe._id)}
                    className="delete-recipe-btn"
                  >
                    Delete
                  </button>
                </td>
              </tr>
              </>
            ) : (
              <tr>
                <button
                  onClick={() => onNavigate(`/recipe/${recipe._id}`)}
                  className="view-details-btn"
                >
                  View Details
                </button>
              </tr>
            )}
        </tbody>
      </table>
      }
    </div>
  );
}