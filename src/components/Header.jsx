import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BarberLogo from '../assets/barber-logo.png';
import ThemeToggleButton from './ThemeToggleButton';

function Header() {
  const navigate = useNavigate();
  const [clickCount, setClickCount] = useState(0);
  const [ctrlPressed, setCtrlPressed] = useState(false);
  // Usaremos una referencia para el temporizador para evitar problemas de renderizado
  const clickTimer = React.useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Control') {
        setCtrlPressed(true);
      }
    };
    const handleKeyUp = (e) => {
      if (e.key === 'Control') {
        setCtrlPressed(false);
        // Si se suelta la tecla Control, reiniciamos el contador por seguridad
        resetClicks();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      clearTimeout(clickTimer.current);
    };
  }, []);


  const handleLogoClick = () => {
    const isMobile = window.innerWidth <= 768;

    // --- CAMBIO CLAVE 1: Condicionar el contador de clics en PC ---
    // Si estamos en un computador y la tecla Control no está presionada, no hacemos nada.
    if (!isMobile && !ctrlPressed) {
      return; 
    }

    const newClickCount = clickCount + 1;
    setClickCount(newClickCount);
    clearTimeout(clickTimer.current);

    // La lógica de navegación se mantiene, pero ahora solo se puede llegar a ella
    // si se cumplió la condición de arriba en PC.
    if (!isMobile && newClickCount === 3 && ctrlPressed) {
      navigate('/admin/login');
      resetClicks();
      return;
    }

    if (isMobile && newClickCount === 5) {
      navigate('/admin/login');
      resetClicks();
      return;
    }
    
    clickTimer.current = setTimeout(() => {
      resetClicks();
    }, 2000); // El temporizador se reinicia después de 2 segundos de inactividad
  };

  const resetClicks = () => {
    setClickCount(0);
    clearTimeout(clickTimer.current);
  };

  // --- CAMBIO CLAVE 2: La animación de escala ahora es dinámica ---
  // Las clases de la animación solo se aplican si `ctrlPressed` es verdadero.
  const logoAnimationClass = ctrlPressed ? 'hover:scale-110' : '';

  return (
    <header className="relative text-center py-6 sm:py-8 px-4 bg-light-secondary dark:bg-dark-primary border-b-2 border-brand-gold transition-colors duration-300">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggleButton />
      </div>
      <img 
        src={BarberLogo}
        alt="Barber Studio Logo"
        // La clase de animación se añade o quita dinámicamente
        className={`mx-auto h-16 sm:h-20 w-auto cursor-pointer transition-transform duration-300 ${logoAnimationClass}`}
        onClick={handleLogoClick}
      />
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif tracking-wider mt-4 text-text-dark dark:text-text-light">
        Barber Studio
      </h1>
      <h2 className="text-xl sm:text-2xl md:text-3xl font-serif tracking-wider text-brand-gold">
        Night and Day
      </h2>
      <p className="text-sm text-text-soft dark:text-text-medium mt-2 tracking-widest">v1.2</p>
    </header>
  );
}

export default Header;