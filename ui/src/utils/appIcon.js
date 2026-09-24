export function resolveAppIconDisplayUrl(settings) {
  if (!settings) return null;
  if (settings.appIconPath) {
    const v = settings.appIconVersion || 0;
    return `${settings.appIconPath}?v=${v}`;
  }
  if (settings.appIconDataUrl) return settings.appIconDataUrl;
  return null;
}

const MAX_FALLBACK_ICON_BYTES = 80_000;

/** Small JPEG for localStorage fallback when public/icone upload is unavailable. */
export function compressAppIconFile(file, maxSize = 128, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height, 1));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not process image'));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(dataUrl);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not load image'));
    };
    img.src = url;
  });
}

export function isAppIconDataUrlTooLarge(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return false;
  return dataUrl.length > MAX_FALLBACK_ICON_BYTES;
}

export { MAX_FALLBACK_ICON_BYTES };

export function fallbackLetterFromAppName(appName) {
  const ch = (appName || 'K').trim().charAt(0);
  return ch ? ch.toUpperCase() : 'K';
}
