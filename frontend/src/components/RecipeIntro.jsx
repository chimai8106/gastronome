import React from "react";
import { Link, useNavigate } from "react-router-dom";

function SourceLink({ source }) {
  if (!source) return null;
  const isUrl = source.startsWith("http://") || source.startsWith("https://");
  if (isUrl) {
    return (
      <a
        href={source}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: "#D4A574",
          textDecoration: "underline",
          wordBreak: "break-word",
          overflowWrap: "break-word",
        }}
      >
        {source}
      </a>
    );
  }
  return <span style={{ wordBreak: "break-word", overflowWrap: "break-word" }}>{source}</span>;
}

export default function RecipeIntro({ recipe }) {
  const navigate = useNavigate();

  if (!recipe) return null;

  const savedCollections = recipe.myCollections || [];

  return (
    <div className="recipe-intro">
      <h3
        style={{ cursor: "pointer" }}
        onClick={() => navigate(`/recipe/${recipe._id}`)}
      >
        {recipe.title}
      </h3>
      <div className="recipe-info flex gap-4">
        <div className="recipe-details flex flex-col gap-1">
          {recipe.authorName && (
            <p>
              <strong>Author:</strong> {recipe.authorName}
            </p>
          )}
          {recipe.sourceName && (
            <p>
              <strong>Source:</strong> <SourceLink source={recipe.sourceName} />
            </p>
          )}
          {(recipe.timePrepared > 0 || recipe.readyInMinutes > 0) && (
            <p>
              <strong>⏱️ Ready in:</strong>{" "}
              {recipe.timePrepared || recipe.readyInMinutes} minutes
            </p>
          )}
          {(recipe.numServings > 0 || recipe.servings > 0) && (
            <p>
              <strong>🍽️ Servings:</strong> {recipe.numServings || recipe.servings}
            </p>
          )}
          {recipe.ingredients?.length > 0 && (
            <p>
              <strong>Ingredients:</strong>{" "}
              {Array.isArray(recipe.ingredients)
                ? recipe.ingredients.join("; ")
                : recipe.ingredients}
            </p>
          )}
          {recipe.usedIngredients?.length > 0 && (
            <p>
              <strong>Used ingredients:</strong>{" "}
              {recipe.usedIngredients.map((ing) => ing.original).join("; ")}
            </p>
          )}
          {recipe.missedIngredients?.length > 0 && (
            <p>
              <strong>Missing ingredients:</strong>{" "}
              {recipe.missedIngredients.map((ing) => ing.original).join("; ")}
            </p>
          )}
          {recipe.cuisine && (
            <p>
              <strong>Cuisine:</strong> {recipe.cuisine}
            </p>
          )}
          {recipe.difficulty > 0 && (
            <p>
              <strong>Difficulty:</strong> {recipe.difficulty}/5
            </p>
          )}
          {recipe.rating > 0 && (
            <p>
              <strong>Rating:</strong> {recipe.rating}/5
            </p>
          )}
          {savedCollections.length > 0 && (
            <div className="mt-2">
              <strong className="block mb-2">Collections:</strong>
              <div className="flex flex-wrap gap-2">
                {savedCollections.map((collection) => (
                  <Link
                    key={collection._id}
                    to={`/collections/${collection._id}`}
                    style={{
                      display: "inline-block",
                      backgroundColor: "#fef08a",
                      color: "#854d0e",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "9999px",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      textDecoration: "none",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => (e.target.style.backgroundColor = "#fde047")}
                    onMouseLeave={(e) => (e.target.style.backgroundColor = "#fef08a")}
                  >
                    {collection.title}
                  </Link>
                ))}
              </div>
            </div>
          )}
          {recipe.myComment && (
            <p>
              <strong style={{ color: "#8B5E3C", textDecoration: "underline" }}>
                My Comment:
              </strong>{" "}
              {recipe.myComment}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}