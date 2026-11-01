/**
 * Resize to JPEG for Gemini + Firebase callable (mobile HEIC / large photos).
 * Uses createImageBitmap when possible (better HEIC on iOS), then canvas.
 */

function drawToJpegDataUrl(source, maxDim, quality) {
  let w = source.width ?? source.naturalWidth;
  let h = source.height ?? source.naturalHeight;
  if (!w || !h) throw new Error("empty dimensions");
  if (w > maxDim || h > maxDim) {
    const r = Math.min(maxDim / w, maxDim / h);
    w = Math.round(w * r);
    h = Math.round(h * r);
  }
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no context");
  ctx.drawImage(source, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}

function base64PayloadLength(dataUrl) {
  const b64 = dataUrl.split(",")[1] || "";
  return b64.length;
}

/**
 * @param {File} file
 * @param {{ maxDim?: number; quality?: number; maxBase64Chars?: number }} [opts]
 */
export async function fileToOptimizedJpegDataUrl(file, opts = {}) {
  const maxBase64Chars = opts.maxBase64Chars ?? 1_100_000;
  const dims = [opts.maxDim ?? 1024, 896, 768, 640, 512, 480];
  const qualities = [opts.quality ?? 0.82, 0.72, 0.62, 0.52, 0.42, 0.32];

  let dataUrl = null;

  try {
    const bitmap = await createImageBitmap(file);
    try {
      for (const maxDim of dims) {
        for (const q of qualities) {
          dataUrl = drawToJpegDataUrl(bitmap, maxDim, q);
          if (base64PayloadLength(dataUrl) <= maxBase64Chars) return dataUrl;
        }
      }
    } finally {
      bitmap.close();
    }
  } catch {
    /* fall through to Image() */
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("decode"));
      i.src = url;
    });
    for (const maxDim of dims) {
      for (const q of qualities) {
        dataUrl = drawToJpegDataUrl(img, maxDim, q);
        if (base64PayloadLength(dataUrl) <= maxBase64Chars) return dataUrl;
      }
    }
  } finally {
    URL.revokeObjectURL(url);
  }

  if (!dataUrl || base64PayloadLength(dataUrl) > maxBase64Chars) {
    throw new Error("compress");
  }
  return dataUrl;
}
