'use client';

import { useEffect, useState } from 'react';
import { api, User } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const DIETARY_OPTIONS = [
  { id: 'vegetarian', label: '🥬 Vegetarian', desc: 'No meat or fish' },
  { id: 'vegan', label: '🌱 Vegan', desc: 'No animal products' },
  { id: 'keto', label: '🥑 Keto', desc: 'Low carb, high fat' },
  { id: 'paleo', label: '🦴 Paleo', desc: 'Whole foods only' },
  { id: 'gluten-free', label: '🌾 Gluten-Free', desc: 'No wheat/gluten' },
  { id: 'dairy-free', label: '🥛 Dairy-Free', desc: 'No milk products' },
  { id: 'low-sodium', label: '🧂 Low Sodium', desc: 'Reduced salt' },
  { id: 'halal', label: '☪️ Halal', desc: 'Islamic dietary law' },
  { id: 'kosher', label: '✡️ Kosher', desc: 'Jewish dietary law' },
];

const COMMON_ALLERGIES = [
  { id: 'peanuts', label: '🥜 Peanuts' },
  { id: 'tree-nuts', label: '🌰 Tree Nuts' },
  { id: 'milk', label: '🥛 Milk/Dairy' },
  { id: 'eggs', label: '🥚 Eggs' },
  { id: 'wheat', label: '🌾 Wheat' },
  { id: 'soy', label: '🫘 Soy' },
  { id: 'fish', label: '🐟 Fish' },
  { id: 'shellfish', label: '🦐 Shellfish' },
  { id: 'sesame', label: '🫘 Sesame' },
];

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
];

