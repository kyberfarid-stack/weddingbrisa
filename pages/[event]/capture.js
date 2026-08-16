import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import useSiteConfig from "../../lib/useSiteConfig";

export default function Capture() {
        const router = useRouter();
        const { event } = router.query;
        const { site, loading } = useSiteConfig(event);
        const videoRef = useRef(null);
        const streamRef = useRef(null);
        const [error, setError] = useState("");
        const [facingMode, setFacingMode] = useState("user");
        const [ready, setReady] = useState(false);
        const [photoCount, setPhotoCount] = useState(1);
        const [shots, setShots] = useState([]);

  useEffect(() => {
            if (!sessionStorage.getItem("guestName") || !sessionStorage.getItem("templateId")) {
                        router.replace(`/${event}`);
                        return;
            }
            const count = parseInt(sessionStorage.getItem("photoCount") || "1", 10);
            setPhotoCount(count);
            startCamera(facingMode);
            return () => stopCamera();
            // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);

  async function startCamera(mode) {
            stopCamera();
            setError("");
            try {
                        const stream = await navigator.mediaDevices.getUserMedia({
                                      video: { facingMode: mode },
                                      audio: false,
                        });
                        streamRef.current = stream;
                        if (videoRef.current) {
                                      videoRef.current.srcObject = stream;
                                      setReady(true);
                        }
            } catch (err) {
                        setError(
                                      "Tidak bisa akses kamera (butuh izin & koneksi HTTPS). Kamu masih bisa upload foto dari galeri di bawah."
                                    );
            }
  }

  function stopCamera() {
            if (streamRef.current) {
                        streamRef.current.getTracks().forEach((t) => t.stop());
                        streamRef.current = null;
            }
  }

  function switchCamera() {
            const next = facingMode === "user" ? "environment" : "user";
            setFacingMode(next);
            startCamera(next);
  }

  function finishOrContinue(nextShots) {
            if (nextShots.length >= photoCount) {
                        stopCamera();
                        sessionStorage.setItem("rawPhotos", JSON.stringify(nextShots));
                        router.push(`/${event}/voicenote`);
            } else {
                        setShots(nextShots);
            }
  }

  function takePhoto() {
            const video = videoRef.current;
            if (!video) return;
            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d");
            // mirror if front camera for natural selfie look
          if (facingMode === "user") {
                      ctx.translate(canvas.width, 0);
                      ctx.scale(-1, 1);
          }
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
            finishOrContinue([...shots, dataUrl]);
  }

  function handleUpload(e) {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
                        finishOrContinue([...shots, reader.result]);
            };
            reader.readAsDataURL(file);
            e.target.value = "";
  }

  const shotNumber = shots.length + 1;

  if (loading) {
            return (
                        <div className="screen">
                          <p>Memuat...</p>
                  </div>
            );
  }

  return (
            <div className="screen" style={{ background: site.theme.secondary, fontFamily: site.fontBody }}>
      <div className="card">
              <h1>Ambil Foto</h1>
        <p className="subtitle">
{photoCount > 1
            ? `Foto ke-${shotNumber} dari ${photoCount}`
                  : "Posisikan wajah kamu, lalu tekan tombol foto"}
</p>

        <div className="camera-wrap">
                <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
                                transform: facingMode === "user" ? "scaleX(-1)" : "none",
            }}
          />
                </div>

{error && <p style={{ color: "#a33", fontSize: "0.85rem" }}>{error}</p>}

{ready && (
                <>
                  <div className="shutter-btn" onClick={takePhoto} />
                  <button
               className="btn-secondary"
               onClick={switchCamera}
               style={{ marginBottom: 20 }}
            >
              Ganti Kamera
                    </button>
                    </>
        )}

        <label className="btn btn-secondary" style={{ display: "block" }}>
          Upload dari Galeri
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            style={{ display: "none" }}
          />
                </label>
                </div>
                </div>
  );
}
