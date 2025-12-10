// File: /api/index.js
export default function handler(request, response) {
  response.status(200).json({
    message: "Whitelist System API is running",
    endpoints: {
      validate: "/api/license/validate",
      generate: "/api/license/generate"
    }
  });
}
