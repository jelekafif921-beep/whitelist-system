import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  // ===== CORS =====
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")

  if (req.method === "OPTIONS") {
    return res.status(200).end()
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const body = req.body || {}

    const {
      license_key,
      product_key,
      roblox_user_id,
      hwid
    } = body

    // ===== BASIC VALIDATION =====
    if (!license_key || !product_key || !roblox_user_id || !hwid) {
      return res.status(400).json({
        error: "Missing required fields"
      })
    }

    // ===== GET PRODUCT =====
    const { data: product, error: productError } =
      await supabase
        .from("products")
        .select("id")
        .eq("product_key", product_key)
        .single()

    if (productError || !product) {
      return res.status(404).json({
        error: "Product not found"
      })
    }

    // ===== GET LICENSE =====
    const { data: license, error: licenseError } =
      await supabase
        .from("licenses")
        .select("*")
        .eq("license_key", license_key)
        .eq("product_id", product.id)
        .single()

    if (licenseError || !license) {
      return res.status(404).json({
        error: "License not found"
      })
    }

    // ===== REVOKED =====
    if (license.status === "revoked") {
      return res.status(403).json({
        error: "License revoked"
      })
    }

    // ===== UNUSED → FIRST BIND =====
    if (license.status === "unused") {
      const { error: bindError } =
        await supabase
          .from("licenses")
          .update({
            status: "active",
            roblox_user_id,
            hwid,
            first_used_at: new Date().toISOString(),
            last_checked_at: new Date().toISOString()
          })
          .eq("id", license.id)

      if (bindError) {
        throw bindError
      }

      return res.status(200).json({
        ok: true,
        message: "License activated"
      })
    }

    // ===== ACTIVE → VALIDATE =====
    if (license.status === "active") {
      if (
        license.roblox_user_id !== Number(roblox_user_id) ||
        license.hwid !== hwid
      ) {
        return res.status(403).json({
          error: "License already bound to another user or device"
        })
      }

      // Update last check
      await supabase
        .from("licenses")
        .update({
          last_checked_at: new Date().toISOString()
        })
        .eq("id", license.id)

      return res.status(200).json({
        ok: true,
        message: "License valid"
      })
    }

    // ===== FALLBACK =====
    return res.status(500).json({
      error: "Invalid license state"
    })

  } catch (err) {
    console.error("VALIDATE ERROR:", err)
    return res.status(500).json({
      error: "Internal server error"
    })
  }
}
