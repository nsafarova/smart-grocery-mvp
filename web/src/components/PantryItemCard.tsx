'use client';

import { PantryItem } from '@/lib/api';

interface PantryItemCardProps {
  item: PantryItem;
  onEdit?: (item: PantryItem) => void;
  onDelete?: (item: PantryItem) => void;
}

export default function PantryItemCard({ item, onEdit, onDelete }: PantryItemCardProps) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="card card-pressable" onClick={() => onEdit?.(item)}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-base">{item.name}</h3>
            {item.isExpiringSoon && (
              <span className="tag tag-warning">⏰ Expiring</span>
            )}
            {item.isLowStock && (
              <span className="tag tag-danger">📉 Low</span>
            )}
          </div>
          
          <div className="flex items-center gap-3 mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {item.quantity !== null && (
              <span>{item.quantity} {item.unit || 'units'}</span>
            )}
            {item.category && (
              <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: 'var(--color-bg-muted)' }}>
                {item.category}
              </span>
            )}
          </div>
          
          {item.expirationDate && (
            <div className="mt-2 text-sm" style={{ color: item.isExpiringSoon ? 'var(--color-warning)' : 'var(--color-text-muted)' }}>
              Expires: {formatDate(item.expirationDate)}
              {item.daysUntilExpiry !== null && item.daysUntilExpiry !== undefined && (
                <span className="ml-1">
                  ({item.daysUntilExpiry <= 0 ? 'Today!' : `${item.daysUntilExpiry}d`})
                </span>
              )}
            </div>
          )}
        </div>
        
        {onDelete && (
          <button 
            className="btn btn-icon btn-secondary text-lg"
            onClick={(e) => { e.stopPropagation(); onDelete(item); }}
            style={{ width: '36px', height: '36px' }}
          >
            🗑️
          </button>
        )}
      </div>
    </div>
  );
}


