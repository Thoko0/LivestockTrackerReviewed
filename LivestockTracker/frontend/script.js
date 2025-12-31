// ===========================
// CONFIG
// ===========================
const TRACKER_API = `https://livestocktrackerwebapp.onrender.com/tracker_data`;

// ===========================
// CONFIG-VARIABLES
// ===========================
let map;
let minimap;
let pathLine;
let trackerMarker = null;
let availableTrackers = []; // filled from backend
let trackerMarkers = []; // store all markers for easy removal
function ensureMapReady() {
    if (!map) {
        initMap();
        setTimeout(() => map.invalidateSize(), 200);
    }
}

// ===========================
// MOBILE MENU
// ===========================
document.getElementById("hamburger").addEventListener("click", () => {
    tabs.forEach(tab => tab.classList.toggle("show"));
});

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
        if (tab.id === "charts-tab") {
            initMapCard();
        }
    });
});

// ****************************
// MAPS TAB CONFIGURATION SETTINGS
// ****************************



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
// SHOW ALL TRACKERS ON MAP
// ===========================
// Attach setting to button
document.addEventListener("DOMContentLoaded", () => {
    document
        .getElementById("showAllTrackersBtn")
        .addEventListener("click", showAllTrackers);
});

async function showAllTrackers() {
    try {

        ensureMapReady();   

        const response = await fetch('https://livestocktrackerwebapp.onrender.com/trackers/map');
        if (!response.ok) throw new Error("Failed to fetch trackers");

        const allTrackers = await response.json();

        // Remove existing markers
        trackerMarkers.forEach(m => map.removeLayer(m));
        trackerMarkers = [];

        if (!allTrackers || allTrackers.length === 0) {
            console.log("No trackers found");
            return;
        }

        // Pick only the latest record per device
        const latestTrackersMap = {};
        allTrackers.forEach(tracker => {
            const id = tracker.device_id;
            if (!latestTrackersMap[id] || new Date(tracker.timestamp) > new Date(latestTrackersMap[id].timestamp)) {
                latestTrackersMap[id] = tracker;
            }
        });

        const bounds = [];

        // Add markers for latest trackers only
        Object.values(latestTrackersMap).forEach(tracker => {
            const lat = Number(tracker.latitude);
            const lon = Number(tracker.longitude);

            if (!isNaN(lat) && !isNaN(lon)) {
                const marker = L.marker([lat, lon])
                    .addTo(map)
                    .bindPopup(`Tracker ${tracker.device_id}`);
                trackerMarkers.push(marker);

                bounds.push([lat, lon]);
            }
        });

        // Fit map to markers
        if (bounds.length > 0) {
            map.fitBounds(bounds, { padding: [50, 50] });
        }

    } catch (err) {
        console.error("SHOW ALL TRACKERS FAILED:", err);
        alert(err.message);
    }
}

// ===========================
// MAP SEARCH (LOCATE TRACKER)
// ===========================

//attach setting to button
document
    .getElementById("mapSearchBtn")
    .addEventListener("click", locateTrackerOnMap);

