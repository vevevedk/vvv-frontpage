import React, { useState } from 'react';

export enum Stil {
  blue = 'blue',
  white = 'white'
}

export enum Tekst {
  kontakt = 'Kontakt',
  readMore = 'Læs mere'
}

interface CTAProps {
  stil: Stil;
  tekst: Tekst;
  popup?: React.ReactNode;
}

const CTA: React.FC<CTAProps> = ({ stil, tekst, popup }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Tailwind class mappings for button style
  const baseButton =
    'px-6 py-3 rounded-lg text-base font-medium cursor-pointer transition-all border-2 border-transparent';
  const blueButton =
    'bg-primary text-white hover:bg-white hover:text-primary hover:border-primary';
  const whiteButton =
    'bg-white text-primary border-primary hover:bg-primary hover:text-white';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${baseButton} ${stil === 'blue' ? blueButton : whiteButton}`}
      >
        {tekst}
      </button>

      {isOpen && popup && (
        <div
          className="fixed inset-0 bg-black/70 flex justify-center items-center z-[1000]"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white p-8 rounded-custom relative max-w-[90%] w-[500px] max-h-[90vh] overflow-y-auto shadow-lg animate-fadeIn"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 bg-none border-none text-2xl cursor-pointer text-primary w-[30px] h-[30px] flex items-center justify-center rounded-full transition-colors hover:bg-black/10"
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>
            {popup}
          </div>
        </div>
      )}
    </div>
  );
};

export default CTA;
