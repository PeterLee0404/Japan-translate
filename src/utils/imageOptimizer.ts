/**
 * 圖片壓縮與尺寸最佳化工具
 * 將高解析度手機照片（如 48MP/12MP）縮放至最適辨識尺寸（最大邊 1600px）
 * 既保證日文字元 OCR 清晰度，又將 base64 資料量縮減 90%，杜絕上傳逾時與斷線
 */

export function optimizeImageForOcr(dataUrl: string, maxDimension = 1600): Promise<string> {
  return new Promise((resolve) => {
    if (!dataUrl || !dataUrl.startsWith('data:image')) {
      resolve(dataUrl);
      return;
    }

    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // 若原圖尺寸已在合理範圍內，直接回傳
      if (width <= maxDimension && height <= maxDimension) {
        resolve(dataUrl);
        return;
      }

      // 等比例縮小至最大邊 maxDimension
      if (width > height) {
        if (width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        // 使用優化後的 JPEG 格式，保持字元銳利度
        resolve(canvas.toDataURL('image/jpeg', 0.88));
      } else {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
