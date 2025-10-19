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
  const [images, setImages] = useState();
  const validFileTypes = ['image/jpg', 'image/jpeg', 'image/png'];

  // Prepopulate form if editing
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
    const newErrors = {};
    if (!title.trim()) newErrors.title = "Title is required";
    if (!ingredients.trim()) newErrors.ingredients = "Ingredients are required";
    if (!instruction.trim()) newErrors.instruction = "Instructions are required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Unsuccessful. Please try again!");
      return;
    }

    setErrors({});

    const formattedIngredients = ingredients
      .split(",")
      .map((i) => i.trim())
      .filter((i) => i.length > 0);

    const formattedComments = comments
      .split(",")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    // Use FormData for file upload
    const formData = new FormData();
    formData.append("title", title);
    formData.append("instruction", instruction);
    formData.append("isPublic", isPublic);
    formData.append("numServings", numServings);
    formData.append("timePrepared", timePrepared);
    formData.append("rating", rating);
    formData.append("likes", likes);
    formData.append("cuisine", cuisine);
    formData.append("difficulty", difficulty);
    formData.append("nutrition", nutrition);

    // Append ingredients and comments as JSON strings
    formData.append("ingredients", JSON.stringify(formattedIngredients));
    formData.append("comments", JSON.stringify(formattedComments));

    // Append image if selected
    if (images) formData.append("image", images);

    // Call onSubmit with FormData
    if (initialId) {
      onSubmit(initialId, formData);
    } else {
      onSubmit(formData);
    }
  };


  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (validFileTypes.includes(file.type)) {
      setImages(file);
    } else {
      toast.error("Invalid file type. Please upload a JPG or PNG image.");
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
          onChange={(e) => setTitle(e.target.value)}
        />
        {errors.title && <p className="error-text">{errors.title}</p>}
      </div>

      {/* Image */}
      <div className="mb-4">
        <label className="block mb-1 font-semibold">Image</label>
        <input
          id="imageInput"
          type="file"
          hidden
          onChange={handleImageUpload}
        />
        <button
          type="button"
          onClick={() => document.getElementById("imageInput").click()}
          className="px-4 py-2 bg-gray-200 rounded"
        >
          {images ? "Change image" : "Upload image"}
        </button>
        {images && (
          <div className="mt-2">
            <img
              src={URL.createObjectURL(images)}
              alt="Preview"
              className="h-32 w-auto rounded-lg"
            />
          </div>
        )}
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
        {errors.ingredients && <p className="error-text">{errors.ingredients}</p>}
      </div>

      {/* Instructions */}
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
        {errors.instruction && <p className="error-text">{errors.instruction}</p>}
      </div>

      {/* Visibility */}
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
