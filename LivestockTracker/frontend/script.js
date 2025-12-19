// ===========================
// CONFIG
// ===========================
const SERVER_IP = "127.0.0.1";
const TRACKER_API = `http://${SERVER_IP}:8000/tracker`;

// ===========================
// MAP VARIABLES
// ===========================
let map;
let trackerMarker = null;

// ===========================
// DEVICE SEARCH (TABLE)
// ===========================
document
    .getElementById("searchTrackerBtn")
    .addEventListener("click", searchTracker);

document
    .getElementById("clearTableBtn")
    .addEventListener("click", clearTable);

async function searchTracker() {
    const trackerId = document.getElementById("trackerIdInput").value.trim();

    if (!trackerId) {
        alert("Enter a tracker ID");
        return;
    }

    try {
        const response = await fetch(`${TRACKER_API}/${encodeURIComponent(trackerId)}`);

        if (!response.ok) {
            throw new Error(`Tracker not found`);
        }

        const data = await response.json();
        console.log("Fetched data:", data);

        updateTable(data);

    } catch (err) {
        console.error("FETCH FAILED:", err);
        alert(err.message);
    }
}

// ===========================
// UPDATE TABLE
// ===========================
function updateTable(data) {
    const tbody = document.getElementById("device-table-body");

    const row = document.createElement("tr");

    row.innerHTML = `
        <td>${data.device_id ?? ""}</td>
        <td>${Number(data.latitude).toFixed(6)}</td>
        <td>${Number(data.longitude).toFixed(6)}</td>
        <td>${data.ax ?? ""}, ${data.ay ?? ""}, ${data.az ?? ""}</td>
        <td>${data.gyro_x ?? ""}, ${data.gyro_y ?? ""}, ${data.gyro_z ?? ""}</td>
        <td>${data.timestamp ? new Date(data.timestamp).toLocaleString() : ""}</td>
    `;

    tbody.appendChild(row);
}

function clearTable() {
    document.getElementById("device-table-body").innerHTML = "";
}

// ===========================
// MAP INITIALIZATION
// ===========================
function initMap() {
    map = L.map("map").setView([0, 0], 2);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);
}

// ===========================
// MAP SEARCH (LOCATE TRACKER)
// ===========================
document
    .getElementById("mapSearchBtn")
    .addEventListener("click", locateTrackerOnMap);

async function locateTrackerOnMap() {
    const trackerId = document
        .getElementById("mapTrackerIdInput")
        .value
        .trim();

    if (!trackerId) {
        alert("Enter a tracker ID");
        return;
    }

    try {
        const response = await fetch(`${TRACKER_API}/${encodeURIComponent(trackerId)}`);

        if (!response.ok) {
            throw new Error("Tracker not found");
        }

        const data = await response.json();

        const lat = Number(data.latitude);
        const lon = Number(data.longitude);

        if (isNaN(lat) || isNaN(lon)) {
            alert("Tracker has no valid location");
            return;
        }

        // Remove old marker
        if (trackerMarker) {
            map.removeLayer(trackerMarker);
        }

        // Add marker
        trackerMarker = L.marker([lat, lon])
            .addTo(map)
            .bindPopup(`Tracker ${trackerId}`)
            .openPopup();

        // Zoom to tracker
        map.setView([lat, lon], 15);

    } catch (err) {
        console.error(err);
        alert(err.message);
    }
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

        // Initialize map ONLY when Maps tab opens
        if (tab.id === "maps-tab" && !map) {
            initMap();
            setTimeout(() => map.invalidateSize(), 200);
        }
    });
});

// ===========================
// MOBILE MENU
// ===========================
document.getElementById("hamburger").addEventListener("click", () => {
    tabs.forEach(tab => tab.classList.toggle("show"));
});
