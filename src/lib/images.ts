/**
 * Product photos are stored in Firestore as data URLs (no Firebase Storage needed).
 * To keep the catalog fast on mobile data we keep two sizes:
 *   - thumb  (~20–40 KB) on the product document itself, shown in the catalog grid
 *   - full   (~150–300 KB) in productImages/{productId}, loaded only when a product is opened
 */

export const THUMB = { maxPx: 480, quality: 0.7 };
export const FULL = { maxPx: 1200, quality: 0.8 };

/** Resize + re-encode an image (File, Blob or data URL) to a JPEG data URL. */
export function compressToDataUrl(
  source: Blob | string,
  { maxPx, quality }: { maxPx: number; quality: number },
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const isBlob = typeof source !== 'string';
    const url = isBlob ? URL.createObjectURL(source) : source;

    img.onload = () => {
      if (isBlob) URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxPx || height > maxPx) {
        const scale = maxPx / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas not supported'));
      ctx.fillStyle = '#fff'; // PNGs with transparency become white, not black
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => {
      if (isBlob) URL.revokeObjectURL(url);
      reject(new Error('Could not read image'));
    };
    img.src = url;
  });
}

/** Approximate size of a data URL in KB, for display. */
export const dataUrlKb = (dataUrl: string) => Math.round((dataUrl.length * 3) / 4 / 1024);

/** True for old products whose full-size photo is still stored on the product document. */
export const isLegacyImage = (imageUrl?: string) =>
  !!imageUrl && imageUrl.startsWith('data:');
