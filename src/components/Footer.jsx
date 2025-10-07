import React from 'react';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full text-center p-6 mt-12 border-t border-gray-200 dark:border-gray-800 bg-light-secondary dark:bg-dark-primary transition-colors duration-300">
      <p className="text-sm text-text-soft dark:text-text-medium">
        &copy; {currentYear} Barber Studio Night and Day. Todos los derechos reservados.
      </p>
    </footer>
  );
}

export default Footer;