const API_URL =
  process.env.REACT_APP_API_URL ||
  "https://qalam-backend.444hussayn444.deno.net/api/v1";
const API_BASE_URL = API_URL.replace(/\/api\/v1\/?$/, "");
const config = { API_BASE_URL, API_URL };

export { API_BASE_URL, API_URL };
export default config;
