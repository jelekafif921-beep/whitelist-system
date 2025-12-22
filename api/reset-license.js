// api/reset-license.js
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
    const { license_key, admin_key } = req.body;
    if (!license_key || !admin_key) return res.status(400).json({ error: "Missing fields" });

    // Validate admin key
    const { data: keyData } = await supabase
      .from("admin_keys")
      .select("*")
      .eq("key_value", admin_key)
      .eq("is_active", true)
      .single();

    if (!keyData) return res.status(403).json({ error: "Unauthorized" });

    // Get license
    const { data: license } = await supabase
      .from("licenses")
      .select("*")
      .eq("license_key", license_key)
      .single();

    if (!license) return res.status(404).json({ error: "License not found" });

    if (license.reset_count >= license.max_reset) {
      return res.status(403).json({ error: "Reset limit reached" });
    }

    // Reset license
    await supabase.from("licenses")
      .update({
        status: "unused",
        roblox_user_id: null,
        hwid: null,
        reset_count: license.reset_count + 1
      })
      .eq("id", license.id);

    // Log reset
    await supabase.from("license_resets")
      .insert({
        license_id: license.id,
        admin_user: admin_key,
        reset_at: new Date().toISOString()
      });

    return res.status(200).json({ ok: true, message: "License reset successfully" });

  } catch(err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
