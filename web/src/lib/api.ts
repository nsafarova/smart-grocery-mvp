const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface User {
  userId: number;
  email: string;
  name: string | null;
  timezone: string | null;
  dietaryTags: string | null;
  allergies: string | null;
  reminderWindowDays: number | null;
  notifyEmail: boolean | null;
  notifyPush: boolean | null;
  notifyExpiring: boolean | null;
  notifyLowStock: boolean | null;
  createdAt: string;
  updatedAt: string;
}

export interface PantryItem {
  pantryItemId: number;
  userId: number;
  name: string;
  quantity: number | null;
  unit: string | null;
  category: string | null;
  expirationDate: string | null;
  source: string | null;
  createdAt: string;
  updatedAt: string;
  isExpiringSoon?: boolean;
  isLowStock?: boolean;
  daysUntilExpiry?: number | null;
}

export interface GroceryList {
  groceryListId: number;
  userId: number;
  title: string;
  status: string | null;
  createdAt: string;
  items: GroceryListItem[];
}

export interface GroceryListItem {
  groceryListItemId: number;
  groceryListId: number;
  pantryItemId: number | null;
  name: string;
  quantity: number | null;
  unit: string | null;
  category: string | null;
  note: string | null;
  isChecked: boolean | null;
  createdAt: string;
}

export interface MealIdea {
  mealIdeaId: number;
  userId: number;
  title: string;
  notes: string | null;
  createdAt: string;
}

export interface MealSuggestion {
  title: string;
  ingredients: string[];
  instructions: string;
  cookTime?: string;
  difficulty?: string;
  servings?: string;
  detailedSteps?: string[];
  tips?: string;
  nutrition?: {
    calories?: string;
    protein?: string;
    carbs?: string;
    fat?: string;
  };
}

export interface Notification {
  notificationId: number;
  pantryItemId: number;
  scheduledFor: string | null;
  sentAt: string | null;
  status: string | null;
  pantryItemName?: string;
  expirationDate?: string | null;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: { message: string };
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('API Request:', url, options);
  }
  
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    // Check if response is ok before parsing JSON
    if (!res.ok) {
      const errorText = await res.text();
      console.error('API Error Response:', res.status, errorText);
      throw new Error(`API request failed: ${res.status} ${res.statusText}`);
    }

    const json = await res.json() as ApiResponse<T>;
    
    if (!json.success) {
      throw new Error(json.error?.message || 'API request failed');
    }

    return json.data;
  } catch (error: any) {
    // Enhanced error logging
    console.error('Fetch API Error:', {
      url,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

// Users
export const api = {
  // Users
  getUsers: () => fetchApi<User[]>('/api/users'),
  getUser: (id: number) => fetchApi<User>(`/api/users/${id}`),
  login: (email: string) => 
    fetchApi<{ userId: number; email: string; name: string | null; timezone: string | null; dietaryTags: string | null; allergies: string | null }>('/api/users/login', { 
      method: 'POST', 
      body: JSON.stringify({ email }) 
    }),
  createUser: (data: Partial<User>) => 
    fetchApi<User>('/api/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id: number, data: Partial<User>) => 
    fetchApi<User>(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Pantry
  getPantryItems: (userId: number) => 
    fetchApi<PantryItem[]>(`/api/pantry?userId=${userId}`),
  getExpiringItems: (userId: number, days = 7) => 
    fetchApi<{ items: PantryItem[]; count: number }>(`/api/pantry/expiring?userId=${userId}&days=${days}`),
  getLowStockItems: (userId: number) => 
    fetchApi<{ items: PantryItem[]; count: number }>(`/api/pantry/low-stock?userId=${userId}`),
  getCategories: (userId: number) => 
    fetchApi<string[]>(`/api/pantry/categories?userId=${userId}`),
  createPantryItem: (data: Partial<PantryItem> & { userId: number; name: string }) => 
    fetchApi<PantryItem>('/api/pantry', { method: 'POST', body: JSON.stringify(data) }),
  updatePantryItem: (id: number, data: Partial<PantryItem>) => 
    fetchApi<PantryItem>(`/api/pantry/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePantryItem: (id: number) => 
    fetchApi<void>(`/api/pantry/${id}`, { method: 'DELETE' }),

  // Grocery Lists
  getGroceryLists: (userId: number) => 
    fetchApi<GroceryList[]>(`/api/grocery-lists?userId=${userId}`),
  getGroceryList: (id: number) => 
    fetchApi<GroceryList>(`/api/grocery-lists/${id}`),
  createGroceryList: (data: { userId: number; title: string; status?: string }) => 
    fetchApi<GroceryList>('/api/grocery-lists', { method: 'POST', body: JSON.stringify(data) }),
  updateGroceryList: (id: number, data: Partial<GroceryList>) => 
    fetchApi<GroceryList>(`/api/grocery-lists/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteGroceryList: (id: number) => 
    fetchApi<void>(`/api/grocery-lists/${id}`, { method: 'DELETE' }),
  addGroceryItem: (listId: number, data: Partial<GroceryListItem> & { name: string }) => 
    fetchApi<GroceryListItem>(`/api/grocery-lists/${listId}/items`, { method: 'POST', body: JSON.stringify(data) }),
  updateGroceryItem: (listId: number, itemId: number, data: Partial<GroceryListItem>) => 
    fetchApi<GroceryListItem>(`/api/grocery-lists/${listId}/items/${itemId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteGroceryItem: (listId: number, itemId: number) => 
    fetchApi<void>(`/api/grocery-lists/${listId}/items/${itemId}`, { method: 'DELETE' }),
  addExpiringToList: (listId: number, userId: number, days = 7) => 
    fetchApi<{ message: string }>(`/api/grocery-lists/${listId}/add-expiring?userId=${userId}&days=${days}`, { method: 'POST' }),
  addLowStockToList: (listId: number, userId: number) => 
    fetchApi<{ message: string }>(`/api/grocery-lists/${listId}/add-low-stock?userId=${userId}`, { method: 'POST' }),

  // Meals
  getMealSuggestions: (userId: number, additionalPreferences?: string) => 
    fetchApi<{ suggestions: MealSuggestion[] }>('/api/meals/suggest', { 
      method: 'POST', 
      body: JSON.stringify({ userId, additionalPreferences }) 
    }),
  getSavedMeals: (userId: number) => 
    fetchApi<MealIdea[]>(`/api/meals?userId=${userId}`),
  saveMealIdea: (data: { userId: number; title: string; notes?: string }) => 
    fetchApi<MealIdea>('/api/meals', { method: 'POST', body: JSON.stringify(data) }),
  deleteMealIdea: (id: number) => 
    fetchApi<void>(`/api/meals/${id}`, { method: 'DELETE' }),

  // Notifications
  getNotifications: (userId: number) => 
    fetchApi<Notification[]>(`/api/notifications?userId=${userId}`),
  getPendingNotifications: (userId: number) => 
    fetchApi<Notification[]>(`/api/notifications/pending?userId=${userId}`),
  markNotificationSent: (id: number) => 
    fetchApi<Notification>(`/api/notifications/${id}/mark-sent`, { method: 'PUT' }),
  cancelNotification: (id: number) => 
    fetchApi<Notification>(`/api/notifications/${id}/cancel`, { method: 'PUT' }),
  autoScheduleNotifications: (userId: number) => 
    fetchApi<{ message: string }>('/api/notifications/auto-schedule', { 
      method: 'POST', 
      body: JSON.stringify({ userId }) 
    }),
};

