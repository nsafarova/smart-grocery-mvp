'use client';

import { useEffect, useState } from 'react';
import { api, GroceryList, GroceryListItem } from '@/lib/api';
import Modal from '@/components/Modal';
import { useUser } from '@/contexts/UserContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';

function GroceryPageContent() {
  const { user } = useUser();
  const [lists, setLists] = useState<GroceryList[]>([]);
  const [activeList, setActiveList] = useState<GroceryList | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewListModal, setShowNewListModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('');

  useEffect(() => {
    if (user) {
      loadLists();
    }
  }, [user]);

  const loadLists = async () => {
    if (!user) return;
    try {
      const data = await api.getGroceryLists(user.userId);
      setLists(data);
      
      // Auto-select first active list
      const active = data.find(l => l.status === 'active');
      if (active) {
        const fullList = await api.getGroceryList(active.groceryListId);
        setActiveList(fullList);
      }
    } catch (error) {
      console.error('Failed to load lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectList = async (list: GroceryList) => {
    try {
      const fullList = await api.getGroceryList(list.groceryListId);
      setActiveList(fullList);
    } catch (error) {
      console.error('Failed to load list:', error);
    }
  };

  const createList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;

    try {
      const newList = await api.createGroceryList({ 
        userId: user!.userId, 
        title: newListTitle.trim() 
      });
      setNewListTitle('');
      setShowNewListModal(false);
      setLists([newList, ...lists]);
      setActiveList(newList);
    } catch (error) {
      console.error('Failed to create list:', error);
      alert('Failed to create list');
    }
  };

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeList || !newItemName.trim()) return;

    try {
      const newItem = await api.addGroceryItem(activeList.groceryListId, {
        name: newItemName.trim(),
        quantity: newItemQuantity ? parseFloat(newItemQuantity) : undefined,
        unit: newItemUnit || undefined,
      });
      
      setActiveList({
        ...activeList,
        items: [...activeList.items, newItem],
      });
      
      setNewItemName('');
      setNewItemQuantity('');
      setNewItemUnit('');
      setShowAddItemModal(false);
    } catch (error) {
      console.error('Failed to add item:', error);
      alert('Failed to add item');
    }
  };

  const toggleItem = async (item: GroceryListItem) => {
    if (!activeList) return;

    try {
      const updated = await api.updateGroceryItem(
        activeList.groceryListId,
        item.groceryListItemId,
        { isChecked: !item.isChecked }
      );
      
      setActiveList({
        ...activeList,
        items: activeList.items.map(i => 
          i.groceryListItemId === item.groceryListItemId ? updated : i
        ),
      });
    } catch (error) {
      console.error('Failed to toggle item:', error);
    }
  };

  const deleteItem = async (item: GroceryListItem) => {
    if (!activeList) return;

    try {
      await api.deleteGroceryItem(activeList.groceryListId, item.groceryListItemId);
      setActiveList({
        ...activeList,
        items: activeList.items.filter(i => i.groceryListItemId !== item.groceryListItemId),
      });
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const addExpiringItems = async () => {
    if (!activeList) return;
    
    try {
      if (!user) return;
      const result = await api.addExpiringToList(activeList.groceryListId, user.userId);
      alert(result.message);
      const updatedList = await api.getGroceryList(activeList.groceryListId);
      setActiveList(updatedList);
    } catch (error) {
      console.error('Failed to add expiring items:', error);
    }
  };

  const addLowStockItems = async () => {
    if (!activeList) return;
    
    try {
      if (!user) return;
      const result = await api.addLowStockToList(activeList.groceryListId, user.userId);
      alert(result.message);
      const updatedList = await api.getGroceryList(activeList.groceryListId);
      setActiveList(updatedList);
    } catch (error) {
      console.error('Failed to add low stock items:', error);
    }
  };

  const checkedCount = activeList?.items.filter(i => i.isChecked).length || 0;
  const totalCount = activeList?.items.length || 0;

  const formatListForSharing = (list: GroceryList): string => {
    const checkedItems = list.items.filter(i => i.isChecked);
    const uncheckedItems = list.items.filter(i => !i.isChecked);
    
    let text = `🛒 ${list.title}\n\n`;
    
    if (uncheckedItems.length > 0) {
      text += '📝 To Buy:\n';
      uncheckedItems.forEach((item, index) => {
        const qty = item.quantity ? `${item.quantity} ${item.unit || ''}`.trim() : '';
        const note = item.note ? ` (${item.note})` : '';
        text += `${index + 1}. ${item.name}${qty ? ` - ${qty}` : ''}${note}\n`;
      });
      text += '\n';
    }
    
    if (checkedItems.length > 0) {
      text += '✅ Already Got:\n';
      checkedItems.forEach((item, index) => {
        const qty = item.quantity ? `${item.quantity} ${item.unit || ''}`.trim() : '';
        const note = item.note ? ` (${item.note})` : '';
        text += `${index + 1}. ${item.name}${qty ? ` - ${qty}` : ''}${note}\n`;
      });
    }
    
    text += `\n---\nShared from SmartPantry`;
    return text;
  };

  const copyListToClipboard = async () => {
    if (!activeList) return;
    
    try {
      const text = formatListForSharing(activeList);
      await navigator.clipboard.writeText(text);
      
      // Show success feedback
      const button = document.querySelector('[data-copy-button]') as HTMLElement;
      if (button) {
        const originalText = button.textContent;
        button.textContent = '✓ Copied!';
        button.style.opacity = '1';
        setTimeout(() => {
          button.textContent = originalText;
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('Failed to copy list. Please try again.');
    }
  };

  const shareList = async () => {
    if (!activeList) return;
    
    const text = formatListForSharing(activeList);
    
    // Try Web Share API first (mobile-friendly)
    if (navigator.share) {
      try {
        await navigator.share({
          title: activeList.title,
          text: text,
        });
        return;
      } catch (error: any) {
        // User cancelled or share failed, fall back to copy
        if (error.name !== 'AbortError') {
          console.error('Share failed:', error);
        }
      }
    }
    
    // Fallback to copy
    await copyListToClipboard();
  };

  return (
    <>
      <header className="page-header">
        <div className="flex items-center justify-between mb-2">
          <h1 className="page-title">Grocery Lists 🛒</h1>
          {activeList && (
            <div className="flex gap-2">
              <button
                data-copy-button
                onClick={copyListToClipboard}
                className="btn btn-sm btn-secondary"
                title="Copy list"
                aria-label="Copy grocery list"
              >
                📋 Copy
              </button>
              <button
                onClick={shareList}
                className="btn btn-sm btn-secondary"
                title="Share list"
                aria-label="Share grocery list"
              >
                📤 Share
              </button>
            </div>
          )}
        </div>
        <p className="page-subtitle">
          {activeList ? `${checkedCount}/${totalCount} items checked` : `${lists.length} lists`}
        </p>
      </header>

      <div className="page-content">
        {/* List selector tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2" style={{ marginLeft: '-20px', marginRight: '-20px', paddingLeft: '20px', paddingRight: '20px' }}>
          {lists.map((list) => (
            <button
              key={list.groceryListId}
              onClick={() => selectList(list)}
              className={`btn btn-sm whitespace-nowrap ${
                activeList?.groceryListId === list.groceryListId ? 'btn-primary' : 'btn-secondary'
              }`}
            >
              {list.title}
              {list.status === 'active' && (
                <span className="ml-1 w-2 h-2 rounded-full bg-green-400 inline-block" />
              )}
            </button>
          ))}
          <button
            onClick={() => setShowNewListModal(true)}
            className="btn btn-sm btn-outline whitespace-nowrap"
          >
            + New
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-16 rounded-2xl" />
            ))}
          </div>
        ) : !activeList ? (
          <div className="empty-state">
            <div className="icon">📝</div>
            <p>No grocery lists yet</p>
            <button className="btn btn-primary mt-4" onClick={() => setShowNewListModal(true)}>
              Create Your First List
            </button>
          </div>
        ) : (
          <>
            {/* Quick add buttons */}
            <div className="flex gap-2 mb-4">
              <button 
                onClick={addExpiringItems}
                className="btn btn-sm btn-secondary flex-1"
              >
                ⏰ Add Expiring
              </button>
              <button 
                onClick={addLowStockItems}
                className="btn btn-sm btn-secondary flex-1"
              >
                📉 Add Low Stock
              </button>
            </div>

            {/* Items */}
            {activeList.items.length === 0 ? (
              <div className="empty-state">
                <div className="icon">🛒</div>
                <p>List is empty</p>
                <button 
                  className="btn btn-primary mt-4" 
                  onClick={() => setShowAddItemModal(true)}
                >
                  Add First Item
                </button>
              </div>
            ) : (
              <div className="card">
                {activeList.items.map((item) => (
                  <div 
                    key={item.groceryListItemId} 
                    className="list-item"
                  >
                    <div 
                      className={`checkbox ${item.isChecked ? 'checked' : ''}`}
                      onClick={() => toggleItem(item)}
                    >
                      {item.isChecked && '✓'}
                    </div>
                    <div className="flex-1" onClick={() => toggleItem(item)}>
                      <div className={`font-medium ${item.isChecked ? 'line-through opacity-50' : ''}`}>
                        {item.name}
                      </div>
                      {(item.quantity || item.note) && (
                        <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                          {item.quantity && `${item.quantity} ${item.unit || ''}`}
                          {item.quantity && item.note && ' • '}
                          {item.note}
                        </div>
                      )}
                    </div>
                    <button
                      className="text-lg opacity-50 hover:opacity-100 p-2"
                      onClick={() => deleteItem(item)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* FAB */}
      {activeList && (
        <button className="fab" onClick={() => setShowAddItemModal(true)}>
          +
        </button>
      )}

      {/* New List Modal */}
      <Modal
        isOpen={showNewListModal}
        onClose={() => setShowNewListModal(false)}
        title="New Grocery List"
      >
        <form onSubmit={createList} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">List Name</label>
            <input
              type="text"
              className="input"
              placeholder="e.g., Weekly Shopping, Party Supplies"
              value={newListTitle}
              onChange={(e) => setNewListTitle(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" className="btn btn-secondary flex-1" onClick={() => setShowNewListModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary flex-1">
              Create List
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Item Modal */}
      <Modal
        isOpen={showAddItemModal}
        onClose={() => setShowAddItemModal(false)}
        title="Add Item"
      >
        <form onSubmit={addItem} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Item Name *</label>
            <input
              type="text"
              className="input"
              placeholder="e.g., Milk, Bread, Eggs"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
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
                value={newItemQuantity}
                onChange={(e) => setNewItemQuantity(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Unit</label>
              <input
                type="text"
                className="input"
                placeholder="e.g., gallons"
                value={newItemUnit}
                onChange={(e) => setNewItemUnit(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" className="btn btn-secondary flex-1" onClick={() => setShowAddItemModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary flex-1">
              Add Item
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export default function GroceryPage() {
  return (
    <ProtectedRoute>
      <GroceryPageContent />
    </ProtectedRoute>
  );
}


