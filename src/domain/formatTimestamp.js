export const formatUnixTimestamp = (unixSeconds) => {
  if (!unixSeconds) return '';
  const date = new Date(unixSeconds * 1000);
  const pad = (value) => String(value).padStart(2, '0');
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
};
