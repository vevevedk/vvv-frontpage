import React, { useState } from 'react';
import style from '../../styles/CTA.module.css';

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

  return (
    <div className={style.ctaWrapper}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`${style.cta} ${style[stil]}`}
      >
        {tekst}
      </button>
      
      {isOpen && popup && (
        <div className={style.popupOverlay} onClick={() => setIsOpen(false)}>
          <div className={style.popup} onClick={e => e.stopPropagation()}>
            <button 
              className={style.closeButton}
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
