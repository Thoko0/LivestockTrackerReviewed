// ===========================
// Config
// ===========================
const SERVER_IP = "10.215.25.198";
const API_URL = `http://${SERVER_IP}:8000/data/latest`; // endpoint returns latest entry per device

// ===========================
// Load latest device data
// ===========================
async function loadData() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        updateDeviceTable(data);

    } catch (error) {
        console.error("Error fetching latest device data:", error);
    }
}

// ===========================
// Update table with latest data
// ===========================
function updateDeviceTable(data) {
    const tbody = document.querySelector("#devices-table tbody");
    tbody.innerHTML = "";

    data.forEach((device, index) => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${device.device_id || "N/A"}</td>
            <td>${device.lat || 0}</td>
            <td>${device.lon || 0}</td>
            <td>${device.speed || 0}</td>
            <td>${device.direction || "N/A"}</td>
        `;

        tbody.appendChild(tr);
    });
}

// ===========================
// Initialize table on load and refresh every 5 seconds
// ===========================
loadData();
setInterval(loadData, 5000);
