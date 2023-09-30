import style from "../../styles/HeroSection.module.css";
import React, { useState, useEffect, useRef } from "react";

interface HeroProps {
  title: string;
}

const Hero = (props: HeroProps) => {
  const [videoUrl, setVideoUrl] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setVideoUrl(
      "https://veveve-bucket-2.fra1.digitaloceanspaces.com/Untitled.mp4"
    );
  }, []);

  useEffect(() => {
    function handleVisibilityChange() {
      if (videoRef.current) {
        if (document.visibilityState === "hidden") {
          videoRef.current.pause();
        } else {
          videoRef.current.play();
        }
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [videoRef]);

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
        ></video>
      </div>
      <div className={style.hero_text}>
        <h2>&quot;{props.title}&quot;</h2>
      </div>
    </div>
  );
};

export default Hero;
