import { useState, useEffect, useCallback, useRef } from 'react';

export interface RealtimeClockState {
  time: Date;
  isOnline: boolean;
  isSynced: boolean;
  syncError: boolean;
  lastSyncedAt: Date | null;
  formattedDatePST: string;
  formattedTimePST: string;
  formattedFullPST: string;
  timeZoneLabel: string;
  syncNow: () => Promise<void>;
}

export const useRealtimeClock = (): RealtimeClockState => {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  // Clock drift offset in milliseconds (serverTime - localTime)
  const [driftOffsetMs, setDriftOffsetMs] = useState<number>(0);
  const [isSynced, setIsSynced] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  // Current calculated time
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());

  const isSyncingRef = useRef(false);

  // Sync with /api/time when online
  const syncWithServer = useCallback(async () => {
    if (typeof window === 'undefined' || !navigator.onLine || isSyncingRef.current) {
      return;
    }

    isSyncingRef.current = true;
    const reqStart = Date.now();

    try {
      const response = await fetch('/api/time', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });

      const reqEnd = Date.now();
      const rtt = reqEnd - reqStart;

      if (response.ok) {
        const data = await response.json();
        if (data.epochMs) {
          // Estimated server time at response arrival = serverTime + (rtt / 2)
          const estimatedServerNow = data.epochMs + Math.round(rtt / 2);
          const computedDrift = estimatedServerNow - reqEnd;

          setDriftOffsetMs(computedDrift);
          setIsSynced(true);
          setSyncError(false);
          setLastSyncedAt(new Date());
          setCurrentTime(new Date(Date.now() + computedDrift));
        }
      } else {
        setSyncError(true);
      }
    } catch {
      setSyncError(true);
    } finally {
      isSyncingRef.current = false;
    }
  }, []);

  // Listen to browser online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncWithServer();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial sync
    if (navigator.onLine) {
      syncWithServer();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncWithServer]);

  // Periodic resync every 60 seconds when online
  useEffect(() => {
    const syncInterval = setInterval(() => {
      if (navigator.onLine) {
        syncWithServer();
      }
    }, 60000);

    return () => clearInterval(syncInterval);
  }, [syncWithServer]);

  // Ticking interval every second
  useEffect(() => {
    const tickInterval = setInterval(() => {
      setCurrentTime(new Date(Date.now() + driftOffsetMs));
    }, 1000);

    return () => clearInterval(tickInterval);
  }, [driftOffsetMs]);

  // Formatter for Philippine Standard Time (PST: Asia/Manila, UTC+8)
  const fullFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  let formattedFullPST = '';
  let formattedDatePST = '';
  let formattedTimePST = '';

  try {
    formattedFullPST = fullFormatter.format(currentTime);
    formattedDatePST = dateFormatter.format(currentTime);
    formattedTimePST = timeFormatter.format(currentTime);
  } catch {
    // Fallback if Intl fails
    formattedFullPST = currentTime.toLocaleString();
    formattedDatePST = currentTime.toLocaleDateString();
    formattedTimePST = currentTime.toLocaleTimeString();
  }

  return {
    time: currentTime,
    isOnline,
    isSynced,
    syncError,
    lastSyncedAt,
    formattedDatePST,
    formattedTimePST,
    formattedFullPST,
    timeZoneLabel: 'Philippine Standard Time (PST)',
    syncNow: syncWithServer,
  };
};
