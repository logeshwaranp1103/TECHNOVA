import { useEffect } from 'react';

export function useSync(callback) {
  useEffect(() => {
    const channel = new BroadcastChannel('seatsync_channel');
    
    // Listen for broadcast events from other tabs
    channel.onmessage = (event) => {
      if (callback) callback(event.data);
    };

    // Fallback: listen for local storage changes across tabs
    const handleStorage = (e) => {
      if (e.key && e.key.startsWith('seatsync_')) {
        if (callback) callback({ type: 'storage_change', key: e.key });
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      channel.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, [callback]);

  const broadcast = (data) => {
    const channel = new BroadcastChannel('seatsync_channel');
    channel.postMessage(data);
    channel.close();
  };

  return { broadcast };
}
