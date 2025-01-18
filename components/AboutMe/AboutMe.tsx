import React, { useState, useEffect } from "react";
import styles from "../../styles/AboutMe.module.css";
import { AboutMeData } from "../model/AboutMeModel";

const AboutMe: React.FC = () => {
  const [cases, setCases] = useState<AboutMeData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Log environment variables for debugging
        console.log("NEXT_PUBLIC_BASEPATH:", process.env.NEXT_PUBLIC_BASEPATH);
        console.log("Full environment:", process.env);

        // Use a simple relative path for API routes in Next.js
        const response = await fetch("/api/AboutMeData");
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setCases(data);
      } catch (error) {
        console.error("Fetch error:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div id="about" className={`${styles.about_section}`}>
      <div className={`${styles.about_text} ${styles.wrapper}`}>
        <h2>Hvem er vi</h2>
        {cases.map((content) => (
          <div className={styles.about_content} key={"aboutme" + content.id}>
            <div className={styles.about_text}>
              {content.breadtext.map((btext) => (
                <p key={btext}>{btext}</p>
              ))}
            </div>
            <img
              src={content.img}
              alt="Picture of the team"
              className={styles.about_img}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default AboutMe;