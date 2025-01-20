import React, { useState, useEffect } from "react";
import Image from "next/image";
import { CustomerCasesData } from "../model/CustomerCasesModel";
import styles from "../../styles/CustomerCasesStyle.module.css";

const CustomerCases: React.FC = () => {
  const [cases, setCases] = useState<CustomerCasesData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/CustomerCasesData");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setCases(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Fetch error:", error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return <div>Loading cases...</div>;
  }

  return (
    <section id="cases" className={styles.cases_section}>
      <h2>Kunde Cases</h2>
      <div className={styles.cases_container}>
        {cases.map((caseItem) => (
          <article key={caseItem.id} className={styles.case}>
            <div className={styles.case_image_wrapper}>
              <Image
                src={caseItem.img}
                alt={caseItem.title}
                width={400}
                height={300}
                objectFit="cover"
                className={styles.case_image}
              />
            </div>
            <div className={styles.case_content}>
              <h3 className={styles.case_title}>{caseItem.title}</h3>
              <div className={styles.case_stats}>
                {caseItem.stats.map((stat, index) => (
                  <div key={`${caseItem.id}-stat-${index}`} className={styles.case_stat}>
                    {stat}
                  </div>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default CustomerCases;