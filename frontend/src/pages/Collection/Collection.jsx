import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { getRecipeCollectionById } from "../../services/RecipeCollectionServices";
export default function Collection() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recipesToShow, setRecipesToShow] = useState(10);
  

  useEffect(() => {
    async function fetchCollection() {
      try {
        setLoading(true);
        const data = await getRecipeCollectionById(id);
        setCollection(data);
        console.log(data);
      } catch (err) {
        toast.error(`Failed to load collection: ${err?.message || err}`);
      } finally {
        setLoading(false);
      }
    }
    fetchCollection();
  }, [id]);

  const handleRecipeClick = (recipeId) => {
    navigate(`/recipe/${recipeId}`);
  };

  const handleShowMore = () => {
    setRecipesToShow(prev => prev + 10);
  };

  if (loading) {
    return null;
  }

  if (!collection) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ fontSize: '18px', color: '#666' }}>Collection not found</p>
      </div>
    );
  }

  const recipes = collection.recipes || [];
  const displayedRecipes = recipes.slice(0, recipesToShow);
  const hasMore = recipesToShow < recipes.length;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Collection Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '10px' }}>
          {collection.title}
        </h1>
        {collection.description && (
          <p style={{ fontSize: '16px', color: '#666', marginBottom: '10px' }}>
            {collection.description}
          </p>
        )}
        <p style={{ fontSize: '14px', color: '#999' }}>
          {recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'}
        </p>
        <p>Author: {collection.authorName}</p>
      </div>

      {/* Recipes Grid */}
      {recipes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ fontSize: '18px', color: '#999' }}>No recipes in this collection yet</p>
        </div>
      ) : (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            {displayedRecipes.map((recipe) => (
              <div
                key={recipe._id}
                onClick={() => handleRecipeClick(recipe._id)}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  background: 'white'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Recipe Image */}
                <div style={{
                  width: '100%',
                  height: '200px',
                  background: recipe.image ? `url(${recipe.image})` : '#f0f0f0',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}>
                  {!recipe.image && (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#999',
                      fontSize: '48px'
                    }}>
                      🍽️
                    </div>
                  )}
                </div>

                {/* Recipe Info */}
                <div style={{ padding: '15px' }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    marginBottom: '10px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {recipe.title}
                  </h3>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '14px', color: '#666' }}>
                    {recipe.cuisine && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        🌍 {recipe.cuisine}
                      </span>
                    )}
                    {recipe.timePrepared > 0 && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        ⏱️ {recipe.timePrepared}m
                      </span>
                    )}
                    {recipe.difficulty > 0 && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        📊 {recipe.difficulty}/5
                      </span>
                    )}
                  </div>

                  {recipe.rating > 0 && (
                    <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ color: '#ffc107', fontSize: '16px' }}>⭐</span>
                      <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{recipe.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Show More Button */}
          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button
                onClick={handleShowMore}
                style={{
                  padding: '12px 30px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  background: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#45a049'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#4CAF50'}
              >
                Show More ({recipes.length - recipesToShow} remaining)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}