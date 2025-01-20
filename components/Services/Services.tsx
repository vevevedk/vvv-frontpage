import React, { useState, useEffect } from "react";
import style from "../../styles/Services.module.css";
import CTA from "../CTA/CTA";
import { Stil, Tekst } from "../CTA/CTA";
import { ServicesData } from "../model/ServicesModel";
import { FaCode, FaChartLine, FaPaintBrush } from 'react-icons/fa';

const Services: React.FC = () => {
  const [services, setServices] = useState<ServicesData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const icons = [
    <FaCode key="code" size={50} />,
    <FaChartLine key="chart" size={50} />,
    <FaPaintBrush key="paint" size={50} />
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/ServicesData");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setServices(data);
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
    <section id="services" className={style.BGblue}>
      <h2>Services</h2>
      <div className={`${style.ServicesContainer} ${style.wrapper}`}>
        {services.map((service, index) => (
          <article key={service.title + service.id} className={style.Service}>
            <h3 className={style.header2}>{service.title}</h3>
            <div className={style.icon}>{icons[index]}</div>
            <p>{service.description}</p>
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
          </article>
        ))}
      </div>
    </section>
  );
};

export default Services; 