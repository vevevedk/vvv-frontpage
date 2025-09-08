import React, { useState, useEffect } from "react";
import { PriceData } from "../model/PrisDataModel";
import CTAButton, { Stil, Tekst } from "../CTA/CTA";

const Prices: React.FC = () => {
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/data/prices");
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
    <section id="prices" className="py-16 px-4 bg-white">
      <h2 className="text-center text-4xl md:text-5xl mb-12 text-primary font-semibold">Priser</h2>
      <div className="max-w-wrapper mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 px-4">
        {prices.map((price) => (
          <article
            key={price.id}
            className="bg-white rounded-custom shadow-lg p-8 text-center transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col"
          >
            <h3 className="text-2xl md:text-3xl text-primary mb-6 font-semibold">{price.title}</h3>
            <div className="my-6 flex flex-col items-center gap-2">
              <span className="text-xl text-text">DKK</span>
              <span className="text-4xl md:text-5xl font-bold text-primary">{price.price.toLocaleString()}</span>
              <span className="text-base text-text">ex moms</span>
            </div>
            <p className="text-text mb-8">{price.description}</p>
            <ul className="list-none p-0 m-0 flex-grow mb-8">
              {price.servicesIncluded.map((service, index) => (
                <li
                  key={`${price.id}-service-${index}`}
                  className="py-3 border-b last:border-b-0 border-gray text-text"
                >
                  {service}
                </li>
              ))}
            </ul>
            <div className="mt-auto">
              <a
                href="mailto:hello@veveve.dk"
                className="inline-block py-3 px-6 bg-primary text-white rounded transition-colors duration-300 hover:bg-primary-dark"
              >
                Kontakt
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default Prices;
