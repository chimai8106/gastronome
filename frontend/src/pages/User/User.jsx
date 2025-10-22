import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getMyRecipeCollection, deleteRecipeCollection, updateRecipeCollection } from "../../services/RecipeCollectionServices";
import Popup from 'reactjs-popup';
import { toast } from "react-hot-toast";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/authContext";
import RecipeCollectionForm from "../../components/RecipeCollectionForm";
import RecipeGridBox from "../../components/RecipeGridBox";
import "./User.css"; // Import the CSS file

export default function User() {
  const { userLoggedIn, loading: authLoading, currentUser } = useAuth(); 
  const [recipeCollections, setRecipeCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [changed, setChanged] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const hasShownToast = useRef(false);

  // States for RecipeGridBox functionality
  const [selectedCollections, setSelectedCollections] = useState({});
  const [showCollectionDropdown, setShowCollectionDropdown] = useState({});
  const [creatingNewCollection, setCreatingNewCollection] = useState({});
  const [newCollectionName, setNewCollectionName] = useState({});
  
  useEffect(() => {
    if (location.state?.message && !hasShownToast.current) {
      toast.success(location.state.message);
      hasShownToast.current = true;
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  useEffect(() => {
    if (authLoading) return;
    if (!userLoggedIn) {
      navigate("/login");
      return;
    }
    fetchRecipeCollections();
  }, [changed, authLoading, userLoggedIn, navigate]); 

  async function fetchRecipeCollections() {
    try {
      const data = await getMyRecipeCollection();
      setRecipeCollections(data);
    } catch (err) {
      toast.error(`Failed to load Recipe Collections: ${err?.message || err}. Please try again`);
    } finally {
      setLoading(false);
    }
  }

  const handleUpdate = async (id, recipeCollectionData) => {
    try {
      await updateRecipeCollection(id, recipeCollectionData);
      setChanged(!changed);
      toast.success("Successfully updated Recipe Collection!");
      return true;
    } catch (err) {
      toast.error(`Failed to update Recipe Collection: ${err?.message || err}. Please try again`);
      return false;
    }
  };

  const handleDelete = async (recipeCollectionId) => {
    try {
      await deleteRecipeCollection(recipeCollectionId);
      setChanged(!changed);
      toast.success("Successfully deleted Recipe Collection!");
    } catch (err) {
      toast.error(`Failed to delete Recipe Collection: ${err?.message || err}. Please try again`);
    }
  };

  // RecipeGridBox handler functions
  const isOwner = (recipe) => {
    return currentUser && recipe.userId === currentUser.uid;
  };

  const handleCollectionToggle = (recipeId, collectionId, collectionName) => {
    setSelectedCollections(prev => {
      const current = prev[recipeId] || { ids: [], names: [] };
      const isSelected = current.ids.includes(collectionId);
      
      if (isSelected) {
        return {
          ...prev,
          [recipeId]: {
            ids: current.ids.filter(id => id !== collectionId),
            names: current.names.filter(name => name !== collectionName)
          }
        };
      } else {
        return {
          ...prev,
          [recipeId]: {
            ids: [...current.ids, collectionId],
            names: [...current.names, collectionName]
          }
        };
      }
    });
  };

  const handleRemoveCollection = async (recipeId, collectionId) => {
    // Implement your remove from collection logic here
    toast.success("Removed from collection!");
    setChanged(!changed);
  };

  const handleShowCollectionDropdown = (recipeId) => {
    setShowCollectionDropdown(prev => ({
      ...prev,
      [recipeId]: !prev[recipeId]
    }));
  };

  const handleAddToCollections = async (recipeId) => {
    // Implement your add to collections logic here
    toast.success("Added to collections!");
    setSelectedCollections(prev => ({
      ...prev,
      [recipeId]: { ids: [], names: [] }
    }));
    setChanged(!changed);
  };

  const handleCreateNewCollection = async (recipeId) => {
    const name = newCollectionName[recipeId];
    if (!name || !name.trim()) {
      toast.error("Collection name cannot be empty");
      return;
    }
    // Implement your create collection logic here
    toast.success("Collection created!");
    setCreatingNewCollection(prev => ({ ...prev, [recipeId]: false }));
    setNewCollectionName(prev => ({ ...prev, [recipeId]: "" }));
    setChanged(!changed);
  };

  const handleSetCreatingNewCollection = (recipeId, value) => {
    setCreatingNewCollection(prev => ({ ...prev, [recipeId]: value }));
  };

  const handleSetNewCollectionName = (recipeId, value) => {
    setNewCollectionName(prev => ({ ...prev, [recipeId]: value }));
  };

  const handleRecipeUpdate = async (id, recipeData) => {
    // Implement your recipe update logic here
    toast.success("Recipe updated!");
    setChanged(!changed);
    return true;
  };

  const handleRecipeDelete = async (recipeId) => {
    // Implement your recipe delete logic here
    toast.success("Recipe deleted!");
    setChanged(!changed);
  };

  if (authLoading || loading) {
    return null;
  }

  if (recipeCollections.length === 0) {
    return (
      <div className="user-collections-container">
        <div className="empty-collections">
          <p>You haven't added any Recipe Collections yet!</p>
          <button onClick={() => navigate("/add")} className="add-collection-btn">
            Add one now!
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-collections-container">
      <div className="user-collections-header">
        <h1>My Recipe Collections</h1>
      </div>

      {recipeCollections.map((recipeCollection) => {
        const displayedRecipes = recipeCollection.recipes?.slice(0, 10) || [];
        const hasMoreRecipes = recipeCollection.recipes?.length > 10;
        
        return (
          <div key={recipeCollection._id} className="collection-section">
            <div className="collection-header">
              <div className="collection-info">
                <h2 
                  className="collection-title"
                  onClick={() => navigate(`/collections/${recipeCollection._id}`)}
                >
                  {recipeCollection.title}
                </h2>
                <p className="collection-description">{recipeCollection.description}</p>
                {recipeCollection.authorName && (
                  <p className="collection-author">By {recipeCollection.authorName}</p>
                )}
                <div className="collection-meta">
                  <span className="recipe-count">
                    {recipeCollection.recipes?.length || 0} {recipeCollection.recipes?.length === 1 ? 'recipe' : 'recipes'}
                  </span>
                </div>
              </div>

              <div className="collection-actions">
                <Popup 
                  className="pop-up" 
                  overlayClassName="popup-overlay" 
                  trigger={<button className="update-collection-btn">Update</button>} 
                  modal 
                  nested
                >
                  {(close) => (
                    <RecipeCollectionForm
                      initialRecipeCollection={recipeCollection}
                      onSubmit={async (id, data) => {
                        const success = await handleUpdate(recipeCollection._id, data);
                        if (success) close();
                      }}
                      submitButtonText="Update Collection"
                    />
                  )}
                </Popup>

                <button
                  onClick={() => handleDelete(recipeCollection._id)}
                  className="delete-collection-btn"
                >
                  Delete
                </button>
              </div>
            </div>

            {displayedRecipes.length > 0 ? (
              <>
                <div className="collection-recipes-grid">
                  {displayedRecipes.map((recipe) => (
                    <RecipeGridBox
                      key={recipe._id}
                      recipe={recipe}
                      currentUserId={currentUser?.uid}
                      isOwner={isOwner}
                      selectedCollections={selectedCollections}
                      showCollectionDropdown={showCollectionDropdown}
                      creatingNewCollection={creatingNewCollection}
                      newCollectionName={newCollectionName}
                      recipeCollections={recipeCollections}
                      onCollectionToggle={handleCollectionToggle}
                      onRemoveCollection={handleRemoveCollection}
                      onShowCollectionDropdown={handleShowCollectionDropdown}
                      onAddToCollections={handleAddToCollections}
                      onCreateNewCollection={handleCreateNewCollection}
                      onSetCreatingNewCollection={handleSetCreatingNewCollection}
                      onSetNewCollectionName={handleSetNewCollectionName}
                      onUpdate={handleRecipeUpdate}
                      onDelete={handleRecipeDelete}
                      onNavigate={navigate}
                    />
                  ))}
                </div>

                {hasMoreRecipes && (
                  <div className="show-more-container">
                    <button 
                      onClick={() => navigate(`/collections/${recipeCollection._id}`)}
                      className="show-more-btn"
                    >
                      Show More ({recipeCollection.recipes.length - 10} more recipes)
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="empty-recipes-message">
                No recipes in this collection yet
              </div>
            )}
          </div>
        );
      })}

      <div className="logout-container">
        <button onClick={() => navigate("/signout")} className="logout-btn">
          Log out
        </button>
      </div>
    </div>
  );
}