'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { api, PantryItem } from '@/lib/api';
import PantryItemCard from '@/components/PantryItemCard';
import Modal from '@/components/Modal';
import { useUser } from '@/contexts/UserContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const CATEGORIES = [
  'Produce', 'Dairy', 'Meat', 'Seafood', 'Grains', 
  'Canned Goods', 'Frozen', 'Beverages', 'Snacks', 'Condiments', 'Spices', 'Bakery'
];

function PantryPageContent() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const filter = searchParams.get('filter');
  
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>(filter || 'all');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    unit: '',
    category: '',
    expirationDate: '',
  });

  const loadItems = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      let data: PantryItem[];
      
      if (activeFilter === 'expiring') {
        const result = await api.getExpiringItems(user.userId, 7);
        data = result.items;
      } else if (activeFilter === 'low') {
        const result = await api.getLowStockItems(user.userId);
        data = result.items;
      } else {
        data = await api.getPantryItems(user.userId);
      }
      
      setItems(data);
    } catch (error) {
      console.error('Failed to load pantry items:', error);
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  useEffect(() => {
    if (filter) {
      setActiveFilter(filter);
    }
  }, [filter]);

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({ name: '', quantity: '', unit: '', category: '', expirationDate: '' });
    setShowModal(true);
  };

  const openEditModal = (item: PantryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      quantity: item.quantity?.toString() || '',
      unit: item.unit || '',
      category: item.category || '',
      expirationDate: item.expirationDate?.split('T')[0] || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      name: formData.name,
      quantity: formData.quantity ? parseFloat(formData.quantity) : undefined,
      unit: formData.unit || undefined,
      category: formData.category || undefined,
      expirationDate: formData.expirationDate || undefined,
    };

    try {
      if (editingItem) {
        await api.updatePantryItem(editingItem.pantryItemId, data);
      } else {
        if (!user) return;
        await api.createPantryItem({ ...data, userId: user.userId, name: data.name });
      }
      
      setShowModal(false);
      loadItems();
    } catch (error) {
      console.error('Failed to save item:', error);
      alert('Failed to save item');
    }
  };

  const handleDelete = async (item: PantryItem) => {
    if (!confirm(`Delete "${item.name}"?`)) return;
    
    try {
      await api.deletePantryItem(item.pantryItemId);
      loadItems();
    } catch (error) {
      console.error('Failed to delete item:', error);
      alert('Failed to delete item');
    }
  };

  return (
    <>
      <header className="page-header">
        <h1 className="page-title">Pantry 🥫</h1>
        <p className="page-subtitle">{items.length} items in stock</p>
      </header>

      <div className="page-content">
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2" style={{ marginLeft: '-20px', marginRight: '-20px', paddingLeft: '20px', paddingRight: '20px' }}>
          {[
            { key: 'all', label: 'All', icon: '📦' },
            { key: 'expiring', label: 'Expiring', icon: '⏰' },
            { key: 'low', label: 'Low Stock', icon: '📉' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`btn btn-sm whitespace-nowrap ${activeFilter === tab.key ? 'btn-primary' : 'btn-secondary'}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Items List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-24 rounded-2xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📦</div>
            <p>
              {activeFilter === 'expiring' ? 'No items expiring soon!' :
               activeFilter === 'low' ? 'All items well stocked!' :
               'Your pantry is empty'}
            </p>
            {activeFilter === 'all' && (
              <button className="btn btn-primary mt-4" onClick={openAddModal}>
                Add First Item
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <PantryItemCard 
                key={item.pantryItemId} 
                item={item} 
                onEdit={openEditModal}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button className="fab" onClick={openAddModal}>
        +
      </button>

      {/* Add/Edit Modal */}
      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        title={editingItem ? 'Edit Item' : 'Add Item'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Name *</label>
            <input
              type="text"
              className="input"
              placeholder="e.g., Milk, Eggs, Bread"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-2">Quantity</label>
              <input
                type="number"
                className="input"
                placeholder="e.g., 2"
                step="0.1"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Unit</label>
              <input
                type="text"
                className="input"
                placeholder="e.g., lbs, pcs"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <select
              className="input"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="">Select category...</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Expiration Date</label>
            <input
              type="date"
              className="input"
              value={formData.expirationDate}
              onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" className="btn btn-secondary flex-1" onClick={() => setShowModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary flex-1">
              {editingItem ? 'Update' : 'Add Item'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export default function PantryPage() {
  return (
    <ProtectedRoute>
      <PantryPageContent />
    </ProtectedRoute>
  );
}


