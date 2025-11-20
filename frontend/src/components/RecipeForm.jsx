import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { getMyRecipeCollection, addRecipeCollection } from "../services/RecipeCollectionServices";
import "./RecipeForm.css";
import { useAuth } from "../contexts/authContext";

export default function RecipeForm({
  initialRecipe = null,
  initialId = null,
  onSubmit,
  onFormChange = () => {},
  submitButtonText = "Save Recipe",
}) {
  const {uid} = useAuth();
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
  const [image, setImage] = useState();
  const [errors, setErrors] = useState({});
  const [recipeCollections, setRecipeCollections] = useState([]);
  const [selectedRecipeCollections, setSelectedRecipeCollections] = useState([]); // array of IDs
  const [selectedRecipeCollectionNames, setSelectedRecipeCollectionNames] = useState([]); // array of names
  const [newRecipeCollectionName, setNewRecipeCollectionName] = useState("");
  const [creatingNewRecipeCollection, setCreatingNewRecipeCollection] = useState(false);
  const [showCollectionDropdown, setShowCollectionDropdown] = useState(false);
  const validFileTypes = ['image/jpg', 'image/jpeg', 'image/png']
  const [myComment, setMyComment] = useState("");
  
  // Track if we've already initialized from initialRecipe
  const hasInitialized = useRef(false);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const dropdownContainers = document.querySelectorAll('.collection-container');
      let clickedInside = false;

      dropdownContainers.forEach(container => {
        if (container.contains(event.target)) {
          clickedInside = true;
        }
      });

      if (!clickedInside) {
        setShowCollectionDropdown(false);  // Changed from {} to false
        setCreatingNewRecipeCollection(false);  // Changed from {} to false (and fixed the function name)
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Prepopulate the form with the existing data - ONLY ONCE
  useEffect(() => {
    if (initialRecipe && !hasInitialized.current) {
      hasInitialized.current = true;
      
      setTitle(initialRecipe.title || "");
      setIngredients(
        Array.isArray(initialRecipe.ingredients)
          ? initialRecipe.ingredients.join("; ")
          : initialRecipe.ingredients || ""
      );
      setInstruction(initialRecipe.instruction || "");
      setIsPublic(initialRecipe.isPublic ?? true);
      setNumServings(initialRecipe.numServings || 0);
      setSourceName(initialRecipe.sourceName || "");
      setTimePrepared(initialRecipe.timePrepared || 0);
      setRating(initialRecipe.rating || 0);
      setComments(
        Array.isArray(initialRecipe.comments)
          ? initialRecipe.comments.join("; ")
          : initialRecipe.comments || ""
      );
      setCuisine(initialRecipe.cuisine || "");
      setDifficulty(initialRecipe.difficulty || 0);
      setNutrition(initialRecipe.nutrition || "");
      setSelectedRecipeCollections(initialRecipe.recipeCollectionID || []);
      setSelectedRecipeCollectionNames(initialRecipe.recipeCollectionName || []);
      setMyComment(initialRecipe.myComment || "");
    }
  }, [initialRecipe]);

  // Call onFormChange whenever any field changes (just to set the flag, no state passing)
  const notifyFormChange = () => {
    onFormChange();
  };

  // Wrapper to track changes
  const handleChange = (setter) => (value) => {
    setter(value);
    notifyFormChange();
  };

  // Drop-down menu handling for collections
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
    notifyFormChange();
  };

  const handleUploadImage =(e) => {
    const file = e.target.files[0];
    if (!validFileTypes.find(type => type ===file.type)){
      setErrors(prev => ({ ...prev, image: "File must be JPG/PNG" }));
    
    }
    else{
      setErrors(prev => ({ ...prev, image: undefined }));
      setImage(file);
      toast.success("Image added");
    }
  } 

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Error handling
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
    // Append data to the FormData
    const formattedIngredients = ingredients
      .split(";")
      .map((i) => i.trim())
      .filter((i) => i.length > 0);

    const formattedComments = comments
      .split(";")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    const formData = new FormData();
    formData.append("title", title);
    if (image) formData.append("image", image);
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
    formData.append("myComment", myComment);

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
          onChange={(e) => handleChange(setTitle)(e.target.value)}
        />
        {errors.title && <p className="error-message">{errors.title}</p>}
      </div>

      <div className="form-group">
        <div className = "collection-container">
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
          <table className = "collection-button-conatiner">
            <tbody>
              <tr>
                <td>
            <button 
              type="button" 
              onClick={() => {
                setShowCollectionDropdown(!showCollectionDropdown);
                notifyFormChange();
              }}
              className="collection-button"
            >
              {showCollectionDropdown ? '− Hide Collections' : '+ Add to Collection'}
            </button>
            </td>
            <td>
            <button 
              type="button" 
              onClick={() => {
                setCreatingNewRecipeCollection(true);
                notifyFormChange();
              }}
              className="collection-button"
            >
              + Create New Collection
            </button>
            </td>
            </tr>
            </tbody>
            </table>
            

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
          <div className="new-collection-form">
            <input
              type="text"
              placeholder="New recipe collection name"
              value={newRecipeCollectionName}
              onChange={(e) => {
                setNewRecipeCollectionName(e.target.value);
                notifyFormChange();
              }}
              className="new-collection-input"
            />
            <table>
              <tbody>
                <tr>
            <td><button
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
                  notifyFormChange();
                } catch (err) {
                  toast.error(`Failed to create recipe collection: ${err?.message || err}`);
                }
              }}
              className="new-collection-button"
            >
              Save
            </button>
            </td>
            <td>
            <button
              type="button"
              onClick={() => {
                setCreatingNewRecipeCollection(false);
                setNewRecipeCollectionName("");
                notifyFormChange();
              }}
              className="new-collection-cancel"
            >
              Cancel
            </button>
            </td>
            </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
      <div className="form-group">
        <label className="form-label">Image</label>
        <input id='image' type='file' hidden onChange={handleUploadImage}></input>
        
        <label 
          htmlFor='image' 
          className='btn' 
          style={{
            cursor: 'pointer', 
            display: 'block',  
            marginTop: '10px', 
            width: 'fit-content',
            color: 'white' 
          }}
        >
          Upload
        </label>
        
        {errors.image && <p className="error-message">{errors.image}</p>}
      </div>
    
      <div className="form-group">
        <label className="form-label">My Comment </label>
        <textarea
          className="form-textarea"
          placeholder="What do you think about this recipe? Any modifications or tips?"
          value={myComment}
          onChange={(e) => handleChange(setMyComment)(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Ingredients *</label>
        <p>Separate by semicolon (;)</p>
        <input
          className="form-input"
          placeholder="Comma-separated list"
          value={ingredients}
          onChange={(e) => handleChange(setIngredients)(e.target.value)}
        />
        {errors.ingredients && <p className="error-message">{errors.ingredients}</p>}
  
        <ul className="ingredients-list-form">
          {ingredients
            .split(";")
            .map(item => item.trim())
            .filter(item => item.length > 0) 
            .map((item, index) => (
              <li key={index} className="ingredient-tag">
                <span className="ingredient-tag-text">{item}</span>
                <button
                  type="button"
                  className="ingredient-remove-btn"
                  onClick={() => {
                    setIngredients(prev =>
                      prev
                        .split(";")
                        .map(i => i.trim())
                        .filter((_, i) => i !== index)
                        .join("; ")
                    );
                    notifyFormChange();
                  }}
                  title="Remove ingredient"
                >
                  ×
                </button>
              </li>
            ))}
        </ul>
      </div>

      <div className="form-group">
        <label className="form-label">Instructions *</label>
        <textarea
          className="form-textarea"
          placeholder="Step-by-step instructions"
          value={instruction}
          onChange={(e) => handleChange(setInstruction)(e.target.value)}
        />
        {errors.instruction && <p className="error-message">{errors.instruction}</p>}
      </div>

      <div className="form-group">
        <label className="form-label">Servings</label>
        <input 
          className="form-input"
          type="number" 
          value={numServings} 
          onChange={(e) => handleChange(setNumServings)(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Time (mins)</label>
        <input 
          className="form-input"
          type="number" 
          value={timePrepared} 
          onChange={(e) => handleChange(setTimePrepared)(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Cuisine</label>
        <input 
          className="form-input"
          value={cuisine} 
          onChange={(e) => handleChange(setCuisine)(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Difficulty (1–5)</label>
        <input 
          className="form-input"
          type="number" 
          value={difficulty} 
          onChange={(e) => handleChange(setDifficulty)(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Rating (0–5)</label>
        <input 
          className="form-input"
          type="number" 
          value={rating} 
          onChange={(e) => handleChange(setRating)(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Source</label>
        <input 
          className="form-input"
          type="text" 
          value={sourceName} 
          onChange={(e) => handleChange(setSourceName)(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Nutrition Info</label>
        <textarea 
          className="form-textarea-small"
          value={nutrition} 
          onChange={(e) => handleChange(setNutrition)(e.target.value)}
        />
      </div>
        {/*
      <div className="form-group">
        <label className="form-label">Comments</label>
        <input 
          className="form-input"
          placeholder="Comma-separated comments" 
          value={comments} 
          onChange={(e) => handleChange(setComments)(e.target.value)}
        />
      </div>
      */}

      <div className="inline-checkbox-container">
        <label className="inline-label">Public?</label>
        <input 
          type="checkbox" 
          checked={isPublic} 
          onChange={(e) => {
            setIsPublic(e.target.checked);
            notifyFormChange();
          }}
        />
      </div>

      <button type="submit" className="submit-button">
        {submitButtonText}
      </button>
    </form>
  );
}