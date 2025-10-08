import {
    BrowserRouter as Router,
    Routes,
    Route,
    Link,
    useNavigate,
    Outlet,
} from "react-router-dom";
import { deleteRecipe, getMyRecipes, updateRecipe, getUserRecipes } from "../../services/RecipeServices";
import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import RecipeIntro from "../../components/RecipeIntro"; // adjust path as needed
import RecipeForm from "../../components/RecipeForm"; // adjust path as needed
import Popup from "reactjs-popup"; 
export default function Home(){
   
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [changed, setChanged] = useState(false);
  const navigate = useNavigate();
  //const location = useLocation();
/*

  const handleChange = async (id, recipeData) =>{
    try{
      await updateRecipe(id, recipeData);
      setChanged(!changed); // Toggle to trigger useEffect
      toast.success("Successfully updated recipe!");
      return true;
    }
    catch (err) {
      toast.error("Failed to update recipe:", err);
      alert("Failed to update recipe. Please try again.");
      return false;
    }
  }
  
  const handleDelete = async (recipeId) => {
    try {
      await deleteRecipe(recipeId);
      setChanged(!changed); // Toggle to trigger useEffect
      toast.success("Successfully deleted recipe!");
    } catch (err) {
      toast.error("Failed to delete recipe:", err);
      alert("Failed to delete recipe. Please try again.");
    }
  };
  if (loading) {
    return <p className="text-center mt-6">Loading your recipes...</p>;
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
    */
  useEffect(() => {
    async function fetchRecipes() {
      try {
        const data = await getUserRecipes();
        setRecipes(data);
      } catch (err) {
        toast.error(`Failed to load recipes: ${err?.message || err}. Please try again`);
      } finally {
        setLoading(false);
      }
    }
    fetchRecipes();
  }, [changed]);
  return (
    <>
      <div className="max-w-3xl mx-auto p-6">
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