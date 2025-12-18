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
var map = L.map('map');
// Add a base map layer (you can choose any tile layer you prefer)
   L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{

   }).addTo(map);

   var marker = L.marker([0, 0], {
       draggable: true // Allow marker to be dragged
   }).addTo(map);
   window.onload = function () {
       getLocation();
   };
   function getLocation() {
       if (navigator.geolocation) {

           navigator.geolocation.getCurrentPosition(function (position)
           {
               var latitude = position.coords.latitude;
               var longitude = position.coords.longitude;
               document.getElementById("Latitude").value = latitude;
               document.getElementById("Longitude").value = longitude;
               var userLatLng = [position.coords.latitude, position.coords.longitude];
               map.setView(userLatLng, 13); // Set map view to user's location
               marker.setLatLng(userLatLng);
               // Fetch address details using OpenStreetMap Nominatim API
               fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
                   .then(response => response.json())
                   .then(data => {
                       var address = data.address;
                       console.log(address);
                       var district = address.state_district.replace(" District", "");

                       document.getElementById("City").value = district;
                       document.getElementById("State").value = address.state;
                       document.getElementById("Pincode").value = address.postcode;

                   })
                   .catch(error => console.error("Error fetching address details:", error));
           },
               function (error) {
               console.error("Error getting user location:", error.message);
           });
       } else {
           alert("Geolocation is not supported by this browser.");
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
