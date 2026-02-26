import { useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';

export const usePixSubscription = (onUpdate) => {
  useEffect(() => {
    let isSubscribed = false;
    let intervalId = null;

    const subscribe = async () => {
      try {
        await pb.collection('pix_requests').subscribe('*', (e) => {
          if (onUpdate) onUpdate();
        });
        isSubscribed = true;
      } catch (error) {
        console.error('Failed to subscribe to pix_requests:', error);
        // Fallback: 30-second polling interval if subscription fails
        intervalId = setInterval(() => {
          if (onUpdate) onUpdate();
        }, 30000);
      }
    };

    subscribe();

    return () => {
      if (isSubscribed) {
        pb.collection('pix_requests').unsubscribe('*').catch(console.error);
      }
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [onUpdate]);
};
