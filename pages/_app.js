import Head from "next/head";
import "../styles/globals.css";

export default function App({ Component, pageProps }) {
      return (
              <>
                <Head>
                  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
                  <link
              href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Dancing+Script:wght@500;700&family=Playfair+Display:ital@0;1&family=Poppins:wght@400;600;700&family=Lora:ital@0;1&display=swap"
              rel="stylesheet"
            />
                  </Head>
          <Component {...pageProps} />
                  </>
      );
}
