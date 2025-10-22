import { useNavigate } from "react-router-dom";
import { deleteRecipe, updateRecipe, getUserRecipes, getRecipeById } from "../../services/RecipeServices";
import { getMyRecipeCollection, addRecipeCollection } from "../../services/RecipeCollectionServices";
import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import RecipeGridBox from "../../components/RecipeGridBox";
import { useAuth } from "../../contexts/authContext";
import {useCreate} from "../../contexts/CreateContext"


export default function Home() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [changed, setChanged] = useState(false);
  const [recipeCollections, setRecipeCollections] = useState([]);
  const [selectedCollections, setSelectedCollections] = useState({}); 
  const [showCollectionDropdown, setShowCollectionDropdown] = useState({});
  const [creatingNewCollection, setCreatingNewCollection] = useState({});
  const [newCollectionName, setNewCollectionName] = useState({});
  const navigate = useNavigate();
  const { uid } = useAuth();
  const currentUserId = uid;
  const { openRecipePopup } = useCreate();
  const handleChange = async (id, recipeData) => {
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

  const handleDelete = async (recipeId) => {
    try {
      await deleteRecipe(recipeId);
      setChanged(!changed);
      toast.success("Successfully deleted recipe!");
    } catch (err) {
      toast.error(`Failed to delete recipe: ${err?.message || err}`);
    }
  };

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

  const isOwner = (recipe) => {
    return recipe.uid === currentUserId;
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [recipesData, collectionsData] = await Promise.all([
          getUserRecipes(),
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
  }, [changed]);

  if (loading) {
    return null;
  }

  if (recipes.length === 0) {
  return (
    <div className="no-recipe-error-container">
      <p>Sorry we haven't added any recipes yet!</p>
      <button onClick={openRecipePopup} className="btn">
        Add one now!
      </button>
    </div>
  );
  }

  return (
    <div className="recipe-grid-container">
      <div className="recipe-grid">
        {recipes.map((recipe) => (
          <RecipeGridBox
            key={recipe._id}
            recipe={recipe}
            currentUserId={currentUserId}
            isOwner={isOwner}
            selectedCollections={selectedCollections}
            showCollectionDropdown={showCollectionDropdown}
            creatingNewCollection={creatingNewCollection}
            newCollectionName={newCollectionName}
            recipeCollections={recipeCollections}
            onCollectionToggle={handleCollectionToggle}
            onRemoveCollection={handleRemoveCollection}
            onShowCollectionDropdown={(recipeId) => setShowCollectionDropdown({
              ...showCollectionDropdown, 
              [recipeId]: !showCollectionDropdown[recipeId]
            })}
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
            onUpdate={handleChange}
            onDelete={handleDelete}
            onNavigate={navigate}
          />
        ))}
      </div>
    </div>
  );
}