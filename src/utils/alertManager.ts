import { getSupabaseClient } from './supabase';

export interface AppNotification {
  id: string;
  title_ar: string;
  title_en: string;
  message_ar: string;
  message_en: string;
  type: 'critical' | 'warning' | 'info';
  is_read: boolean;
  created_at: string;
}

/**
 * Sweeps all registered api keys to check for critical balances
 * and logs notifications in Supabase + system browser popups.
 */
export async function checkCriticalAlerts(): Promise<AppNotification[]> {
  const supabase = getSupabaseClient();
  const detectedAlerts: Omit<AppNotification, 'id' | 'created_at' | 'is_read'>[] = [];

  // 1. Fetch credentials
  if (supabase) {
    try {
      const { data: credentials, error } = await supabase
        .from('vault_credentials')
        .select('*');

      if (!error && credentials) {
        credentials.forEach((cred: any) => {
          const balance = Number(cred.balance || 0);
          const threshold = Number(cred.auto_recharge_threshold || 10); // Default to $10 threshold
          const platform = cred.platform || 'API Provider';

          if (cred.status === 'low_credit' || balance < threshold || balance < 5) {
            const isCritical = balance === 0;
            detectedAlerts.push({
              title_ar: isCritical ? `🚨 رصيد منتهي: ${platform}` : `⚠️ رصيد منخفض: ${platform}`,
              title_en: isCritical ? `🚨 Expired Balance: ${platform}` : `⚠️ Low Balance Warning: ${platform}`,
              message_ar: isCritical 
                ? `المفتاح الخاص بـ ${platform} نفذ رصيده بالكامل ولا يمكن استخدامه حالياً.`
                : `الرصيد المتبقي لـ ${platform} هو $${balance.toFixed(2)}، وهو أقل من عتبة التنبيه.`,
              message_en: isCritical 
                ? `Your ${platform} key balance is fully exhausted and cannot be used.`
                : `Your remaining ${platform} balance is $${balance.toFixed(2)}, which is below safety alert levels.`,
              type: isCritical ? 'critical' : 'warning'
            });
          }
        });
      }
    } catch (err) {
      console.warn('Supabase credential monitoring failed, generating status check with heuristic local state:', err);
    }
  }

  // 2. Local Fallback Heuristics for development
  if (detectedAlerts.length === 0) {
    const localKeysJson = localStorage.getItem('dev_hub_secrets') || '[]';
    try {
      const decodedList = JSON.parse(localKeysJson);
      if (decodedList.length === 0) {
        // Add single demo fallback alert to test system visually
        detectedAlerts.push({
          title_ar: '⚠️ تنبيه تجريبي: رصيد OpenAI منخفض',
          title_en: '⚠️ Demo Alert: OpenAI Balance Low',
          message_ar: 'رصيد مفتاح OpenAI التجريبي يقارب الانتهاء ($1.25 متبقي).',
          message_en: 'Your custom OpenAI trial key is running low ($1.25 remaining).',
          type: 'warning'
        });
      }
    } catch (e) {
      console.error(e);
    }
  }

  // 3. For each alert triggered, write to database (app_notifications) and display browser prompt
  const notificationsInserted: AppNotification[] = [];

  for (const alert of detectedAlerts) {
    let insertedRecord: any = null;
    
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('app_notifications')
          .insert({
            title_ar: alert.title_ar,
            title_en: alert.title_en,
            message_ar: alert.message_ar,
            message_en: alert.message_en,
            type: alert.type,
            is_read: false,
          })
          .select()
          .single();

        if (!error && data) {
          insertedRecord = data;
        }
      } catch (err) {
        console.warn('Unable to write notifications to remote table:', err);
      }
    }

    // Default return record if db write is failed or operating offline
    if (!insertedRecord) {
      insertedRecord = {
        id: `local-notif-${Math.random().toString(36).substr(2, 9)}`,
        ...alert,
        is_read: false,
        created_at: new Date().toISOString()
      };
    }

    notificationsInserted.push(insertedRecord);

    // 4. Fire standard desktop browser notifications
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(alert.title_en, {
          body: alert.message_en,
          icon: '/favicon.ico'
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification(alert.title_en, {
              body: alert.message_en
            });
          }
        });
      }
    }
  }

  return notificationsInserted;
}

/**
 * Fetch existing notifications from the Supabase log table.
 */
export async function getNotifications(): Promise<AppNotification[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('app_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);

      if (!error && data) {
        return data as AppNotification[];
      }
    } catch (err) {
      console.warn('Fallback notifications read locally from cache:', err);
    }
  }

  // Local storage notifications cache for offline standalone compliance
  const cached = localStorage.getItem('dev_hub_notif_cache');
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Marks single notification as read inside cloud or local store.
 */
export async function markNotificationRead(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase
        .from('app_notifications')
        .update({ is_read: true })
        .eq('id', id);
    } catch (err) {
      console.warn('Error saving read receipt in database:', err);
    }
  }

  // Update offline caches as well
  const cached = localStorage.getItem('dev_hub_notif_cache');
  if (cached) {
    try {
      const list: AppNotification[] = JSON.parse(cached);
      const updated = list.map(item => item.id === id ? { ...item, is_read: true } : item);
      localStorage.setItem('dev_hub_notif_cache', JSON.stringify(updated));
    } catch {}
  }
}
