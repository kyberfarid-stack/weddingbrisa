import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
const config = require("../../lib/config");

const MAX_SECONDS = 60;

export default function VoiceNote() {
    const router = useRouter();
    const { event } = router.query;
    const [supported, setSupported] = useState(true);
    const [error, setError] = useState("");
    const [recording, setRecording] = useState(false);
    const [seconds, setSeconds] = useState(0);
    const [audioUrl, setAudioUrl] = useState(null);

  const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const streamRef = useRef(null);
    const timerRef = useRef(null);
    const audioBlobRef = useRef(null);

  useEffect(() => {
        if (!sessionStorage.getItem("guestName") || !sessionStorage.getItem("rawPhotos")) {
                if (event) router.replace(`/${event}`);
                return;
        }
        if (typeof window !== "undefined" && !window.MediaRecorder) {
                setSupported(false);
        }
        return () => {
                stopStream();
                clearInterval(timerRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);

  function stopStream() {
        if (streamRef.current) {
                streamRef.current.getTracks().forEach((t) => t.stop());
                streamRef.current = null;
        }
  }

  async function startRecording() {
        setError("");
        try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                streamRef.current = stream;
                chunksRef.current = [];
                const recorder = new MediaRecorder(stream);
                recorder.ondataavailable = (e) => {
                          if (e.data.size > 0) chunksRef.current.push(e.data);
                };
                recorder.onstop = () => {
                          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
                          audioBlobRef.current = blob;
                          setAudioUrl(URL.createObjectURL(blob));
                          stopStream();
                };
                recorder.start();
                mediaRecorderRef.current = recorder;
                setRecording(true);
                setSeconds(0);
                timerRef.current = setInterval(() => {
                          setSeconds((s) => {
                                      if (s + 1 >= MAX_SECONDS) {
                                                    stopRecording();
                                                    return MAX_SECONDS;
                                      }
                                      return s + 1;
                          });
                }, 1000);
        } catch (err) {
                setError(
                          "Tidak bisa akses mikrofon (butuh izin & koneksi HTTPS). Kamu bisa lewati langkah ini."
                        );
        }
  }

  function stopRecording() {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
                mediaRecorderRef.current.stop();
        }
        clearInterval(timerRef.current);
        setRecording(false);
  }

  function reRecord() {
        setAudioUrl(null);
        audioBlobRef.current = null;
        setSeconds(0);
  }

  async function handleContinue() {
        if (audioBlobRef.current) {
                const reader = new FileReader();
                reader.onload = () => {
                          sessionStorage.setItem("voiceNote", reader.result);
                          router.push(`/${event}/result`);
                };
                reader.readAsDataURL(audioBlobRef.current);
        } else {
                router.push(`/${event}/result`);
        }
  }

  function formatTime(s) {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  return (
        <div className="screen" style={{ background: config.theme.secondary }}>
      <div className="card">
          <h1>Tinggalkan Pesan Suara</h1>
        <p className="subtitle">
            Rekam ucapan selamat singkat buat {config.coupleName} (opsional)
  </p>

{!supported && (
            <p style={{ color: "#a33", fontSize: "0.85rem" }}>
            Browser kamu tidak mendukung rekam suara. Lewati aja langkah ini.
              </p>
        )}

{error && <p style={{ color: "#a33", fontSize: "0.85rem" }}>{error}</p>}

{supported && !audioUrl && (
            <>
              <div
               className="voice-record-btn"
               style={{
                                 background: recording ? "#a33" : config.theme.primary,
               }}
              onClick={recording ? stopRecording : startRecording}
            >
              {recording ? "■" : "●"}
</div>
            <p className="footer-note" style={{ marginTop: 0 }}>
{recording ? `Merekam... ${formatTime(seconds)}` : "Ketuk untuk mulai rekam"}
</p>
  </>
        )}

{audioUrl && (
            <>
              <audio controls src={audioUrl} style={{ width: "100%", marginBottom: 16 }} />
            <button onClick={reRecord} className="btn-secondary">
                Rekam Ulang
  </button>
  </>
        )}

        <button
          onClick={handleContinue}
          style={{ background: config.theme.primary, marginTop: 8 }}
        >
{audioUrl ? "Lanjut" : "Lewati"}
</button>
  </div>
  </div>
  );
}
