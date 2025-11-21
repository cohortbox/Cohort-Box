// src/utils/getCroppedImage.js
export async function getCroppedImage(imageSrc, crop, zoom, rotation = 0, outputSize = 400) {
  // crop: { x, y, width, height } in pixels from react-easy-crop getCroppedAreaPixels
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Final output is square (DP), e.g. 400x400
  canvas.width = outputSize;
  canvas.height = outputSize;

  // Draw the cropped area to the output canvas
  // Create an offscreen canvas with the raw crop first
  const offCanvas = document.createElement('canvas');
  const offCtx = offCanvas.getContext('2d');

  // account for rotation by expanding offCanvas
  const radians = (rotation * Math.PI) / 180;
  const bboxWidth = Math.abs(Math.cos(radians) * image.width) + Math.abs(Math.sin(radians) * image.height);
  const bboxHeight = Math.abs(Math.cos(radians) * image.height) + Math.abs(Math.sin(radians) * image.width);
  offCanvas.width = Math.ceil(bboxWidth);
  offCanvas.height = Math.ceil(bboxHeight);

  // Move to center, rotate, draw image centered
  offCtx.translate(offCanvas.width / 2, offCanvas.height / 2);
  offCtx.rotate(radians);
  offCtx.drawImage(image, -image.width / 2, -image.height / 2);

  // Now copy the crop box from the rotated image into a temp canvas
  const temp = document.createElement('canvas');
  const tctx = temp.getContext('2d');
  temp.width = crop.width;
  temp.height = crop.height;
  tctx.drawImage(
    offCanvas,
    crop.x, crop.y, crop.width, crop.height, // source crop
    0, 0, crop.width, crop.height            // draw to temp
  );

  // Finally, scale temp -> output square
  ctx.drawImage(temp, 0, 0, outputSize, outputSize);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/jpeg', 0.9);
  });
}

function createImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
