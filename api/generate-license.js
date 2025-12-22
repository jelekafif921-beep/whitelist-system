export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" })
    }

    // SAFE body parsing
    let body = {}
    if (req.body && typeof req.body === "object") {
      body = req.body
    }

    const product = body.product

    if (!product) {
      return res.status(400).json({
        error: "Product is required"
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
      error: "Internal Server Error"
    })
  }
}
