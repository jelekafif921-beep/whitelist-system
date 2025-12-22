// DOM elements
const showGenerateFormBtn = document.getElementById("showGenerateFormBtn");
const generateForm = document.getElementById("generateForm");
const robloxInput = document.getElementById("robloxUserId");
const hwidInput = document.getElementById("hwid");
const productSelect = document.getElementById("productSelect");
const generateLicenseBtn = document.getElementById("generateLicenseBtn");
const generatedLicenseDiv = document.getElementById("generatedLicense");

// Toggle form
showGenerateFormBtn.addEventListener("click", () => {
  generateForm.style.display = generateForm.style.display === "none" ? "block" : "none";
});

// Load products from Supabase
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
    console.log("Sending request:", body);

    const res = await fetch("/api/generate-license", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    console.log("Response:", data);

    if (data.ok) {
      generatedLicenseDiv.innerHTML = `License generated: <strong>${data.license}</strong>
        <button id="copyLicenseBtn">Copy</button>`;

      document.getElementById("copyLicenseBtn").addEventListener("click", () => {
        navigator.clipboard.writeText(data.license);
        alert("License copied to clipboard!");
      });

      // Refresh license table if ada
      if (typeof loadLicenses === "function") loadLicenses();
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