async function locateTrackerOnMap() {

    ensureMapReady();   

    const trackerId = document.getElementById("mapTrackerIdInput").value.trim();
    if (!trackerId) return alert("Enter a tracker ID");

    try {
        const response = await fetch(`${TRACKER_API}/${encodeURIComponent(trackerId)}`);
        if (!response.ok) throw new Error("Tracker not found");

        const data = await response.json();
        const lat = Number(data.latitude);
        const lon = Number(data.longitude);

        if (isNaN(lat) || isNaN(lon)) return alert("Tracker has no valid location");

        // Remove previous marker if exists
        if (trackerMarker) trackerMarker.remove();

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

//****************************
//DEVICES TAB
//****************************
//==========================
// TABLE ROW MANAGEMENT
//==========================
function addOrUpdateTableRow(tracker) {
    const tableBody = document.getElementById("device-table-body");
    let row = document.getElementById(`tracker-row-${tracker.device_id}`);

    if (!row) {
        row = document.createElement("tr");
        row.id = `tracker-row-${tracker.device_id}`;
        tableBody.appendChild(row);
    }

    row.innerHTML = `
        <td>${tracker.device_id}</td>
        <td>${tracker.latitude.toFixed(5)}</td>
        <td>${tracker.longitude.toFixed(5)}</td>
        <td>${tracker.speed ?? 0}</td>
        <td>${tracker.behavior ?? "-"}</td>
        <td>${new Date(tracker.created_at).toLocaleString()}</td>
        <td>
            <button class="btn btn-sm btn-primary" onclick="refreshTracker('${tracker.device_id}')">Refresh</button>
            <button class="btn btn-sm btn-danger" onclick="deleteTracker('${tracker.device_id}', this)">Delete</button>
            <button class="btn btn-sm btn-secondary" onclick="findOnMap('${tracker.device_id}')">Find on Map</button>
            <button class="btn btn-sm btn-secondary" onclick="Playtone('${tracker.device_id}', this)">Play Tone</button>
        </td>
    `;
}                      


// ===========================
// ADD TRACKER BUTTON SETTING
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
// SEARCH TRACKER BUTTON SETTING
// ===========================
document
    .getElementById("searchTrackerBtn")
    .addEventListener("click", searchTracker);
async function searchTracker() {
    const deviceId = document.getElementById("trackerIdInput").value.trim();
    if (!deviceId) return alert("Enter a tracker ID to search");

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
// ===========================
// FIND TRACKER BY SOUND
// ===========================

async function Playtone(deviceId, buttonElement)  {
    if(!confirm(`Send sound command to tracker "${deviceId}"?`)) return;

    try {
        const response = await fetch(`${TRACKER_API}/${encodeURIComponent(deviceId)}/play-sound`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ device_id: deviceId })
        });

        if (!response.ok) throw new Error("Failed to send sound command");

        alert(`Sound command sent to tracker "${deviceId}"`);
    } catch (err) {
        alert(err.message);
    }
}

// ===========================
// FIND TRACKER FROM DEVICES → MAP
// ===========================
function findOnMap(trackerId) {
    // 1. Switch to Maps tab
    document.getElementById("maps-tab").click();

    // 2. Fill the map search input
    document.getElementById("mapTrackerIdInput").value = trackerId;

    // 3. Ensure map is ready, then locate
    setTimeout(() => {
        locateTrackerOnMap();
    }, 300);
}


// ===========================
// CHARTS INITIALIZATION & UPDATING
// ===========================

// Chart.js initialization
const behaviorMap = ['Grazing','Standing','Resting','Moving'];
const behaviorColors = ['#7CC576','#36A2EB','#FFCE56','#FF6384'];

const trackers = {}; // Filled from backend with tracker data};

