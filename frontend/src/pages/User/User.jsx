import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getMyRecipeCollection, deleteRecipeCollection, updateRecipeCollection } from "../../services/RecipeCollectionServices";
import Popup from 'reactjs-popup';
import { toast } from "react-hot-toast";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/authContext";
import RecipeCollectionForm from "../../components/RecipeCollectionForm";
import RecipeIntro from "../../components/RecipeIntro";

export default function User() {
  const { userLoggedIn, loading: authLoading } = useAuth(); 
  const [recipeCollections, setRecipeCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [changed, setChanged] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const hasShownToast = useRef(false);
  
  useEffect(() => {
    if (location.state?.message && !hasShownToast.current) {
      toast.success(location.state.message);
      hasShownToast.current = true;
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

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

  if (authLoading || loading) {
    return null;
  }

  if (recipeCollections.length === 0) {
    return (
      <>
        <p className="text-center mt-6">You haven't added any Recipe Collections yet!</p>
        <button onClick={() => navigate("/add")}>
          Add one now!
        </button>
      </>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1>My Recipe Collections</h1>
      {recipeCollections.map((recipeCollection) => {
        // Limit to 10 recipes
        const displayedRecipes = recipeCollection.recipes?.slice(0, 10) || [];
        
        return (
          <div key={recipeCollection._id} className="border p-4 rounded-lg mb-4">
            <h2 
              className="font-semibold"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/collections/${recipeCollection._id}`)}
            >
              {recipeCollection.title}
            </h2>
            <p>{recipeCollection.description}</p>
            {recipeCollection.author && <p>Author:{recipeCollection.author}</p>}

            {/* Display recipes */}
            {displayedRecipes.length > 0 && (
              <div className="mt-3">
                <h3 className="text-sm font-medium mb-2">Recipes ({displayedRecipes.length}{recipeCollection.recipes?.length > 10 ? ' of ' + recipeCollection.recipes.length : ''}):</h3>
                <ul className="list-disc list-inside">
                  {displayedRecipes.map((recipe) => (
                    <li key={recipe._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/recipe/${recipe._id}`)}>
                      <RecipeIntro recipe={recipe} />
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-2 mt-2">
              {/* Update Button */}
              <Popup className="pop-up" overlayClassName="popup-overlay" trigger={<button className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">Update</button>} modal nested>
                {(close) => (
                  <RecipeCollectionForm
                    initialRecipeCollection={recipeCollection}
                    onSubmit={async (id, data) => {
                      const success = await handleUpdate(recipeCollection._id, data);
                      if (success) close();
                    }}
                    submitButtonText="Update RecipeCollection"
                  />
                )}
              </Popup>

              {/* Delete Button */}
              <button
                onClick={() => handleDelete(recipeCollection._id)}
                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}