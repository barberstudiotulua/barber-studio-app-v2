import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import BarberLogo from '../assets/barber-logo.png'; // Esta línea ya no es necesaria
import ThemeToggleButton from './ThemeToggleButton';

function Header() {
  const navigate = useNavigate();
  const [clickCount, setClickCount] = useState(0);
  const [ctrlPressed, setCtrlPressed] = useState(false);
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

    if (!isMobile && !ctrlPressed) {
      return; 
    }

    const newClickCount = clickCount + 1;
    setClickCount(newClickCount);
    clearTimeout(clickTimer.current);

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
    }, 2000);
  };

  const resetClicks = () => {
    setClickCount(0);
    clearTimeout(clickTimer.current);
  };

  const logoAnimationClass = ctrlPressed ? 'hover:scale-110' : '';

  return (
    <header className="relative text-center py-6 sm:py-8 px-4 bg-light-secondary dark:bg-dark-primary border-b-2 border-brand-gold transition-colors duration-300">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggleButton />
      </div>
      <img 
        src="/barber-logo.png" 
        alt="Barber Studio Logo"
        className={`mx-auto h-16 sm:h-20 w-auto cursor-pointer transition-transform duration-300 ${logoAnimationClass}`}
        onClick={handleLogoClick}
      />
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif tracking-wider mt-4 text-text-dark dark:text-text-light">
        Barber Studio
      </h1>
      <h2 className="text-xl sm:text-2xl md:text-3xl font-serif tracking-wider text-brand-gold">
        Night and Day
      </h2>
      {/* LA LÍNEA DE LA VERSIÓN HA SIDO ELIMINADA */}
    </header>
  );
}

export default Header;