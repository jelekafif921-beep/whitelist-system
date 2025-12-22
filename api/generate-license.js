import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// Supabase client (SERVICE ROLE ONLY)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Generate readable license
function generateLicense() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let license = "RBX";

  for (let i = 0; i < 4; i++) {
    license += "-";
    for (let j = 0; j < 4; j++) {
      license += chars[Math.floor(Math.random() * chars.length)];
    }
  }

  return license;
}

// Hash license (SHA-256)
function hashLicense(license) {
  return crypto
    .createHash("sha256")
    .update(license)
    .digest("hex");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { product_id, customer_id } = req.body;

  if (!product_id) {
    return res.status(400).json({
      error: "product_id is required"
    });
  }

  const license = generateLicense();
  const license_hash = hashLicense(license);

  const { error } = await supabase
    .from("licenses")
    .insert({
      license_hash,
      product_id,
      customer_id: customer_id || null
    });

  if (error) {
    return res.status(500).json({
      error: "Failed to generate license"
    });
  }

  //  LICENSE ASLI HANYA DIKIRIM SEKALI
  return res.status(200).json({
    success: true,
    license
  });
}
