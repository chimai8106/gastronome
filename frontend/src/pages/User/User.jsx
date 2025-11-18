import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getMyRecipeCollection, deleteRecipeCollection, updateRecipeCollection, addRecipeCollection } from "../../services/RecipeCollectionServices";
import { deleteRecipe, addRecipeToCollection, removeRecipeFromCollection } from "../../services/RecipeServices";
import Popup from 'reactjs-popup';
import { toast } from "react-hot-toast";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/authContext";
import RecipeCollectionForm from "../../components/RecipeCollectionForm";
import RecipeGridBox from "../../components/RecipeGridBox";
import "./User.css"; 
import { useAddToCollection } from "../../contexts/AddToCollectionContext";
import { useCreate } from "../../contexts/CreateContext";

export default function User() {
  const { userLoggedIn, loading: authLoading, uid } = useAuth();
  const [recipeCollections, setRecipeCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [changed, setChanged] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const hasShownToast = useRef(false);
  const {isRecipePopupOpen,
        isCollectionPopupOpen,
        openRecipePopup,
        openCollectionPopup,
        openUpdateRecipePopup,
        closeCollectionPopup,
        handleRecipePopupClose } = useCreate();
  const currentUserId = uid;
  const { toggleCollectionDropdown, isDropdownOpen, closeCollectionDropdown } = useAddToCollection();
  
  // States for RecipeGridBox functionality
  const [selectedCollections, setSelectedCollections] = useState({});
  const [creatingNewCollection, setCreatingNewCollection] = useState({});
  const [newCollectionName, setNewCollectionName] = useState({});
  
  useEffect(() => {
      //check for refresh flag first
      if (location.state?.refresh) {
        setChanged(prev => !prev);
        navigate(location.pathname, { replace: true, state: {} });
        return;
      }
      
      // Handle toast separately
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

  const handleRecipeDelete = async (recipeId) => {
    try {
      await deleteRecipe(recipeId);
      setChanged(!changed);
      toast.success("Successfully deleted recipe!");
    } catch (err) {
      toast.error(`Failed to delete recipe: ${err?.message || err}`);
    }
  };

  // RecipeGridBox handler functions
  const isOwner = (recipe) => {
    return recipe.uid === uid;
  };

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

  // Remove recipe from collection (using new API)
  const handleRemoveCollection = async (recipeId, collectionId) => {
    try {
      await removeRecipeFromCollection(recipeId, collectionId);
      toast.success("Removed from collection!");
      setChanged(!changed);
    } catch (err) {
      toast.error(`Failed to remove from collection: ${err?.message || err}`);
    }
  };

  // Add recipe to multiple collections (using new API)
  const handleAddToCollections = async (recipeId) => {
    const selections = selectedCollections[recipeId];
    
    if (!selections || selections.ids.length === 0) {
      toast.error("Please select at least one collection");
      return;
    }

    try {
      // Add to each selected collection using new API
      await Promise.all(
        selections.ids.map(collectionId => 
          addRecipeToCollection(recipeId, collectionId)
        )
      );
      
      toast.success(`Added to ${selections.names.length} collection(s)!`);
      closeCollectionDropdown();
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

  if (authLoading || loading) {
    return null;
  }

  if (recipeCollections.length === 0) {
    return (
      <div className="user-collections-container">
        <div className="empty-collections">
          <p>You haven't added any Recipe Collections yet!</p>
          <button 
            onClick={() => openCollectionPopup(() => setChanged(prev => !prev))} 
            className="btn"
          >
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
                        const success = await handleUpdate(id, data);
                        if (success) {
                          close();
                        }
                      }}
                      onSuccess={() => setChanged(!changed)}
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
                      currentUserId={uid}
                      isOwner={isOwner}
                      selectedCollections={selectedCollections}
                      showCollectionDropdown={isDropdownOpen(recipe._id)}
                      creatingNewCollection={creatingNewCollection}
                      newCollectionName={newCollectionName}
                      recipeCollections={recipeCollections}
                      onCollectionToggle={handleCollectionToggle}
                      onRemoveCollection={handleRemoveCollection}
                      onShowCollectionDropdown={() => toggleCollectionDropdown(recipe._id)}
                      onAddToCollections={handleAddToCollections}
                      onCreateNewCollection={handleCreateNewCollection}
                      onSetCreatingNewCollection={(recipeId, value) => setCreatingNewCollection({ 
                        ...creatingNewCollection, 
                        [recipeId]: value 
                      })}
                      onSetNewCollectionName={(recipeId, value) => setNewCollectionName({ 
                        ...newCollectionName, 
                        [recipeId]: value 
                      })}
                      onUpdate={() => {
                        openUpdateRecipePopup(recipe, () => {
                          setChanged(!changed); 
                        });
                      }}
                      onDelete={handleRecipeDelete}
                      onNavigate={navigate}
                      disabledButton={true}
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