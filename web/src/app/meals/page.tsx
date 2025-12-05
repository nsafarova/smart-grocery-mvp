'use client';

import { useEffect, useState } from 'react';
import { api, MealSuggestion, MealIdea, Ingredient } from '@/lib/api';
import Modal from '@/components/Modal';
import { useUser } from '@/contexts/UserContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';

function MealsPageContent() {
  const { user } = useUser();
  const [suggestions, setSuggestions] = useState<MealSuggestion[]>([]);
  const [savedMeals, setSavedMeals] = useState<MealIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState('');
  const [activeTab, setActiveTab] = useState<'ideas' | 'saved'>('ideas');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [mealToSave, setMealToSave] = useState<MealSuggestion | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<MealSuggestion | null>(null);
  const [recipeMultiplier, setRecipeMultiplier] = useState(1);

  useEffect(() => {
    if (user) {
      loadSavedMeals();
    }
  }, [user]);

  const loadSavedMeals = async () => {
    if (!user) return;
    try {
      const meals = await api.getSavedMeals(user.userId);
      setSavedMeals(meals);
    } catch (error) {
      console.error('Failed to load saved meals:', error);
    }
  };

  const getSuggestions = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await api.getMealSuggestions(user.userId, preferences || undefined);
      setSuggestions(result.suggestions);
    } catch (error) {
      console.error('Failed to get suggestions:', error);
      alert('Failed to get meal suggestions');
    } finally {
      setLoading(false);
    }
  };

  const openSaveModal = (meal: MealSuggestion) => {
    setMealToSave(meal);
    setShowSaveModal(true);
  };

  const openDetailModal = (meal: MealSuggestion) => {
    setSelectedMeal(meal);
    setRecipeMultiplier(1);
    setShowDetailModal(true);
  };

  const parseAmount = (amount: string): number => {
    if (!amount) return 0;
    // Handle fractions like "1/2", "1/4", "3/4"
    if (amount.includes('/')) {
      const parts = amount.split('/');
      if (parts.length === 2) {
        return parseFloat(parts[0]) / parseFloat(parts[1]);
      }
    }
    return parseFloat(amount) || 0;
  };

  const formatAmount = (amount: number): string => {
    // Check if it's a whole number
    if (amount % 1 === 0) {
      return amount.toString();
    }
    // Check for common fractions
    const tolerance = 0.01;
    if (Math.abs(amount - 0.25) < tolerance) return '1/4';
    if (Math.abs(amount - 0.33) < tolerance) return '1/3';
    if (Math.abs(amount - 0.5) < tolerance) return '1/2';
    if (Math.abs(amount - 0.67) < tolerance) return '2/3';
    if (Math.abs(amount - 0.75) < tolerance) return '3/4';
    // Otherwise return decimal
    return amount.toFixed(2).replace(/\.?0+$/, '');
  };

  const scaleIngredient = (ingredient: string | Ingredient, multiplier: number): string => {
    if (typeof ingredient === 'string') {
      return ingredient;
    }
    
    if (!ingredient.amount) {
      return ingredient.name;
    }
    
    const originalAmount = parseAmount(ingredient.amount);
    const scaledAmount = originalAmount * multiplier;
    const formattedAmount = formatAmount(scaledAmount);
    
    return `${formattedAmount} ${ingredient.unit || ''} ${ingredient.name}`.trim();
  };

  const saveMeal = async () => {
    if (!mealToSave) return;
    
    try {
      if (!user) return;
      const saved = await api.saveMealIdea({
        userId: user.userId,
        title: mealToSave.title,
        notes: `Ingredients: ${mealToSave.ingredients.join(', ')}\n\nInstructions: ${mealToSave.instructions}`,
      });
      setSavedMeals([saved, ...savedMeals]);
      setShowSaveModal(false);
      setMealToSave(null);
      alert('Meal saved!');
    } catch (error) {
      console.error('Failed to save meal:', error);
      alert('Failed to save meal');
    }
  };

  const deleteMeal = async (meal: MealIdea) => {
    if (!confirm(`Delete "${meal.title}"?`)) return;
    
    try {
      await api.deleteMealIdea(meal.mealIdeaId);
      setSavedMeals(savedMeals.filter(m => m.mealIdeaId !== meal.mealIdeaId));
    } catch (error) {
      console.error('Failed to delete meal:', error);
    }
  };

  return (
    <>
      <header className="page-header">
        <h1 className="page-title">Meal Ideas 🍳</h1>
        <p className="page-subtitle">Get inspired by what you have</p>
      </header>

      <div className="page-content">
        {/* Tab switcher */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('ideas')}
            className={`btn flex-1 ${activeTab === 'ideas' ? 'btn-primary' : 'btn-secondary'}`}
          >
            ✨ AI Ideas
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`btn flex-1 ${activeTab === 'saved' ? 'btn-primary' : 'btn-secondary'}`}
          >
            💾 Saved ({savedMeals.length})
          </button>
        </div>

        {activeTab === 'ideas' ? (
          <>
            {/* Search/preferences input */}
            <div className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  className="input flex-1"
                  placeholder="Any preferences? (quick, healthy, vegetarian...)"
                  value={preferences}
                  onChange={(e) => setPreferences(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && getSuggestions()}
                />
                <button 
                  className="btn btn-primary"
                  onClick={getSuggestions}
                  disabled={loading}
                >
                  {loading ? '...' : '✨'}
                </button>
              </div>
            </div>

            {/* Suggestions */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-40 rounded-2xl" />
                ))}
              </div>
            ) : suggestions.length === 0 ? (
              <div className="empty-state">
                <div className="icon">🍳</div>
                <p>Tap the button to get meal ideas<br />based on your pantry!</p>
                <button className="btn btn-primary mt-4" onClick={getSuggestions}>
                  ✨ Get Suggestions
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {suggestions.map((meal, idx) => (
                  <div key={idx} className="card">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-lg">{meal.title}</h3>
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => openSaveModal(meal)}
                      >
                        💾 Save
                      </button>
                    </div>

                    {/* Cook time and difficulty */}
                    {(meal.cookTime || meal.difficulty) && (
                      <div className="flex gap-3 mb-3">
                        {meal.cookTime && (
                          <span className="tag tag-success">⏱️ {meal.cookTime}</span>
                        )}
                        {meal.difficulty && (
                          <span className="tag" style={{ 
                            background: meal.difficulty === 'Easy' ? 'rgba(129, 178, 154, 0.15)' : 
                                       meal.difficulty === 'Medium' ? 'rgba(244, 162, 97, 0.15)' : 
                                       'rgba(231, 111, 81, 0.15)',
                            color: meal.difficulty === 'Easy' ? '#5A9B7A' : 
                                  meal.difficulty === 'Medium' ? '#D68A4E' : '#D15A3E'
                          }}>
                            {meal.difficulty === 'Easy' ? '🟢' : meal.difficulty === 'Medium' ? '🟡' : '🔴'} {meal.difficulty}
                          </span>
                        )}
                      </div>
                    )}
                    
                    <div className="mb-3">
                      <div className="text-sm font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>
                        Ingredients:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {meal.ingredients.map((ing, i) => {
                          const ingredient = typeof ing === 'string' 
                            ? { name: ing, amount: '', unit: '' }
                            : ing;
                          return (
                            <span 
                              key={i}
                              className="px-2 py-1 rounded-full text-xs"
                              style={{ background: 'var(--color-bg-muted)' }}
                            >
                              {ingredient.amount && ingredient.unit 
                                ? `${ingredient.amount} ${ingredient.unit} ${ingredient.name}`
                                : ingredient.name}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>
                        Instructions:
                      </div>
                      <p className="text-sm line-clamp-3">{meal.instructions}</p>
                      {meal.instructions && meal.instructions.length > 150 && (
                        <button
                          className="btn btn-sm btn-outline mt-2"
                          onClick={() => openDetailModal(meal)}
                        >
                          📖 Read More
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                <button 
                  className="btn btn-secondary w-full"
                  onClick={getSuggestions}
                >
                  🔄 Get More Ideas
                </button>
              </div>
            )}
          </>
        ) : (
          /* Saved meals */
          savedMeals.length === 0 ? (
            <div className="empty-state">
              <div className="icon">💾</div>
              <p>No saved meals yet</p>
              <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>
                Get AI suggestions and save your favorites!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedMeals.map((meal) => (
                <div key={meal.mealIdeaId} className="card">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold">{meal.title}</h3>
                      {meal.notes && (
                        <p className="text-sm mt-2 whitespace-pre-line" style={{ color: 'var(--color-text-muted)' }}>
                          {meal.notes}
                        </p>
                      )}
                    </div>
                    <button
                      className="text-lg opacity-50 hover:opacity-100 p-2 ml-2"
                      onClick={() => deleteMeal(meal)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Save Modal */}
      <Modal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        title="Save Meal"
      >
        {mealToSave && (
          <div className="space-y-4">
            <p>Save "{mealToSave.title}" to your collection?</p>
            <div className="flex gap-3">
              <button className="btn btn-secondary flex-1" onClick={() => setShowSaveModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary flex-1" onClick={saveMeal}>
                💾 Save Meal
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Detailed Recipe Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={selectedMeal?.title || 'Recipe Details'}
      >
        {selectedMeal && (
          <div className="space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Header Info */}
            <div className="flex flex-wrap gap-2">
              {selectedMeal.cookTime && (
                <span className="tag tag-success">⏱️ {selectedMeal.cookTime}</span>
              )}
              {selectedMeal.difficulty && (
                <span className="tag" style={{ 
                  background: selectedMeal.difficulty === 'Easy' ? 'rgba(129, 178, 154, 0.15)' : 
                             selectedMeal.difficulty === 'Medium' ? 'rgba(244, 162, 97, 0.15)' : 
                             'rgba(231, 111, 81, 0.15)',
                  color: selectedMeal.difficulty === 'Easy' ? '#5A9B7A' : 
                         selectedMeal.difficulty === 'Medium' ? '#D68A4E' : '#D15A3E'
                }}>
                  {selectedMeal.difficulty === 'Easy' ? '🟢' : selectedMeal.difficulty === 'Medium' ? '🟡' : '🔴'} {selectedMeal.difficulty}
                </span>
              )}
              {selectedMeal.servings && (
                <span className="tag" style={{ background: 'var(--color-bg-muted)' }}>
                  👥 {selectedMeal.servings}
                </span>
              )}
            </div>

            {/* Recipe Multiplier */}
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--color-bg-muted)' }}>
              <span className="text-sm font-medium">Servings:</span>
              <div className="flex gap-2">
                {[1, 2, 3].map((mult) => (
                  <button
                    key={mult}
                    onClick={() => setRecipeMultiplier(mult)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      recipeMultiplier === mult
                        ? 'btn btn-primary'
                        : 'btn btn-secondary'
                    }`}
                  >
                    {mult}x
                  </button>
                ))}
              </div>
              {selectedMeal.servings && (
                <span className="text-sm opacity-70 ml-auto">
                  {recipeMultiplier === 1 
                    ? selectedMeal.servings 
                    : `${recipeMultiplier}x ${selectedMeal.servings}`}
                </span>
              )}
            </div>

            {/* Ingredients */}
            <div>
              <h3 className="font-semibold text-lg mb-3">📋 Ingredients</h3>
              <div className="space-y-2">
                {selectedMeal.ingredients.map((ing, i) => {
                  const displayText = scaleIngredient(ing, recipeMultiplier);
                  return (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{displayText}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Detailed Steps */}
            {selectedMeal.detailedSteps && selectedMeal.detailedSteps.length > 0 ? (
              <div>
                <h3 className="font-semibold text-lg mb-3">👨‍🍳 Instructions</h3>
                <div className="space-y-3">
                  {selectedMeal.detailedSteps.map((step, i) => (
                    <div key={i} className="flex gap-3">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-semibold text-sm">
                        {i + 1}
                      </span>
                      <p className="flex-1 text-sm leading-relaxed">{step.replace(/^Step \d+:\s*/i, '')}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <h3 className="font-semibold text-lg mb-3">👨‍🍳 Instructions</h3>
                <p className="text-sm leading-relaxed whitespace-pre-line">{selectedMeal.instructions}</p>
              </div>
            )}

            {/* Tips */}
            {selectedMeal.tips && (
              <div className="p-4 rounded-2xl" style={{ background: 'rgba(129, 178, 154, 0.1)' }}>
                <h3 className="font-semibold mb-2">💡 Pro Tip</h3>
                <p className="text-sm">{selectedMeal.tips}</p>
              </div>
            )}

            {/* Nutrition Info */}
            {selectedMeal.nutrition && (
              <div>
                <h3 className="font-semibold text-lg mb-3">📊 Nutrition (per serving)</h3>
                <div className="grid grid-cols-2 gap-3">
                  {selectedMeal.nutrition.calories && (
                    <div className="p-3 rounded-xl" style={{ background: 'var(--color-bg-muted)' }}>
                      <div className="text-xs opacity-70">Calories</div>
                      <div className="font-semibold">{selectedMeal.nutrition.calories}</div>
                    </div>
                  )}
                  {selectedMeal.nutrition.protein && (
                    <div className="p-3 rounded-xl" style={{ background: 'var(--color-bg-muted)' }}>
                      <div className="text-xs opacity-70">Protein</div>
                      <div className="font-semibold">{selectedMeal.nutrition.protein}</div>
                    </div>
                  )}
                  {selectedMeal.nutrition.carbs && (
                    <div className="p-3 rounded-xl" style={{ background: 'var(--color-bg-muted)' }}>
                      <div className="text-xs opacity-70">Carbs</div>
                      <div className="font-semibold">{selectedMeal.nutrition.carbs}</div>
                    </div>
                  )}
                  {selectedMeal.nutrition.fat && (
                    <div className="p-3 rounded-xl" style={{ background: 'var(--color-bg-muted)' }}>
                      <div className="text-xs opacity-70">Fat</div>
                      <div className="font-semibold">{selectedMeal.nutrition.fat}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <button 
                className="btn btn-secondary flex-1" 
                onClick={() => setShowDetailModal(false)}
              >
                Close
              </button>
              <button 
                className="btn btn-primary flex-1" 
                onClick={() => {
                  setMealToSave(selectedMeal);
                  setShowDetailModal(false);
                  setShowSaveModal(true);
                }}
              >
                💾 Save Recipe
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

export default function MealsPage() {
  return (
    <ProtectedRoute>
      <MealsPageContent />
    </ProtectedRoute>
  );
}

