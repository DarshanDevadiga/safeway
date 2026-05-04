// Simulation configuration
const SIMULATION_CRASH_INTERVAL = 30000; // Trigger accident every 30s for demo
let map;
let marker;

document.addEventListener('DOMContentLoaded', () => {
  // Common UI Interactions
  initSidebar();
  initUserProfile();
  initGlobalAlertListener();

  // Page Specific Init
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  if (currentPage === 'index.html') {
    initDashboard();
  } else if (currentPage === 'live.html') {
    initLiveSensors();
  } else if (currentPage === 'location.html') {
    initMap();
  } else if (currentPage === 'alert.html') {
    initAlerts();
  }
});

function initSidebar() {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-link');

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath) {
      link.parentElement.classList.add('active');
    }
  });
}

function initUserProfile() {
  const activeUserJson = localStorage.getItem('vadas_active_user');
  if (activeUserJson) {
    try {
      const activeUser = JSON.parse(activeUserJson);
      const nameEl = document.querySelector('.user-widget span');
      const avatarEl = document.querySelector('.user-avatar');

      if (nameEl && avatarEl) {
        nameEl.textContent = activeUser.name;
        avatarEl.textContent = activeUser.name.charAt(0).toUpperCase();
      }
    } catch (e) { /* ignore parse error */ }
  } else {
    // If no active user session, redirect to login
    window.location.href = "login.html";
  }
}

// ==========================================
// Dashboard Logic
// ==========================================
function initDashboard() {
  // Update dashboard based on active alerts count
  const updateDashboardStatus = async () => {
    try {
      const response = await fetch('/api/alerts');
      if (response.ok) {
        const alerts = await response.json();
        const systemStatusEl = document.getElementById('system-statusText');
        if (systemStatusEl) {
          // If there is any alert today (basic logic check for demo)
          if (alerts.length > 0) {
            const latest = alerts[0];
            const isRecent = new Date() - new Date(latest.timestamp) < (1000 * 60 * 60 * 24); // within 24h
            if (isRecent) {
              systemStatusEl.textContent = 'Alert Detected!';
              systemStatusEl.style.color = 'var(--status-critical)';
              return;
            }
          }
          systemStatusEl.textContent = 'Active & Monitoring';
          systemStatusEl.style.color = 'var(--status-good)';
        }
      }
    } catch (e) {
      console.error(e);
    }
  };
  updateDashboardStatus();
  setInterval(updateDashboardStatus, 5000);
}

// ==========================================
// Live Sensor Data Logic (Chart.js via CDN required)
// ==========================================
function initLiveSensors() {
  const ctx = document.getElementById('sensorChart');
  if (!ctx) return;

  const initialData = Array.from({ length: 20 }, () => Math.floor(Math.random() * 5));

  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: Array.from({ length: 20 }, (_, i) => `T-${20 - i}s`),
      datasets: [{
        label: 'Acceleration (g)',
        data: initialData,
        borderColor: '#39d353',
        backgroundColor: 'rgba(57, 211, 83, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 20,
          grid: { color: 'rgba(255,255,255,0.1)' },
          ticks: { color: '#8b949e' }
        },
        x: {
          grid: { display: false },
          ticks: { color: '#8b949e' }
        }
      },
      plugins: {
        legend: { labels: { color: '#fff' } }
      }
    }
  });

  // Chart initialized. Real data would be fetched via WebSocket/Polling here.
}

