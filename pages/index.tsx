import Head from "next/head";
import { GetServerSidePropsContext } from "next";
import Footer from "../components/footer/Footer";
import Nav from "../components/Nav/Nav";
import Hero from "../components/HeroSection/Hero";
import Services from "../components/Services/Services";
import Prices from "../components/Prices/Prices";
import CustomerCases from "../components/CustomerCases/CustomerCases";
import AboutMe from "../components/AboutMe/AboutMe";
import { LinkingModel } from "../components/model/LinkModel";
import VeveveIOHome from "./io/index";

const Links: LinkingModel[] = [
  new LinkingModel("1", "Services", "#services"),
  new LinkingModel("2", "Om os", "#about"),
  new LinkingModel("3", "Cases", "#cases"),
  new LinkingModel("4", "Priser", "#prices"),
  new LinkingModel("5", "Kontakt", "#contact"),
  // Login removed - redirects to veveve.io/login via middleware
];

interface HomeProps {
  domain: string;
}

export default function Home({ domain }: HomeProps) {
  // If veveve.io, show English frontpage
  if (domain === 'veveve.io' || domain === 'www.veveve.io') {
    return <VeveveIOHome />;
  }

  // Otherwise, show Danish frontpage (veveve.dk)
  return (
    <>
      <Head>
        <title>Veveve - AI-Powered Marketing Analytics Platform</title>
        <meta name="description" content="Unify your marketing data across channels. Get real-time insights powered by AI. Make data-driven decisions that accelerate growth. Multi-channel analytics, AI-powered attribution, and predictive analytics for modern marketers." />
        <meta name="keywords" content="marketing analytics, AI attribution, marketing data, multi-channel analytics, marketing automation, marketing insights" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="Veveve - AI-Powered Marketing Analytics Platform" />
        <meta property="og:description" content="Unify your marketing data across channels. Get real-time insights powered by AI." />
        <meta property="og:type" content="website" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Nav links={Links} />
      <Hero 
        title="AI-Powered Marketing Analytics That Drive Growth"
        subtitle="Unify your marketing data across channels. Get real-time insights powered by AI. Make data-driven decisions that accelerate growth."
        ctaPrimary={{ text: "Start Free Trial", href: "/register" }}
        ctaSecondary={{ text: "See How It Works", href: "#services" }}
      />
      <Services />
      <AboutMe />
      <CustomerCases />
      <Prices />
      <Footer />
    </>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const host = context.req.headers.host || '';
  const domain = host.split(':')[0]; // Remove port if present

  return {
    props: {
      domain,
    },
  };
}
