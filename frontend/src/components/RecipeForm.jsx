import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { getMyRecipeCollection, addRecipeCollection } from "../services/RecipeCollectionServices";
import "./RecipeForm.css";

export default function RecipeForm({
  initialRecipe = null,
  initialId = null,
  onSubmit,
  submitButtonText = "Save Recipe",
}) {
  const [title, setTitle] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [instruction, setInstruction] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [numServings, setNumServings] = useState(0);
  const [timePrepared, setTimePrepared] = useState(0);
  const [rating, setRating] = useState(0);
  const [sourceName, setSourceName] = useState("");
  const [comments, setComments] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [difficulty, setDifficulty] = useState(0);
  const [nutrition, setNutrition] = useState("");
  const [images, setImages] = useState();
  const [errors, setErrors] = useState({});
  const [recipeCollections, setRecipeCollections] = useState([]);
  const [selectedRecipeCollections, setSelectedRecipeCollections] = useState([]); // array of IDs
  const [selectedRecipeCollectionNames, setSelectedRecipeCollectionNames] = useState([]); // array of names
  const [newRecipeCollectionName, setNewRecipeCollectionName] = useState("");
  const [creatingNewRecipeCollection, setCreatingNewRecipeCollection] = useState(false);
  const [showCollectionDropdown, setShowCollectionDropdown] = useState(false);

  useEffect(() => {
    async function fetchRecipeCollections() {
      try {
        const data = await getMyRecipeCollection();
        setRecipeCollections(data);
      } catch (err) {
        toast.error(`Failed to load recipe collections: ${err?.message || err}`);
      }
    }
    fetchRecipeCollections();
  }, []);
  //prepopulate the form with the existing data if updating

  useEffect(() => {
    if (initialRecipe) {
      setTitle(initialRecipe.title || "");
      setIngredients(
        Array.isArray(initialRecipe.ingredients)
          ? initialRecipe.ingredients.join(", ")
          : initialRecipe.ingredients || ""
      );
      setInstruction(initialRecipe.instruction || "");
      setIsPublic(initialRecipe.isPublic ?? true);
      setNumServings(initialRecipe.numServings || 0);
      setSourceName(initialRecipe.sourceName || "");
      setTimePrepared(initialRecipe.timePrepared || 0);
      setRating(initialRecipe.rating || 0);
      setSourceName(initialRecipe.sourceName || "");
      setComments(
        Array.isArray(initialRecipe.comments)
          ? initialRecipe.comments.join(", ")
          : initialRecipe.comments || ""
      );
      setCuisine(initialRecipe.cuisine || "");
      setDifficulty(initialRecipe.difficulty || 0);
      setNutrition(initialRecipe.nutrition || "");
      setSelectedRecipeCollections(initialRecipe.recipeCollectionID || []);
      setSelectedRecipeCollectionNames(initialRecipe.recipeCollectionName || []);
    }
  }, [initialRecipe]);

  //drop-down menu handling for collections
  const handleCollectionToggle = (collectionId, collectionName) => {
    if (selectedRecipeCollections.includes(collectionId)) {
      //remove it
      setSelectedRecipeCollections(selectedRecipeCollections.filter(id => id !== collectionId));
      setSelectedRecipeCollectionNames(selectedRecipeCollectionNames.filter(name => name !== collectionName));
    } else {
      //add it
      setSelectedRecipeCollections([...selectedRecipeCollections, collectionId]);
      setSelectedRecipeCollectionNames([...selectedRecipeCollectionNames, collectionName]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    //error handling
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
    //append data to the FormData
    const formattedIngredients = ingredients
      .split(",")
      .map((i) => i.trim())
      .filter((i) => i.length > 0);

    const formattedComments = comments
      .split(",")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("instruction", instruction);
    formData.append("isPublic", isPublic);
    formData.append("numServings", numServings);
    formData.append("timePrepared", timePrepared);
    formData.append("rating", rating);
    formData.append("sourceName", sourceName);
    formData.append("cuisine", cuisine);
    formData.append("difficulty", difficulty);
    formData.append("nutrition", nutrition);
    formData.append("recipeCollectionID", JSON.stringify(selectedRecipeCollections));
    formData.append("recipeCollectionName", JSON.stringify(selectedRecipeCollectionNames));
    formData.append("ingredients", JSON.stringify(formattedIngredients));
    formData.append("comments", JSON.stringify(formattedComments));

    if (images) formData.append("image", images);

    if (initialId) onSubmit(initialId, formData);
    else onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="recipe-form">
      <div className="form-group">
        <label className="form-label">Title *</label>
        <input
          className="form-input"
          placeholder="Recipe title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        {errors.title && <p className="error-message">{errors.title}</p>}
      </div>

      <div className="form-group">
        <label className="form-label">Recipe Collections</label>
        
        {/* Display selected collections */}
        <div className="selected-collections-container">
          {selectedRecipeCollectionNames.length > 0 ? (
            <div className="selected-collections">
              {selectedRecipeCollectionNames.map((name, idx) => (
                <span key={idx} className="collection-tag">
                  {name}
                  <button
                    type="button"
                    onClick={() => handleCollectionToggle(selectedRecipeCollections[idx], name)}
                    className="collection-tag-remove"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="no-collections-text">No collections selected</p>
          )}
        </div>

        {!creatingNewRecipeCollection ? (
          <>
            <button 
              type="button" 
              onClick={() => setShowCollectionDropdown(!showCollectionDropdown)}
              className="collection-button"
            >
              {showCollectionDropdown ? '− Hide Collections' : '+ Add to Collection'}
            </button>
            
            <button 
              type="button" 
              onClick={() => setCreatingNewRecipeCollection(true)}
              className="collection-button"
            >
              + Create New Collection
            </button>

            {showCollectionDropdown && (
              <div className="collection-dropdown">
                {recipeCollections.map((c) => (
                  <div 
                    key={c._id}
                    onClick={() => handleCollectionToggle(c._id, c.title)}
                    className={`collection-item ${selectedRecipeCollections.includes(c._id) ? 'selected' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedRecipeCollections.includes(c._id)}
                      onChange={() => {}}
                      className="collection-checkbox"
                    />
                    {c.title}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="new-collection-container">
            <input
              type="text"
              placeholder="New recipe collection name"
              value={newRecipeCollectionName}
              onChange={(e) => setNewRecipeCollectionName(e.target.value)}
              className="new-collection-input"
            />
            <button
              type="button"
              onClick={async () => {
                try {
                  const newCol = await addRecipeCollection({
                    title: newRecipeCollectionName,
                    description: "",
                    isPublic: false,
                  });
                  setRecipeCollections([...recipeCollections, newCol]);
                  setSelectedRecipeCollections([...selectedRecipeCollections, newCol._id]);
                  setSelectedRecipeCollectionNames([...selectedRecipeCollectionNames, newCol.title]);
                  setCreatingNewRecipeCollection(false);
                  setNewRecipeCollectionName("");
                  toast.success("RecipeCollection created!");
                } catch (err) {
                  toast.error(`Failed to create recipe collection: ${err?.message || err}`);
                }
              }}
              className="new-collection-button"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setCreatingNewRecipeCollection(false);
                setNewRecipeCollectionName("");
              }}
              className="new-collection-cancel"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">Ingredients *</label>
        <input
          className="form-input"
          placeholder="Comma-separated list"
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
        />
        {errors.ingredients && <p className="error-message">{errors.ingredients}</p>}
      </div>

      <div className="form-group">
        <label className="form-label">Instructions *</label>
        <textarea
          className="form-textarea"
          placeholder="Step-by-step instructions"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
        />
        {errors.instruction && <p className="error-message">{errors.instruction}</p>}
      </div>

      <div className="form-group">
        <label className="form-label">Servings</label>
        <input 
          className="form-input"
          type="number" 
          value={numServings} 
          onChange={(e) => setNumServings(e.target.value)} 
        />
      </div>

      <div className="form-group">
        <label className="form-label">Time (mins)</label>
        <input 
          className="form-input"
          type="number" 
          value={timePrepared} 
          onChange={(e) => setTimePrepared(e.target.value)} 
        />
      </div>

      <div className="form-group">
        <label className="form-label">Cuisine</label>
        <input 
          className="form-input"
          value={cuisine} 
          onChange={(e) => setCuisine(e.target.value)} 
        />
      </div>

      <div className="form-group">
        <label className="form-label">Difficulty (1–5)</label>
        <input 
          className="form-input"
          type="number" 
          value={difficulty} 
          onChange={(e) => setDifficulty(e.target.value)} 
        />
      </div>

      <div className="form-group">
        <label className="form-label">Rating (0–5)</label>
        <input 
          className="form-input"
          type="number" 
          value={rating} 
          onChange={(e) => setRating(e.target.value)} 
        />
      </div>

      <div className="form-group">
        <label className="form-label">Source</label>
        <input 
          className="form-input"
          type="form-input" 
          value={sourceName} 
          onChange={(e) => setSourceName(e.target.value)} 
        />
      </div>

      <div className="form-group">
        <label className="form-label">Nutrition Info</label>
        <textarea 
          className="form-textarea-small"
          value={nutrition} 
          onChange={(e) => setNutrition(e.target.value)} 
        />
      </div>

      <div className="form-group">
        <label className="form-label">Comments</label>
        <input 
          className="form-input"
          placeholder="Comma-separated comments" 
          value={comments} 
          onChange={(e) => setComments(e.target.value)} 
        />
      </div>

      <div className="inline-checkbox-container">
        <label className="inline-label">Public?</label>
        <input 
          type="checkbox" 
          checked={isPublic} 
          onChange={(e) => setIsPublic(e.target.checked)} 
        />
      </div>

      <button type="submit" className="submit-button">
        {submitButtonText}
      </button>
    </form>
  );
}