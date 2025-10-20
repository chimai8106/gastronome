import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  addRecipeCollection,
  updateRecipeCollection,
  deleteRecipeCollection,
} from "../services/RecipeCollectionServices";

export default function RecipeCollectionForm({
  initialRecipeCollection = null,
  initialId = null,
  onSuccess,
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
    const recipeRecipeCollectionData = { title, description, isPublic };

    try {
      if (initialId) {
        await updateRecipeCollection(initialId, recipeRecipeCollectionData);
        toast.success("RecipeCollection updated successfully!");
      } else {
        await addRecipeCollection(recipeRecipeCollectionData);
        toast.success("RecipeCollection created successfully!");
      }
      if (onSuccess) onSuccess();
      navigate("/user");
    } catch (err) {
      toast.error(`Failed to save recipeRecipeCollection: ${err?.message || err}`);
    }
  };

  const handleDelete = async () => {
    if (!initialId) return;
    try {
      await deleteRecipeCollection(initialId);
      toast.success("RecipeCollection deleted successfully!");
      if (onSuccess) onSuccess();
      navigate("/user");
    } catch (err) {
      toast.error(`Failed to delete recipeRecipeCollection: ${err?.message || err}`);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* TITLE */}
      <div>
        <label>Name *</label>
        <input
          type="text"
          placeholder="RecipeCollection Title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (errors.title) setErrors({ ...errors, title: "" });
          }}
        />
        {errors.title && <p className="error-text">{errors.title}</p>}
      </div>

      {/* DESCRIPTION */}
      <div>
        <label>Description</label>
        <input
          type="text"
          placeholder="Short description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* VISIBILITY */}
      <div>
        <label>Visibility</label>
        <div>
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          />
          <span>Public</span>
        </div>
      </div>

      {/* BUTTONS */}
      <div>
        <button type="submit">
          {initialId ? "Update RecipeCollection" : "Create RecipeCollection"}
        </button>

        {initialId && (
          <button type="button" onClick={handleDelete}>
            Delete
          </button>
        )}
      </div>
    </form>
  );
}
