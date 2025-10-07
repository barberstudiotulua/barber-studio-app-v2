import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import HomePage from './pages/HomePage';
import AdminLogin from './pages/AdminLogin';
import AdminPanel from './pages/AdminPanel';
import ProtectedRoute from './components/ProtectedRoute';
import Footer from './components/Footer';
import InstallPWAButton from './components/InstallPWAButton'; // <-- 1. IMPORTAR EL NUEVO BOTÓN
import { useTheme } from './context/ThemeContext';

function App() {
  const { theme } = useTheme();

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow">
        <Toaster
          position="top-center"
          reverseOrder={false}
          toastOptions={{
            duration: 4000,
            style: {
              background: theme === 'dark' ? '#1E1E1E' : '#FFFFFF',
              color: theme === 'dark' ? '#EAEAEA' : '#18181B',
              border: `1px solid ${theme === 'dark' ? '#4A5568' : '#E5E7EB'}`,
              fontSize: '16px',
              padding: '16px 24px',
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
            },
            success: {
              iconTheme: {
                primary: '#D4AF37',
                secondary: theme === 'dark' ? '#121212' : '#FFFFFF',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: theme === 'dark' ? '#1E1E1E' : '#FFFFFF',
              },
            },
          }}
        />
        
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={ <ProtectedRoute> <AdminPanel /> </ProtectedRoute> } />
        </Routes>
      </div>
      <Footer />
      <InstallPWAButton /> {/* <-- 2. AÑADIR EL BOTÓN AQUÍ */}
    </div>
  );
}

export default App;