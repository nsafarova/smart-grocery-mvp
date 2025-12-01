'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, PantryItem } from '@/lib/api';

const USER_ID = 1; // Demo user

interface DashboardStats {
  totalItems: number;
  expiringCount: number;
  lowStockCount: number;
  expiringItems: PantryItem[];
  lowStockItems: PantryItem[];
}

export default function HomePage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [pantryItems, expiring, lowStock] = await Promise.all([
        api.getPantryItems(USER_ID),
        api.getExpiringItems(USER_ID, 7),
        api.getLowStockItems(USER_ID),
      ]);

      setStats({
        totalItems: pantryItems.length,
        expiringCount: expiring.count,
        lowStockCount: lowStock.count,
        expiringItems: expiring.items.slice(0, 3),
        lowStockItems: lowStock.items.slice(0, 3),
      });
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="page-content pt-6">
        <div className="skeleton h-8 w-48 mb-4" />
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="page-header">
        <h1 className="page-title">Good morning! 👋</h1>
        <p className="page-subtitle">Here's what's in your kitchen</p>
      </header>

      <div className="page-content">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Link href="/pantry" className="stat-card card-pressable">
            <div className="stat-icon" style={{ background: 'rgba(129, 178, 154, 0.15)' }}>
              🥫
            </div>
            <div>
              <div className="stat-value">{stats?.totalItems || 0}</div>
              <div className="stat-label">Pantry Items</div>
            </div>
          </Link>

          <Link href="/pantry?filter=expiring" className="stat-card card-pressable">
            <div className="stat-icon" style={{ background: 'rgba(244, 162, 97, 0.15)' }}>
              ⏰
            </div>
            <div>
              <div className="stat-value" style={{ color: stats?.expiringCount ? 'var(--color-warning)' : undefined }}>
                {stats?.expiringCount || 0}
              </div>
              <div className="stat-label">Expiring Soon</div>
            </div>
          </Link>

          <Link href="/pantry?filter=low" className="stat-card card-pressable">
            <div className="stat-icon" style={{ background: 'rgba(231, 111, 81, 0.15)' }}>
              📉
            </div>
            <div>
              <div className="stat-value" style={{ color: stats?.lowStockCount ? 'var(--color-danger)' : undefined }}>
                {stats?.lowStockCount || 0}
              </div>
              <div className="stat-label">Low Stock</div>
            </div>
          </Link>

          <Link href="/meals" className="stat-card card-pressable">
            <div className="stat-icon" style={{ background: 'rgba(224, 122, 95, 0.15)' }}>
              ✨
            </div>
            <div>
              <div className="stat-value">AI</div>
              <div className="stat-label">Meal Ideas</div>
            </div>
          </Link>
        </div>

        {/* Expiring Soon Section */}
        {stats?.expiringItems && stats.expiringItems.length > 0 && (
          <section className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-semibold text-lg">⏰ Expiring Soon</h2>
              <Link href="/pantry?filter=expiring" className="text-sm" style={{ color: 'var(--color-primary)' }}>
                See all
              </Link>
            </div>
            <div className="space-y-2">
              {stats.expiringItems.map((item) => (
                <div key={item.pantryItemId} className="card flex justify-between items-center">
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm" style={{ color: 'var(--color-warning)' }}>
                      Expires {formatDate(item.expirationDate)}
                    </div>
                  </div>
                  <span className="tag tag-warning">
                    {item.daysUntilExpiry !== null && item.daysUntilExpiry !== undefined
                      ? item.daysUntilExpiry <= 0 ? 'Today!' : `${item.daysUntilExpiry}d`
                      : '⏰'}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Low Stock Section */}
        {stats?.lowStockItems && stats.lowStockItems.length > 0 && (
          <section className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-semibold text-lg">📉 Running Low</h2>
              <Link href="/pantry?filter=low" className="text-sm" style={{ color: 'var(--color-primary)' }}>
                See all
              </Link>
            </div>
            <div className="space-y-2">
              {stats.lowStockItems.map((item) => (
                <div key={item.pantryItemId} className="card flex justify-between items-center">
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      {item.quantity} {item.unit || 'left'}
                    </div>
                  </div>
                  <Link 
                    href="/grocery" 
                    className="btn btn-sm btn-outline"
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  >
                    + List
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Quick Actions */}
        <section>
          <h2 className="font-semibold text-lg mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/pantry" className="card card-pressable text-center py-6">
              <div className="text-3xl mb-2">➕</div>
              <div className="font-medium">Add Item</div>
            </Link>
            <Link href="/meals" className="card card-pressable text-center py-6">
              <div className="text-3xl mb-2">🍳</div>
              <div className="font-medium">Get Meal Ideas</div>
            </Link>
            <Link href="/grocery" className="card card-pressable text-center py-6">
              <div className="text-3xl mb-2">📝</div>
              <div className="font-medium">New List</div>
            </Link>
            <Link href="/alerts" className="card card-pressable text-center py-6">
              <div className="text-3xl mb-2">🔔</div>
              <div className="font-medium">Reminders</div>
            </Link>
        </div>
        </section>
    </div>
    </>
  );
}
