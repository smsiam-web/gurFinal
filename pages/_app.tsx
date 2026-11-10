
// pages/_app.tsx
import "../styles/globals.css";
import type { AppProps } from "next/app";
import Layout from "../app/layout";
import { Provider } from "react-redux";
import { store } from "@/app/redux/store";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // Map routes to titles
  const routeTitles: Record<string, string> = {
    "/": "E-commerce",
    "/place-order": "Orders",
    "/products": "Products",
    "/place-order/add-new": "Create Order",
    "/delivery-report": "Delivery Report",
    "/support-tickets": "Tickets",
    "/category": "Categorys",
    "/customers": "Customers",
    "/orders": "Orders",
    "/coupons": "Coupons",
    "/our-staff": "Our Staff",
    "/setting": "Setting",
  };

  const title = process.env.APP_TITLE || "";

  // Single text node for <title>
  const pageTitle = `${title} || ${routeTitles[router.pathname] ?? "E-commerce"}`;

  // Register service worker only in production, after window load
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const onLoad = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          // Optional: basic update flow
          reg.onupdatefound = () => {
            const sw = reg.installing;
            if (!sw) return;
            sw.onstatechange = () => {
              if (
                sw.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                console.info("A new version is available. Reload to update.");
              }
            };
          };
        })
        .catch(console.error);
    };

    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  // Absolute canonical for OG
  const CANONICAL = `https://aamwala.netlify.app${router.asPath.split("?")[0]}`;

  return (
    <Provider store={store}>
      <Head>
        {/* PWA */}
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#0ea5e9" />
        <link rel="icon" href="/icons/icon-192.png" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />

        {/* Title/Description */}
        <title>{pageTitle}</title>
        <meta
          name="description"
          content="Order your favorite products easily"
        />

        {/* Canonical */}
        <link rel="canonical" href={CANONICAL} />

        {/* Open Graph */}
        <meta property="og:locale" content="bn_BD" key="og:locale" />
        <meta property="og:type" content="website" key="og:type" />
        <meta property="og:site_name" content={title} key="og:site_name" />
        <meta property="og:title" content={pageTitle} key="og:title" />
        <meta
          property="og:description"
          content="Order your favorite products easily"
          key="og:description"
        />
        <meta property="og:url" content={CANONICAL} key="og:url" />
        <meta
          property="og:image"
          content="https://aamwala.netlify.app/og/home-1200x630.jpg"
          key="og:image"
        />
        <meta property="og:image:width" content="1200" key="og:image:width" />
        <meta property="og:image:height" content="630" key="og:image:height" />
        <meta
          property="og:image:alt"
          content={`${title} - E-commerce`}
          key="og:image:alt"
        />

        {/* Twitter Card */}
        <meta
          name="twitter:card"
          content="summary_large_image"
          key="twitter:card"
        />
        <meta name="twitter:title" content={pageTitle} key="twitter:title" />
        <meta
          name="twitter:description"
          content="Order your favorite products easily"
          key="twitter:description"
        />
        <meta
          name="twitter:image"
          content="https://aamwala.netlify.app/og/home-1200x630.jpg"
          key="twitter:image"
        />
      </Head>

      <MantineProvider withNormalizeCSS withGlobalStyles>
        <Layout>
          <Notifications position="top-right" autoClose={2000} />
          <Component {...pageProps} />
        </Layout>
      </MantineProvider>
    </Provider>
  );
}
