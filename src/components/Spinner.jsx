import React from 'react';

function Spinner() {
  return (
    <div className="flex justify-center items-center p-4">
      {/* Cambiamos el color a nuestro dorado de marca */}
      <div className="w-8 h-8 border-4 border-t-transparent border-brand-gold rounded-full animate-spin"></div>
    </div>
  );
}

export default Spinner;