import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { getMyRecipeCollection, addRecipeCollection } from "../services/RecipeCollectionServices";

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
  const [likes, setLikes] = useState(0);
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
      setSelectedRecipeCollections(initialRecipe.recipeCollectionID || []);
      setSelectedRecipeCollectionNames(initialRecipe.recipeCollectionName || []);
    }
  }, [initialRecipe]);

  const handleCollectionToggle = (collectionId, collectionName) => {
    if (selectedRecipeCollections.includes(collectionId)) {
      // Remove it
      setSelectedRecipeCollections(selectedRecipeCollections.filter(id => id !== collectionId));
      setSelectedRecipeCollectionNames(selectedRecipeCollectionNames.filter(name => name !== collectionName));
    } else {
      // Add it
      setSelectedRecipeCollections([...selectedRecipeCollections, collectionId]);
      setSelectedRecipeCollectionNames([...selectedRecipeCollectionNames, collectionName]);
    }
  };

  const handleSubmit = async (e) => {
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
    formData.append("recipeCollectionID", JSON.stringify(selectedRecipeCollections));
    formData.append("recipeCollectionName", JSON.stringify(selectedRecipeCollectionNames));
    formData.append("ingredients", JSON.stringify(formattedIngredients));
    formData.append("comments", JSON.stringify(formattedComments));

    if (images) formData.append("image", images);

    if (initialId) onSubmit(initialId, formData);
    else onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxHeight: '80vh', overflowY: 'auto', padding: '20px' }}>
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Title *</label>
        <input
          style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          placeholder="Recipe title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        {errors.title && <p style={{ color: 'red', margin: '5px 0 0 0' }}>{errors.title}</p>}
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Recipe Collections
        </label>
        
        {/* Display selected collections */}
        <div style={{ marginBottom: '8px' }}>
          {selectedRecipeCollectionNames.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {selectedRecipeCollectionNames.map((name, idx) => (
                <span 
                  key={idx}
                  style={{ 
                    background: '#e0e0e0', 
                    padding: '4px 8px', 
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  {name}
                  <button
                    type="button"
                    onClick={() => handleCollectionToggle(selectedRecipeCollections[idx], name)}
                    style={{ 
                      marginLeft: '6px', 
                      background: 'none', 
                      border: 'none', 
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>No collections selected</p>
          )}
        </div>

        {!creatingNewRecipeCollection ? (
          <>
            <button 
              type="button" 
              onClick={() => setShowCollectionDropdown(!showCollectionDropdown)}
              style={{ 
                padding: '8px 12px', 
                cursor: 'pointer',
                marginRight: '8px',
                background: '#f0f0f0',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            >
              {showCollectionDropdown ? '− Hide Collections' : '+ Add to Collection'}
            </button>
            
            <button 
              type="button" 
              onClick={() => setCreatingNewRecipeCollection(true)}
              style={{ 
                padding: '8px 12px', 
                cursor: 'pointer',
                background: '#f0f0f0',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            >
              + Create New Collection
            </button>

            {showCollectionDropdown && (
              <div style={{ 
                marginTop: '8px', 
                border: '1px solid #ccc', 
                borderRadius: '4px',
                maxHeight: '200px',
                overflowY: 'auto',
                background: 'white'
              }}>
                {recipeCollections.map((c) => (
                  <div 
                    key={c._id}
                    onClick={() => handleCollectionToggle(c._id, c.title)}
                    style={{ 
                      padding: '10px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #eee',
                      background: selectedRecipeCollections.includes(c._id) ? '#e3f2fd' : 'white',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedRecipeCollections.includes(c._id)}
                      onChange={() => {}}
                      style={{ marginRight: '8px' }}
                    />
                    {c.title}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div style={{ marginTop: '8px' }}>
            <input
              type="text"
              placeholder="New recipe collection name"
              value={newRecipeCollectionName}
              onChange={(e) => setNewRecipeCollectionName(e.target.value)}
              style={{ width: '100%', padding: '8px', marginBottom: '8px', boxSizing: 'border-box' }}
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
              style={{ marginRight: '8px', padding: '6px 12px', cursor: 'pointer' }}
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setCreatingNewRecipeCollection(false);
                setNewRecipeCollectionName("");
              }}
              style={{ padding: '6px 12px', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Ingredients *</label>
        <input
          style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          placeholder="Comma-separated list"
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
        />
        {errors.ingredients && <p style={{ color: 'red', margin: '5px 0 0 0' }}>{errors.ingredients}</p>}
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Instructions *</label>
        <textarea
          style={{ width: '100%', padding: '8px', minHeight: '100px', boxSizing: 'border-box' }}
          placeholder="Step-by-step instructions"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
        />
        {errors.instruction && <p style={{ color: 'red', margin: '5px 0 0 0' }}>{errors.instruction}</p>}
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Servings</label>
        <input 
          style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          type="number" 
          value={numServings} 
          onChange={(e) => setNumServings(e.target.value)} 
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Time (mins)</label>
        <input 
          style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          type="number" 
          value={timePrepared} 
          onChange={(e) => setTimePrepared(e.target.value)} 
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Cuisine</label>
        <input 
          style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          value={cuisine} 
          onChange={(e) => setCuisine(e.target.value)} 
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Difficulty (1–5)</label>
        <input 
          style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          type="number" 
          value={difficulty} 
          onChange={(e) => setDifficulty(e.target.value)} 
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Rating (0–5)</label>
        <input 
          style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          type="number" 
          value={rating} 
          onChange={(e) => setRating(e.target.value)} 
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Likes</label>
        <input 
          style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          type="number" 
          value={likes} 
          onChange={(e) => setLikes(e.target.value)} 
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nutrition Info</label>
        <textarea 
          style={{ width: '100%', padding: '8px', minHeight: '80px', boxSizing: 'border-box' }}
          value={nutrition} 
          onChange={(e) => setNutrition(e.target.value)} 
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Comments</label>
        <input 
          style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          placeholder="Comma-separated comments" 
          value={comments} 
          onChange={(e) => setComments(e.target.value)} 
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'inline-block', marginRight: '10px', fontWeight: 'bold' }}>Public?</label>
        <input 
          type="checkbox" 
          checked={isPublic} 
          onChange={(e) => setIsPublic(e.target.checked)} 
        />
      </div>

      <button 
        type="submit"
        style={{ padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold' }}
      >
        {submitButtonText}
      </button>
    </form>
  );
}