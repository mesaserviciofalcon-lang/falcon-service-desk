export function getAppUrl() {

  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "https://falconseguridad.com"
  ).replace(/\/$/, "");
}
