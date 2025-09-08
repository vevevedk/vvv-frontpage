import React from "react";

const AboutMe: React.FC = () => {
  return (
    <section id="about" className="py-16 px-4 bg-gray-100">
      <div className="max-w-wrapper mx-auto">
        <article className="bg-white rounded-custom shadow-lg p-8 md:p-12">
          <h2 className="text-center text-4xl md:text-5xl mb-8 text-primary font-semibold">Hvem er vi</h2>
          <p className="text-text leading-relaxed text-lg">
            Vi er specialister i markedsføring og digital kommunikation med +12 års erfaring. Vi har erfaring fra en lang række virksomheder inden for e-handel, rejsebranchen og serviceerhverv. Gennem mange års erfaring har vi opbygget et bredt fundament, som gør, at vi ud fra specialistarbejdet kan tilbyde vores kunder kompetent vejledning om, hvor i processen de befinder sig i forhold til deres mål.
          </p>
        </article>
      </div>
    </section>
  );
};

export default AboutMe;