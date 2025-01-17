import React from 'react';
import style from '../../styles/HeroSection.module.css';

interface HeroProps {
  title: string;
}

const Hero: React.FC<HeroProps> = ({ title }) => {
  return (
    <div className={style.hero_section}>
      <div className={style.overlay}>
        {/* <video
          ref={videoRef}
          className={style.hero_video}
          loop
          autoPlay
          muted
          src={videoUrl}
          onError={(e) => console.error('Video error:', e)}
        /> */}
      </div>
      <div className={style.hero_text}>
        <h2>&quot;{title}&quot;</h2>
      </div>
    </div>
  );
};

export default React.memo(Hero);
