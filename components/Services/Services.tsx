import React from "react";
import { FaSearch, FaShareSquare, FaChartLine } from 'react-icons/fa';

const Services: React.FC = () => {
  const services = [
    {
      id: 1,
      title: "Search Engine Marketing (SEM)",
      description: "Markedsføring på søgemaskiner. Optimering af Google Ads kampagner, Google My Business og Google Search Console",
      icon: <FaSearch size={50} />
    },
    {
      id: 2,
      title: "Social Media Marketing (SMM)",
      description: "Markedsføring på sociale medier. Facebook, Instagram, LinkedIn, TikTok og andre sociale platforme.",
      icon: <FaShareSquare size={50} />
    },
    {
      id: 3,
      title: "Analyse & Rapportering",
      description: "Analyse af markedsføring og kampagner. Rapportering af kampagner og resultater.",
      icon: <FaChartLine size={50} />
    }
  ];

  return (
    <section id="services" className="bg-primary py-16 px-4">
      <h2 className="text-center text-4xl md:text-5xl mb-12 font-semibold text-white">Services</h2>
      <div className="max-w-wrapper mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
        {services.map((service) => (
          <article
            key={service.id}
            className="bg-white rounded-custom shadow-lg p-8 text-center transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col items-center"
          >
            <h3 className="text-2xl md:text-3xl mb-6 font-semibold text-primary">{service.title}</h3>
            <div className="text-primary my-8 flex justify-center items-center transition-transform duration-300 group-hover:scale-110">
              {service.icon}
            </div>
            <p className="text-text leading-relaxed mb-6">{service.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
};

export default Services; 