// ==========================================
// Location Map Logic (Leaflet.js required)
// ==========================================
function initMap() {
  const mapElement = document.getElementById('map');
  if (!mapElement) return;

  // Initialize map to a default location (e.g., Bangalore)
  const defaultLocation = [0, 0];

  map = L.map('map').setView(defaultLocation, 13);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(map);

  const customIcon = L.divIcon({
    className: 'custom-div-icon',
    html: "<div style='background-color:#2f81f7;width:15px;height:15px;border-radius:50%;border:2px solid #fff;box-shadow: 0 0 10px #2f81f7;'></div>",
    iconSize: [15, 15],
    iconAnchor: [7, 7]
  });

  marker = L.marker(defaultLocation, { icon: customIcon }).addTo(map);
  marker.bindPopup("<b>Waiting for IoT Location Data...</b><br>Status: Monitoring").openPopup();

  // Fetch true location data from backend via Alerts
  const fetchRealLocation = async () => {
    try {
      const response = await fetch('/api/alerts');
      if (!response.ok) return;
      const alerts = await response.json();

      if (alerts.length > 0) {
        const latest = alerts[0]; // Assuming newest first
        if (latest.latitude && latest.longitude) {
          const lat = latest.latitude;
          const lng = latest.longitude;
          marker.setLatLng([lat, lng]);
          map.panTo([lat, lng]);

          const crashIcon = L.divIcon({
            className: 'custom-div-icon',
            html: "<div style='background-color:#f85149;width:20px;height:20px;border-radius:50%;border:2px solid #fff;box-shadow: 0 0 20px #f85149;animation: pulse-red 1s infinite;'></div>",
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });
          marker.setIcon(crashIcon);
          marker.bindPopup(`<b>⚠️ ALERT DETECTED!</b><br>Vehicle: ${latest.vehicleNumber || 'Unknown'}<br>Loc: ${lat.toFixed(4)}, ${lng.toFixed(4)}`).openPopup();
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  fetchRealLocation();
  setInterval(fetchRealLocation, 5000);
}

// ==========================================
// Alert Logs Logic
// ==========================================
function initAlerts() {
  const tbody = document.getElementById('alerts-tbody');
  if (!tbody) return;

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/alerts');
      if (!response.ok) return;
      const alerts = await response.json();

      tbody.innerHTML = ''; // clear current rows

      if (alerts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px; color: var(--text-secondary);">No recent emergency detections in database.</td></tr>';
        return;
      }

      alerts.forEach(alert => {
        const row = document.createElement('tr');
        row.className = 'fade-in';
        const time = new Date(alert.timestamp).toLocaleTimeString();
        const badgeClass = alert.severity === 'High' ? 'badge-critical' : 'badge-warning';

        row.innerHTML = `
          <td>${time}</td>
          <td>${alert.vehicleNumber || 'Unknown'}</td>
          <td><span class="badge ${badgeClass}">${alert.severity || 'ACCIDENT'}</span></td>
          <td>Lat: ${alert.latitude ? alert.latitude.toFixed(4) : 0}, Lng: ${alert.longitude ? alert.longitude.toFixed(4) : 0}</td>
          <td>✅ Contact: ${alert.contactNumber || '-'}</td>
          <td>
            <a href="location.html?lat=${alert.latitude}&lng=${alert.longitude}" class="btn btn-primary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;">
              View Map
            </a>
          </td>
        `;
        tbody.appendChild(row);
      });
    } catch (err) {
      console.error('Error fetching alerts:', err);
    }
  };

  // Fetch immediately
  fetchAlerts();

  // Refresh every 5 seconds
  setInterval(fetchAlerts, 5000);
}

// ==========================================
// Global Alert Listener
// ==========================================
function initGlobalAlertListener() {
  let lastAlertId = localStorage.getItem('last_alert_id');

  const checkGlobalAlerts = async () => {
    try {
      const response = await fetch('/api/alerts');
      if (!response.ok) return;
      const alerts = await response.json();

      if (alerts.length > 0) {
        const latest = alerts[0];
        // Ensure new alert trigger only for unique records the user hasn't seen
        if (latest._id && latest._id !== lastAlertId) {
          lastAlertId = latest._id;
          localStorage.setItem('last_alert_id', lastAlertId);
          showGlobalToast(latest);
        }
      }
    } catch (e) {
      console.error('Error in global alert listener:', e);
    }
  };

  function showGlobalToast(alert) {
    const toast = document.createElement('div');
    toast.className = 'global-alert-toast';
    toast.innerHTML = `
      <h3>⚠️ CRITICAL ACCIDENT DETECTED!</h3>
      <p style="margin-bottom: 8px;"><b>Vehicle:</b> ${alert.vehicleNumber || 'Unknown'}</p>
      <p style="margin-bottom: 12px; font-size: 0.9em; color: var(--text-secondary);"><b>GPS Location:</b> Lat: ${alert.latitude ? alert.latitude.toFixed(5) : 0}, Lng: ${alert.longitude ? alert.longitude.toFixed(5) : 0}</p>
      <p style="margin-bottom: 15px; font-size: 0.9em; color: var(--text-secondary);">Emergency SMS dispatched.</p>
      <div style="display: flex; gap: 10px;">
         <a href="location.html" class="btn btn-danger" style="padding: 0.5rem 1rem; flex: 1;">Track Live Map</a>
         <button class="btn" onclick="this.parentElement.parentElement.remove()" style="padding: 0.5rem 1rem;">Dismiss</button>
      </div>
    `;
    document.body.appendChild(toast);
  }

  // Poll every 3 seconds
  setInterval(checkGlobalAlerts, 3000);
}
