import { useState } from "react";
import { useRouter } from "next/router";
import useSiteConfig from "../../lib/useSiteConfig";
import GuestCoverView from "../../components/GuestCoverView";

export default function GuestEntry() {
  const router = useRouter();
  const { event } = router.query;
  const { site, loading } = useSiteConfig(event);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const handleContinue = () => {
    if (!name.trim()) return;
    sessionStorage.setItem("guestName", name.trim());
    sessionStorage.setItem("guestMessage", message.trim());
    router.push(`/${event}/template`);
  };

  if (loading) {
    return (
      <div className="screen">
        <p>Memuat...</p>
      </div>
    );
  }

  return (
    <GuestCoverView
      site={site}
      name={name}
      message={message}
      onNameChange={setName}
      onMessageChange={setMessage}
      onSubmit={handleContinue}
      interactive
    />
  );
}
