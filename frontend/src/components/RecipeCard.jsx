import React, { useState } from "react";

export default function RecipeCard({ recipe }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <h3>{recipe.title}</h3>
      </div>
        <>
          <div className="recipe-info">
            {recipe.image && (
              <img src={recipe.image} alt={recipe.title} width={200} />
            )}
            <div>
              {(recipe.timePrepared || recipe.readyInMinutes) && (
                <p>
                  <strong>Ready in:</strong> {recipe.timePrepared || recipe.readyInMinutes} minutes
                </p>
              )}
              
              {(recipe.numServings || recipe.servings) && (
                <p>
                  <strong>Servings:</strong> {recipe.numServings || recipe.servings}
                </p>
              )}
              
              {recipe.ingredients && recipe.ingredients.length > 0 && (
                <p>
                  <strong>Ingredients:</strong>{" "}
                  {Array.isArray(recipe.ingredients) 
                    ? recipe.ingredients.join(", ")
                    : recipe.ingredients}
                </p>
              )}
              
              {recipe.usedIngredients && recipe.usedIngredients.length > 0 && (
                <p>
                  <strong>Used ingredients:</strong>{" "}
                  {recipe.usedIngredients?.map((ing) => ing.original).join(", ")}
                </p>
              )}
              
              {recipe.missedIngredients && recipe.missedIngredients.length > 0 && (
                <p>
                  <strong>Missing ingredients:</strong>{" "}
                  {recipe.missedIngredients?.map((ing) => ing.original).join(", ")}
                </p>
              )}

              {recipe.cuisine && (
                <p>
                  <strong>Cuisine:</strong> {recipe.cuisine}
                </p>
              )}

              {recipe.difficulty!=0 && (
                <p>
                  <strong>Difficulty:</strong> {recipe.difficulty}/5
                </p>
              )}

              {recipe.rating!=0 && (
                <p>
                  <strong>Rating:</strong> {recipe.rating}/5
                </p>
              )}

              {recipe.likes !== undefined && recipe.likes !== null && (
                <p>
                  <strong>Likes:</strong> {recipe.likes}
                </p>
              )}

              {recipe.nutrition && (
                <p>
                  <strong>Nutrition:</strong> {recipe.nutrition}
                </p>
              )}
            </div>
          </div>
          
          <h4>Instructions:</h4>
          {recipe.instruction ? (
            <p>{recipe.instruction}</p>
          ) : recipe.analyzedInstructions?.length > 0 ? (
            <ol>
              {recipe.analyzedInstructions[0].steps.map((step) => (
                <li key={step.number}>{step.step}</li>
              ))}
            </ol>
          ) : (
            <p>No instructions available</p>
          )}

          {recipe.comments && recipe.comments.length > 0 && (
            <>
              <h4>Comments:</h4>
              <ul>
                {recipe.comments.map((comment, index) => (
                  <li key={index}>{comment}</li>
                ))}
              </ul>
            </>
          )}
        </>
    </>
  );
}