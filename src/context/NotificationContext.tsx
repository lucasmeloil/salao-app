import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/ts/supabase';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

type NotificationType = 'success' | 'info' | 'warning' | 'error';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
}

interface NotificationContextType {
  addNotification: (title: string, message: string, type?: NotificationType) => Promise<void>;
  notifications: Notification[];
  removeNotification: (id: string) => void;
  unreadCount: number;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchUnreadCount();
    
    // Subscribe to new notifications
    const subscription = supabase
      .channel('public:notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, payload => {
        const newNotif = payload.new;
        // Show toast
        triggerToast(newNotif.title, newNotif.message, newNotif.type);
        fetchUnreadCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchUnreadCount = async () => {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);
    setUnreadCount(count || 0);
  };

  const triggerToast = (title: string, message: string, type: NotificationType = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, title, message, type }]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const addNotification = async (title: string, message: string, type: NotificationType = 'info') => {
    // Persistent notification in DB
    await supabase.from('notifications').insert([{ title, message, type }]);
    // triggerToast is handled by the subscription for real-time feel
  };

  const removeNotification = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const markAllAsRead = async () => {
    await supabase.from('notifications').update({ is_read: true }).eq('is_read', false);
    setUnreadCount(0);
  };

  return (
    <NotificationContext.Provider value={{ addNotification, notifications: toasts, removeNotification, unreadCount, markAllAsRead }}>
      {children}
      {/* Toast Container */}
      <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '400px', width: '100%' }}>
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className="glass"
            style={{ 
              padding: '16px', 
              borderRadius: '12px', 
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              gap: '12px',
              alignItems: 'start',
              borderLeft: `4px solid ${
                toast.type === 'success' ? '#16a34a' : 
                toast.type === 'error' ? '#dc2626' : 
                toast.type === 'warning' ? '#ca8a04' : '#2563eb'
              }`,
              animation: 'slideIn 0.3s ease-out'
            }}
          >
            <div style={{ marginTop: '2px' }}>
              {toast.type === 'success' && <CheckCircle size={20} color="#16a34a" />}
              {toast.type === 'error' && <XCircle size={20} color="#dc2626" />}
              {toast.type === 'warning' && <AlertCircle size={20} color="#ca8a04" />}
              {toast.type === 'info' && <Info size={20} color="#2563eb" />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '4px' }}>{toast.title}</div>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{toast.message}</div>
            </div>
            <button onClick={() => removeNotification(toast.id)} style={{ background: 'none', color: '#94a3b8', padding: 0 }}>
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
};
