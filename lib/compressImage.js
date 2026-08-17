// Kompres & convert gambar ke WebP (fallback JPEG kalau browser belum dukung
// encode WebP) langsung di browser SEBELUM dikirim ke server. Ini yang bikin
// upload admin (background/overlay/hero) dan foto tamu jauh lebih ringan &
// cepat dimuat tamu lain, tanpa kelihatan bedanya secara visual.

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImageFromDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

function canvasSupportsWebp(canvas) {
  try {
    return canvas.toDataURL("image/webp").indexOf("data:image/webp") === 0;
  } catch (e) {
    return false;
  }
}

// Resize (kalau lebih besar dari maxDim) + re-encode ke WebP/JPEG.
// Mengembalikan { dataUrl, mime, ext }.
export function compressImageEl(img, { maxDim = 2000, quality = 0.85 } = {}) {
  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;
  if (Math.max(width, height) > maxDim) {
    const scale = maxDim / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  const useWebp = canvasSupportsWebp(canvas);
  const mime = useWebp ? "image/webp" : "image/jpeg";
  const dataUrl = canvas.toDataURL(mime, quality);
  return { dataUrl, mime, ext: useWebp ? "webp" : "jpg" };
}

// Buat File dari <input type="file"> (upload gambar admin / galeri tamu).
export async function compressFile(file, opts) {
  const dataUrl = await readFileAsDataUrl(file);
  const img = await loadImageFromDataUrl(dataUrl);
  return compressImageEl(img, opts).dataUrl;
}

// Buat dataURL yang sudah ada (mis. hasil canvas.toDataURL lain).
export async function compressDataUrl(dataUrl, opts) {
  const img = await loadImageFromDataUrl(dataUrl);
  return compressImageEl(img, opts).dataUrl;
}

// Cek dukungan WebP dari sebuah <canvas> yang sudah ada (dipakai result.js
// yang sudah punya canvas hasil render, tidak perlu resize ulang).
export function canvasToCompressedOutput(canvas, quality = 0.9) {
  const useWebp = canvasSupportsWebp(canvas);
  const mime = useWebp ? "image/webp" : "image/jpeg";
  const dataUrl = canvas.toDataURL(mime, quality);
  return { dataUrl, mime, ext: useWebp ? "webp" : "jpg" };
}
