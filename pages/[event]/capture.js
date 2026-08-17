import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import useSiteConfig from "../../lib/useSiteConfig";
import { compressFile, canvasToCompressedOutput } from "../../lib/compressImage";

// Foto tamu di-cap ke lebar maksimal ini sebelum di-encode — kamera HP modern
// bisa 3000-4000px lebar, jauh lebih besar dari yang dibutuhkan hasil akhir
// (canvas hasil cuma 1080px), jadi men-downscale di sini bikin upload & load
// jauh lebih cepat tanpa kelihatan bedanya di hasil akhir.
const CAPTURE_MAX_DIM = 1600;

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
    setReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = stream;
        // PENTING: jangan aktifkan tombol jepret sebelum video benar-benar punya
        // frame gambar (readyState >= 2 / event "loadeddata"). Kalau tombol aktif
        // lebih dulu, tamu bisa jepret saat buffer video masih kosong/noise —
        // hasilnya foto gelap bergaris-garis seperti static TV, bukan wajah tamu.
        const markReady = () => setReady(true);
        video.onloadeddata = markReady;
        if (video.readyState >= 2) markReady();
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
    if (!video || !video.videoWidth || !video.videoHeight) return;
    let w = video.videoWidth;
    let h = video.videoHeight;
    if (Math.max(w, h) > CAPTURE_MAX_DIM) {
      const scale = CAPTURE_MAX_DIM / Math.max(w, h);
      w = Math.round(w * scale);
      h = Math.round(h * scale);
    }
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    // mirror if front camera for natural selfie look
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, w, h);
    const { dataUrl } = canvasToCompressedOutput(canvas, 0.85);
    finishOrContinue([...shots, dataUrl]);
  }

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const dataUrl = await compressFile(file, { maxDim: CAPTURE_MAX_DIM, quality: 0.85 });
      finishOrContinue([...shots, dataUrl]);
    } catch (err) {
      setError("Gagal memproses foto dari galeri, coba lagi.");
    }
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
