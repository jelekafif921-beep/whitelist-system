// =======================
// CONFIG SUPABASE
// =======================
const SUPABASE_URL = "https://YOUR_SUPABASE_URL.supabase.co";
const SUPABASE_KEY = "YOUR_SERVICE_ROLE_KEY"; // gunakan service role key untuk admin
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// =======================
// DOM ELEMENTS
// =======================
const adminInput = document.getElementById("adminKey");
const loadDataBtn = document.getElementById("loadDataBtn");
const licenseTableBody = document.querySelector("#licenseTable tbody");
const historyTableBody = document.querySelector("#historyTable tbody");

// =======================
// EVENTS
// =======================
loadDataBtn.addEventListener("click", () => {
  const adminKey = adminInput.value.trim();
  if (!adminKey) return alert("Admin key required");

  loadLicenses();
  loadHistory();
});

// =======================
// FUNCTIONS
// =======================

// Load all licenses
async function loadLicenses() {
  const { data: licenses, error } = await supabase
    .from("licenses")
    .select("*, products(product_name)")
    .order("created_at", { ascending: false });

  if (error) return alert("Error loading licenses: " + error.message);

  licenseTableBody.innerHTML = "";
  licenses.forEach(lic => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${lic.license_key}</td>
      <td>${lic.products ? lic.products.product_name : "-"}</td>
      <td>${lic.status}</td>
      <td>${lic.roblox_user_id || "-"}</td>
      <td>${lic.hwid || "-"}</td>
      <td>${lic.reset_count}/${lic.max_reset}</td>
      <td><button class="reset-btn" data-license="${lic.license_key}">Reset</button></td>
    `;
    licenseTableBody.appendChild(tr);
  });

  // Attach reset button events
  document.querySelectorAll(".reset-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const licenseKey = btn.dataset.license;
      const adminKey = adminInput.value.trim();

      if (!confirm(`Reset license ${licenseKey}?`)) return;

      const res = await fetch("/api/reset-license", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ license_key: licenseKey, admin_key: adminKey })
      });

      const data = await res.json();
      if (data.ok) {
        alert("License reset successfully!");
        loadLicenses();
        loadHistory();
      } else {
        alert("Error: " + data.error);
      }
    });
  });
}

// Load reset history
async function loadHistory() {
  const { data: logs, error } = await supabase
    .from("license_resets")
    .select("license_id, admin_user, reset_at, licenses(license_key)")
    .order("reset_at", { ascending: false });

  if (error) return alert("Error loading history: " + error.message);

  historyTableBody.innerHTML = "";
  logs.forEach(log => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${log.licenses ? log.licenses.license_key : "-"}</td>
      <td>${log.admin_user || "-"}</td>
      <td>${new Date(log.reset_at).toLocaleString()}</td>
    `;
    historyTableBody.appendChild(tr);
  });
}
