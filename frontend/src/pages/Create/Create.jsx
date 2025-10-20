import React from "react";
import { useNavigate } from "react-router-dom";
import Popup from "reactjs-popup";
import { toast } from "react-hot-toast";

import RecipeForm from "../../components/RecipeForm";
import RecipeCollectionForm from "../../components/RecipeCollectionForm"; 
import { addRecipe } from "../../services/RecipeServices";
import { addRecipeCollection } from "../../services/RecipeCollectionServices";

export default function Create() {
  const navigate = useNavigate();

  const handleSubmitRecipe = async (recipeData) => {
    try {
      await addRecipe(recipeData);
      navigate("/dashboard", {
        state: { message: "Successfully created recipe!" },
      });
    } catch (err) {
      toast.error(err?.message || "Failed to create recipe");
    }
  };

  const handleSubmitRecipeCollection = async (recipeRecipeCollectionData) => {
    try {
      await addRecipeCollection(recipeRecipeCollectionData);
      navigate("/user", {
        state: { message: "Successfully created recipeRecipeCollection!" },
      });
    } catch (err) {
      toast.error(err?.message || "Failed to create recipeRecipeCollection");
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 mt-8">
      {/* Create Recipe */}
      <Popup className="pop-up" overlayClassName="popup-overlay" trigger={<button className="btn">Create a new Recipe</button>} modal nested>
        {(close) => (
          <RecipeForm
            onSubmit={async (data) => {
              await handleSubmitRecipe(data);
              close();
            }}
            submitButtonText="Create Recipe"
          />
        )}
      </Popup>

      {/* Create RecipeCollection */}
      <Popup className="pop-up" overlayClassName="popup-overlay" trigger={<button className="btn">Create a new Recipe Collection</button>} modal nested>
        {(close) => (
          <RecipeCollectionForm
            onSubmit={async (data) => {
              await handleSubmitRecipeCollection(data);
              close();
            }}
            submitButtonText="Create RecipeCollection"
          />
        )}
      </Popup>
    </div>
  );
}
