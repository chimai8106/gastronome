import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  getRecipeCollectionById,
  updateRecipeCollection,
  deleteRecipeCollection,
  addRecipeCollection,
  getMyRecipeCollection,
} from "../../services/RecipeCollectionServices";
import { deleteRecipe, addRecipeToCollection, removeRecipeFromCollection } from "../../services/RecipeServices";
import { useAuth } from "../../contexts/authContext";
import { useCreate } from "../../contexts/CreateContext";
import { useAddToCollection } from "../../contexts/AddToCollectionContext";
import RecipeCollectionForm from "../../components/RecipeCollectionForm";
import RecipeGridBox from "../../components/RecipeGridBox";
import Popup from "reactjs-popup";
import "./Collection.css";

export default function Collection() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { uid } = useAuth();
  const { openUpdateRecipePopup } = useCreate();
  const { toggleCollectionDropdown, isDropdownOpen, closeCollectionDropdown } = useAddToCollection();

  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recipesToShow, setRecipesToShow] = useState(10);
  const [changed, setChanged] = useState(false);
  const [recipeCollections, setRecipeCollections] = useState([]);
  const [selectedCollections, setSelectedCollections] = useState({});
  const [creatingNewCollection, setCreatingNewCollection] = useState({});
  const [newCollectionTitle, setNewCollectionTitle] = useState({});

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // Fetch the collection page data
        const collectionData = await getRecipeCollectionById(id);
        setCollection(collectionData);

        // Separately fetch user's own collections for the "add to collection" dropdown
        if (uid) {
          const myCollections = await getMyRecipeCollection();
          setRecipeCollections(myCollections || []);
        }
      } catch (err) {
        toast.error(`Failed to load collection: ${err?.message || err}`);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id, changed, uid]);

  const isOwner = (recipe) => recipe.uid === uid;
  const isCollectionOwner = () => collection?.uid === uid;

  const handleUpdate = async (id, recipeCollectionData) => {
    try {
      await updateRecipeCollection(id, recipeCollectionData);
      setChanged(!changed);
      toast.success("Successfully updated Recipe Collection!");
      return true;
    } catch (err) {
      toast.error(`Failed to update Recipe Collection: ${err?.message || err}`);
      return false;
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this collection?")) return;
    try {
      await deleteRecipeCollection(id);
      toast.success("Successfully deleted Recipe Collection!");
      navigate("/user");
    } catch (err) {
      toast.error(`Failed to delete Recipe Collection: ${err?.message || err}`);
    }
  };

  const handleShowMore = () => setRecipesToShow((prev) => prev + 10);

  const handleCollectionToggle = (recipeId, collectionId, collectionTitle) => {
    const currentSelections = selectedCollections[recipeId] || { ids: [], titles: [] };
    if (currentSelections.ids.includes(collectionId)) {
      setSelectedCollections({
        ...selectedCollections,
        [recipeId]: {
          ids: currentSelections.ids.filter((id) => id !== collectionId),
          titles: currentSelections.titles.filter((t) => t !== collectionTitle),
        },
      });
    } else {
      setSelectedCollections({
        ...selectedCollections,
        [recipeId]: {
          ids: [...currentSelections.ids, collectionId],
          titles: [...currentSelections.titles, collectionTitle],
        },
      });
    }
  };

  const handleRemoveCollection = async (recipeId, collectionId) => {
    try {
      await removeRecipeFromCollection(recipeId, collectionId);
      toast.success("Removed from collection!");
      setChanged(!changed);
    } catch (err) {
      toast.error(`Failed to remove from collection: ${err?.message || err}`);
    }
  };

  const handleAddToCollections = async (recipeId) => {
    const selections = selectedCollections[recipeId];
    if (!selections || selections.ids.length === 0) {
      toast.error("Please select at least one collection");
      return;
    }
    try {
      await Promise.all(
        selections.ids.map((collectionId) => addRecipeToCollection(recipeId, collectionId))
      );
      toast.success(`Added to ${selections.titles.length} collection(s)!`);
      closeCollectionDropdown();
      setSelectedCollections({ ...selectedCollections, [recipeId]: { ids: [], titles: [] } });
      setChanged(!changed);
    } catch (err) {
      toast.error(`Failed to add to collections: ${err?.message || err}`);
    }
  };

  const handleCreateNewCollection = async (recipeId) => {
    const collectionTitle = newCollectionTitle[recipeId];
    if (!collectionTitle || collectionTitle.trim() === "") {
      toast.error("Please enter a collection name");
      return;
    }
    try {
      const newCol = await addRecipeCollection({
        title: collectionTitle,
        description: "",
        isPublic: false,
      });
      setRecipeCollections([...recipeCollections, newCol]);
      const currentSelections = selectedCollections[recipeId] || { ids: [], titles: [] };
      setSelectedCollections({
        ...selectedCollections,
        [recipeId]: {
          ids: [...currentSelections.ids, newCol._id],
          titles: [...currentSelections.titles, newCol.title],
        },
      });
      setCreatingNewCollection({ ...creatingNewCollection, [recipeId]: false });
      setNewCollectionTitle({ ...newCollectionTitle, [recipeId]: "" });
      toast.success("Collection created and selected!");
    } catch (err) {
      toast.error(`Failed to create collection: ${err?.message || err}`);
    }
  };

  const handleRecipeDelete = async (recipeId) => {
    try {
      await deleteRecipe(recipeId);
      setChanged(!changed);
      toast.success("Successfully deleted recipe!");
    } catch (err) {
      toast.error(`Failed to delete recipe: ${err?.message || err}`);
    }
  };

  if (loading) return null;

  if (!collection) {
    return (
      <div className="collection-not-found">
        <p>Collection not found</p>
      </div>
    );
  }

  const recipes = collection.recipes || [];
  const displayedRecipes = recipes.slice(0, recipesToShow);
  const hasMore = recipesToShow < recipes.length;

  return (
    <div className="collection-page-container">
      {/* Collection Header */}
      <div className="collection-page-header">
        <div className="collection-page-info">
          <h1 className="collection-page-title">{collection.title}</h1>
          {collection.description && (
            <p className="collection-page-description">{collection.description}</p>
          )}
          {collection.authorName && (
            <p className="collection-page-author">By {collection.authorName}</p>
          )}
          <div className="collection-page-meta">
            <span className="collection-page-recipe-count">
              {recipes.length} {recipes.length === 1 ? "recipe" : "recipes"}
            </span>
          </div>
        </div>

        {uid && isCollectionOwner() && (
          <div className="collection-page-actions">
            <Popup
              className="pop-up"
              overlayClassName="popup-overlay"
              trigger={<button className="collection-page-update-btn">Update</button>}
              modal
              nested
            >
              {(close) => (
                <RecipeCollectionForm
                  initialRecipeCollection={collection}
                  onSubmit={async (id, data) => {
                    const success = await handleUpdate(id, data);
                    if (success) close();
                  }}
                  submitButtonText="Update Collection"
                />
              )}
            </Popup>

            <button onClick={handleDelete} className="collection-page-delete-btn">
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Recipes Grid */}
      {recipes.length === 0 ? (
        <div className="collection-page-empty">
          <p>No recipes in this collection yet</p>
        </div>
      ) : (
        <>
          <div className="collection-page-recipes-grid">
            {displayedRecipes.map((recipe) => (
              <RecipeGridBox
                key={recipe._id}
                recipe={recipe}
                currentUserId={uid}
                isOwner={isOwner}
                selectedCollections={selectedCollections}
                showCollectionDropdown={isDropdownOpen(recipe._id)}
                creatingNewCollection={creatingNewCollection}
                newCollectionTitle={newCollectionTitle}
                recipeCollections={recipeCollections}
                onCollectionToggle={handleCollectionToggle}
                onRemoveCollection={handleRemoveCollection}
                onShowCollectionDropdown={() => toggleCollectionDropdown(recipe._id)}
                onAddToCollections={handleAddToCollections}
                onCreateNewCollection={handleCreateNewCollection}
                onSetCreatingNewCollection={(recipeId, value) =>
                  setCreatingNewCollection({ ...creatingNewCollection, [recipeId]: value })
                }
                onSetNewCollectionTitle={(recipeId, value) =>
                  setNewCollectionTitle({ ...newCollectionTitle, [recipeId]: value })
                }
                onUpdate={() => {
                  openUpdateRecipePopup(recipe, () => setChanged(!changed));
                }}
                onDelete={handleRecipeDelete}
                onNavigate={navigate}
                disabledButton={true}
              />
            ))}
          </div>

          {hasMore && (
            <div className="collection-page-show-more">
              <button onClick={handleShowMore} className="collection-page-show-more-btn">
                Show More ({recipes.length - recipesToShow} remaining)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}