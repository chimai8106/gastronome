import React, { useState } from "react";
import { searchRecipeByIngredients } from "./RecipeServices";
import Popup from 'reactjs-popup';
import { toast } from "react-hot-toast";
import "./RecipeSearch.css";
import RecipeIntro from "../components/RecipeIntro";

export default function SearchByIngredients() {
  const [ingredients, setIngredients] = useState("");
  const [number, setNumber] = useState(5);
  const [ranking, setRanking] = useState(1);
  const [ignorePantry, setIgnorePantry] = useState(true);
  const [searchClicked, setSearchClicked] = useState(false);
  const [recipes, setRecipes] = useState([]);

  const formattedIngredients = ingredients.split(",").map(i => i.trim()).join(",");

  const handleSearch = async () => {
    try {
      const recipeData = { ingredients: formattedIngredients, number, ranking, ignorePantry };
      const data = await searchRecipeByIngredients(recipeData);
      setRecipes(data);
      return true;
    } catch (err) {
      toast.error(`Failed to search recipes: ${err?.message || err}. Please try again`);
      return false;
    }
  };

  const handleDelete = (id) => {
    // Placeholder function for delete
    console.log("Delete", id);
  };

  const handleChange = async (id, recipeData) => {
    // Placeholder function for update
    console.log("Update", id, recipeData);
    return true;
  };

  return (
    <div className="search-container">
      <h1>Kitchen Remix</h1>
      <p>
        Kitchen Remix helps you turn the ingredients you already have into delicious meals. 
        Just enter what’s in your pantry, and we’ll suggest recipes you can cook today!
      </p>

      {/* Ingredients */}
      <div className="form-group">
        <label>
          Ingredients *
          <span className="tooltip">Enter ingredients you have, separated by commas.</span>
        </label>
        <input
          type="text"
          placeholder="e.g. tomato, cheese, basil"
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
        />
      </div>

      {/* Number of recipes */}
      <div className="form-group">
        <label>
          Number of Recipes
          <span className="tooltip">Enter how many recipes you want to see.</span>
        </label>
        <input
          type="number"
          placeholder="e.g. 5"
          value={number}
          onChange={(e) => setNumber(Number(e.target.value))}
        />
      </div>

      {/* Ranking */}
      <div className="form-group">
        <label>
          Ranking
          <span className="tooltip">1 = maximize used ingredients, 2 = minimize missing ingredients.</span>
        </label>
        <input
          type="number"
          placeholder="1 or 2"
          value={ranking}
          onChange={(e) => setRanking(Number(e.target.value))}
        />
      </div>

      {/* Ignore Pantry */}
      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={ignorePantry}
            onChange={(e) => setIgnorePantry(e.target.checked)}
          />
          Ignore Pantry
          <span className="tooltip">Toggle to ignore items you already have in your pantry.</span>
        </label>
      </div>

      {/* Search Button */}
      <button onClick={() => { setSearchClicked(true); handleSearch(); }}>Search</button>

      {/* Display selected ingredients */}
      {/* Display selected ingredients */}
{ingredients && ingredients.length > 0 && (
  <div className="ingredients-list">
    <h2>Ingredients</h2>
    <ul>
      {ingredients
        .split(",")
        .map(item => item.trim())
        .filter(item => item.length > 0) 
        .map((item, index) => (
          <li key={index}>
            <button
              onClick={() =>
                setIngredients(prev =>
                  prev
                    .split(",")
                    .map(i => i.trim())
                    .filter((_, i) => i !== index)
                    .join(", ")
                )
              }
            >
              x
            </button>
            {item}
          </li>
        ))}
    </ul>
  </div>
)}


      {/* Search results */}
      {searchClicked && recipes.map((recipe) => (
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
        </div>
      ))}
    </div>
  );
}
