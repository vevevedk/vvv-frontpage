import React from "react";

const CustomerCases: React.FC = () => {
  const cases = [
    {
      id: 1,
      title: "Wo Clé",
      logo: "/images/cases/wocle.svg",
      stats: [
        "Fra 0 til 20 t. kr. månedlig omsætning",
        "ROAS 8 opnået indenfor 6 mdr."
      ]
    },
    {
      id: 2,
      title: "Crossfit Lageret Holstebro",
      logo: "/images/cases/crossfit-lageret.jpg",
      stats: [
        "50% reduktion i Ad Spend på Google",
        "Top placering på vigtigste søgninger på Google"
      ]
    },
    {
      id: 3,
      title: "Porsaco",
      logo: "/images/cases/porsa.png",
      stats: [
        "Opsætning af konverteringssporing i Google Analytics",
        "Robust kampagnestruktur på Google Search Ads"
      ]
    }
  ];

  return (
    <section id="cases" className="py-16 px-4 bg-white">
      <h2 className="text-center text-4xl md:text-5xl mb-12 text-primary font-semibold">Kunde cases</h2>
      <div className="max-w-wrapper mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 px-4">
        {cases.map((caseItem) => (
          <article
            key={caseItem.id}
            className="bg-white rounded-custom shadow-lg overflow-hidden transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="relative w-full h-[150px] flex justify-center items-center overflow-hidden p-6">
              <img
                src={caseItem.logo}
                alt={caseItem.title}
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4 text-primary text-center w-full">{caseItem.title}</h3>
              <div className="flex flex-col gap-3 text-center w-full">
                {caseItem.stats.map((stat, index) => (
                  <div
                    key={`${caseItem.id}-stat-${index}`}
                    className="bg-gray-light py-3 px-4 rounded-lg text-base text-text text-center transition-colors duration-300 group-hover:bg-primary group-hover:text-white"
                  >
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