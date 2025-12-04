'use client';

import { useEffect, useState } from 'react';
import { api, MealSuggestion, MealIdea } from '@/lib/api';
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
                        {meal.ingredients.map((ing, i) => (
                          <span 
                            key={i}
                            className="px-2 py-1 rounded-full text-xs"
                            style={{ background: 'var(--color-bg-muted)' }}
                          >
                            {ing}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>
                        Instructions:
                      </div>
                      <p className="text-sm">{meal.instructions}</p>
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

