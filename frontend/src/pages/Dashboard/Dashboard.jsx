import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { deleteRecipe, getMyRecipes, updateRecipe } from "../../services/RecipeServices";
import RecipeCard from "../../components/RecipeCard";
import RecipeIntro from "../../components/RecipeIntro";
import RecipeForm from "../../components/RecipeForm";
import Popup from 'reactjs-popup';
import { toast } from "react-hot-toast";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/authContext";
export default function Dashboard() {
  const { userLoggedIn, loading: authLoading } = useAuth(); 
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [changed, setChanged] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const hasShownToast = useRef(false);
  const [successMessage, setSuccessMessage] = useState("");
  
  useEffect(() => {
    if (location.state?.message && !hasShownToast.current) {
      toast.success(location.state.message);
      hasShownToast.current = true;
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

  useEffect(() => {
    // Don't fetch recipes until auth is ready
    if (authLoading) return;
    
    // Redirect if not logged in
    if (!userLoggedIn) {
      navigate("/login");
      return;
    }

    async function fetchRecipes() {
      try {
        const data = await getMyRecipes();
        setRecipes(data);
      } catch (err) {
        toast.error(`Failed to load recipes: ${err?.message || err}. Please try again`);
      } finally {
        setLoading(false);
      }
    }
    fetchRecipes();
  }, [changed, authLoading, userLoggedIn, navigate]); 

  const handleChange = async (id, recipeData) => {
    try {
      await updateRecipe(id, recipeData);
      setChanged(!changed);
      toast.success("Successfully updated recipe!");
      return true;
    } catch (err) {
      toast.error(`Failed to update recipes: ${err?.message || err}. Please try again`);
      return false;
    }
  }
  
  const handleDelete = async (recipeId) => {
    try {
      await deleteRecipe(recipeId);
      setChanged(!changed);
      toast.success("Successfully deleted recipe!");
    } catch (err) {
      toast.error(`Failed to delete recipes: ${err?.message || err}. Please try again`);
    }
  };

  // Show loading while auth is being checked
  if (authLoading || loading) {
    return null;
  }

  if (recipes.length === 0) {
    return (
      <>
        <p className="text-center mt-6">You haven't added any recipes yet!</p>
        <button onClick={() => navigate("/add-recipe")}>
          Add one now!
        </button>
      </>
    );
  }

  return (
    <>
      <div className="max-w-3xl mx-auto p-6">
        <h1>My Recipes</h1>
        {recipes.map((recipe) => (
          <div key={recipe.id}>
            <RecipeIntro recipe={recipe} />
            <button 
              onClick={() => handleDelete(recipe._id)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginBottom: '20px'
              }}
            >
              Delete
            </button>

            <Popup 
              trigger={<button>Update</button>} 
              modal nested>
              {close => (
                <div className='detail-recipe'>
                  <RecipeForm  
                    initialRecipe={recipe} 
                    initialId={recipe._id} 
                    onSubmit={async (id, recipeData) => {
                      const success = await handleChange(id, recipeData);
                      if (success) close();
                    }} 
                    submitButtonText="Update Recipe" 
                  />
                  <button onClick={() => close()}>Close</button> 
                </div>
              )}
            </Popup>
          </div>
        ))}
      </div>
    </>
  );
}