export function formatBytes(bytes) {
  const number = Number(bytes);

  if (!number || number === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(number) / Math.log(k));

  return parseFloat((number / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}