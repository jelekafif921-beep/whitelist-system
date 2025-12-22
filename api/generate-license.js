// api/generate-license.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const body = req.body || {};
    const { roblox_user_id, hwid, product } = body;

    if (!roblox_user_id || !product) {
      return res.status(400).json({ error: "Roblox User ID and Product are required" });
    }

    // Generate license
    const license = `WL-${product}-${Math.random().toString(36).substring(2,10).toUpperCase()}`;

    // Insert to Supabase
    const { data, error } = await supabase
      .from("licenses")
      .insert([{
        license_key: license,
        product_id: product,
        status: "unused",
        roblox_user_id,
        hwid,
        reset_count: 0,
        max_reset: 3,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      ok: true,
      license: data.license_key,
      product
    });

  } catch(err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
