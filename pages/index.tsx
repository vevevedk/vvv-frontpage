import Head from "next/head";
import Footer from "../components/footer/Footer";

import Services from "../components/Card/Card";
import Hero from "../components/HeroSection/Hero";
import { LinkingModel } from "../components/model/LinkModel";
import Nav from "../components/Nav/Nav";
import Prices from "../components/Prices/Prices";
import CustomerCases from "../components/CustomerCases/CustomerCases";
import AboutMe from "../components/AboutMe/AboutMe";


const Links: LinkingModel[] = [
  new LinkingModel("1", "Beskrivelse af services", "#specs"),
  new LinkingModel("2", "Hvem er jeg", "#about"),
  new LinkingModel("3", "kunde cases", "#cases"),
  new LinkingModel("4", "Priser", "#prices"),
  new LinkingModel("5", "Kontakt", "#contact"),
];

export default function Home() {
  return (
    
    <>
      <Head>
        <title>Veveve</title>
        <meta name="description" content="Internet på jysk" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Nav links={Links} />
      <Hero title="Internet på jysk" />
      <Services />
      <AboutMe />
      <CustomerCases />
      <Prices />
      <Footer />
    </>
      
  );
}