function ProfilePageContent() {
  const { user: currentUser, logout } = useUser();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [timezone, setTimezone] = useState('');
  const [selectedDiets, setSelectedDiets] = useState<string[]>([]);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [customAllergy, setCustomAllergy] = useState('');
  const [reminderDays, setReminderDays] = useState(3);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyPush, setNotifyPush] = useState(true);
  const [notifyExpiring, setNotifyExpiring] = useState(true);
  const [notifyLowStock, setNotifyLowStock] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadUser();
    }
  }, [currentUser]);

  const loadUser = async () => {
    if (!currentUser) return;
    try {
      const userData = await api.getUser(currentUser.userId);
      setUser(userData);
      
      // Populate form
      setName(userData.name || '');
      setEmail(userData.email);
      setTimezone(userData.timezone || '');
      setSelectedDiets(userData.dietaryTags?.split(',').filter(Boolean) || []);
      setSelectedAllergies(userData.allergies?.split(',').filter(Boolean) || []);
      setReminderDays(userData.reminderWindowDays || 3);
      setNotifyEmail(userData.notifyEmail ?? true);
      setNotifyPush(userData.notifyPush ?? true);
      setNotifyExpiring(userData.notifyExpiring ?? true);
      setNotifyLowStock(userData.notifyLowStock ?? true);
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDiet = (dietId: string) => {
    setSelectedDiets(prev => 
      prev.includes(dietId) 
        ? prev.filter(d => d !== dietId)
        : [...prev, dietId]
    );
  };

  const toggleAllergy = (allergyId: string) => {
    setSelectedAllergies(prev => 
      prev.includes(allergyId) 
        ? prev.filter(a => a !== allergyId)
        : [...prev, allergyId]
    );
  };

  const addCustomAllergy = () => {
    if (customAllergy.trim() && !selectedAllergies.includes(customAllergy.trim().toLowerCase())) {
      setSelectedAllergies([...selectedAllergies, customAllergy.trim().toLowerCase()]);
      setCustomAllergy('');
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    setMessage(null);
    
    try {
      if (!currentUser) return;
      await api.updateUser(currentUser.userId, {
        name: name || undefined,
        timezone: timezone || undefined,
        dietaryTags: selectedDiets.join(',') || undefined,
        allergies: selectedAllergies.join(',') || undefined,
        reminderWindowDays: reminderDays,
        notifyEmail,
        notifyPush,
        notifyExpiring,
        notifyLowStock,
      });
      
      setMessage({ type: 'success', text: 'Profile saved successfully!' });
      
      // Auto-hide message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Failed to save profile:', error);
      setMessage({ type: 'error', text: 'Failed to save profile. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-content pt-6">
        <div className="skeleton h-8 w-48 mb-4" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-20 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="page-header">
        <h1 className="page-title">Profile 👤</h1>
        <p className="page-subtitle">Manage your preferences</p>
      </header>

      <div className="page-content space-y-6">
        {/* Success/Error Message */}
        {message && (
          <div 
            className={`card ${message.type === 'success' ? 'tag-success' : 'tag-danger'}`}
            style={{ 
              background: message.type === 'success' ? 'rgba(129, 178, 154, 0.15)' : 'rgba(231, 111, 81, 0.15)',
              borderColor: message.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)'
            }}
          >
            <div className="flex items-center gap-2">
              <span>{message.type === 'success' ? '✅' : '❌'}</span>
              <span>{message.text}</span>
            </div>
          </div>
        )}

        {/* Basic Info */}
        <section className="card">
          <h2 className="font-semibold text-lg mb-4">📋 Basic Info</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <input
                type="text"
                className="input"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                className="input"
                value={email}
                disabled
                style={{ opacity: 0.6 }}
              />
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                Email cannot be changed
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Timezone</label>
              <select
                className="input"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              >
                <option value="">Select timezone...</option>
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Dietary Preferences */}
        <section className="card">
          <h2 className="font-semibold text-lg mb-2">🥗 Dietary Preferences</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
            Select all that apply. Meal suggestions will respect these.
          </p>
          
          <div className="grid grid-cols-2 gap-2">
            {DIETARY_OPTIONS.map((diet) => (
              <button
                key={diet.id}
                type="button"
                onClick={() => toggleDiet(diet.id)}
                className={`p-3 rounded-xl text-left transition-all ${
                  selectedDiets.includes(diet.id)
                    ? 'ring-2 ring-[var(--color-primary)]'
                    : ''
                }`}
                style={{ 
                  background: selectedDiets.includes(diet.id) 
                    ? 'rgba(224, 122, 95, 0.1)' 
                    : 'var(--color-bg-muted)' 
                }}
              >
                <div className="font-medium text-sm">{diet.label}</div>
                <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {diet.desc}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Allergies */}
        <section className="card">
          <h2 className="font-semibold text-lg mb-2">⚠️ Allergies</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
            Select foods you're allergic to. These will be excluded from suggestions.
          </p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {COMMON_ALLERGIES.map((allergy) => (
              <button
                key={allergy.id}
                type="button"
                onClick={() => toggleAllergy(allergy.id)}
                className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedAllergies.includes(allergy.id)
                    ? 'ring-2 ring-[var(--color-danger)]'
                    : ''
                }`}
                style={{ 
                  background: selectedAllergies.includes(allergy.id) 
                    ? 'rgba(231, 111, 81, 0.15)' 
                    : 'var(--color-bg-muted)',
                  color: selectedAllergies.includes(allergy.id)
                    ? 'var(--color-danger)'
                    : 'var(--color-text)'
                }}
              >
                {allergy.label}
              </button>
            ))}
          </div>

          {/* Custom allergies */}
          {selectedAllergies.filter(a => !COMMON_ALLERGIES.find(ca => ca.id === a)).length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedAllergies
                .filter(a => !COMMON_ALLERGIES.find(ca => ca.id === a))
                .map((allergy) => (
                  <span
                    key={allergy}
                    className="px-3 py-1 rounded-full text-sm flex items-center gap-1"
                    style={{ background: 'rgba(231, 111, 81, 0.15)', color: 'var(--color-danger)' }}
                  >
                    {allergy}
                    <button onClick={() => toggleAllergy(allergy)}>✕</button>
                  </span>
                ))}
            </div>
          )}
          
          <div className="flex gap-2">
            <input
              type="text"
              className="input flex-1"
              placeholder="Add other allergy..."
              value={customAllergy}
              onChange={(e) => setCustomAllergy(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomAllergy())}
            />
            <button 
              type="button"
              className="btn btn-secondary"
              onClick={addCustomAllergy}
            >
              Add
            </button>
          </div>
        </section>

        {/* Notification Settings */}
        <section className="card">
          <h2 className="font-semibold text-lg mb-4">🔔 Notifications</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Reminder Days Before Expiration
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="14"
                  value={reminderDays}
                  onChange={(e) => setReminderDays(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="font-semibold w-16 text-center">
                  {reminderDays} day{reminderDays !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--color-bg-muted)' }}>
                <div>
                  <div className="font-medium">📧 Email Notifications</div>
                  <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    Receive reminders via email
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.checked)}
                  className="w-5 h-5 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--color-bg-muted)' }}>
                <div>
                  <div className="font-medium">📱 Push Notifications</div>
                  <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    Get alerts on your device
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifyPush}
                  onChange={(e) => setNotifyPush(e.target.checked)}
                  className="w-5 h-5 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--color-bg-muted)' }}>
                <div>
                  <div className="font-medium">⏰ Expiring Items</div>
                  <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    Alert when items are about to expire
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifyExpiring}
                  onChange={(e) => setNotifyExpiring(e.target.checked)}
                  className="w-5 h-5 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--color-bg-muted)' }}>
                <div>
                  <div className="font-medium">📉 Low Stock</div>
                  <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    Alert when items are running low
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifyLowStock}
                  onChange={(e) => setNotifyLowStock(e.target.checked)}
                  className="w-5 h-5 rounded"
                />
              </label>
            </div>
          </div>
        </section>

        {/* Save Button */}
        <button 
          className="btn btn-primary w-full"
          onClick={saveProfile}
          disabled={saving}
        >
          {saving ? 'Saving...' : '💾 Save Profile'}
        </button>

        {/* Logout */}
        <section className="mt-6">
          <button
            onClick={logout}
            className="btn btn-secondary w-full"
            style={{ background: 'rgba(231, 111, 81, 0.1)', color: 'var(--color-danger)' }}
          >
            🚪 Sign Out
          </button>
        </section>

        {/* App Info */}
        <section className="text-center py-4" style={{ color: 'var(--color-text-muted)' }}>
          <p className="text-sm">SmartPantry v1.0.0</p>
          <p className="text-xs mt-1">Made with ❤️ for reducing food waste</p>
        </section>
      </div>
    </>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfilePageContent />
    </ProtectedRoute>
  );
}


