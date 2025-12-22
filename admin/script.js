// =======================
// CONFIG SUPABASE
// =======================
const SUPABASE_URL = "https://YOUR_SUPABASE_URL.supabase.co";
const SUPABASE_KEY = "YOUR_SERVICE_ROLE_KEY"; // gunakan service role key untuk admin
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// =======================
// DOM ELEMENTS
// =======================
const licenseInput = document.getElementById("licenseKey");
const adminInput = document.getElementById("adminKey");
const resetBtn = document.getElementById("resetBtn");
const licenseStatus = document.getElementById("licenseStatus");
const resetHistory = document.getElementById("resetHistory");

// =======================
// EVENTS
// =======================
resetBtn.addEventListener("click", async () => {
  const licenseKey = licenseInput.value.trim();
  const adminKey = adminInput.value.trim();
  if (!licenseKey || !adminKey) return alert("Fill all fields");

  // Reset License via API
  try {
    const res = await fetch("/api/reset-license", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ license_key: licenseKey, admin_key: adminKey })
    });

    const data = await res.json();
    if (data.ok) {
      alert("License reset successfully!");
      loadLicenseStatus(licenseKey);
      loadResetHistory(licenseKey);
    } else {
      alert("Error: " + data.error);
    }
  } catch (err) {
    console.error(err);
    alert("API Error");
  }
});

// =======================
// FUNCTIONS
// =======================
async function loadLicenseStatus(licenseKey) {
  const { data, error } = await supabase
    .from("licenses")
    .select("*")
    .eq("license_key", licenseKey)
    .single();

  if (error) {
    licenseStatus.textContent = "License not found";
    return;
  }

  licenseStatus.innerHTML = `
    Status: ${data.status} <br/>
    Roblox UserID: ${data.roblox_user_id || "-"} <br/>
    HWID: ${data.hwid || "-"} <br/>
    Reset Count: ${data.reset_count}/${data.max_reset}
  `;
}

async function loadResetHistory(licenseKey) {
  // Cari license dulu
  const { data: license } = await supabase
    .from("licenses")
    .select("id")
    .eq("license_key", licenseKey)
    .single();

  if (!license) return;
  
  const { data: logs } = await supabase
    .from("license_resets")
    .select("*")
    .eq("license_id", license.id)
    .order("reset_at", { ascending: false });

  resetHistory.innerHTML = "";
  logs.forEach(log => {
    const li = document.createElement("li");
    li.textContent = `Reset by: ${log.admin_user || "admin"} at ${new Date(log.reset_at).toLocaleString()}`;
    resetHistory.appendChild(li);
  });
}
