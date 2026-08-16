import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
const config = require("../../lib/config");

const CANVAS_W = 1080;

export default function Result() {
      const router = useRouter();
      const { event } = router.query;
      const canvasRef = useRef(null);
      const [guestName, setGuestName] = useState("");
      const [templateId, setTemplateId] = useState("");
      const [saveStatus, setSaveStatus] = useState("");
      const [shareSupported, setShareSupported] = useState(false);
      const [voiceUrl, setVoiceUrl] = useState(null);

  useEffect(() => {
          const name = sessionStorage.getItem("guestName");
          const tId = sessionStorage.getItem("templateId");
          const rawPhotosJson = sessionStorage.getItem("rawPhotos");
          const voiceNote = sessionStorage.getItem("voiceNote");
          if (!name || !tId || !rawPhotosJson || !event) {
                    if (event) router.replace(`/${event}`);
                    return;
          }
          setGuestName(name);
          setTemplateId(tId);
          setVoiceUrl(voiceNote || null);
          setShareSupported(typeof navigator !== "undefined" && !!navigator.share);

                const photos = JSON.parse(rawPhotosJson);
          const template = config.templates.find((t) => t.id === tId) || config.templates[0];

                const draw = async () => {
                          if (document.fonts) {
                                      try {
                                                    await document.fonts.load("80px 'Great Vibes'");
                                                    await document.fonts.load("32px 'Playfair Display'");
                                      } catch (e) {}
                          }
                          const images = await Promise.all(
                                      photos.map(
                                                    (src) =>
                                                                    new Promise((resolve) => {
                                                                                      const img = new Image();
                                                                                      img.onload = () => resolve(img);
                                                                                      img.src = src;
                                                                    })
                                                  )
                                    );
                          renderCanvas(images, template, name);
                };
          draw();
          // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);

  function computeLayout(count, isPolaroid) {
          const outerPad = isPolaroid ? 60 : 90;
          if (count <= 1) {
                    const w = CANVAS_W - outerPad * 2;
                    const h = w * 1.05;
                    return {
                                slots: [{ x: outerPad, y: outerPad, w, h }],
                                footerY: outerPad + h,
                    };
          }
          const stripW = 700;
          const stripX = (CANVAS_W - stripW) / 2;
          const slotH = 440;
          const gap = 22;
          const slots = [];
          for (let i = 0; i < count; i++) {
                    slots.push({ x: stripX, y: outerPad + i * (slotH + gap), w: stripW, h: slotH });
          }
          const footerY = outerPad + count * slotH + (count - 1) * gap;
          return { slots, footerY };
  }

  function renderCanvas(images, template, name) {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const isPolaroid = template.style === "polaroid";
          const { slots, footerY } = computeLayout(images.length, isPolaroid);
          const footerHeight = (isPolaroid ? 100 : 110) + 140 + 40;
          const canvasH = footerY + footerHeight;

        canvas.width = CANVAS_W;
          canvas.height = canvasH;
          const ctx = canvas.getContext("2d");

        ctx.fillStyle = template.background;
          ctx.fillRect(0, 0, CANVAS_W, canvasH);

        slots.forEach((slot, i) => {
                  drawImageCover(ctx, images[i], slot.x, slot.y, slot.w, slot.h);
                  ctx.strokeStyle = template.accent;
                  ctx.lineWidth = isPolaroid ? 4 : 6;
                  ctx.strokeRect(slot.x, slot.y, slot.w, slot.h);
                  if (!isPolaroid) {
                              drawCorners(ctx, slot.x, slot.y, slot.w, slot.h, template.accent);
                  }
        });

        ctx.fillStyle = template.textColor;
          ctx.textAlign = "center";
          ctx.font = "90px 'Great Vibes', cursive";
          const nameY = footerY + (isPolaroid ? 100 : 110);
          ctx.fillText(config.coupleName, CANVAS_W / 2, nameY);

        ctx.font = "28px 'Playfair Display', serif";
          ctx.fillText(config.weddingDate, CANVAS_W / 2, nameY + 50);

        ctx.font = "24px 'Playfair Display', serif";
          ctx.fillStyle = template.accent;
          ctx.fillText(`${config.thankYouMessage}`, CANVAS_W / 2, nameY + 100);
          ctx.font = "italic 22px 'Playfair Display', serif";
          ctx.fillStyle = template.textColor;
          ctx.fillText(`- ${name} -`, CANVAS_W / 2, nameY + 140);
  }

  function drawImageCover(ctx, img, x, y, w, h) {
          const imgRatio = img.width / img.height;
          const boxRatio = w / h;
          let sx, sy, sw, sh;
          if (imgRatio > boxRatio) {
                    sh = img.height;
                    sw = sh * boxRatio;
                    sx = (img.width - sw) / 2;
                    sy = 0;
          } else {
                    sw = img.width;
                    sh = sw / boxRatio;
                    sx = 0;
                    sy = (img.height - sh) / 2;
          }
          ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  }

  function drawCorners(ctx, x, y, w, h, color) {
          const len = 40;
          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
          const corners = [
                    [x - 15, y - 15, len, 0, 0, len],
                    [x + w + 15, y - 15, -len, 0, 0, len],
                    [x - 15, y + h + 15, len, 0, 0, -len],
                    [x + w + 15, y + h + 15, -len, 0, 0, -len],
                  ];
          corners.forEach(([cx, cy, dx1, dy1, dx2, dy2]) => {
                    ctx.beginPath();
                    ctx.moveTo(cx + dx1, cy + dy1);
                    ctx.lineTo(cx, cy);
                    ctx.lineTo(cx + dx2, cy + dy2);
                    ctx.stroke();
          });
  }

  async function handleSaveAndDownload() {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const dataUrl = canvas.toDataURL("image/jpeg", 0.95);

        const a = document.createElement("a");
          a.href = dataUrl;
          a.download = `${config.coupleName.replace(/\s/g, "-")}-${guestName.replace(/\s/g, "-")}.jpg`;
          a.click();

        persistGuest(dataUrl);
  }

  async function persistGuest(dataUrl) {
          setSaveStatus("Menyimpan...");
          try {
                    const res = await fetch("/api/guests", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                              name: guestName,
                                              templateId,
                                              photoDataUrl: dataUrl,
                                              voiceNoteDataUrl: voiceUrl || null,
                                              message: sessionStorage.getItem("guestMessage") || null,
                                }),
                    });
                    if (res.ok) setSaveStatus("Tersimpan ✓");
                    else setSaveStatus("");
          } catch (e) {
                    setSaveStatus("");
          }
  }

  async function handleShare() {
          const canvas = canvasRef.current;
          if (!canvas) return;
          canvas.toBlob(async (blob) => {
                    const file = new File([blob], "photobooth.jpg", { type: "image/jpeg" });
                    try {
                                await navigator.share({
                                              files: [file],
                                              title: config.coupleName,
                                              text: `Momen fotobooth di pernikahan ${config.coupleName}`,
                                });
                    } catch (e) {
                                // user cancelled share, no-op
                    }
          }, "image/jpeg", 0.95);
          persistGuest(canvas.toDataURL("image/jpeg", 0.95));
  }

  function handleRetake() {
          sessionStorage.removeItem("rawPhotos");
          sessionStorage.removeItem("voiceNote");
          router.push(`/${event}/capture`);
  }

  return (
          <>
            <Head>
              <link
              href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Playfair+Display:ital@0;1&display=swap"
              rel="stylesheet"
            />
                  </Head>
          <div className="screen" style={{ background: config.theme.secondary }}>
        <div className="card">
              <h1>Hasil Fotomu</h1>
          <canvas ref={canvasRef} className="result-canvas" />
{voiceUrl && (
                <p className="footer-note" style={{ marginTop: -8 }}>
              🎙 Pesan suara kamu ikut tersimpan
                  </p>
          )}
{shareSupported ? (
                <button onClick={handleShare} style={{ background: config.theme.primary }}>
              Share ke Sosmed
    </button>
              ) : null}
          <button onClick={handleSaveAndDownload} className="btn-secondary">
                          Download Foto
              </button>
          <button onClick={handleRetake} className="btn-secondary">
                          Ambil Ulang
              </button>
{saveStatus && <p className="footer-note">{saveStatus}</p>}
           <p className="footer-note">
                Setelah download, kamu bisa upload sendiri ke Instagram/WhatsApp/TikTok
             langsung dari galeri HP kamu.
                 </p>
                 </div>
                 </div>
                 </>
   );
}
