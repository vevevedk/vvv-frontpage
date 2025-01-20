import React, { useRef } from 'react';
import style from '../../styles/HeroSection.module.css';

interface HeroProps {
  title: string;
  videoUrl?: string;
}

const Hero: React.FC<HeroProps> = ({ title, videoUrl = '/videos/hero.mp4' }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <div className={style.hero_section}>
      <div className={style.overlay}>
        <video
          ref={videoRef}
          className={style.hero_video}
          loop
          autoPlay
          muted
          src={videoUrl}
          onError={(e) => console.error('Video error:', e)}
        /> 
      </div>
      <div className={style.hero_text}>
        <h2>{title}</h2>
      </div>
    </div>
  );
};

export default React.memo(Hero);
