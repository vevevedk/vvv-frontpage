import React, { useState, useEffect } from "react";
import styles from "../../styles/AboutMe.module.css";
import { AboutMeData } from "../model/AboutMeModel";
const MyComponent: React.FC = () => {
  const [cases, setCases] = useState<AboutMeData[]>([]);

  useEffect(() => {
    fetch(process.env.NEXT_PUBLIC_BASEPATH + "api/AboutMeData")
      .then((res) => res.json())
      .then((data) => setCases(data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div id="about" className={`${styles.AboutMe} `}>
      <div className={`${styles.AboutMeContainer} ${styles.wrapper}`}>
        <h2> Hvem er jeg? </h2>
        {cases.map((content) => (
          <div
            className={`${styles.AboutMeContent}`}
            key={"aboutme" + content.id}
          >
            <div className={styles.AboutMeText}>
              {content.breadtext.map((btext) => (
                <p key={btext}>{btext}</p>
              ))}
            </div>
            <img
              src={content.img}
              alt="picture of Andreas"
              className={styles.AboutMeImg}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyComponent;
