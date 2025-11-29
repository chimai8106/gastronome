import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import RecipeGridBox from "../../components/RecipeGridBox";
import { useAuth } from "../../contexts/authContext";
import { useAddToCollection } from "../../contexts/AddToCollectionContext";
import { useCreate } from "../../contexts/CreateContext";
import { 
  deleteRecipe, 
  addRecipeToCollection, 
  removeRecipeFromCollection, 
  searchRecipe 
} from "../../services/RecipeServices";
import { 
  getMyRecipeCollection, 
  addRecipeCollection, 
  searchCollection
} from "../../services/RecipeCollectionServices";
import "./SearchResult.css";

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { uid } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [recipeResults, setRecipeResults] = useState([]);
  const [collectionResults, setCollectionResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("recipes");
  const [changed, setChanged] = useState(false);
  
  // Advanced filters
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    cuisine: "",
    maxCookTime: "",
    difficulty: "",
    minRating: ""
  });

  // For RecipeGridBox
  const [recipeCollections, setRecipeCollections] = useState([]);
  const [selectedCollections, setSelectedCollections] = useState({});
  const [creatingNewCollection, setCreatingNewCollection] = useState({});
  const [newCollectionTitle, setNewCollectionTitle] = useState({});
  const { toggleCollectionDropdown, isDropdownOpen, closeCollectionDropdown } = useAddToCollection();
  const { openUpdateRecipePopup } = useCreate();

  useEffect(() => {
    if (uid) {
      loadCollections();
    }
  }, [uid, changed]);

  const loadCollections = async () => {
    try {
      const data = await getMyRecipeCollection();
      setRecipeCollections(data);
    } catch (err) {
      console.error("Failed to load collections:", err);
    }
  };

  useEffect(() => {
    const query = searchParams.get("q");
    if (query) {
      setSearchQuery(query);
      performSearch(query);
    }
  }, [searchParams]);

  const performSearch = async (query) => {
    if (!query || query.trim() === "") return;

    setLoading(true);
    try {
      const [recipes, collections] = await Promise.all([
        searchRecipe({ query: query.trim(), ...filters }),
        searchCollection({ query: query.trim() })
      ]);

      setRecipeResults(recipes || []);
      setCollectionResults(collections || []);
    } catch (err) {
      toast.error(`Search failed: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery.trim() });
    }
  };

  const handleAdvancedSearch = () => {
    performSearch(searchQuery);
  };

  const isOwner = (recipe) => recipe.uid === uid;

  const handleDelete = async (recipeId) => {
    try {
      await deleteRecipe(recipeId);
      setChanged(!changed);
      performSearch(searchQuery);
      toast.success("Successfully deleted recipe!");
    } catch (err) {
      toast.error(`Failed to delete recipe: ${err?.message || err}`);
    }
  };

  const handleCollectionToggle = (recipeId, collectionId, collectionTitle) => {
    const currentSelections = selectedCollections[recipeId] || { ids: [], titles: [] };
    
    if (currentSelections.ids.includes(collectionId)) {
      setSelectedCollections({
        ...selectedCollections,
        [recipeId]: {
          ids: currentSelections.ids.filter(id => id !== collectionId),
          titles: currentSelections.titles.filter(title => title !== collectionTitle)
        }
      });
    } else {
      setSelectedCollections({
        ...selectedCollections,
        [recipeId]: {
          ids: [...currentSelections.ids, collectionId],
          titles: [...currentSelections.titles, collectionTitle]
        }
      });
    }
  };

  const handleRemoveCollection = async (recipeId, collectionId) => {
    try {
      await removeRecipeFromCollection(recipeId, collectionId);
      toast.success("Removed from collection!");
      setChanged(!changed);
      performSearch(searchQuery);
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
        selections.ids.map(collectionId => 
          addRecipeToCollection(recipeId, collectionId)
        )
      );
      
      toast.success(`Added to ${selections.titles.length} collection(s)!`);
      closeCollectionDropdown();
      setSelectedCollections({ ...selectedCollections, [recipeId]: { ids: [], titles: [] } });
      setChanged(!changed);
      performSearch(searchQuery);
    } catch (err) {
      toast.error(`Failed to add to collections: ${err?.message || err}`);
    }
  };

  const handleCreateNewCollection = async (recipeId) => {
    const collectionTitle = newCollectionTitle[recipeId];
    if (!collectionTitle || collectionTitle.trim() === '') {
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
          titles: [...currentSelections.titles, newCol.title]
        }
      });
      
      setCreatingNewCollection({ ...creatingNewCollection, [recipeId]: false });
      setNewCollectionTitle({ ...newCollectionTitle, [recipeId]: "" });
      toast.success("Collection created and selected!");
    } catch (err) {
      toast.error(`Failed to create collection: ${err?.message || err}`);
    }
  };

  const totalResults = recipeResults.length + collectionResults.length;
  if (loading) {
    return null;
  }

  return (
    <div className="search-results-main-page">
      <div className="search-results-main-container">
        {/* Search Header */}
        <div className="search-results-page-header">
          <h1>Search Results</h1>
          
          {/* Search Bar */}
          <div className="search-results-bar-large">
            <input
              type="text"
              placeholder="Search recipes and collections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit(e)}
            />
            <button onClick={handleSearchSubmit}>Search</button>
          </div>

          {/* Results Summary */}
          {!loading && (
            <p className="search-results-summary-text">
              Found {totalResults} result{totalResults !== 1 ? 's' : ''} for "{searchParams.get("q")}"
            </p>
          )}
        </div>

        {/* Tabs */}
        <div className="search-results-page-tabs">
          <button
            className={`search-results-tab ${activeTab === "recipes" ? "active" : ""}`}
            onClick={() => setActiveTab("recipes")}
          >
            Recipes ({recipeResults.length})
          </button>
          <button
            className={`search-results-tab ${activeTab === "collections" ? "active" : ""}`}
            onClick={() => setActiveTab("collections")}
          >
            Collections ({collectionResults.length})
          </button>
        </div>

        {/* Advanced Filters (only for recipes) */}
        {activeTab === "recipes" && (
          <div className="search-results-filters-section">
            <button
              className="search-results-toggle-filters-btn"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? "Hide" : "Show"} Filters
            </button>

            {showFilters && (
              <div className="search-results-filters-container">
                <div className="search-results-filter-grid">
                  <div className="form-group">
                    <label>Cuisine</label>
                    <input
                      type="text"
                      placeholder="e.g., Italian"
                      value={filters.cuisine}
                      onChange={(e) => setFilters({...filters, cuisine: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label>Max Cook Time (min)</label>
                    <input
                      type="number"
                      placeholder="e.g., 30"
                      value={filters.maxCookTime}
                      onChange={(e) => setFilters({...filters, maxCookTime: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label>Difficulty (1-5)</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      placeholder="e.g., 3"
                      value={filters.difficulty}
                      onChange={(e) => setFilters({...filters, difficulty: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label>Min Rating</label>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      step="0.5"
                      placeholder="e.g., 4"
                      value={filters.minRating}
                      onChange={(e) => setFilters({...filters, minRating: e.target.value})}
                    />
                  </div>
                </div>

                <button className="search-results-apply-filters-btn" onClick={handleAdvancedSearch}>
                  Apply Filters
                </button>
              </div>
            )}
          </div>
        )}

        

        {/* Results */}
        {!loading && (
          <>
            {/* Recipe Results */}
            {activeTab === "recipes" && (
              <div className="search-results-recipe-grid">
                {recipeResults.length > 0 ? (
                  recipeResults.map((recipe) => (
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
                      onSetCreatingNewCollection={(recipeId, value) => setCreatingNewCollection({ 
                        ...creatingNewCollection, 
                        [recipeId]: value 
                      })}
                      onSetNewCollectionTitle={(recipeId, value) => setNewCollectionTitle({ 
                        ...newCollectionTitle, 
                        [recipeId]: value 
                      })}
                      onUpdate={() => {
                        openUpdateRecipePopup(recipe, () => {
                          setChanged(!changed);
                          performSearch(searchQuery);
                        });
                      }}
                      onDelete={handleDelete}
                      onNavigate={navigate}
                      disabledButton={!uid}
                    />
                  ))
                ) : (
                  <p className="search-results-no-results">No recipes found</p>
                )}
              </div>
            )}

            {/* Collection Results */}
            {activeTab === "collections" && (
              <div className="search-results-collections-list">
                {collectionResults.length > 0 ? (
                  collectionResults.map((collection) => (
                    <div
                      key={collection._id}
                      className="search-results-collection-card"
                      onClick={() => navigate(`/collections/${collection._id}`)}
                    >
                      <h3>{collection.title}</h3>
                      {collection.description && (
                        <p className="search-results-collection-description">{collection.description}</p>
                      )}
                      <div className="search-results-collection-meta">
                        <span>{collection.recipes?.length || 0} recipes</span>
                        {collection.authorName && (
                          <span>By {collection.authorName}</span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="search-results-no-results">No collections found</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}