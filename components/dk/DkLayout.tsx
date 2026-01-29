import Head from "next/head";
import React from "react";
import DkFooter from "./DkFooter";
import DkNav from "./DkNav";

type Props = {
  title?: string;
  description?: string;
  children: React.ReactNode;
};

const DEFAULT_TITLE = "veveve — Boutique performance marketing for danske virksomheder";
const DEFAULT_DESCRIPTION =
  "Vi hjælper danske SMB’er med at få mere ud af Google Ads, Meta og tracking — med tæt samarbejde og tydelige resultater.";

export default function DkLayout({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  children,
}: Props) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <DkNav />
      <main>{children}</main>
      <DkFooter />
    </>
  );
}

