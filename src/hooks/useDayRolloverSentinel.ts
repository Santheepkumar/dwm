'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { activityService } from '@/services/activityService';
import { getTodayString } from '@/lib/utils';
import { Activity } from '@/lib/types';

interface RolloverNotice {
  today: string;
  count: number;
  activities: Activity[];
}

export function useDayRolloverSentinel(onDayRolled?: (notice: RolloverNotice) => void) {
  const [lastNotice, setLastNotice] = useState<RolloverNotice | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const lastProcessedDateRef = useRef<string>(getTodayString());
  const isExecutingRef = useRef<boolean>(false);

  const executeRollover = useCallback(async (forcedDate?: string) => {
    if (isExecutingRef.current) return;
    const today = forcedDate || getTodayString();

    try {
      isExecutingRef.current = true;
      setIsRolling(true);

      const result = await activityService.rollOverPendingActivities(today);
      lastProcessedDateRef.current = today;

      if (result.rolledCount > 0) {
        const notice: RolloverNotice = {
          today,
          count: result.rolledCount,
          activities: result.rolledActivities,
        };
        setLastNotice(notice);
        if (onDayRolled) {
          onDayRolled(notice);
        }
      }
    } catch (err) {
      console.error('Day rollover sentinel error:', err);
    } finally {
      isExecutingRef.current = false;
      setIsRolling(false);
    }
  }, [onDayRolled]);

  useEffect(() => {
    // 1. Cold Start on Mount
    executeRollover();

    // 2. Schedule exact midnight timer targeting 00:00:01
    let midnightTimer: NodeJS.Timeout;
    const scheduleNextMidnight = () => {
      const now = new Date();
      const tomorrowMidnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0,
        0,
        1
      );
      const msUntilMidnight = Math.max(1000, tomorrowMidnight.getTime() - now.getTime());

      midnightTimer = setTimeout(async () => {
        const newDay = getTodayString();
        await executeRollover(newDay);
        scheduleNextMidnight();
      }, msUntilMidnight);
    };

    scheduleNextMidnight();

    // 3. Tab Visibility & Focus Watcher (Laptop wake / tab switch)
    const handleWakeOrFocus = () => {
      const currentToday = getTodayString();
      if (document.visibilityState === 'visible' && currentToday !== lastProcessedDateRef.current) {
        executeRollover(currentToday);
      }
    };

    document.addEventListener('visibilitychange', handleWakeOrFocus);
    window.addEventListener('focus', handleWakeOrFocus);

    // 4. 60-Second Periodic Sanity Heartbeat
    const heartbeatInterval = setInterval(() => {
      const currentToday = getTodayString();
      if (currentToday !== lastProcessedDateRef.current) {
        executeRollover(currentToday);
      }
    }, 60000);

    return () => {
      clearTimeout(midnightTimer);
      clearInterval(heartbeatInterval);
      document.removeEventListener('visibilitychange', handleWakeOrFocus);
      window.removeEventListener('focus', handleWakeOrFocus);
    };
  }, [executeRollover]);

  const dismissNotice = () => setLastNotice(null);

  return {
    lastNotice,
    isRolling,
    dismissNotice,
    triggerManualCheck: executeRollover,
  };
}
