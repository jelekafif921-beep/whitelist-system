import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    if (req.method === "GET") {
      // List semua admin key aktif
      const { data, error } = await supabase
        .from("admin_keys")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return res.status(200).json({ ok: true, data });
    }

    if (req.method === "POST") {
      const { key_value } = req.body;

      if (!key_value) {
        return res.status(400).json({ error: "key_value is required" });
      }

      const { data, error } = await supabase
        .from("admin_keys")
        .insert([{ key_value }])
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({ ok: true, data });
    }

    return res.status(405).json({ error: "Method not allowed" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
