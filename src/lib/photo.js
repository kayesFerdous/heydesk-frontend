// A photo a visitor picks is made small in the browser before it's sent: a
// JPEG no wider or taller than 1024 px, as a data URL. A phone photo of 4 MB
// becomes about 150 KB, and the backend takes JPEG and PNG only (D57).
const LARGEST_SIDE = 1024;

export async function shrinkPhoto(file) {
  const bitmap = await createImageBitmap(file); // throws for a file that isn't a picture
  const scale = Math.min(1, LARGEST_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', 0.85);
}
