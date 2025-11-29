import { useNavigate } from "react-router-dom";
import { deleteRecipe, addRecipeToCollection, removeRecipeFromCollection, getUserRecipes } from "../../services/RecipeServices";
import { getMyRecipeCollection, addRecipeCollection } from "../../services/RecipeCollectionServices";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "react-hot-toast";
import RecipeGridBox from "../../components/RecipeGridBox";
import { useAuth } from "../../contexts/authContext";
import { useCreate } from "../../contexts/CreateContext";
import { useAddToCollection } from "../../contexts/AddToCollectionContext";

export default function Home() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [changed, setChanged] = useState(false);
  const [recipeCollections, setRecipeCollections] = useState([]);
  const [selectedCollections, setSelectedCollections] = useState({}); 
  const [creatingNewCollection, setCreatingNewCollection] = useState({});
  const [newCollectionTitle, setNewCollectionTitle] = useState({});
  
  // Infinite scroll states
  const [displayedCount, setDisplayedCount] = useState(12); // How many recipes to show
  const [allRecipes, setAllRecipes] = useState([]); // All fetched recipes
  const observerTarget = useRef(null);
  const RECIPES_PER_LOAD = 12; // Load 12 more each time
  
  const navigate = useNavigate();
  const { uid } = useAuth();
  const currentUserId = uid;
  const { openRecipePopup, openUpdateRecipePopup } = useCreate();
  const { toggleCollectionDropdown, isDropdownOpen, closeCollectionDropdown } = useAddToCollection();

  const isOwner = (recipe) => {
    return recipe.uid === currentUserId;
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

  const handleRemoveCollection = async (recipeId, collectionId) => {
    try {
      await removeRecipeFromCollection(recipeId, collectionId);
      toast.success("Removed from collection!");
      setChanged(!changed);
    } catch (err) {
      toast.error(`Failed to remove from collection: ${err?.message || err}`);
    }
  };

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

  const handleAddToCollections = async (recipeId) => {
    const selections = selectedCollections[recipeId];
    
    if (!selections || selections.ids.length === 0) {
      toast.error("Please select at least one collection");
      return;
    }

    try {
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

  // Load more recipes (client-side pagination)
  const loadMoreRecipes = useCallback(() => {
    const newCount = displayedCount + RECIPES_PER_LOAD;
    setDisplayedCount(newCount);
  }, [displayedCount]);

  // Check if there are more recipes to show
  const hasMore = displayedCount < allRecipes.length;

  // Initial load
  useEffect(() => {
    async function fetchData() {
      try {
        // Load ALL recipes at once
        const recipesData = await getUserRecipes();
        setAllRecipes(recipesData);
        
        if (uid) {
          const collectionsData = await getMyRecipeCollection();
          setRecipeCollections(collectionsData);
        }
      } catch (err) {
        toast.error(`Failed to load data: ${err?.message || err}`);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    setDisplayedCount(RECIPES_PER_LOAD); // Reset display count when data changes
  }, [changed, uid]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore) {
          loadMoreRecipes();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadMoreRecipes]);

  if (loading) {
    return null;
  }

  if (allRecipes.length === 0) {
    return (
      <div className="no-recipe-error-container">
        <p>Sorry we haven't added any recipes yet!</p>
        <button onClick={openRecipePopup} className="btn">
          Add one now!
        </button>
      </div>
    );
  }

  // Get only the recipes we want to display
  const displayedRecipes = allRecipes.slice(0, displayedCount);

  return (
    <div className="recipe-grid-container">
      <div className="recipe-grid">
        {displayedRecipes.map((recipe) => (
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
            disabledButton={!uid}
          />
        ))}
      </div>
      
      {/* Infinite scroll trigger - only show when there are more recipes to load */}
      {hasMore && <div ref={observerTarget} style={{ height: '20px', margin: '20px 0' }} />}
      
      {/* End message - only show after user has scrolled and loaded more recipes */}
      {!hasMore && displayedCount > RECIPES_PER_LOAD && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
          <p>You've reached the end!</p>
        </div>
      )}
    </div>
  );
}