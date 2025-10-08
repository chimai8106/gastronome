import React, { useState } from "react";
import Popup from 'reactjs-popup';
import RecipeCard from "./RecipeCard";

export default function RecipeIntro({ recipe }) {
  return (
    <>
        <h3>{recipe.title}</h3>
        <>
          <div className="recipe-info">
            {recipe.image && (
              <img src={recipe.image} alt={recipe.title} width={200} />
            )}
            <div>
                {recipe.authorName && (
                  <p>
                    <strong>Author: </strong> {recipe.authorName}
                  </p>
                )}
              {(recipe.timePrepared>0 || recipe.readyInMinutes>0) && (
                <p>
                  <strong>Ready in:</strong> {recipe.timePrepared || recipe.readyInMinutes} minutes
                </p>
              )}
              
              {(recipe.numServings>0 || recipe.servings>0) && (
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

              {recipe.difficulty>0 && (
                <p>
                  <strong>Difficulty:</strong> {recipe.difficulty}/5
                </p>
              )}

              {recipe.rating>0 && (
                <p>
                  <strong>Rating:</strong> {recipe.rating}/5
                </p>
              )}

              {recipe.likes !== undefined && recipe.likes !== null && (
                <p>
                  <strong>Likes:</strong> {recipe.likes}
                </p>
              )}
            <Popup trigger=
                {<button>Details</button>} 
                modal nested>
                {
                    close => (
                        <div className='detail-recipe'>
                            <RecipeCard recipe={recipe}/>
                        <button onClick={() => close()}>Close</button>
                        </div>
                    )
                }
            </Popup>
            </div>
          </div>
          
          
    </>
    </>
  );
}