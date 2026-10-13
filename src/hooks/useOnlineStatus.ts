import { useEffect, useState, useCallback } from 'react';

export function useOnlineStatus() {
  // 預設為連線狀態，避免 iframe 內 navigator.onLine 誤判為 false
  const [serverOnline, setServerOnline] = useState<boolean>(true);
  
  // 手動離線開關 (預設為 false，避免使用者未開啟卻處於離線模式)
  const [forceOffline, setForceOfflineState] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('japango_force_offline') === 'true';
    } catch {
      return false;
    }
  });

  // 主動向後端 /api/health 發送 ping 驗證連線
  const checkHealth = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch('/api/health', {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        setServerOnline(true);
      } else {
        // 如果伺服器無法連通，才標記為離線
        setServerOnline(false);
      }
    } catch (e) {
      // 網路請求拋出例外時再判定為無網路
      setServerOnline(false);
    }
  }, []);

  useEffect(() => {
    // 首次載入立即驗證一次
    checkHealth();

    const handleOnline = () => {
      checkHealth();
    };

    const handleOffline = () => {
      // 當瀏覽器明確通知斷線時再驗證
      checkHealth();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('focus', checkHealth);

    // 每 30 秒定期檢查一次
    const interval = setInterval(checkHealth, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('focus', checkHealth);
      clearInterval(interval);
    };
  }, [checkHealth]);

  const toggleForceOffline = (force?: boolean) => {
    setForceOfflineState((prev) => {
      const next = typeof force === 'boolean' ? force : !prev;
      try {
        if (next) {
          sessionStorage.setItem('japango_force_offline', 'true');
        } else {
          sessionStorage.removeItem('japango_force_offline');
          localStorage.removeItem('japango_force_offline');
        }
      } catch (e) {
        console.warn(e);
      }
      return next;
    });
  };

  const resetToOnline = () => {
    try {
      sessionStorage.removeItem('japango_force_offline');
      localStorage.removeItem('japango_force_offline');
    } catch (e) {
      console.warn(e);
    }
    setForceOfflineState(false);
    setServerOnline(true);
    checkHealth();
  };

  // 只有在明確啟用手動離線，或主動 ping 伺服器確實失敗時，才認定為離線
  const isOnline = !forceOffline && serverOnline;

  return {
    isOnline,
    browserOnline: serverOnline,
    forceOffline,
    toggleForceOffline,
    resetToOnline,
    checkHealth,
  };
}
