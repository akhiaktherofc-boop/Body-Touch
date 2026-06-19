/**
 * Utility to compress images on the client side using HTML5 Canvas.
 * This converts raw high-resolution images (often 3-10MB from smartphone cameras)
 * into high-quality compressed JPEG data URLs (~50-120KB) to ensure compatibility
 * with mobile browsers, fast uploads, and Firestore document size boundaries (1MB).
 */
export const compressImage = (
  file: File,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.7
): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Perform proportional scaling
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        } else {
          resolve(event.target?.result as string); // fallback to raw
        }
      };
      img.onerror = () => {
        resolve(event.target?.result as string); // fallback to raw
      };
    };
    reader.onerror = () => {
      resolve('');
    };
  });
};
