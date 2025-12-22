export default async function handler(req, res) {
  // ===== CORS HEADERS =====
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")

  // ===== HANDLE PREFLIGHT =====
  if (req.method === "OPTIONS") {
    return res.status(200).end()
  }

  try {
    // ===== TEST GET =====
    if (req.method === "GET") {
      return res.status(200).json({
        ok: true,
        message: "API alive"
      })
    }

    // ===== ONLY POST BELOW =====
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" })
    }

    const body = req.body || {}
    const product = body.product

    if (!product) {
      return res.status(400).json({
        error: "product is required"
      })
    }

    const license =
      "WL-" +
      product +
      "-" +
      Math.random().toString(36).substring(2, 10).toUpperCase()

    return res.status(200).json({
      ok: true,
      product,
      license
    })

  } catch (err) {
    console.error("API ERROR:", err)
    return res.status(500).json({
      error: "Internal server error"
    })
  }
}
