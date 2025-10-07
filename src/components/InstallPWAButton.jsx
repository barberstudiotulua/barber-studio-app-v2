import React, { useState, useEffect } from 'react';

const InstallPWAButton = () => {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState(null);
  
  // 1. Nuevo estado para saber si el cliente ya cerró el mensaje
  const [isDismissed, setIsDismissed] = useState(
    // Leemos de la memoria del navegador si ya lo cerró antes
    () => localStorage.getItem('installPromptDismissed') === 'true'
  );

  useEffect(() => {
    const handler = e => {
      e.preventDefault();
      setSupportsPWA(true);
      setPromptInstall(e);
    };
    
    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = evt => {
    evt.preventDefault();
    if (!promptInstall) {
      return;
    }
    promptInstall.prompt();
  };

  // 2. Nueva función para cerrar el mensaje y recordarlo
  const handleDismiss = (e) => {
    e.stopPropagation(); // Evita que se active el botón de instalar si se hace clic cerca
    localStorage.setItem('installPromptDismissed', 'true');
    setIsDismissed(true);
  };

  // Si el navegador no es compatible, no mostramos nada.
  if (!supportsPWA) {
    return null;
  }

  return (
    // 3. Un contenedor principal que posiciona todo en la esquina
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
      
      {/* 4. El mensaje llamativo solo se muestra si no ha sido cerrado */}
      {!isDismissed && (
        <div className="bg-dark-secondary text-text-light p-4 rounded-lg shadow-2xl max-w-[280px] text-center text-sm relative animate-fade-in-up border border-gray-700">
          <button 
            onClick={handleDismiss} 
            className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full h-6 w-6 flex items-center justify-center font-bold text-xs z-10"
            aria-label="Cerrar mensaje"
          >
            &times;
          </button>
          <p>
            ¡Lleva tu barbería contigo! Instala la app en tu celular para agendar tu próxima cita con un solo toque.
          </p>
        </div>
      )}

      {/* El botón de instalación siempre está visible */}
      <button
        className="bg-brand-gold text-dark-primary font-bold py-3 px-5 rounded-lg shadow-lg flex items-center gap-3 animate-fade-in-up hover:opacity-90 transition-opacity"
        id="setup_button"
        aria-label="Install app"
        title="Instalar Aplicación"
        onClick={handleInstallClick}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Instalar App
      </button>
    </div>
  );
};

export default InstallPWAButton;