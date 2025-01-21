import React, { useState, useEffect } from "react";
import { PriceData } from "../model/PrisDataModel";
import styles from "../../styles/Prices.module.css";
import CTAButton, { Stil, Tekst } from "../CTA/CTA";

const Prices: React.FC = () => {
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/prices");
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        setPrices(data);
      } catch (error) {
        console.error("Fetch error:", error);
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return <div>Loading prices...</div>;
  }

  if (error) {
    return <div>Error loading prices: {error}</div>;
  }

  if (!prices.length) {
    return <div>No pricing information available.</div>;
  }

  return (
    <section id="prices" className={styles.prices_section}>
      <h2>Priser</h2>
      <div className={styles.prices_container}>
        {prices.map((price) => (
          <article key={price.id} className={styles.price_card}>
            <h3 className={styles.price_title}>{price.title}</h3>
            <div className={styles.price_amount}>
              <span className={styles.currency}>DKK</span>
              <span className={styles.amount}>{price.price.toLocaleString()}</span>
              <span className={styles.period}>ex moms</span>
            </div>
            <p className={styles.description}>{price.description}</p>
            <ul className={styles.features_list}>
              {price.servicesIncluded.map((service, index) => (
                <li key={`${price.id}-service-${index}`} className={styles.feature_item}>
                  {service}
                </li>
              ))}
            </ul>
            <div className={styles.cta_wrapper}>
              <CTAButton
                stil={Stil.blue}
                tekst={Tekst.kontakt}
                popup={
                  <div>
                    <h3>{price.title}</h3>
                    <p>{price.description}</p>
                    <ul>
                      {price.servicesIncluded.map((service, index) => (
                        <li key={`popup-${price.id}-service-${index}`}>{service}</li>
                      ))}
                    </ul>
                  </div>
                }
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default Prices;
