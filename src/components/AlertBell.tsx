import React, { useState, useEffect } from 'react';
import { Bell, Check, Trash, AlertTriangle, Info, Skull } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getNotifications, checkCriticalAlerts, markNotificationRead, AppNotification } from '../utils/alertManager';

interface AlertBellProps {
  lang: 'ar' | 'en';
}

export default function AlertBell({ lang }: AlertBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const isAr = lang === 'ar';

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const dbNotif = await getNotifications();
      setNotifications(dbNotif);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSweepAlerts = async () => {
    setLoading(true);
    try {
      const triggered = await checkCriticalAlerts();
      if (triggered.length > 0) {
        // Refresh notifications
        await loadNotifications();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();

    // Run sweep checks on application mount
    const timer = setTimeout(() => {
      handleSweepAlerts();
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await markNotificationRead(id);
    setNotifications(prev => 
      prev.map(item => item.id === id ? { ...item, is_read: true } : item)
    );
  };

  const handleClearAll = () => {
    setNotifications([]);
    localStorage.removeItem('dev_hub_notif_cache');
  };

  return (
    <div className="relative inline-block text-left" id="notification-bell-container">
      {/* Dynamic Pulsing Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-2xl bg-white/70 backdrop-blur-md border border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-300 hover:shadow-3d-flat transition-all cursor-pointer select-none"
        title={isAr ? 'الإشعارات والتنبيهات المباشرة' : 'Live Notifications & Alerts'}
      >
        <Bell className={`h-5 w-5 ${unreadCount > 0 ? 'animate-bounce' : ''}`} />
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 font-bold font-mono text-[10px] text-white ring-2 ring-white shadow-md animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Glassmorphic Dropdown Drawer containing listings */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Modal Overlay to ease clicking back */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />

            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`absolute z-50 mt-3 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-xl shadow-3d-deep p-4 space-y-3
                ${isAr ? 'left-0 origin-top-left' : 'right-0 origin-top-right'}
              `}
              style={{ maxHeight: '480px', overflowY: 'auto' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 select-none">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping shrink-0" />
                  <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide">
                    {isAr ? 'مركز تنبيهات الأنظمة والاعتمادات' : 'Live Credentials Alert Panel'}
                  </h4>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleSweepAlerts}
                    disabled={loading}
                    className="text-[10px] font-black text-indigo-600 hover:text-indigo-850 cursor-pointer"
                  >
                    {isAr ? 'فحص الآن' : 'Scan Keys'}
                  </button>
                  {notifications.length > 0 && (
                    <button
                      onClick={handleClearAll}
                      className="text-[10px] font-black text-slate-450 hover:text-rose-600 cursor-pointer"
                    >
                      {isAr ? 'تصفية' : 'Clear All'}
                    </button>
                  )}
                </div>
              </div>

              {/* Body Rows */}
              <div className="space-y-2 select-none">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs font-semibold">
                    🌿 {isAr ? 'جميع مزودات الخدمة آمنة وقيد العمل!' : 'All connected API keys are safe and active!'}
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const title = isAr ? notif.title_ar : notif.title_en;
                    const message = isAr ? notif.message_ar : notif.message_en;
                    const isRead = notif.is_read;

                    return (
                      <div
                        key={notif.id}
                        className={`flex gap-3 p-3 rounded-xl border text-xs leading-relaxed transition-all relative group
                          ${isRead 
                            ? 'bg-slate-50/50 border-slate-100/75 text-slate-500' 
                            : 'bg-white border-slate-200 text-slate-700 shadow-3xs'
                          }
                        `}
                      >
                        {/* Interactive Status Icons */}
                        <div className="shrink-0 mt-0.5">
                          {notif.type === 'critical' ? (
                            <div className="p-1 rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
                              <Skull className="h-3.5 w-3.5" />
                            </div>
                          ) : notif.type === 'warning' ? (
                            <div className="p-1 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
                              <AlertTriangle className="h-3.5 w-3.5" />
                            </div>
                          ) : (
                            <div className="p-1 rounded-lg bg-sky-50 text-sky-600 border border-sky-100">
                              <Info className="h-3.5 w-3.5" />
                            </div>
                          )}
                        </div>

                        {/* Text Detail */}
                        <div className="space-y-0.5 min-w-0 pr-6">
                          <h5 className={`font-extrabold text-xs truncate ${isRead ? 'text-slate-600' : 'text-slate-800'}`}>
                            {title}
                          </h5>
                          <p className="text-[11px] leading-relaxed select-all font-semibold font-sans">{message}</p>
                          <span className="text-[9px] font-semibold text-slate-400 block pt-1 font-mono">
                            {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Read Toggle Check Button */}
                        {!isRead && (
                          <button
                            onClick={(e) => handleMarkAsRead(notif.id, e)}
                            className="absolute right-2 top-2 p-1 text-slate-350 hover:text-indigo-605 bg-slate-50 border border-slate-150 rounded-md transition cursor-pointer"
                            title={isAr ? 'تعليم كتمقروء' : 'Mark as read'}
                          >
                            <Check className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
