// ===========================
// CONFIG
// ===========================
const SERVER_IP = "https://livestocktrackerwebapp.onrender.com";
const TRACKER_API = `https://${SERVER_IP}/tracker_data`;
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
    if (!trackerId) {
        return alert("Enter a tracker ID");
    }

    try {
        const response = await fetch(`${TRACKER_API}/${encodeURIComponent(trackerId)}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                return alert("Tracker not found in database");
            } else {
                throw new Error("Failed to fetch tracker data");
            }
        }

        const data = await response.json();
        const lat = Number(data.latitude);
        const lon = Number(data.longitude);

        if (isNaN(lat) || isNaN(lon)) {
            return alert("Tracker has no valid location");
        }

        // Remove previous marker if exists
        if (trackerMarker) {
            trackerMarker.remove();
        }

        // Add new marker
        trackerMarker = L.marker([lat, lon])
            .addTo(map)
            .bindPopup(`Tracker ${trackerId}`)
            .openPopup();

        // Center map on the tracker
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
        const response = await fetch(`${TRACKER_API}`, {
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
        const response = await fetch(`${TRACKER_API}/${encodeURIComponent(deviceId)}`, {
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
// Chart.js initialization
const behaviorMap = ['Grazing','Standing','Resting','Moving'];
const behaviorColors = ['#7CC576','#36A2EB','#FFCE56','#FF6384'];

const trackers = {
    1: {
        timeLabels: ['19:00','20:00','21:00','22:00','23:00','00:00','01:00','02:00','03:00','04:00','05:00','06:00'],
        behaviorValues: [2,2,1,1,0,0,0,3,3,2,2,1],
        pieValues: [4,4,3,1]
    },
    2: {
        timeLabels: ['19:00','20:00','21:00','22:00','23:00','00:00','01:00','02:00','03:00','04:00','05:00','06:00'],
        behaviorValues: [1,1,1,0,0,0,0,0,1,2,2,2],
        pieValues: [5,4,2,1]
    },
    3: {
        timeLabels: ['19:00','20:00','21:00','22:00','23:00','00:00','01:00','02:00','03:00','04:00','05:00','06:00'],
        behaviorValues: [0,0,0,0,0,1,1,2,2,2,3,3],
        pieValues: [6,3,2,1]
    }
};

// Initialize line chart
const lineChart = new Chart(document.getElementById('lineChart'), {
    type: 'line',
    data: {
        labels: trackers[1].timeLabels,
        datasets: [{
            data: trackers[1].behaviorValues,
            borderColor: '#36A2EB',
            backgroundColor: 'rgba(54,162,235,0.08)',
            fill: true,
            tension: 0.3,
            pointRadius: 6,
            pointBackgroundColor: trackers[1].behaviorValues.map(v => behaviorColors[v])
        }]
    },
    options: {
        maintainAspectRatio: false,
        scales: {
            y: {
                suggestedMin: 0.5,
                suggestedMax: 3.5,
                ticks: {
                    stepSize: 1,
                    callback: v => behaviorMap[Math.round(v)] || ''
                }
            }
        },
        plugins: { 
            legend: { 
                display: false 
            } 
        }
    }
});

// Initialize pie chart
const pieChart = new Chart(document.getElementById('pieChart'), {
    type: 'doughnut',
    data: {
        labels: behaviorMap,
        datasets: [{
            data: trackers[1].pieValues,
            backgroundColor: behaviorColors,
            borderWidth: 2
        }]
    },
    options: {
        maintainAspectRatio: false,
        cutout: '45%',
        plugins: { 
            legend: { 
                position: 'right' 
            } 
        }
    }
});

// Update signal display function
function updateSignalDisplay(signalValue) {
    const signalElement = document.getElementById('signalStatus');
    
    // Reset classes
    signalElement.classList.remove('excellent', 'warning', 'critical');

    if (signalValue >= 70) {
        signalElement.innerText = "GOOD";
        signalElement.classList.add('excellent');
    } 
    else if (signalValue >= 30 && signalValue < 70) {
        signalElement.innerText = "WEAK";
        signalElement.classList.add('warning');
    } 
    else {
        signalElement.innerText = "SIGNAL LOST";
        signalElement.classList.add('critical');
    }
}

// Update activity ratio function
function updateActivityRatio(grazing, standing, moving, resting) {
    // 1. Sum up the active components
    const totalActiveValue = grazing + standing + moving;
    
    // 2. Calculate the grand total to find percentages
    const grandTotal = totalActiveValue + resting;

    // Avoid division by zero if backend hasn't sent data yet
    if (grandTotal === 0) return;

    // 3. Convert to percentages
    const activePercentage = Math.round((totalActiveValue / grandTotal) * 100);
    const restPercentage = 100 - activePercentage;

    // 4. Update the Text Labels
    document.getElementById('activeText').innerText = activePercentage + "%";
    document.getElementById('restText').innerText = restPercentage + "%";

    // 5. Update the Progress Bar Widths
    document.getElementById('activeBar').style.width = activePercentage + "%";
    document.getElementById('restBar').style.width = restPercentage + "%";
}

// Calculate distance using Haversine formula
function calculateHaversine(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}

// Update total distance function
function updateTotalDistance(gpsPoints) {
    let totalKm = 0;

    for (let i = 0; i < gpsPoints.length - 1; i++) {
        let p1 = gpsPoints[i];
        let p2 = gpsPoints[i + 1];
        
        totalKm += calculateHaversine(p1.lat, p1.lng, p2.lat, p2.lng);
    }

    // Update the HTML display
    document.getElementById('distanceDisplay').innerText = totalKm.toFixed(1);
    
    // Hide trend icon if distance is 0
    document.getElementById('trendIcon').style.display = totalKm > 0 ? 'inline' : 'none';
}

// Example data from backend
const pathData = [
    { lat: -15.3875, lng: 28.3228 },
    { lat: -15.3880, lng: 28.3235 },
    { lat: -15.3895, lng: 28.3250 }
];

updateTotalDistance(pathData);

// Switch tracker function
function switchTracker(n) {
    const t = trackers[n];

    lineChart.data.labels = t.timeLabels;
    lineChart.data.datasets[0].data = t.behaviorValues;
    lineChart.data.datasets[0].pointBackgroundColor = t.behaviorValues.map(v => behaviorColors[v]);
    lineChart.update();

    pieChart.data.datasets[0].data = t.pieValues;
    pieChart.update();

    document.getElementById('chartTitle').innerText = 'Tracker ' + n;
}
// -------------------------------
// DYNAMIC TRACKERS MODAL
// -------------------------------
let availableTrackers = []; // filled from backend

async function loadTrackers() {
    try {
        const response = await fetch(`${TRACKER_API}/list`);
        if (!response.ok) throw new Error("Failed to fetch trackers");
        availableTrackers = await response.json();
        renderTrackers(availableTrackers);
    } catch (err) {
        console.error("Error loading trackers:", err);
    }
}

function renderTrackers(trackers) {
    const container = document.getElementById("trackersContainer");
    container.innerHTML = "";

    trackers.forEach((tracker, index) => {
        const btn = document.createElement("button");
        btn.className = "btn btn-outline-primary";
        btn.textContent = tracker.name || tracker.id || `Tracker ${index+1}`;
        btn.onclick = () => switchTracker(tracker.id || index+1);
        btn.setAttribute("data-bs-dismiss", "modal");
        container.appendChild(btn);
    });

    const searchInput = document.getElementById("trackerSearch");
    if (trackers.length > 5) {
        searchInput.style.display = "block";
        searchInput.addEventListener("input", filterTrackers);
    } else {
        searchInput.style.display = "none";
    }
}

function filterTrackers(e) {
    const term = e.target.value.toLowerCase();
    const filtered = availableTrackers.filter(t => (t.name || t.id || "").toLowerCase().includes(term));
    renderTrackers(filtered);
}

// Load trackers when modal opens
document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("trackersModal");
    modal.addEventListener("show.bs.modal", loadTrackers);
});
