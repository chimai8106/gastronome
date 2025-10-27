import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { getRecipeCollectionById, updateRecipeCollection, deleteRecipeCollection, addRecipeCollection } from "../../services/RecipeCollectionServices";
import { getRecipeById, updateRecipe, deleteRecipe } from "../../services/RecipeServices";
import { useAuth } from "../../contexts/authContext";
import { useCreate } from "../../contexts/CreateContext";
import { useAddToCollection } from "../../contexts/AddToCollectionContext";
import RecipeCollectionForm from "../../components/RecipeCollectionForm";
import RecipeGridBox from "../../components/RecipeGridBox";
import Popup from 'reactjs-popup';
import "./Collection.css";

export default function Collection() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { uid } = useAuth();
  const { openUpdateRecipePopup } = useCreate();
  const { toggleCollectionDropdown, isDropdownOpen, closeCollectionDropdown } = useAddToCollection();
  
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recipesToShow, setRecipesToShow] = useState(10);
  const [changed, setChanged] = useState(false);
  const [recipeCollections, setRecipeCollections] = useState([]);
  const [selectedCollections, setSelectedCollections] = useState({});
  const [creatingNewCollection, setCreatingNewCollection] = useState({});
  const [newCollectionName, setNewCollectionName] = useState({});

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [collectionData, collectionsData] = await Promise.all([
          getRecipeCollectionById(id),
          uid ? getRecipeCollectionById(id).then(() => []) : [] // Fetch user's collections if logged in
        ]);
        setCollection(collectionData);
        setRecipeCollections(collectionsData);
      } catch (err) {
        toast.error(`Failed to load collection: ${err?.message || err}`);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id, changed, uid]);

  const isOwner = (recipe) => {
    return recipe.uid === uid;
  };

  const isCollectionOwner = () => {
    return collection?.uid === uid;
  };

  const handleUpdate = async (id, recipeCollectionData) => {
    try {
      await updateRecipeCollection(id, recipeCollectionData);
      setChanged(!changed);
      toast.success("Successfully updated Recipe Collection!");
      return true;
    } catch (err) {
      toast.error(`Failed to update Recipe Collection: ${err?.message || err}`);
      return false;
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this collection?")) {
      return;
    }
    try {
      await deleteRecipeCollection(id);
      toast.success("Successfully deleted Recipe Collection!");
      navigate("/user");
    } catch (err) {
      toast.error(`Failed to delete Recipe Collection: ${err?.message || err}`);
    }
  };

  const handleRecipeClick = (recipeId) => {
    navigate(`/recipe/${recipeId}`);
  };

  const handleShowMore = () => {
    setRecipesToShow(prev => prev + 10);
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

  const handleAddToCollections = async (recipeId) => {
    const selections = selectedCollections[recipeId];
    
    if (!selections || selections.ids.length === 0) {
      toast.error("Please select at least one collection");
      return;
    }

    try {
      const recipe = await getRecipeById(recipeId);
      
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

  const handleRecipeDelete = async (recipeId) => {
    try {
      await deleteRecipe(recipeId);
      setChanged(!changed);
      toast.success("Successfully deleted recipe!");
    } catch (err) {
      toast.error(`Failed to delete recipe: ${err?.message || err}`);
    }
  };

  if (loading) {
    return null;
  }

  if (!collection) {
    return (
      <div className="collection-not-found">
        <p>Collection not found</p>
      </div>
    );
  }

  const recipes = collection.recipes || [];
  const displayedRecipes = recipes.slice(0, recipesToShow);
  const hasMore = recipesToShow < recipes.length;

  return (
    <div className="collection-page-container">
      {/* Collection Header */}
      <div className="collection-page-header">
        <div className="collection-page-info">
          <h1 className="collection-page-title">{collection.title}</h1>
          {collection.description && (
            <p className="collection-page-description">{collection.description}</p>
          )}
          {collection.authorName && (
            <p className="collection-page-author">By {collection.authorName}</p>
          )}
          <div className="collection-page-meta">
            <span className="collection-page-recipe-count">
              {recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'}
            </span>
          </div>
        </div>

        {/* Action Buttons - Only show if user is the owner */}
        {uid && isCollectionOwner() && (
          <div className="collection-page-actions">
            <Popup 
              className="pop-up" 
              overlayClassName="popup-overlay" 
              trigger={<button className="collection-page-update-btn">Update</button>} 
              modal 
              nested
            >
              {(close) => (
                <RecipeCollectionForm
                  initialRecipeCollection={collection}
                  onSubmit={async (id, data) => {
                    const success = await handleUpdate(id, data);
                    if (success) close();
                  }}
                  submitButtonText="Update Collection"
                />
              )}
            </Popup>

            <button
              onClick={handleDelete}
              className="collection-page-delete-btn"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Recipes Grid */}
      {recipes.length === 0 ? (
        <div className="collection-page-empty">
          <p>No recipes in this collection yet</p>
        </div>
      ) : (
        <>
          <div className="collection-page-recipes-grid">
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

          {/* Show More Button */}
          {hasMore && (
            <div className="collection-page-show-more">
              <button
                onClick={handleShowMore}
                className="collection-page-show-more-btn"
              >
                Show More ({recipes.length - recipesToShow} remaining)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}