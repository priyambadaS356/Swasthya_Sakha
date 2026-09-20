import React, { useState, useEffect } from 'react';
import { syncOfflineData } from './utils/syncManager';

// Apne existing components ya routes yahan import rakhein
// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Internet wapas aate hi IndexedDB ka unsynced data auto-send hoga
      syncOfflineData();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial load par check aur sync
    if (navigator.onLine) {
      syncOfflineData();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="app-container">
      {/* Offline Status Banner */}
      {!isOnline && (
        <div style={{
          backgroundColor: '#d97706',
          color: '#ffffff',
          textAlign: 'center',
          padding: '10px 16px',
          fontWeight: '500',
          fontSize: '14px',
          position: 'sticky',
          top: 0,
          zIndex: 9999,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          ⚠️ Aap Offline hain. Naye entries local storage mein save honge aur network aate hi server par sync ho jayenge.
        </div>
      )}

      {/* Aapke existing routes, dashboard, aur navigation yahan continue honge */}
    </div>
  );
}

export default App;