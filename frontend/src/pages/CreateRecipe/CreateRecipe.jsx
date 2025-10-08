// CreateRecipe.js
import React from "react";
import { addRecipe } from "../../services/RecipeServices";
import { useNavigate } from "react-router-dom";
import RecipeForm from "../../components/RecipeForm";
import { toast } from "react-hot-toast";


export default function CreateRecipe() {
  const navigate = useNavigate();

  const handleSubmit = async (recipeData) => {

    await addRecipe(recipeData);    
    navigate("/dashboard", { state: { message: 'Successfully created recipe!' } });
  };

  return (
    
    <div>
      <h1 className="text-2xl font-bold mb-6 text-center mt-6">Create a New Recipe</h1>
  
      <RecipeForm onSubmit={handleSubmit} submitButtonText="Create Recipe" />
    </div>
  );
}