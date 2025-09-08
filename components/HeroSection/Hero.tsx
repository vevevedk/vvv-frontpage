import React, { useRef } from 'react';
// Removed: import style from '../../styles/HeroSection.module.css';

interface HeroProps {
  title: string;
  subtitle?: string;
  videoUrl?: string;
}

const Hero: React.FC<HeroProps> = ({ title, subtitle, videoUrl = '/videos/hero.mp4' }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-black/40 z-10" />
      <video
        ref={videoRef}
        className="w-full h-full object-cover absolute top-0 left-0"
        loop
        autoPlay
        muted
        src={videoUrl}
        onError={(e) => console.error('Video error:', e)}
      />
      <div className="absolute top-1/2 left-1/2 text-white text-center z-20 w-[90%] max-w-[800px] -translate-x-1/2 -translate-y-1/2">
        <h2 className="text-4xl md:text-5xl font-bold m-0 drop-shadow-lg leading-tight">{title}</h2>
        {subtitle && <p className="mt-2 text-lg md:text-xl drop-shadow">{subtitle}</p>}
      </div>
    </div>
  );
};

export default React.memo(Hero);