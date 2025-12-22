// ===========================
// CONFIG
// ===========================
const SERVER_IP = "https://livestocktrackerwebapp.onrender.com";
const TRACKER_API = `http://${SERVER_IP}/tracker`;

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

async function searchTracker() {
    const trackerId = document.getElementById("trackerIdInput").value.trim();
    if (!trackerId) {
        alert("Enter a tracker ID");
        return;
    }

    try {
        const response = await fetch(`${TRACKER_API}/${encodeURIComponent(trackerId)}`);
        if (!response.ok) throw new Error("Tracker not found");

        const data = await response.json();
        console.log("Fetched data:", data);

        addOrUpdateTableRow(data);

    } catch (err) {
        console.error("FETCH FAILED:", err);
        alert(err.message);
    }
}

// ===========================
// ADD OR UPDATE TABLE ROW
// ===========================
function addOrUpdateTableRow(tracker) {
    const tbody = document.getElementById("device-table-body");
    let existingRow = document.querySelector(`tr[data-device-id="${tracker.device_id}"]`);

    if (existingRow) {
        // Update existing row
        existingRow.innerHTML = tableRowHTML(tracker);
    } else {
        // Add new row
        const row = document.createElement("tr");
        row.setAttribute("data-device-id", tracker.device_id);
        row.innerHTML = tableRowHTML(tracker);
        tbody.appendChild(row);
    }
}

// HTML for table row
function tableRowHTML(tracker) {
    return `
        <td>${tracker.device_id}</td>
        <td>${Number(tracker.latitude ?? 0).toFixed(6)}</td>
        <td>${Number(tracker.longitude ?? 0).toFixed(6)}</td>
        <td>${tracker.ax ?? ""}, ${tracker.ay ?? ""}, ${tracker.az ?? ""}</td>
        <td>${tracker.gyro_x ?? ""}, ${tracker.gyro_y ?? ""}, ${tracker.gyro_z ?? ""}</td>
        <td>${tracker.created_at ? new Date(tracker.created_at).toLocaleString() : ""}</td>
        <td>
            <button class="refresh-btn" onclick="refreshTracker('${tracker.device_id}')">Refresh</button>
            <button class="delete-btn" onclick="deleteTracker('${tracker.device_id}', this)">Delete</button>
        </td>
    `;
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
    const trackerId = document.getElementById("mapTrackerIdInput").value.trim();
    if (!trackerId) return alert("Enter a tracker ID");

    try {
        const response = await fetch(`${TRACKER_API}/${encodeURIComponent(trackerId)}`);
        if (!response.ok) throw new Error("Tracker not found");

        const data = await response.json();
        const lat = Number(data.latitude);
        const lon = Number(data.longitude);

        if (isNaN(lat) || isNaN(lon)) return alert("Tracker has no valid location");

        if (trackerMarker) map.removeLayer(trackerMarker);

        trackerMarker = L.marker([lat, lon])
            .addTo(map)
            .bindPopup(`Tracker ${trackerId}`)
            .openPopup();

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
        document.getElementById(tab.id.replace("-tab", "-section")).classList.add("active");

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

// ===========================
// ADD TRACKER
// ===========================
document.getElementById("addTrackerBtn").addEventListener("click", addTracker);

async function addTracker() {
    const deviceId = document.getElementById("newTrackerId").value.trim();
    const name = document.getElementById("newTrackerName").value.trim();
    if (!deviceId) return alert("Tracker ID is required");

    try {
        const response = await fetch(`http://127.0.0.1:8000/trackers`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ device_id: deviceId, name: name || null })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.detail);

        alert(`Tracker "${data.device_id}" added successfully`);

        document.getElementById("newTrackerId").value = "";
        document.getElementById("newTrackerName").value = "";

        addOrUpdateTableRow(data);

    } catch (err) {
        alert(err.message);
    }
}

// ===========================
// REFRESH TRACKER
// ===========================
async function refreshTracker(deviceId) {
    try {
        const response = await fetch(`${TRACKER_API}/${encodeURIComponent(deviceId)}`);
        if (!response.ok) throw new Error("Tracker not found");

        const data = await response.json();
        addOrUpdateTableRow(data);
    } catch (err) {
        alert(err.message);
    }
}

// ===========================
// DELETE TRACKER
// ===========================
async function deleteTracker(deviceId, buttonElement) {
    if (!confirm(`Are you sure you want to delete tracker "${deviceId}"?`)) return;

    try {
        const response = await fetch(`http://127.0.0.1:8000/trackers/${encodeURIComponent(deviceId)}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.detail || "Failed to delete tracker");
        }

        // Remove row from table
        const row = buttonElement.closest("tr");
        row.remove();
        alert(`Tracker "${deviceId}" deleted successfully`);

    } catch (err) {
        alert(err.message);
    }
}
