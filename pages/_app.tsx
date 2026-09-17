import type { AppProps } from "next/app";
import Head from "next/head";
import "@/styles/globals.css";
import { uz } from "@/lib/uz";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>{uz.siteTitle}</title>
        <meta name="description" content={uz.tagline} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
