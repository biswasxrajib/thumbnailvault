import React, { useState, useEffect } from 'react';
import { Shield, Users } from 'lucide-react';
import AdminPanel from './AdminPanel';
import PublicGallery from './PublicGallery';

export default function App() {
  const [view, setView] = useState('gallery');

  useEffect(() => {
    if (window.location.pathname === '/admin') {
      setView('admin');
    }
  }, []);

  return (
    <div className="relative">
      {view === 'admin' ? (
        <>
          <div className="fixed top-4 left-4 z-50">
            <button
              onClick={() => {
                setView('gallery');
                window.history.pushState({}, '', '/');
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors text-sm flex items-center gap-2 shadow-lg"
            >
              <Users className="w-4 h-4" />
              Public Gallery
            </button>
          </div>
          <AdminPanel />
        </>
      ) : (
        <>
          <div className="fixed top-4 right-4 z-50">
            <button
              onClick={() => {
                setView('admin');
                window.history.pushState({}, '', '/admin');
              }}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors text-sm flex items-center gap-2 shadow-lg"
            >
              <Shield className="w-4 h-4" />
              Admin
            </button>
          </div>
          <PublicGallery />
        </>
      )}
    </div>
  );
}