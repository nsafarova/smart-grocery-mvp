'use client';

import { useEffect, useState } from 'react';
import { api, MealIdea, MealSuggestion } from '@/lib/api';
import Modal from '@/components/Modal';
import { useUser } from '@/contexts/UserContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useRouter } from 'next/navigation';

interface WeeklyPlan {
  [day: string]: MealIdea | null;
}

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Monday', short: 'Mon' },
  { key: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { key: 'thursday', label: 'Thursday', short: 'Thu' },
  { key: 'friday', label: 'Friday', short: 'Fri' },
  { key: 'saturday', label: 'Saturday', short: 'Sat' },
  { key: 'sunday', label: 'Sunday', short: 'Sun' },
];

function MealPlanPageContent() {
  const { user } = useUser();
  const router = useRouter();
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan>({});
  const [savedMeals, setSavedMeals] = useState<MealIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMealSelector, setShowMealSelector] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadSavedMeals();
      loadWeeklyPlan();
    }
  }, [user]);

  const loadSavedMeals = async () => {
    if (!user) return;
    try {
      const meals = await api.getSavedMeals(user.userId);
      setSavedMeals(meals);
    } catch (error) {
      console.error('Failed to load saved meals:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWeeklyPlan = () => {
    if (!user) return;
    try {
      const stored = localStorage.getItem(`weeklyPlan_${user.userId}`);
      if (stored) {
        setWeeklyPlan(JSON.parse(stored));
      } else {
        // Initialize empty plan
        const emptyPlan: WeeklyPlan = {};
        DAYS_OF_WEEK.forEach(day => {
          emptyPlan[day.key] = null;
        });
        setWeeklyPlan(emptyPlan);
      }
    } catch (error) {
      console.error('Failed to load weekly plan:', error);
    }
  };

  const saveWeeklyPlan = (plan: WeeklyPlan) => {
    if (!user) return;
    try {
      localStorage.setItem(`weeklyPlan_${user.userId}`, JSON.stringify(plan));
      setWeeklyPlan(plan);
    } catch (error) {
      console.error('Failed to save weekly plan:', error);
    }
  };

  const assignMealToDay = (day: string, meal: MealIdea | null) => {
    const newPlan = { ...weeklyPlan, [day]: meal };
    saveWeeklyPlan(newPlan);
    setShowMealSelector(false);
    setSelectedDay(null);
  };

  const openMealSelector = (day: string) => {
    setSelectedDay(day);
    setShowMealSelector(true);
  };

  const clearDay = (day: string) => {
    assignMealToDay(day, null);
  };

  const clearAll = () => {
    if (!confirm('Clear entire weekly plan?')) return;
    const emptyPlan: WeeklyPlan = {};
    DAYS_OF_WEEK.forEach(day => {
      emptyPlan[day.key] = null;
    });
    saveWeeklyPlan(emptyPlan);
  };

  const getCurrentWeekDates = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    
    return DAYS_OF_WEEK.map((day, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return {
        ...day,
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      };
    });
  };

  const weekDates = getCurrentWeekDates();

  return (
    <>
      <header className="page-header">
        <div className="flex items-center justify-between mb-2">
          <h1 className="page-title">Weekly Meal Plan 📅</h1>
          <button
            onClick={() => router.push('/meals')}
            className="btn btn-sm btn-secondary"
          >
            + Add Meals
          </button>
        </div>
        <p className="page-subtitle">Plan your week with saved meal ideas</p>
      </header>

      <div className="page-content">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="skeleton h-24 rounded-2xl" />
            ))}
          </div>
        ) : savedMeals.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📅</div>
            <p>No saved meals yet</p>
            <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>
              Save meal ideas first, then come back to plan your week!
            </p>
            <button 
              className="btn btn-primary mt-4" 
              onClick={() => router.push('/meals')}
            >
              Go to Meal Ideas
            </button>
          </div>
        ) : (
          <>
            {/* Week Overview */}
            <div className="mb-4 p-3 rounded-xl" style={{ background: 'var(--color-bg-muted)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">This Week</div>
                  <div className="text-xs opacity-70">
                    {weekDates[0].date} - {weekDates[6].date}
                  </div>
                </div>
                <button
                  onClick={clearAll}
                  className="btn btn-sm btn-outline"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Weekly Calendar */}
            <div className="space-y-3">
              {weekDates.map((dayInfo) => {
                const meal = weeklyPlan[dayInfo.key];
                return (
                  <div
                    key={dayInfo.key}
                    className="card"
                    onClick={() => openMealSelector(dayInfo.key)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <div className="text-xs font-medium opacity-70 uppercase">
                          {dayInfo.short}
                        </div>
                        <div className="text-sm font-semibold mt-1">
                          {dayInfo.date}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        {meal ? (
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h3 className="font-semibold">{meal.title}</h3>
                              {meal.notes && (
                                <p className="text-xs mt-1 line-clamp-2 opacity-70">
                                  {meal.notes.split('\n')[0]}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                clearDay(dayInfo.key);
                              }}
                              className="text-lg opacity-50 hover:opacity-100 p-1"
                              title="Remove meal"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-sm opacity-50">
                            <span>+</span>
                            <span>Tap to add a meal</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Stats */}
            <div className="mt-6 p-4 rounded-xl" style={{ background: 'var(--color-bg-muted)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Meals Planned</div>
                  <div className="text-2xl font-bold mt-1">
                    {Object.values(weeklyPlan).filter(m => m !== null).length} / 7
                  </div>
                </div>
                <div className="text-4xl">🍽️</div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Meal Selector Modal */}
      <Modal
        isOpen={showMealSelector}
        onClose={() => {
          setShowMealSelector(false);
          setSelectedDay(null);
        }}
        title={`Select Meal for ${selectedDay ? DAYS_OF_WEEK.find(d => d.key === selectedDay)?.label : ''}`}
      >
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {savedMeals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm opacity-70 mb-4">No saved meals yet</p>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setShowMealSelector(false);
                  router.push('/meals');
                }}
              >
                Go to Meal Ideas
              </button>
            </div>
          ) : (
            <>
              {savedMeals.map((meal) => {
                const isSelected = selectedDay && weeklyPlan[selectedDay]?.mealIdeaId === meal.mealIdeaId;
                return (
                  <div
                    key={meal.mealIdeaId}
                    className={`p-3 rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? 'border-2'
                        : 'border border-transparent hover:border-primary/30'
                    }`}
                    style={{
                      background: isSelected ? 'rgba(224, 122, 95, 0.1)' : 'var(--color-bg-muted)',
                      borderColor: isSelected ? 'var(--color-primary)' : 'transparent'
                    }}
                    onClick={() => selectedDay && assignMealToDay(selectedDay, meal)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{meal.title}</h3>
                        {meal.notes && (
                          <p className="text-xs mt-1 line-clamp-2 opacity-70">
                            {meal.notes.split('\n')[0]}
                          </p>
                        )}
                      </div>
                      {isSelected && (
                        <span className="text-primary ml-2">✓</span>
                      )}
                    </div>
                  </div>
                );
              })}
              {selectedDay && (
                <button
                  className="btn btn-secondary w-full mt-4"
                  onClick={() => selectedDay && assignMealToDay(selectedDay, null)}
                >
                  Clear Day
                </button>
              )}
            </>
          )}
        </div>
      </Modal>
    </>
  );
}

export default function MealPlanPage() {
  return (
    <ProtectedRoute>
      <MealPlanPageContent />
    </ProtectedRoute>
  );
}

