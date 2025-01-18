import React, { useState, useEffect } from "react";
import style from "../../styles/CardsStyle.module.css";
import CTA from "../CTA/CTA";
import { Stil, Tekst } from "../CTA/CTA";
import { ServicesData } from "../model/CardDataModel";

const MyComponent: React.FC = () => {
  const [cards, setCards] = useState<ServicesData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/CardData");
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setCards(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Fetch error:", error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return <div>Loading services...</div>;
  }

  return (
    <div id="specs" className={style.BGblue}>
      <h2>Services</h2>
      <div className={`${style.CardContainer} ${style.wrapper}`}>
        {cards.map((service) => (
          <div key={service.title + service.id} className={style.Card}>
            <h3 className={style.header2}>
              {service.title.split(" ").slice(0, 10).join(" ")}
            </h3>
            {service.url ? (
              <img
                src={service.url}
                alt={service.title}
                className={style.img}
              />
            ) : null}
            <p>
              {service.description.split(" ").slice(0, 30).join(" ") + "..."}
            </p>
            <div className={style.cta}>
              <CTA
                stil={Stil.blue}
                tekst={Tekst.kontakt}
                popup={
                  <div>
                    <h3>{service.title}</h3>
                    {service.description}
                  </div>
                }
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyComponent;