import React, { useState, useEffect, useRef } from 'react';
import style from '../../styles/HeroSection.module.css';

interface HeroProps {
  title: string;
}

const Hero: React.FC<HeroProps> = ({ title }) => {
  const [videoUrl, setVideoUrl] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_VIDEO_URL;
    setVideoUrl(url);
    console.log('Video URL set to:', url);
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (videoRef.current) {
        if (document.visibilityState === 'hidden') {
          videoRef.current.pause();
          console.log('Video paused due to visibility change');
        } else {
          videoRef.current.play().catch((error) => {
            console.error('Error playing video:', error);
          });
          console.log('Video played due to visibility change');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      console.log('Video element:', videoRef.current);
      if (videoRef.current.readyState >= 3) { // Check if the video is ready
        videoRef.current.play().catch((error) => {
          console.error('Error playing video on load:', error);
        });
        console.log('Video played on load');
      } else {
        videoRef.current.addEventListener('canplay', () => {
          videoRef.current.play().catch((error) => {
            console.error('Error playing video on load:', error);
          });
          console.log('Video played on load after canplay event');
        });
      }
    }
  }, [videoUrl]);

  useEffect(() => {
    fetch('/api/CardData')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then((data) => {
        console.log('Card Data:', data);
      })
      .catch((error) => {
        console.error('Error fetching Card Data:', error);
      });
  }, []);

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
        <h2>&quot;{title}&quot;</h2>
      </div>
    </div>
  );
};

export default React.memo(Hero);
