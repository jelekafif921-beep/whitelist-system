import crypto from "crypto";

function generateLicense(product = "GEN") {
  const random = crypto.randomBytes(4).toString("hex").toUpperCase(); // 8 char
  const timestamp = Date.now().toString(36).toUpperCase(); // entropy tambahan

  const base = `WL-${product}-${random}-${timestamp}`;

  const checksum = crypto
    .createHash("sha256")
    .update(base)
    .digest("hex")
    .slice(0, 3)
    .toUpperCase();

  return `${base}-${checksum}`;
}

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { product } = req.body || {};

  const license = generateLicense(product || "GEN");

  return res.status(200).json({
    ok: true,
    license,
    product: product || "GEN",
    status: "unused",
    generated_at: new Date().toISOString(),
  });
}
