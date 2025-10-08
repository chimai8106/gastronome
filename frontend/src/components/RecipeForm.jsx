import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

export default function RecipeForm({ 
  initialRecipe = null,
  initialId = null,
  onSubmit, 
  submitButtonText = "Save Recipe" 
}) {
  const [title, setTitle] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [instruction, setInstruction] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [numServings, setNumServings] = useState(0);
  const [timePrepared, setTimePrepared] = useState(0);
  const [rating, setRating] = useState(0);
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [difficulty, setDifficulty] = useState(0);
  const [nutrition, setNutrition] = useState("");
  const [errors, setErrors] = useState({});

  // Prepopulate form if editing (initialRecipe provided)
  useEffect(() => {
    if (initialRecipe) {
      setTitle(initialRecipe.title || "");
      setIngredients(
        Array.isArray(initialRecipe.ingredients)
          ? initialRecipe.ingredients.join(", ")
          : initialRecipe.ingredients || ""
      );
      setInstruction(initialRecipe.instruction || "");
      setIsPublic(initialRecipe.isPublic !== undefined ? initialRecipe.isPublic : true);
      setNumServings(initialRecipe.numServings || 0);
      setTimePrepared(initialRecipe.timePrepared || 0);
      setRating(initialRecipe.rating || 0);
      setLikes(initialRecipe.likes || 0);
      setComments(
        Array.isArray(initialRecipe.comments)
          ? initialRecipe.comments.join(", ")
          : initialRecipe.comments || ""
      );
      setCuisine(initialRecipe.cuisine || "");
      setDifficulty(initialRecipe.difficulty || 0);
      setNutrition(initialRecipe.nutrition || "");
    }
  }, [initialRecipe]);

  const handleSubmit = (e) => {
     e.preventDefault();
    // Validate required fields
    const newErrors = {};
    
    if (!title.trim()) {
      newErrors.title = "Title is required";
    }
    if (!ingredients.trim()) {
      newErrors.ingredients = "Ingredients are required";
    }
    if (!instruction.trim()) {
      newErrors.instruction = "Instructions are required";
    }

    // If there are errors, set them and don't submit
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error(Object.values(newErrors).join(", "));
      return; 
    }

    // Clear errors if validation passes
    setErrors({});

    const formattedIngredients = ingredients
      .split(",")
      .map((i) => i.trim())
      .filter((i) => i.length > 0);

    const formattedComments = comments
      .split(",")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    const recipeData = {
      title,
      ingredients: formattedIngredients,
      instruction,
      isPublic,
      numServings,
      timePrepared,
      rating,
      likes,
      comments: formattedComments,
      cuisine,
      difficulty,
      nutrition,
    };

    // If initialId exists, pass it along (for updates)
    if (initialId) {
      onSubmit(initialId, recipeData);
    } else {
      onSubmit(recipeData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto p-6 bg-white shadow-lg rounded-2xl">
      {/* Title */}
      <div className="mb-4">
        <label className="block mb-1 font-semibold">Title *</label>
        <input
          className={`w-full p-2 border rounded-lg ${errors.title ? 'border-red-500' : ''}`}
          placeholder="Recipe Title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (errors.title) setErrors({...errors, title: ""});
          }}
        />
        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
      </div>

      {/* Ingredients */}
      <div className="mb-4">
        <label className="block mb-1 font-semibold">Ingredients *</label>
        <input
          className={`w-full p-2 border rounded-lg ${errors.ingredients ? 'border-red-500' : ''}`}
          placeholder="Comma-separated"
          value={ingredients}
          onChange={(e) => {
            setIngredients(e.target.value);
            if (errors.ingredients) setErrors({...errors, ingredients: ""});
          }}
        />
        {errors.ingredients && <p className="text-red-500 text-sm mt-1">{errors.ingredients}</p>}
      </div>

      {/* Instruction */}
      <div className="mb-4">
        <label className="block mb-1 font-semibold">Instructions *</label>
        <textarea
          className={`w-full p-2 border rounded-lg ${errors.instruction ? 'border-red-500' : ''}`}
          placeholder="Step-by-step instructions"
          value={instruction}
          onChange={(e) => {
            setInstruction(e.target.value);
            if (errors.instruction) setErrors({...errors, instruction: ""});
          }}
        />
        {errors.instruction && <p className="text-red-500 text-sm mt-1">{errors.instruction}</p>}
      </div>

      {/* Public */}
      <div className="mb-4">
        <label className="block font-semibold mb-1">Visibility</label>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          />
          <span>Public</span>
        </div>
      </div>

      {/* Number fields */}
      <div className="mb-4">
        <label className="block mb-1 font-semibold">Number of Servings</label>
        <input
          type="number"
          className="w-full p-2 border rounded-lg"
          placeholder="e.g. 4"
          value={numServings}
          onChange={(e) => setNumServings(Number(e.target.value))}
        />
      </div>

      <div className="mb-4">
        <label className="block mb-1 font-semibold">Time to Prepare (minutes)</label>
        <input
          type="number"
          className="w-full p-2 border rounded-lg"
          placeholder="e.g. 30"
          value={timePrepared}
          onChange={(e) => setTimePrepared(Number(e.target.value))}
        />
      </div>

      <div className="mb-4">
        <label className="block mb-1 font-semibold">Rating (0-5)</label>
        <input
          type="number"
          className="w-full p-2 border rounded-lg"
          placeholder="e.g. 4"
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
        />
      </div>

      <div className="mb-4">
        <label className="block mb-1 font-semibold">Likes</label>
        <input
          type="number"
          className="w-full p-2 border rounded-lg"
          placeholder="e.g. 100"
          value={likes}
          onChange={(e) => setLikes(Number(e.target.value))}
        />
      </div>

      {/* Comments */}
      <div className="mb-4">
        <label className="block mb-1 font-semibold">Comments</label>
        <input
          className="w-full p-2 border rounded-lg"
          placeholder="Comma-separated"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
        />
      </div>

      {/* Cuisine */}
      <div className="mb-4">
        <label className="block mb-1 font-semibold">Cuisine</label>
        <input
          className="w-full p-2 border rounded-lg"
          placeholder="e.g. Italian, Mexican"
          value={cuisine}
          onChange={(e) => setCuisine(e.target.value)}
        />
      </div>

      {/* Difficulty */}
      <div className="mb-4">
        <label className="block mb-1 font-semibold">Difficulty (1-5)</label>
        <input
          type="number"
          className="w-full p-2 border rounded-lg"
          placeholder="e.g. 3"
          value={difficulty}
          onChange={(e) => setDifficulty(Number(e.target.value))}
        />
      </div>

      {/* Nutrition */}
      <div className="mb-6">
        <label className="block mb-1 font-semibold">Nutrition Info</label>
        <input
          className="w-full p-2 border rounded-lg"
          placeholder="e.g. 500 calories per serving"
          value={nutrition}
          onChange={(e) => setNutrition(e.target.value)}
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
      >
        {submitButtonText}
      </button>
    </form>
  );
}