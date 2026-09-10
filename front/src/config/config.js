const API_URL = process.env.REACT_APP_API_URL || "https://qalam.hussayn369.workers.dev/";
const API_BASE_URL = API_URL.replace(/\/api\/v1\/?$/, "");
const config = { API_BASE_URL, API_URL };

export { API_BASE_URL, API_URL };
export default config;
