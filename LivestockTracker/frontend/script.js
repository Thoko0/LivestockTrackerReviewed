// ===========================
// CONFIG
// ===========================
const SERVER_IP = "127.0.0.1";
const TRACKER_API = `http://${SERVER_IP}:8000/tracker`;

// ===========================
// MAP VARIABLES
// ===========================
let mapsMap;
let currentMarker = null;

// ===========================
// SEARCH TRACKER
// ===========================
document
    .getElementById("searchTrackerBtn")
    .addEventListener("click", searchTracker);

async function searchTracker() {
    const trackerId = document.getElementById("trackerIdInput").value.trim();

    if (!trackerId) {
        alert("Enter a tracker ID");
        return;
    }

    try {
        const response = await fetch(`${TRACKER_API}/${trackerId}`);
        if (!response.ok) throw new Error("Tracker not found");

        const data = await response.json();
        updateTable(data);
        updateMap(data);

    } catch (err) {
        alert("Tracker not found");
        clearTable();
        console.error(err);
    }
}

// ===========================
// UPDATE TABLE
// ===========================
function updateTable(data) {
    const tbody = document.getElementById("device-table-body");
    tbody.innerHTML = `
        <tr>
            <td>${data.device_id}</td>
            <td>${data.latitude.toFixed(6)}</td>
            <td>${data.longitude.toFixed(6)}</td>
            <td>${data.ax}, ${data.ay}, ${data.az}</td>
            <td>${data.gyro_x}, ${data.gyro_y}, ${data.gyro_z}</td>
            <td>${new Date(data.timestamp).toLocaleString()}</td>
        </tr>
    `;
}

function clearTable() {
    document.getElementById("device-table-body").innerHTML = "";
}

// ===========================
// MAP
// ===========================
function initMap() {
    mapsMap = L.map("maps-map").setView([-15.4, 28.3], 7);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
    }).addTo(mapsMap);
}

function updateMap(data) {
    if (!mapsMap) return;

    const latlng = [data.latitude, data.longitude];

    if (currentMarker) mapsMap.removeLayer(currentMarker);

    currentMarker = L.marker(latlng)
        .addTo(mapsMap)
        .bindPopup(`<b>${data.device_id}</b>`)
        .openPopup();

    mapsMap.setView(latlng, 15);
}

// ===========================
// TAB SWITCHING
// ===========================
const tabs = document.querySelectorAll(".tab");
const sections = document.querySelectorAll(".section");

tabs.forEach(tab => {
    tab.addEventListener("click", () => {
        tabs.forEach(t => t.classList.remove("active"));
        sections.forEach(s => s.classList.remove("active"));

        tab.classList.add("active");
        document
            .getElementById(tab.id.replace("-tab", "-section"))
            .classList.add("active");

        if (tab.id === "maps-tab" && !mapsMap) {
            initMap();
            setTimeout(() => mapsMap.invalidateSize(), 200);
        }
    });
});

// ===========================
// MOBILE MENU
// ===========================
document.getElementById("hamburger").addEventListener("click", () => {
    tabs.forEach(tab => tab.classList.toggle("show"));
});
