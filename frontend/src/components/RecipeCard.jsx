import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { getRecipeById } from "../services/RecipeServices";

export default function RecipeCard() {
  const { id } = useParams(); 
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchRecipe() {
      try {
        setLoading(true);
        const data = await getRecipeById(id);
        setRecipe(data);
      } catch (err) {
        toast.error(`Failed to load recipe: ${err?.message || err}`);
      } finally {
        setLoading(false);
      }
    }

    fetchRecipe();
  }, [id]);

  if (loading) return null;
  if (!recipe) return <p>No recipe found</p>;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
        <h3>{recipe.title}</h3>
      </div>

      <div className="recipe-info flex gap-4">
        {recipe.image && <img src={recipe.image} alt={recipe.title} width={200} />}
        <div>
          {(recipe.timePrepared || recipe.readyInMinutes) && (
            <p><strong>Ready in:</strong> {recipe.timePrepared || recipe.readyInMinutes} minutes</p>
          )}

          {(recipe.numServings || recipe.servings) && (
            <p><strong>Servings:</strong> {recipe.numServings || recipe.servings}</p>
          )}

          {recipe.ingredients && recipe.ingredients.length > 0 && (
            <p><strong>Ingredients:</strong> {Array.isArray(recipe.ingredients) ? recipe.ingredients.join(", ") : recipe.ingredients}</p>
          )}

          {recipe.usedIngredients?.length > 0 && (
            <p><strong>Used ingredients:</strong> {recipe.usedIngredients.map(ing => ing.original).join(", ")}</p>
          )}

          {recipe.missedIngredients?.length > 0 && (
            <p><strong>Missing ingredients:</strong> {recipe.missedIngredients.map(ing => ing.original).join(", ")}</p>
          )}

          {recipe.cuisine && <p><strong>Cuisine:</strong> {recipe.cuisine}</p>}
          {recipe.difficulty !== 0 && <p><strong>Difficulty:</strong> {recipe.difficulty}/5</p>}
          {recipe.rating !== 0 && <p><strong>Rating:</strong> {recipe.rating}/5</p>}
          {recipe.likes != null && <p><strong>Likes:</strong> {recipe.likes}</p>}
          {recipe.nutrition && <p><strong>Nutrition:</strong> {recipe.nutrition}</p>}

          {/* Collections as tags */}
          {recipe.recipeCollectionName?.length > 0 && recipe.recipeCollectionID?.length > 0 && (
            <div className="mt-2">
              <strong className="block mb-2">Collections:</strong>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(recipe.recipeCollectionName)
                  ? recipe.recipeCollectionName.map((name, i) => (
                      <Link
                        key={recipe.recipeCollectionID[i]}
                        to={`/collections/${recipe.recipeCollectionID[i]}`}
                        style={{
                          display: 'inline-block',
                          backgroundColor: '#fef08a',
                          color: '#854d0e',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          textDecoration: 'none',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#fde047'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#fef08a'}
                      >
                        {name}
                      </Link>
                    ))
                  : (
                      <Link
                        to={`/collections/${recipe.recipeCollectionID}`}
                        style={{
                          display: 'inline-block',
                          backgroundColor: '#fef08a',
                          color: '#854d0e',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          textDecoration: 'none',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#fde047'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#fef08a'}
                      >
                        {recipe.recipeCollectionName}
                      </Link>
                    )}
              </div>
            </div>
          )}
        </div>
      </div>

      <h4>Instructions:</h4>
      {recipe.instruction ? (
        <p>{recipe.instruction}</p>
      ) : recipe.analyzedInstructions?.length > 0 ? (
        <ol>
          {recipe.analyzedInstructions[0].steps.map(step => (
            <li key={step.number}>{step.step}</li>
          ))}
        </ol>
      ) : (
        <p>No instructions available</p>
      )}

      {recipe.comments?.length > 0 && (
        <>
          <h4>Comments:</h4>
          <ul>
            {recipe.comments.map((comment, index) => (
              <li key={index}>{comment}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}