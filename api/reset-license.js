// api/reset-license.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { license_key, admin_key } = req.body;

  if (admin_key !== process.env.ADMIN_RESET_KEY) {
    return res.status(403).json({ error: "Unauthorized" });
  }

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
      admin_user: admin_key, // atau admin ID
      reset_at: new Date().toISOString()
    });

  return res.status(200).json({ ok: true, message: "License reset successfully" });
}
