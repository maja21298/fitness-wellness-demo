/**
 * Decode a camera / gallery image in the browser, apply EXIF orientation where supported,
 * resize, and output JPEG + base64 for Cloud Functions / Gemini (avoids HEIC + huge payloads on mobile).
 */
export async function fileToJpegBase64ForApi(file, maxSide = 1600, quality = 0.88) {
  let w0;
  let h0;
  let render;

  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    w0 = bitmap.width;
    h0 = bitmap.height;
    render = (ctx, dw, dh) => {
      ctx.drawImage(bitmap, 0, 0, dw, dh);
      bitmap.close();
    };
  } catch {
    const objectUrl = URL.createObjectURL(file);
    try {
      const img = await new Promise((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = () => reject(new Error("IMAGE_DECODE"));
        i.src = objectUrl;
      });
      w0 = img.naturalWidth;
      h0 = img.naturalHeight;
      render = (ctx, dw, dh) => {
        ctx.drawImage(img, 0, 0, dw, dh);
      };
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  if (!w0 || !h0) throw new Error("IMAGE_DECODE");

  const scale = Math.min(1, maxSide / Math.max(w0, h0));
  const w = Math.max(1, Math.round(w0 * scale));
  const h = Math.max(1, Math.round(h0 * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("IMAGE_DECODE");

  render(ctx, w, h);

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("TOBLOB"))), "image/jpeg", quality);
  });

  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  const base64 = String(dataUrl).split(",")[1];
  if (!base64) throw new Error("IMAGE_DECODE");

  return { base64, blob, mimeType: "image/jpeg" };
}
