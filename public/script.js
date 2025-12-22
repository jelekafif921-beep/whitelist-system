// =======================
// SUPABASE CONFIG
// =======================
const SUPABASE_URL = "https://YOUR_SUPABASE_URL.supabase.co";
const SUPABASE_KEY = "YOUR_SERVICE_ROLE_KEY";
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// =======================
// DOM ELEMENTS
// =======================
const adminInput = document.getElementById("adminKeyInput");
const loadDataBtn = document.getElementById("loadDataBtn");

const newAdminKeyInput = document.getElementById("newAdminKey");
const generateKeyBtn = document.getElementById("generateKeyBtn");
const adminKeyTableBody = document.querySelector("#adminKeyTable tbody");

const licenseTableBody = document.querySelector("#licenseTable tbody");
const historyTableBody = document.querySelector("#historyTable tbody");

// =======================
// EVENTS
// =======================
loadDataBtn.addEventListener("click", () => {
  const adminKey = adminInput.value.trim();
  if (!adminKey) return alert("Admin Key required");

  loadAdminKeys();
  loadLicenses();
  loadHistory();
});

generateKeyBtn.addEventListener("click", async () => {
  const keyValue = newAdminKeyInput.value.trim();
  if (!keyValue) return alert("Enter new key");

  const { data, error } = await supabase
    .from("admin_keys")
    .insert([{ key_value: keyValue }])
    .select()
    .single();

  if (error) return alert("Error creating key: " + error.message);

  alert("Admin Key generated!");
  newAdminKeyInput.value = "";
  loadAdminKeys();
});

// =======================
// FUNCTIONS
// =======================

// Load Admin Keys
async function loadAdminKeys() {
  const { data: keys, error } = await supabase
    .from("admin_keys")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return alert("Error loading keys: " + error.message);

  adminKeyTableBody.innerHTML = "";
  keys.forEach(k => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${k.key_value}</td>
      <td>${k.is_active}</td>
      <td>${new Date(k.created_at).toLocaleString()}</td>
      <td>${k.revoked_at ? new Date(k.revoked_at).toLocaleString() : "-"}</td>
      <td>
        ${k.is_active ? `<button class="revoke-btn" data-id="${k.id}">Revoke</button>` : "-"}
      </td>
    `;
    adminKeyTableBody.appendChild(tr);
  });

  document.querySelectorAll(".revoke-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const { error } = await supabase
        .from("admin_keys")
        .update({ is_active: false, revoked_at: new Date().toISOString() })
        .eq("id", id);

      if (error) return alert("Error revoking key: " + error.message);
      loadAdminKeys();
    });
  });
}

// Load Licenses
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

// Load Reset History
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

// =======================
// Generate License
// =======================
const showGenerateFormBtn = document.getElementById("showGenerateFormBtn");
const generateForm = document.getElementById("generateForm");
const robloxInput = document.getElementById("robloxUserId");
const hwidInput = document.getElementById("hwid");
const productSelect = document.getElementById("productSelect");
const generateLicenseBtn = document.getElementById("generateLicenseBtn");
const generatedLicenseDiv = document.getElementById("generatedLicense");

// Show / hide form
showGenerateFormBtn.addEventListener("click", () => {
  generateForm.style.display = generateForm.style.display === "none" ? "block" : "none";
});

// Load products dropdown
async function loadProductsDropdown() {
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) return alert("Error loading products: " + error.message);

  productSelect.innerHTML = '<option value="">Select Product</option>';
  products.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.product_key;
    opt.textContent = p.product_name;
    productSelect.appendChild(opt);
  });
}
loadProductsDropdown();

// Generate license
generateLicenseBtn.addEventListener("click", async () => {
  const robloxUserId = robloxInput.value.trim();
  const hwid = hwidInput.value.trim();
  const productKey = productSelect.value;

  if (!robloxUserId || !productKey) return alert("Roblox ID and Product are required");

  const body = {
    roblox_user_id: robloxUserId,
    hwid: hwid || null,
    product: productKey
  };

  try {
    const res = await fetch("/api/generate-license", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (data.ok) {
      generatedLicenseDiv.innerHTML = `License generated: <strong>${data.license}</strong>
        <button id="copyLicenseBtn">Copy</button>`;

      // Tombol copy
      document.getElementById("copyLicenseBtn").addEventListener("click", () => {
        navigator.clipboard.writeText(data.license);
        alert("License copied to clipboard!");
      });

      // Tambahkan langsung ke table licenses
      await loadLicenses();
    } else {
      generatedLicenseDiv.textContent = `Error: ${data.error}`;
      generatedLicenseDiv.style.color = "red";
    }
  } catch (err) {
    console.error(err);
    generatedLicenseDiv.textContent = "Unexpected error occurred";
    generatedLicenseDiv.style.color = "red";
  }
});

