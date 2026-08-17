import Head from "next/head";
import HomepageView from "../components/HomepageView";
const config = require("../lib/config");
const db = require("../lib/db");

export async function getServerSideProps() {
  const blocks = await db.getHomepageContent(config.eventSlug);
  return { props: { blocks } };
}

export default function Landing({ blocks }) {
  const adminHref = `/${config.eventSlug}/admin`;
  const demoHref = `/${config.eventSlug}`;

  return (
    <>
      <Head>
        <title>Virtual Photobooth — Untuk Hari Bahagia Kamu</title>
        <link
          href="https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap"
          rel="stylesheet"
        />
      </Head>
      <HomepageView blocks={blocks} adminHref={adminHref} demoHref={demoHref} />
    </>
  );
}
