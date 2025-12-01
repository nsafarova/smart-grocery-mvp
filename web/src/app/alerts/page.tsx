'use client';

import { useEffect, useState } from 'react';
import { api, Notification } from '@/lib/api';

const USER_ID = 1;

export default function AlertsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');

  useEffect(() => {
    loadNotifications();
  }, [activeTab]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await api.getNotifications(USER_ID);
      if (activeTab === 'pending') {
        setNotifications(data.filter(n => n.status === 'pending'));
      } else {
        setNotifications(data);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsSent = async (notification: Notification) => {
    try {
      await api.markNotificationSent(notification.notificationId);
      loadNotifications();
    } catch (error) {
      console.error('Failed to mark notification:', error);
    }
  };

  const cancelNotification = async (notification: Notification) => {
    try {
      await api.cancelNotification(notification.notificationId);
      loadNotifications();
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  };

  const autoSchedule = async () => {
    try {
      const result = await api.autoScheduleNotifications(USER_ID);
      alert(result.message);
      loadNotifications();
    } catch (error) {
      console.error('Failed to auto-schedule:', error);
      alert('Failed to schedule notifications');
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Not scheduled';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'sent': return '✅';
      case 'cancelled': return '❌';
      default: return '📬';
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'pending': return 'var(--color-warning)';
      case 'sent': return 'var(--color-success)';
      case 'cancelled': return 'var(--color-text-muted)';
      default: return 'var(--color-text)';
    }
  };

  const pendingCount = notifications.filter(n => n.status === 'pending').length;

  return (
    <>
      <header className="page-header">
        <h1 className="page-title">Reminders 🔔</h1>
        <p className="page-subtitle">
          {pendingCount > 0 ? `${pendingCount} pending reminders` : 'All caught up!'}
        </p>
      </header>

      <div className="page-content">
        {/* Tab switcher */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('pending')}
            className={`btn flex-1 ${activeTab === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
          >
            ⏳ Pending
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`btn flex-1 ${activeTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          >
            📋 All
          </button>
        </div>

        {/* Auto-schedule button */}
        <button 
          className="btn btn-secondary w-full mb-4"
          onClick={autoSchedule}
        >
          🔄 Auto-Schedule for Expiring Items
        </button>

        {/* Notifications list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-20 rounded-2xl" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🔔</div>
            <p>
              {activeTab === 'pending' 
                ? 'No pending reminders' 
                : 'No reminders yet'}
            </p>
            <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>
              Add items with expiration dates to get reminders
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div key={notification.notificationId} className="card">
                <div className="flex items-start gap-3">
                  <div 
                    className="text-2xl"
                    style={{ color: getStatusColor(notification.status) }}
                  >
                    {getStatusIcon(notification.status)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="font-semibold">
                      {notification.pantryItemName || `Item #${notification.pantryItemId}`}
                    </div>
                    <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      {notification.scheduledFor 
                        ? `Scheduled: ${formatDate(notification.scheduledFor)}`
                        : 'Not scheduled'}
                    </div>
                    {notification.expirationDate && (
                      <div className="text-sm" style={{ color: 'var(--color-warning)' }}>
                        Expires: {formatDate(notification.expirationDate)}
                      </div>
                    )}
                    {notification.sentAt && (
                      <div className="text-sm" style={{ color: 'var(--color-success)' }}>
                        Sent: {formatDate(notification.sentAt)}
                      </div>
                    )}
                  </div>

                  {notification.status === 'pending' && (
                    <div className="flex gap-1">
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => markAsSent(notification)}
                        title="Mark as sent"
                      >
                        ✅
                      </button>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => cancelNotification(notification)}
                        title="Cancel"
                      >
                        ❌
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

