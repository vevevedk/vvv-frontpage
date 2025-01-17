import { useState, useEffect } from "react";
import React from "react";
import { PriceData } from "../model/PrisDataModel";
import styles from "../../styles/Prices.module.css";
import CTAButton, { Stil, Tekst } from "../CTA/CTA";

const Prices: React.FC = () => {
  const [domLoaded, setDomLoaded] = useState(false);
  const [price, setPrices] = useState<PriceData[]>([]);
  const [activeTab, setActiveTab] = useState<string>("");
  let [width, setWidth] = useState<number>((): number => {
    if (typeof window !== "undefined") {
      return window.innerWidth;
    } else {
      return 0;
    }
  });

  useEffect(() => {
    setDomLoaded(true);
  }, []);

  useEffect(() => {
    fetch(process.env.NEXT_PUBLIC_BASEPATH + "api/PricesData")
      .then((res) => res.json())
      .then((data) => {
        setPrices(data);
        setActiveTab(data[1].title);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleTabClick = (tabTitle: string) => {
    setActiveTab(tabTitle);
  };

  const services = [
    { id: 1, name: "Service 1", description: "Description 1" },
    { id: 2, name: "Service 2", description: "Description 2" },
    // Add more services as needed
  ];

  return (
    <>
      {domLoaded &&
        (width >= 800 ? (
          <>
            <div id="prices" className={styles.prices_section}>
              <h2>Prices</h2>
              <div className={styles.prices_container}>
                {services.map((service) => (
                  <div key={service.id} className={styles.price}>
                    <h3>{service.name}</h3>
                    <p>{service.description}</p>
                    <CTAButton
                      stil={Stil.orange}
                      tekst={Tekst.kontakt}
                      popup={
                        <div>
                          <h3>{service.name}</h3>
                          <p>{service.description}</p>
                        </div>
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className={styles.priceWrap}>
              <h2>Beskrivelse af priser</h2>
              <div className={styles.tabBar}>
                {price.map((prices) => (
                  <button
                    className={`${styles.tabButton} ${
                      activeTab === prices.title ? styles.activeTabButton : ""
                    }`}
                    key={prices.price + prices.id}
                    onClick={() => handleTabClick(prices.title)}
                  >
                    <h3 className={styles.title}>{prices.title}</h3>
                  </button>
                ))}
              </div>
              <div className={styles.content}>
                {price.map((prices) => (
                  <div
                    key={prices.title + prices.id}
                    className={
                      activeTab === prices.title ? "" : styles.inactiveTab
                    }
                  >
                    <h3> {prices.title}</h3>
                    {prices.servicesIncluded.map((service) => (
                      <ul
                        key={prices.title + prices.id + service}
                        className={styles.inc}
                      >
                        <li>
                          <p> {service}</p>
                        </li>
                      </ul>
                    ))}
                    <p className={styles.price}>{prices.price} Dkk ex moms</p>
                  </div>
                ))}
                <CTAButton
                  stil={Stil.orange}
                  tekst={Tekst.kontakt}
                  popup={
                    <div>
                      <h3> Oih diz is da shizzle</h3>
                    </div>
                  }
                />
              </div>
            </div>
          </>
        ))}
    </>
  );
};

export default Prices;
