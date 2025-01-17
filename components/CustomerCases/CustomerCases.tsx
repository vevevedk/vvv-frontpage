import React, { useState, useEffect } from "react";
import { CustomerCasesData } from "../model/CustomerCasesModel";
import styles from "../../styles/CustomerCasesStyle.module.css";
import { url } from "inspector";
const MyComponent: React.FC = () => {
  const [cases, setCases] = useState<CustomerCasesData[]>([]);

  useEffect(() => {
    fetch(process.env.NEXT_PUBLIC_BASEPATH + "api/CustomerCasesData")
      .then((res) => res.json())
      .then((data) => setCases(data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div id="cases" className={styles.CustomerCases}>
      <h2> References </h2>
      <div className={`${styles.CasesContainer} ${styles.wrapper}`}>
        {cases.map((Services) => (
          <div
            key={Services.id}
            style={{
              backgroundImage: `linear-gradient(black, black), url(${Services.img})`,
              backgroundSize: "cover",
              backgroundRepeat: "no-repeat",
              backgroundBlendMode: "saturation",
            }}
            className={styles.Cases}
          >
            <h3>{Services.title}</h3>
            <div className={styles.overlay}>
              <p>→</p>
              <div className={styles.content}>
                {Services.stats.map((stat) => (
                  <h4 key={stat}>{stat}</h4>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyComponent;
