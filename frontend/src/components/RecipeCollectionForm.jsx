import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  addRecipeCollection,
  updateRecipeCollection,
  deleteRecipeCollection,
} from "../services/RecipeCollectionServices";
import "./RecipeCollectionForm.css";

export default function RecipeCollectionForm({
  initialRecipeCollection = null,
  onSuccess,
  onSubmit,
  submitButtonText,
}) {
  const navigate = useNavigate();
  const [title, setTitle] = useState(initialRecipeCollection?.title || "");
  const [description, setDescription] = useState(
    initialRecipeCollection?.description || ""
  );
  const [isPublic, setIsPublic] = useState(initialRecipeCollection?.isPublic || false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!title.trim()) newErrors.title = "Title is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Unsuccessful. Please try again!");
      return;
    }

    setErrors({});
    const recipeCollectionData = { title, description, isPublic };

    try {
      if (initialRecipeCollection) {
        // If onSubmit prop is provided, use it (for popup forms)
        if (onSubmit) {
          const result = await onSubmit(initialRecipeCollection._id, recipeCollectionData);
          // Only show toast if onSubmit didn't handle it (check return value)
          if (result !== false) {
            toast.success("RecipeCollection updated successfully!");
          }
          // Call onSuccess after successful submit
          if (onSuccess) onSuccess();
        } else {
          // Otherwise use the service directly
          await updateRecipeCollection(initialRecipeCollection._id, recipeCollectionData);
          toast.success("RecipeCollection updated successfully!");
          if (onSuccess) onSuccess();
          navigate("/user");
        }
      } else {
        // For create mode
        if (onSubmit) {
          await onSubmit(recipeCollectionData);
          if (onSuccess) onSuccess();
        } else {
          await addRecipeCollection(recipeCollectionData);
          toast.success("RecipeCollection created successfully!");
          if (onSuccess) onSuccess();
          navigate("/user");
        }
      }
    } catch (err) {
      toast.error(`Failed to save RecipeCollection: ${err?.message || err}`);
    }
  };

  const handleDelete = async () => {
    if (!initialRecipeCollection) return;
    try {
      await deleteRecipeCollection(initialRecipeCollection._id);
      toast.success("RecipeCollection deleted successfully!");
      if (onSuccess) onSuccess();
      // Don't navigate if we're in a popup (onSubmit exists)
      if (!onSubmit) {
        navigate("/user");
      }
    } catch (err) {
      toast.error(`Failed to delete RecipeCollection: ${err?.message || err}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="recipe-collection-form">
      {/* TITLE */}
      <div className="recipe-collection-form-group">
        <label className="recipe-collection-label">Name *</label>
        <input
          type="text"
          placeholder="RecipeCollection Title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (errors.title) setErrors({ ...errors, title: "" });
          }}
          className="recipe-collection-input"
        />
        {errors.title && <p className="recipe-collection-error-text">{errors.title}</p>}
      </div>

      {/* DESCRIPTION */}
      <div className="recipe-collection-form-group">
        <label className="recipe-collection-label">Description</label>
        <input
          type="text"
          placeholder="Short description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="recipe-collection-input"
        />
      </div>

      {/* VISIBILITY */}
      <div className="recipe-collection-form-group">
        <label className="recipe-collection-label">Visibility</label>
        <div className="recipe-collection-checkbox-container">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="recipe-collection-checkbox"
          />
          <span className="recipe-collection-checkbox-label">Public</span>
        </div>
      </div>

      {/* BUTTONS */}
      <div className="recipe-collection-button-group">
        <button type="submit" className="recipe-collection-submit-button">
          {submitButtonText || (initialRecipeCollection ? "Update RecipeCollection" : "Create RecipeCollection")}
        </button>

        {initialRecipeCollection && (
          <button 
            type="button" 
            onClick={handleDelete}
            className="recipe-collection-delete-button"
          >
            Delete
          </button>
        )}
      </div>
    </form>
  );
}