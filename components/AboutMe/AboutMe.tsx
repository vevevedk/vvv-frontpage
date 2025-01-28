import React, { useState, useEffect } from "react";
import styles from "../../styles/AboutMe.module.css";
import { AboutMeData } from "../model/AboutMeModel";
import Image from "next/image";

const AboutMe: React.FC = () => {
  const [aboutData, setAboutData] = useState<AboutMeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/AboutMeData");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setAboutData(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Fetch error:", error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return <div>Loading about section...</div>;
  }

  return (
    <section id="about" className={styles.about_section}>
      <div className={`${styles.about_container} ${styles.wrapper}`}>
        <h2>Hvem Er Vi</h2>
        {aboutData.map((content) => (
          <article key={`aboutme-${content.id}`} className={styles.about_content}>
            <div className={styles.about_text}>
              {content.breadtext.map((text, index) => (
                <p key={`text-${content.id}-${index}`}>{text}</p>
              ))}
            </div>
            {/*
            
            <div className={styles.about_image}>
              <Image
                src={content.img}
                alt="Picture of the team"
                width={500}
                height={300}
                objectFit="cover"
                priority={content.id === 0}
              />
            </div>
            */}
          </article>
        ))}
      </div>
    </section>
  );
};

export default AboutMe;