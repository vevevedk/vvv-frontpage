import { useState, useEffect } from "react";
import React from "react";
import { PriceData } from "../model/PrisDataModel";
import style from "../../styles/priceStyle.module.css";
import CTA, { stil, tekst } from "../CTA/CTA";

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

  return (
    <>
      {domLoaded &&
        (width >= 800 ? (
          <>
            <div id="prices" className={style.wrapper}>
              <h2>Beskrivelse af priser</h2>
              <div className={style.content}>
                {price.map((prices) => (
                  <div
                    key={prices.price + prices.id}
                    className={`${style.cards} card`}
                  >
                    <div className={style.priceBox}>
                      <h3 className={style.price}>Dkk {prices.price}/Måned </h3>
                      <p className={style.smallText}> Dkk ex moms</p>
                    </div>
                    <div className={style.textBox}>
                      <h3> {prices.title}</h3>
                      {prices.servicesIncluded.map((service) => (
                        <ul
                          key={prices.title + prices.id}
                          className={style.inc}
                        >
                          <li>
                            <p> {service}</p>
                          </li>
                        </ul>
                      ))}{" "}
                    </div>
                    <div className={style.CTA}>
                      <CTA
                        stil={stil.orange}
                        tekst={tekst.kontakt}
                        popup={
                          <div>
                            <h3> Oih diz is da shizzle</h3>
                          </div>
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className={style.priceWrap}>
              <h2>Beskrivelse af priser</h2>
              <div className={style.tabBar}>
                {price.map((prices) => (
                  <button
                    className={`${style.tabButton} ${
                      activeTab === prices.title ? style.activeTabButton : ""
                    }`}
                    key={prices.price + prices.id}
                    onClick={() => handleTabClick(prices.title)}
                  >
                    <h3 className={style.title}>{prices.title}</h3>
                  </button>
                ))}
              </div>
              <div className={style.content}>
                {price.map((prices) => (
                  <div
                    key={prices.title + prices.id}
                    className={
                      activeTab === prices.title ? "" : style.inactiveTab
                    }
                  >
                    <h3> {prices.title}</h3>
                    {prices.servicesIncluded.map((service) => (
                      <ul
                        key={prices.title + prices.id + service}
                        className={style.inc}
                      >
                        <li>
                          <p> {service}</p>
                        </li>
                      </ul>
                    ))}
                    <p className={style.price}>{prices.price} Dkk ex moms</p>
                  </div>
                ))}
                <CTA
                  stil={stil.orange}
                  tekst={tekst.kontakt}
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
