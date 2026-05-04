// Modern Vehicle Accident Detection System - Enhanced JavaScript
// Configuration and state management
const CONFIG = {
  SIMULATION_CRASH_INTERVAL: 30000,
  API_BASE: '/api',
  REFRESH_INTERVALS: {
    DASHBOARD: 5000,
    ALERTS: 5000,
    LOCATION: 5000,
    GLOBAL_ALERTS: 3000
  },
  MAP_DEFAULTS: {
    center: [0, 0],
    zoom: 13,
    maxZoom: 20
  }
};

// Global state
const state = {
  map: null,
  marker: null,
  chart: null,
  currentUser: null,
  lastAlertId: localStorage.getItem('last_alert_id') || null,
  intervals: new Set()
};

// Utility functions
const utils = {
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  formatTimestamp: (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  },

  formatCoordinates: (lat, lng, precision = 4) => {
    return {
      lat: lat ? lat.toFixed(precision) : '0',
      lng: lng ? lng.toFixed(precision) : '0'
    };
  },

  showAlert: (message, type = 'info') => {
    const toast = document.createElement('div');
    toast.className = `global-alert-toast ${type === 'critical' ? 'border-status-critical' : 'border-accent-blue'}`;
    toast.innerHTML = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  },

  async fetchAPI(endpoint, options = {}) {
    try {
      const response = await fetch(`${CONFIG.API_BASE}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }
};

// Authentication and user management
class AuthManager {
  static init() {
    this.checkAuthStatus();
    this.setupFormHandlers();
  }

  static checkAuthStatus() {
    const activeUserJson = localStorage.getItem('vadas_active_user');
    if (activeUserJson) {
      try {
        state.currentUser = JSON.parse(activeUserJson);
        this.updateUI();
      } catch (e) {
        console.error('Failed to parse user data:', e);
        this.logout();
      }
    } else if (!window.location.pathname.includes('login')) {
      window.location.href = "/login";
    }
  }

  static updateUI() {
    const nameEl = document.querySelector('.user-widget span');
    const avatarEl = document.querySelector('.user-avatar');

    if (nameEl && avatarEl && state.currentUser) {
      nameEl.textContent = state.currentUser.name || state.currentUser.username;
      avatarEl.textContent = (state.currentUser.name || state.currentUser.username).charAt(0).toUpperCase();
    }
  }

  static setupFormHandlers() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (loginForm) {
      loginForm.addEventListener('submit', this.handleLogin.bind(this));
    }

    if (registerForm) {
      registerForm.addEventListener('submit', this.handleRegister.bind(this));
    }
  }

  static async handleLogin(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get('username');
    const password = formData.get('password');

    try {
      const data = await utils.fetchAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });

      localStorage.setItem('vadas_active_user', JSON.stringify(data.user));
      state.currentUser = data.user;
      window.location.href = '/index';
    } catch (error) {
      utils.showAlert('Login failed: ' + error.message, 'error');
    }
  }

  static async handleRegister(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
      const data = await utils.fetchAPI('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          username: formData.get('username'),
          email: formData.get('email'),
          password: formData.get('password')
        })
      });

      utils.showAlert('Registration successful! Please login.', 'success');
      setTimeout(() => window.location.href = '/login', 2000);
    } catch (error) {
      utils.showAlert('Registration failed: ' + error.message, 'error');
    }
  }

  static logout() {
    localStorage.removeItem('vadas_active_user');
    window.location.href = '/login';
  }
}

// Dashboard functionality
class Dashboard {
  static init() {
    this.setupRealTimeUpdates();
  }

  static setupRealTimeUpdates() {
    const updateStatus = async () => {
      try {
        const alerts = await utils.fetchAPI('/alerts');
        const systemStatusEl = document.getElementById('system-statusText');
        
        if (systemStatusEl) {
          if (alerts.length > 0) {
            const latest = alerts[0];
            const isRecent = (Date.now() - new Date(latest.timestamp).getTime()) < (1000 * 60 * 60 * 24);
            
            if (isRecent) {
              systemStatusEl.textContent = 'Alert Detected!';
              systemStatusEl.className = 'text-status-critical font-semibold';
              return;
            }
          }
          
          systemStatusEl.textContent = 'Active & Monitoring';
          systemStatusEl.className = 'text-status-good font-semibold';
        }
      } catch (error) {
        console.error('Dashboard update error:', error);
      }
    };

    updateStatus();
    const interval = setInterval(updateStatus, CONFIG.REFRESH_INTERVALS.DASHBOARD);
    state.intervals.add(interval);
  }
}

// Live sensors with Chart.js
class SensorMonitor {
  static init() {
    this.setupChart();
  }

  static setupChart() {
    const ctx = document.getElementById('sensorChart');
    if (!ctx || !window.Chart) return;

    const initialData = Array.from({ length: 20 }, () => Math.floor(Math.random() * 5));

    state.chart = new Chart(ctx, {
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

    // Simulate real-time data updates
    this.simulateDataUpdates();
  }

  static simulateDataUpdates() {
    const updateData = () => {
      if (!state.chart) return;

      state.chart.data.datasets[0].data.shift();
      state.chart.data.datasets[0].data.push(Math.floor(Math.random() * 15));
      state.chart.data.labels.shift();
      state.chart.data.labels.push('T-0s');
      state.chart.update('none');
    };

    const interval = setInterval(updateData, 1000);
    state.intervals.add(interval);
  }
}

// Location mapping with Leaflet
class LocationTracker {
  static init() {
    this.setupMap();
  }

  static setupMap() {
    const mapElement = document.getElementById('map');
    if (!mapElement || !window.L) return;

    state.map = window.L.map('map').setView(CONFIG.MAP_DEFAULTS.center, CONFIG.MAP_DEFAULTS.zoom);

    window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: CONFIG.MAP_DEFAULTS.maxZoom
    }).addTo(state.map);

    this.createMarker(CONFIG.MAP_DEFAULTS.center);
    this.startLocationUpdates();
  }

  static createMarker(location) {
    if (!window.L) return;

    const customIcon = window.L.divIcon({
      className: 'custom-div-icon',
      html: "<div style='background-color:#2f81f7;width:15px;height:15px;border-radius:50%;border:2px solid #fff;box-shadow: 0 0 10px #2f81f7;'></div>",
      iconSize: [15, 15],
      iconAnchor: [7, 7]
    });

    state.marker = window.L.marker(location, { icon: customIcon }).addTo(state.map);
    state.marker.bindPopup("<b>Waiting for IoT Location Data...</b><br>Status: Monitoring").openPopup();
  }

  static async startLocationUpdates() {
    const updateLocation = async () => {
      try {
        const alerts = await utils.fetchAPI('/alerts');
        
        if (alerts.length > 0) {
          const latest = alerts[0];
          if (latest.latitude && latest.longitude && window.L && state.map && state.marker) {
            const lat = latest.latitude;
            const lng = latest.longitude;
            
            state.marker.setLatLng([lat, lng]);
            state.map.panTo([lat, lng]);

            const crashIcon = window.L.divIcon({
              className: 'custom-div-icon',
              html: "<div style='background-color:#f85149;width:20px;height:20px;border-radius:50%;border:2px solid #fff;box-shadow: 0 0 20px #f85149;animation: pulse-red 1s infinite;'></div>",
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            });
            
            state.marker.setIcon(crashIcon);
            const coords = utils.formatCoordinates(lat, lng);
            state.marker.bindPopup(`<b>⚠️ ALERT DETECTED!</b><br>Vehicle: ${latest.vehicleNumber || 'Unknown'}<br>Loc: ${coords.lat}, ${coords.lng}`).openPopup();
          }
        }
      } catch (error) {
        console.error('Location update error:', error);
      }
    };

    updateLocation();
    const interval = setInterval(updateLocation, CONFIG.REFRESH_INTERVALS.LOCATION);
    state.intervals.add(interval);
  }
}

// Alert management
class AlertManager {
  static init() {
    this.setupAlertTable();
    this.setupGlobalAlertListener();
  }

  static setupAlertTable() {
    const tbody = document.getElementById('alerts-tbody');
    if (!tbody) return;

    const fetchAlerts = async () => {
      try {
        const alerts = await utils.fetchAPI('/alerts');
        tbody.innerHTML = '';

        if (alerts.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" class="text-center p-5 text-text-secondary">No recent emergency detections in database.</td></tr>';
          return;
        }

        alerts.forEach(alert => {
          const row = this.createAlertRow(alert);
          tbody.appendChild(row);
        });
      } catch (error) {
        console.error('Error fetching alerts:', error);
        tbody.innerHTML = '<tr><td colspan="6" class="text-center p-5 text-status-critical">Error loading alerts</td></tr>';
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, CONFIG.REFRESH_INTERVALS.ALERTS);
    state.intervals.add(interval);
  }

  static createAlertRow(alert) {
    const row = document.createElement('tr');
    row.className = 'animate-fade-in';
    
    const time = utils.formatTimestamp(alert.timestamp);
    const badgeClass = alert.severity === 'High' ? 'badge-critical' : 'badge-warning';
    const coords = utils.formatCoordinates(alert.latitude, alert.longitude);

    row.innerHTML = `
      <td class="p-4">${time}</td>
      <td class="p-4">${alert.vehicleNumber || 'Unknown'}</td>
      <td class="p-4"><span class="badge ${badgeClass}">${alert.severity || 'ACCIDENT'}</span></td>
      <td class="p-4">Lat: ${coords.lat}, Lng: ${coords.lng}</td>
      <td class="p-4">✅ Contact: ${alert.contactNumber || '-'}</td>
      <td class="p-4">
        <a href="/location?lat=${alert.latitude}&lng=${alert.longitude}" class="btn btn-primary px-3 py-2 text-sm">
          View Map
        </a>
      </td>
    `;
    
    return row;
  }

  static setupGlobalAlertListener() {
    const checkAlerts = async () => {
      try {
        const alerts = await utils.fetchAPI('/alerts');
        
        if (alerts.length > 0) {
          const latest = alerts[0];
          if (latest._id && latest._id !== state.lastAlertId) {
            state.lastAlertId = latest._id;
            localStorage.setItem('last_alert_id', state.lastAlertId);
            this.showGlobalAlert(latest);
          }
        }
      } catch (error) {
        console.error('Global alert listener error:', error);
      }
    };

    const interval = setInterval(checkAlerts, CONFIG.REFRESH_INTERVALS.GLOBAL_ALERTS);
    state.intervals.add(interval);
  }

  static showGlobalAlert(alert) {
    const coords = utils.formatCoordinates(alert.latitude, alert.longitude, 5);
    
    const alertHTML = `
      <h3 class="text-status-critical text-xl font-bold mb-2">⚠️ CRITICAL ACCIDENT DETECTED!</h3>
      <p class="mb-2"><b>Vehicle:</b> ${alert.vehicleNumber || 'Unknown'}</p>
      <p class="mb-3 text-sm text-text-secondary"><b>GPS Location:</b> Lat: ${coords.lat}, Lng: ${coords.lng}</p>
      <p class="mb-4 text-sm text-text-secondary">Emergency SMS dispatched.</p>
      <div class="flex gap-2">
         <a href="/location" class="btn btn-danger flex-1">Track Live Map</a>
         <button class="btn" onclick="this.parentElement.parentElement.remove()">Dismiss</button>
      </div>
    `;
    
    utils.showAlert(alertHTML, 'critical');
  }
}

// Navigation and UI
class Navigation {
  static init() {
    this.setupSidebar();
    this.setupMobileMenu();
  }

  static setupSidebar() {
    const currentPath = window.location.pathname.split('/').pop() || 'index';
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href === currentPath || (currentPath === '' && href === 'index')) {
        link.parentElement.classList.add('active');
      }
    });
  }

  static setupMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (menuToggle && sidebar) {
      menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('-translate-x-full');
      });
    }
  }
}

// Main application initialization
class App {
  static init() {
    // Initialize core modules
    AuthManager.init();
    Navigation.init();

    // Page-specific initialization
    const currentPage = window.location.pathname.split('/').pop() || '';
    
    const pageInitMap = {
      '': Dashboard,
      'index': Dashboard,
      'live': SensorMonitor,
      'location': LocationTracker,
      'alert': AlertManager,
      'alerts': AlertManager
    };

    const pageInit = pageInitMap[currentPage];
    if (pageInit) {
      pageInit.init();
    }

    // Initialize alert manager globally for toast notifications
    if (!['alert', 'alerts'].includes(currentPage)) {
      AlertManager.setupGlobalAlertListener();
    }

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      state.intervals.forEach(interval => clearInterval(interval));
    });

    console.log('Vehicle Accident Detection System initialized');
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.init());
} else {
  App.init();
}

// Global error handler
window.addEventListener('error', (e) => {
  console.error('Global error:', e.error);
});

// Export for external use if needed
window.VehicleApp = {
  utils,
  AuthManager,
  Dashboard,
  SensorMonitor,
  LocationTracker,
  AlertManager,
  Navigation,
  state
};