// Initialize line chart
const lineChart = new Chart(document.getElementById('lineChart'), {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            data: [],
            borderColor: '#36A2EB',
            backgroundColor: 'rgba(54,162,235,0.08)',
            fill: true,
            tension: 0.3,
            pointRadius: 6,
            pointBackgroundColor:[1]
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
            data: [],
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
    if (!gpsPoints || gpsPoints.length < 2) {
        document.getElementById('distanceDisplay').innerText = "0.0";
        document.getElementById('trendIcon').style.display = 'none';
        return;
    }

    // Sort by timestamp
    const sortedPoints = gpsPoints.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    let totalKm = 0;

    for (let i = 0; i < sortedPoints.length - 1; i++) {
        const p1 = sortedPoints[i];
        const p2 = sortedPoints[i + 1];

        totalKm += calculateHaversine(p1.latitude, p1.longitude, p2.latitude, p2.longitude);
    }

    document.getElementById('distanceDisplay').innerText = totalKm.toFixed(2);
    document.getElementById('trendIcon').style.display = totalKm > 0 ? 'inline' : 'none';
}

async function fetchDailyDistance(deviceId, date) {
    try {
        const response = await fetch(
            `https://livestocktrackerwebapp.onrender.com/tracker_data/${deviceId}/path?date=${date}`
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const gpsPoints = await response.json();

        updateTotalDistance(gpsPoints);

    } catch (error) {
        console.error("Failed to fetch daily distance:", error);
    }
}



// Update line chart
function updateCharts(tracker) {
    const labels = tracker.timeLabels || [];
    const values = tracker.behaviorValues || [];
    const pie = tracker.pieValues || [];

    // Update line chart
    lineChart.data.labels = labels;
    lineChart.data.datasets[0].data = values;
    lineChart.data.datasets[0].pointBackgroundColor = values.map(v => behaviorColors[v] || "gray");
    lineChart.update();

    // Update pie chart
    pieChart.data.datasets[0].data = pie;
    pieChart.update();

    //update activity ratio
    // --- Calculate activity counts ---
    const counts = { grazing: 0, standing: 0, moving: 0, resting: 0 };
    values.forEach(b => {
        switch(b) {
            case 0: counts.grazing++; break;
            case 1: counts.standing++; break;
            case 2: counts.moving++; break;
            case 3: counts.resting++; break;
        }
    });

    // --- Call updateActivityRatio ---
    updateActivityRatio(counts.grazing, counts.standing, counts.moving, counts.resting);
}

// Switch tracker function (simplified, auto-picks date if empty)
async function switchTracker(deviceId, date) {
    try {
        // If no date provided, get the first available timestamp for the tracker
        if (!date) {
            const res = await fetch(`https://livestocktrackerwebapp.onrender.com/tracker_data/${deviceId}`);
            const data = await res.json();
            date = data.timestamp ? new Date(data.timestamp).toISOString().slice(0, 10) 
                                  : new Date().toISOString().slice(0, 10);
        }

        // Fetch chart data from backend
        const response = await fetch(`https://livestocktrackerwebapp.onrender.com/tracker_data/${deviceId}/chart?date=${date}`);
        const tracker = await response.json();

        console.log("Fetching data for device:", deviceId, "on date:", date);

        // Update chart title
        document.getElementById('chartTitle').innerText = 'Tracker ' + deviceId;

        // Update the charts
        updateCharts(tracker);

        // Update total distance
        fetchDailyDistance(deviceId, date);                                

    } catch (err) {
        console.error("Failed to fetch chart data:", err);
    }
}


// ===========================
// MINIMAP INITIALIZATION 
// ===========================
function initMapCard() {
    minimap = L.map("mapCard", {
        zoomControl: false,
        scrollWheelZoom: false,
        dragging: false
    }).setView([0, 0], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18
    }).addTo(minimap);

}


async function loadDailyPath(deviceId, date) {
    try {
        const res = await fetch(`https://livestocktrackerwebapp.onrender.com/tracker_data/${deviceId}/path?date=${date}`);
        const points = await res.json();

        if (!points || points.length === 0) return;

        const pathData = points.map(p => ({ latitude: p.latitude, longitude: p.longitude }));
        updateTotalDistance(pathData);

        // Remove previous polyline
        if (pathLine) minimap.removeLayer(pathLine);

        minimap.invalidateSize();

        const latLngs = pathData.map(p => [p.latitude, p.longitude]);
        pathLine = L.polyline(latLngs, { color: "green", weight: 4 }).addTo(minimap);

        minimap.fitBounds(pathLine.getBounds());

        // Optional start & end markers
        L.marker(latLngs[0]).addTo(minimap).bindPopup("Start");
        L.marker(latLngs[latLngs.length - 1]).addTo(minimap).bindPopup("End");

    } catch (err) {
        console.error("Failed to load daily path:", err);
    }
}

// -------------------------------
// DYNAMIC TRACKERS MODAL
// -------------------------------


async function loadTrackers() {
    try {
        const response = await fetch(`https://livestocktrackerwebapp.onrender.com/trackers/list`);
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
        const trackerId = tracker.tracker_id || tracker.id;

        if (!trackerId) {
            console.error("Invalid tracker object:", tracker);
            return;
        }

        const btn = document.createElement("button");
        btn.className = "btn btn-outline-primary";
        btn.textContent = trackerId;

        btn.onclick = () => {
            const selectedDateInput = document.getElementById("dateInput");
            const date =
                selectedDateInput?.value || new Date().toISOString().slice(0, 10);

            switchTracker(trackerId, date); // Updates charts
            loadDailyPath(trackerId, date);   // Updates mini map path

            btn.setAttribute("data-bs-dismiss", "modal");
        };

        btn.setAttribute("data-bs-dismiss", "modal");
        container.appendChild(btn);
    });
}


    const searchInput = document.getElementById("trackerSearch");
    if (trackers.length > 5) {
        searchInput.style.display = "block";
        searchInput.addEventListener("input", filterTrackers);
    } else {
        searchInput.style.display = "none";
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

document.addEventListener("DOMContentLoaded", () => {
    initMapCard(); // initialize the mini map
});