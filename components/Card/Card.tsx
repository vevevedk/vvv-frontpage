import React, { useState, useEffect } from "react";
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
    <div id="specs" className="bg-primary py-16 px-4">
      <h2 className="text-center text-4xl md:text-5xl mb-12 font-semibold text-white">Services</h2>
      <div className="max-w-wrapper mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {cards.map((service) => (
          <div key={service.title + service.id} className="bg-white rounded-custom shadow-lg p-8 text-center transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col">
            <h3 className="text-2xl md:text-3xl mb-6 font-semibold text-primary">
              {service.title.split(" ").slice(0, 10).join(" ")}
            </h3>
            {service.url ? (
              <img
                src={service.url}
                alt={service.title}
                className="w-full h-48 object-cover rounded-lg mb-6"
              />
            ) : null}
            <p className="text-text leading-relaxed mb-6 flex-grow">
              {service.description.split(" ").slice(0, 30).join(" ") + "..."}
            </p>
            <div className="mt-auto">
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