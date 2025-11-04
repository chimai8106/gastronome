import { useNavigate } from "react-router-dom";
import { deleteRecipe, getMyRecipes, addRecipeToCollection, removeRecipeFromCollection } from "../../services/RecipeServices";
import { getMyRecipeCollection, addRecipeCollection } from "../../services/RecipeCollectionServices";
import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import RecipeGridBox from "../../components/RecipeGridBox";
import { useAuth } from "../../contexts/authContext";
import { useLocation } from "react-router-dom";
import { useAddToCollection } from "../../contexts/AddToCollectionContext";
import {useCreate} from "../../contexts/CreateContext";

export default function Dashboard() {
  const { userLoggedIn, loading: authLoading, uid } = useAuth();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [changed, setChanged] = useState(false);
  const [recipeCollections, setRecipeCollections] = useState([]);
  const [selectedCollections, setSelectedCollections] = useState({});
  const [creatingNewCollection, setCreatingNewCollection] = useState({});
  const [newCollectionTitle, setNewCollectionTitle] = useState({});
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleCollectionDropdown, isDropdownOpen, closeCollectionDropdown } = useAddToCollection();
  const hasShownToast = useRef(false);
  const currentUserId = uid;
  const { openRecipePopup, openUpdateRecipePopup } = useCreate();

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

  const handleDelete = async (recipeId) => {
    try {
      await deleteRecipe(recipeId);
      setChanged(!changed);
      toast.success("Successfully deleted recipe!");
    } catch (err) {
      toast.error(`Failed to delete recipe: ${err?.message || err}`);
    }
  };

  // Remove a recipe from a collection (using new API)
  const handleRemoveCollection = async (recipeId, collectionId) => {
    try {
      await removeRecipeFromCollection(recipeId, collectionId);
      toast.success("Removed from collection!");
      setChanged(!changed);
    } catch (err) {
      toast.error(`Failed to remove from collection: ${err?.message || err}`);
    }
  };

  // Toggle temporary selection in dropdown
  const handleCollectionToggle = (recipeId, collectionId, collectionTitle) => {
    const currentSelections = selectedCollections[recipeId] || { ids: [], titles: [] };
    
    if (currentSelections.ids.includes(collectionId)) {
      setSelectedCollections({
        ...selectedCollections,
        [recipeId]: {
          ids: currentSelections.ids.filter(id => id !== collectionId),
          titles: currentSelections.titles.filter(title => title !== collectionTitle)
        }
      });
    } else {
      setSelectedCollections({
        ...selectedCollections,
        [recipeId]: {
          ids: [...currentSelections.ids, collectionId],
          titles: [...currentSelections.titles, collectionTitle]
        }
      });
    }
  };

  // Add recipe to multiple collections at once
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
      
      toast.success(`Added to ${selections.titles.length} collection(s)!`);
      closeCollectionDropdown();
      setSelectedCollections({ ...selectedCollections, [recipeId]: { ids: [], titles: [] } });
      setChanged(!changed);
    } catch (err) {
      toast.error(`Failed to add to collections: ${err?.message || err}`);
    }
  };

  const handleCreateNewCollection = async (recipeId) => {
    const collectionTitle = newCollectionTitle[recipeId];
    if (!collectionTitle || collectionTitle.trim() === '') {
      toast.error("Please enter a collection name");
      return;
    }

    try {
      const newCol = await addRecipeCollection({
        title: collectionTitle,
        description: "",
        isPublic: false,
      });
      
      setRecipeCollections([...recipeCollections, newCol]);
      
      const currentSelections = selectedCollections[recipeId] || { ids: [], titles: [] };
      setSelectedCollections({
        ...selectedCollections,
        [recipeId]: {
          ids: [...currentSelections.ids, newCol._id],
          titles: [...currentSelections.titles, newCol.title]
        }
      });
      
      setCreatingNewCollection({ ...creatingNewCollection, [recipeId]: false });
      setNewCollectionTitle({ ...newCollectionTitle, [recipeId]: "" });
      toast.success("Collection created and selected!");
    } catch (err) {
      toast.error(`Failed to create collection: ${err?.message || err}`);
    }
  };

  const isOwner = (recipe) => {
    return recipe.uid === currentUserId;
  };

  useEffect(() => {
    // Don't fetch recipes until auth is ready
    if (authLoading) return;
    
    // Redirect if not logged in
    if (!userLoggedIn) {
      navigate("/login");
      return;
    }

    async function fetchData() {
      try {
        const [recipesData, collectionsData] = await Promise.all([
          getMyRecipes(), // Returns recipes with myCollections populated
          getMyRecipeCollection()
        ]);
        setRecipes(recipesData);
        setRecipeCollections(collectionsData);
      } catch (err) {
        toast.error(`Failed to load data: ${err?.message || err}`);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [changed, authLoading, userLoggedIn, navigate]);

  // Show loading while auth is being checked
  if (authLoading || loading) {
    return null;
  }

  if (recipes.length === 0) {
    return (
      <div className="no-recipe-error-container">
        <p className="mb-4">You haven't added any recipes yet!</p>
        <button onClick={openRecipePopup} className="btn">
          Add one now!
        </button>
      </div>
    );
  }

  return (
    <div className="recipe-grid-container">
      <h1 className="page-title">My Recipes</h1>
      <div className="recipe-grid">
        {recipes.map((recipe) => (
          <RecipeGridBox
            key={recipe._id}
            recipe={recipe}
            currentUserId={currentUserId}
            isOwner={isOwner}
            selectedCollections={selectedCollections}
            showCollectionDropdown={isDropdownOpen(recipe._id)}
            creatingNewCollection={creatingNewCollection}
            newCollectionTitle={newCollectionTitle}
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
            onSetNewCollectionTitle={(recipeId, value) => setNewCollectionTitle({ 
              ...newCollectionTitle, 
              [recipeId]: value 
            })}
            onUpdate={() => {
              openUpdateRecipePopup(recipe, () => {
                setChanged(!changed); 
              });
            }}
            onDelete={handleDelete}
            onNavigate={navigate}
          />
        ))}
      </div>
    </div>
  );
}