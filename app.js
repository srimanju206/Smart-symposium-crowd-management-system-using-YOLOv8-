/**
 * Smart Symposium Crowd Management System
 * Core Frontend Application Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- APPLICATION STATE ---
  const state = {
    currentUser: null,
    activePage: 'dashboard',
    connectionMode: 'simulation', // 'simulation' or 'live'
    backendUrl: 'http://localhost:5000',
    simSpeed: 'medium', // 'slow', 'medium', 'fast'
    simIntervalId: null,
    
    // Zone Threshold Configs
    zones: {
      auditorium: {
        name: 'Main Auditorium',
        count: 42,
        capacity: 150,
        threshold: 80, // %
        status: 'Normal',
        priority: 'High'
      },
      registration: {
        name: 'Registration Hall',
        count: 28,
        capacity: 80,
        threshold: 75,
        status: 'Normal',
        priority: 'Medium'
      },
      seminar: {
        name: 'Seminar Hall-A',
        count: 15,
        capacity: 60,
        threshold: 85,
        status: 'Normal',
        priority: 'Low'
      },
      foodcourt: {
        name: 'Food Court Plaza',
        count: 35,
        capacity: 100,
        threshold: 70,
        status: 'Normal',
        priority: 'Medium'
      }
    },
    
    // Alert Logs & System State
    alerts: [],
    unreadAlertsCount: 0,
    cumulativeVisitors: 1240,
    peakHour: '02:30 PM',
    redirectCount: 14,
    
    // Camera Stream State
    activeCamera: 'auditorium',
    simulatedPeople: [],
    yoloFps: 29.4,
    yoloLatency: 12, // ms
    
    // Charts
    flowChart: null,
    utilChart: null
  };

  // --- MOCK CONSTANTS FOR STREAM SIMULATION ---
  const STREAM_WIDTH = 640;
  const STREAM_HEIGHT = 360;
  
  // Set default credentials in LocalStorage if not present
  if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify({
      'admin@college.edu': {
        name: 'Admin Organizer',
        password: 'password'
      }
    }));
  }

  // --- INITIALIZATION ---
  initApp();

  function initApp() {
    setupLucide();
    checkAuthSession();
    registerEventListeners();
    setupPasswordToggles();
    initStreamSimulator();
    startSimulation();
  }

  function setupLucide() {
    // Initialize Lucide Icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  function setupPasswordToggles() {
    const setupToggle = (inputId, toggleId) => {
      const passwordInput = document.getElementById(inputId);
      const toggleBtn = document.getElementById(toggleId);
      if (!passwordInput || !toggleBtn) return;
      
      toggleBtn.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        const icon = toggleBtn.querySelector('i');
        if (type === 'password') {
          icon.setAttribute('data-lucide', 'eye');
        } else {
          icon.setAttribute('data-lucide', 'eye-off');
        }
        if (window.lucide) {
          window.lucide.createIcons();
        }
      });
    };

    setupToggle('login-password', 'login-password-toggle');
    setupToggle('signup-password', 'signup-password-toggle');
  }

  // --- AUTHENTICATION MODULE ---
  function checkAuthSession() {
    const session = localStorage.getItem('currentUser');
    if (session) {
      state.currentUser = JSON.parse(session);
      showAppContainer();
    } else {
      showAuthContainer();
    }
  }

  function showAuthContainer() {
    document.getElementById('auth-container').classList.remove('hidden');
    document.getElementById('app-container').classList.add('hidden');
  }

  function showAppContainer() {
    document.getElementById('auth-container').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');
    
    // Update Profile UI
    document.getElementById('user-display-name').textContent = state.currentUser.name;
    document.getElementById('user-display-email').textContent = state.currentUser.email;
    const initials = state.currentUser.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
    document.getElementById('user-initials').textContent = initials;
    
    // Set settings defaults in inputs
    loadSettingsInputs();
    
    // Render charts
    initCharts();
    
    // Refresh routing map and steps
    updateRoutingView();
  }

  function registerEventListeners() {
    // Auth Toggles
    document.getElementById('to-signup-link').addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('login-card').classList.add('hidden');
      document.getElementById('signup-card').classList.remove('hidden');
    });

    document.getElementById('to-login-link').addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('signup-card').classList.add('hidden');
      document.getElementById('login-card').classList.remove('hidden');
    });

    // Login Form Submit
    document.getElementById('login-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      
      const users = JSON.parse(localStorage.getItem('users') || '{}');
      
      if (users[email] && users[email].password === password) {
        state.currentUser = {
          email: email,
          name: users[email].name
        };
        
        if (document.getElementById('login-remember').checked) {
          localStorage.setItem('currentUser', JSON.stringify(state.currentUser));
        } else {
          sessionStorage.setItem('currentUser', JSON.stringify(state.currentUser));
        }
        
        showAppContainer();
      } else {
        alert('Invalid email or password. Use: admin@college.edu / password');
      }
    });

    // Signup Form Submit
    document.getElementById('signup-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('signup-name').value.trim();
      const email = document.getElementById('signup-email').value.trim();
      const password = document.getElementById('signup-password').value;
      
      const users = JSON.parse(localStorage.getItem('users') || '{}');
      
      if (users[email]) {
        alert('Email already registered!');
        return;
      }
      
      users[email] = { name, password };
      localStorage.setItem('users', JSON.stringify(users));
      
      alert('Account created successfully! Please sign in.');
      document.getElementById('signup-card').classList.add('hidden');
      document.getElementById('login-card').classList.remove('hidden');
    });

    // Logout
    document.getElementById('logout-btn').addEventListener('click', () => {
      localStorage.removeItem('currentUser');
      sessionStorage.removeItem('currentUser');
      state.currentUser = null;
      showAuthContainer();
    });

    // SPA Navigation routing
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = item.getAttribute('data-page');
        navigateTo(page);
        
        navItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');
      });
    });

    // Notification dropdown toggle
    const bellToggle = document.getElementById('bell-toggle');
    const bellBtn = bellToggle.querySelector('.icon-btn');
    const dropdown = document.getElementById('notification-dropdown');
    
    bellBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('active');
      state.unreadAlertsCount = 0;
      updateBellBadge();
    });
    
    document.addEventListener('click', () => {
      dropdown.classList.remove('active');
    });
    
    dropdown.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    document.getElementById('clear-notifications-btn').addEventListener('click', () => {
      state.alerts = [];
      updateAlertLogs();
      updateBellBadge();
    });

    // Camera Selector
    document.getElementById('camera-select').addEventListener('change', (e) => {
      state.activeCamera = e.target.value;
      initStreamSimulator();
      updateStreamCountDisplay();
    });

    // Toggle Backend vs Simulation Mode
    const connectBtn = document.getElementById('reconnect-backend-btn');
    connectBtn.addEventListener('click', () => {
      if (state.connectionMode === 'simulation') {
        attemptBackendConnection();
      } else {
        disconnectFromBackend();
      }
    });

    // Settings thresholds save
    document.getElementById('thresholds-form').addEventListener('submit', (e) => {
      e.preventDefault();
      state.zones.auditorium.capacity = parseInt(document.getElementById('input-cap-auditorium').value);
      state.zones.auditorium.threshold = parseInt(document.getElementById('input-thresh-auditorium').value);
      
      state.zones.registration.capacity = parseInt(document.getElementById('input-cap-registration').value);
      state.zones.registration.threshold = parseInt(document.getElementById('input-thresh-registration').value);

      state.zones.seminar.capacity = parseInt(document.getElementById('input-cap-seminar').value);
      state.zones.seminar.threshold = parseInt(document.getElementById('input-thresh-seminar').value);

      state.zones.foodcourt.capacity = parseInt(document.getElementById('input-cap-foodcourt').value);
      state.zones.foodcourt.threshold = parseInt(document.getElementById('input-thresh-foodcourt').value);

      // Save to localStorage or mock backend save
      alert('Threshold configurations updated successfully!');
      
      updateZoneCardsUI();
      updateChartsData();
      updateRoutingView();
    });

    // Settings Reset
    document.getElementById('btn-reset-thresholds').addEventListener('click', () => {
      document.getElementById('input-cap-auditorium').value = 150;
      document.getElementById('input-thresh-auditorium').value = 80;
      document.getElementById('input-cap-registration').value = 80;
      document.getElementById('input-thresh-registration').value = 75;
      document.getElementById('input-cap-seminar').value = 60;
      document.getElementById('input-thresh-seminar').value = 85;
      document.getElementById('input-cap-foodcourt').value = 100;
      document.getElementById('input-thresh-foodcourt').value = 70;
    });

    // Server connection change
    document.getElementById('input-backend-url').addEventListener('change', (e) => {
      state.backendUrl = e.target.value.trim();
    });

    // Simulation speed toggle
    document.getElementById('select-sim-speed').addEventListener('change', (e) => {
      state.simSpeed = e.target.value;
      startSimulation(); // Rebuild simulation speed intervals
    });

    // Desktop notifications enable
    document.getElementById('btn-request-notifications').addEventListener('click', () => {
      if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            alert('Desktop alerts active! You will be notified of congestions.');
          }
        });
      } else {
        alert('Notifications not supported by this browser.');
      }
    });

    // Export CSV
    document.getElementById('btn-export-csv').addEventListener('click', () => {
      exportReportToCSV();
    });

    // Wipe Log
    document.getElementById('btn-clear-alerts').addEventListener('click', () => {
      state.alerts = [];
      updateAlertLogs();
      updateBellBadge();
      alert('Alert logs cleared.');
    });

    // SVG Map Demo Congestion Trigger
    document.getElementById('btn-toggle-demo-congestion').addEventListener('click', () => {
      // Toggle auditorium to critical and food court to warning
      const isCongested = state.zones.auditorium.count > 120;
      if (isCongested) {
        state.zones.auditorium.count = 45;
        state.zones.foodcourt.count = 35;
      } else {
        state.zones.auditorium.count = 138; // 92% (Exceeds 80%)
        state.zones.foodcourt.count = 85;  // 85% (Exceeds 70%)
        triggerSystemAlert('auditorium', 'CRITICAL OVERCROWDING: Auditorium occupancy exceeds 90%! Redirecting attendees.');
      }
      
      updateZoneCardsUI();
      updateChartsData();
      updateRoutingView();
    });

    // Refresh charts
    document.getElementById('btn-chart-refresh').addEventListener('click', () => {
      updateChartsData();
      alert('Analytics data refreshed.');
    });
  }

  // --- SPA VIEWS ROUTER ---
  function navigateTo(pageId) {
    state.activePage = pageId;
    
    // Hide all pages
    const pages = document.querySelectorAll('.app-page');
    pages.forEach(p => p.classList.add('hidden'));
    
    // Show selected page
    const activePage = document.getElementById(`${pageId}-page`);
    if (activePage) {
      activePage.classList.remove('hidden');
    }
    
    // Update Top Header titles
    const titleEl = document.getElementById('page-title');
    const subtitleEl = document.getElementById('page-subtitle');
    
    switch (pageId) {
      case 'dashboard':
        titleEl.textContent = 'Crowd Density Overview';
        subtitleEl.textContent = 'Real-time object detection and safety monitoring';
        break;
      case 'analytics':
        titleEl.textContent = 'Symposium Historical Analytics';
        subtitleEl.textContent = 'Interactive timeline distribution charts and logs';
        // Resize charts to fit
        if (state.flowChart) state.flowChart.resize();
        if (state.utilChart) state.utilChart.resize();
        break;
      case 'routing':
        titleEl.textContent = 'Smart Route Recommendation Engine';
        subtitleEl.textContent = 'Venue pathfinding bypasses and queue management';
        break;
      case 'settings':
        titleEl.textContent = 'System Parameters & Configurations';
        subtitleEl.textContent = 'Set capacity limits, warning thresholds, and server link';
        break;
    }
  }

  // --- LOCAL SETTINGS LOADER ---
  function loadSettingsInputs() {
    document.getElementById('input-cap-auditorium').value = state.zones.auditorium.capacity;
    document.getElementById('input-thresh-auditorium').value = state.zones.auditorium.threshold;
    document.getElementById('input-cap-registration').value = state.zones.registration.capacity;
    document.getElementById('input-thresh-registration').value = state.zones.registration.threshold;
    document.getElementById('input-cap-seminar').value = state.zones.seminar.capacity;
    document.getElementById('input-thresh-seminar').value = state.zones.seminar.threshold;
    document.getElementById('input-cap-foodcourt').value = state.zones.foodcourt.capacity;
    document.getElementById('input-thresh-foodcourt').value = state.zones.foodcourt.threshold;
  }

  // --- CONNECTED BACKEND MODULE (REAL YOLOv8) ---
  function attemptBackendConnection() {
    const badge = document.getElementById('connection-status-badge');
    const label = document.getElementById('status-mode-label');
    const dot = badge.querySelector('.status-dot');
    const connectBtnText = document.getElementById('reconnect-backend-btn').querySelector('span');
    
    // Change to Connecting State
    label.textContent = 'Connecting...';
    dot.className = 'status-dot warning-bg';
    badge.className = 'status-indicator-badge warning-glow';

    // Ping Python server health endpoint
    fetch(`${state.backendUrl}/api/counts`)
      .then(res => {
        if (!res.ok) throw new Error('API server down');
        return res.json();
      })
      .then(data => {
        // Connection success
        state.connectionMode = 'live';
        label.textContent = 'YOLOv8 Live Online';
        dot.className = 'status-dot success-bg';
        badge.className = 'status-indicator-badge success-glow';
        connectBtnText.textContent = 'Simulator Mode';
        
        // Hide simulation canvas, show backend feed image
        document.getElementById('simulated-stream-canvas').classList.add('hidden');
        document.getElementById('live-backend-img').classList.remove('hidden');
        
        // Clear standalone interval
        if (state.simIntervalId) {
          clearInterval(state.simIntervalId);
          state.simIntervalId = null;
        }

        // Start reading live metrics
        startLiveInferenceListener();
      })
      .catch(err => {
        console.error(err);
        alert(`Failed to connect to YOLOv8 Flask backend at ${state.backendUrl}. Keeping Standalone Simulation Mode active.`);
        disconnectFromBackend();
      });
  }

  function disconnectFromBackend() {
    state.connectionMode = 'simulation';
    
    const badge = document.getElementById('connection-status-badge');
    const label = document.getElementById('status-mode-label');
    const dot = badge.querySelector('.status-dot');
    const connectBtnText = document.getElementById('reconnect-backend-btn').querySelector('span');
    
    label.textContent = 'Simulation Mode';
    dot.className = 'status-dot warning-bg';
    badge.className = 'status-indicator-badge warning-glow';
    connectBtnText.textContent = 'Live Mode';
    
    // Show simulation canvas, hide backend feed image
    document.getElementById('simulated-stream-canvas').classList.remove('hidden');
    document.getElementById('live-backend-img').classList.add('hidden');
    
    // Start simulation back up
    startSimulation();
  }

  let liveListenerInterval = null;
  function startLiveInferenceListener() {
    if (liveListenerInterval) clearInterval(liveListenerInterval);
    
    // Update live stream image src
    updateBackendStreamSrc();

    liveListenerInterval = setInterval(() => {
      if (state.connectionMode !== 'live') {
        clearInterval(liveListenerInterval);
        return;
      }
      
      // Fetch latest YOLOv8 counts
      fetch(`${state.backendUrl}/api/counts`)
        .then(res => res.json())
        .then(data => {
          // data format: { auditorium: 45, registration: 20, ... }
          Object.keys(data).forEach(zoneKey => {
            if (state.zones[zoneKey]) {
              state.zones[zoneKey].count = data[zoneKey];
            }
          });
          
          // Speed, FPS, Latency overlay updates
          state.yoloFps = (27 + Math.random() * 4).toFixed(1);
          state.yoloLatency = (10 + Math.random() * 5).toFixed(1);
          document.getElementById('yolo-fps').textContent = state.yoloFps;
          document.getElementById('yolo-latency').textContent = state.yoloLatency + 'ms';
          
          // Re-evaluate system safety thresholds
          evaluateSystemCounts();
        })
        .catch(err => {
          console.error('Lost live backend server link:', err);
          disconnectFromBackend();
        });
    }, 1500);
  }

  function updateBackendStreamSrc() {
    const liveImg = document.getElementById('live-backend-img');
    liveImg.src = `${state.backendUrl}/video_feed?cam=${state.activeCamera}&t=${new Date().getTime()}`;
  }

  // --- CROWD DENSITY SIMULATOR (STANDALONE DEMO MODE) ---
  function startSimulation() {
    if (state.simIntervalId) clearInterval(state.simIntervalId);
    
    let intervalTime = 3000;
    if (state.simSpeed === 'slow') intervalTime = 5000;
    else if (state.simSpeed === 'fast') intervalTime = 1200;
    
    state.simIntervalId = setInterval(() => {
      // Simulate occupancy changes (random walking flows)
      Object.keys(state.zones).forEach(key => {
        const zone = state.zones[key];
        const change = Math.floor(Math.random() * 7) - 3; // -3 to +3
        zone.count = Math.max(2, Math.min(zone.capacity + 5, zone.count + change));
      });
      
      // Increment overall symposium cumulative count occasionally
      if (Math.random() > 0.6) {
        state.cumulativeVisitors += Math.floor(Math.random() * 4);
        document.getElementById('analytics-cumulative-visitors').textContent = state.cumulativeVisitors.toLocaleString();
      }

      // Re-evaluate system
      evaluateSystemCounts();
    }, intervalTime);
  }

  function evaluateSystemCounts() {
    let totalCount = 0;
    let activeCongestedCount = 0;
    
    Object.keys(state.zones).forEach(key => {
      const zone = state.zones[key];
      totalCount += zone.count;
      
      // Calculate ratios
      const ratio = Math.round((zone.count / zone.capacity) * 100);
      zone.ratio = ratio;
      
      // Safety limits
      if (ratio >= zone.threshold) {
        if (zone.status !== 'Congested') {
          zone.status = 'Congested';
          triggerSystemAlert(key, `⚠️ CONGESTION TRIGGER: ${zone.name} is filled to ${ratio}% capacity (${zone.count}/${zone.capacity})! Please redirect incoming footfall.`);
        }
        activeCongestedCount++;
      } else if (ratio >= zone.threshold * 0.8) {
        zone.status = 'Warning';
      } else {
        zone.status = 'Normal';
      }
    });
    
    // Updates UI elements
    document.getElementById('total-occupant-count').textContent = totalCount;
    document.getElementById('congested-zone-count').textContent = activeCongestedCount;
    
    // Compute average occupancy percentage
    let totalCap = 0;
    Object.keys(state.zones).forEach(k => totalCap += state.zones[k].capacity);
    const avgRatio = Math.round((totalCount / totalCap) * 100);
    document.getElementById('average-density-percentage').textContent = `${avgRatio}%`;
    
    // Update congestion text badge
    const trendEl = document.getElementById('congestion-trend');
    if (activeCongestedCount > 0) {
      trendEl.textContent = `${activeCongestedCount} alerts pending`;
      trendEl.className = 'stat-trend negative';
      document.getElementById('analytics-critical-count').textContent = activeCongestedCount;
    } else {
      trendEl.textContent = 'Safe levels';
      trendEl.className = 'stat-trend positive';
    }

    updateZoneCardsUI();
    updateChartsData();
    updateRoutingView();
    updateStreamCountDisplay();
  }

  function updateZoneCardsUI() {
    Object.keys(state.zones).forEach(key => {
      const zone = state.zones[key];
      
      const countEl = document.getElementById(`zone-count-${key}`);
      const capEl = document.getElementById(`zone-cap-${key}`);
      const ratioEl = document.getElementById(`zone-ratio-${key}`);
      const progressEl = document.getElementById(`zone-progress-${key}`);
      const badgeEl = document.getElementById(`zone-badge-${key}`);
      const cardEl = document.getElementById(`zone-card-${key}`);
      
      if (countEl) countEl.textContent = zone.count;
      if (capEl) capEl.textContent = zone.capacity;
      if (ratioEl) ratioEl.textContent = `${zone.ratio}%`;
      
      if (progressEl) {
        progressEl.style.width = `${Math.min(100, zone.ratio)}%`;
        // Color classification
        progressEl.className = 'progress-bar-fill';
        if (zone.status === 'Congested') progressEl.classList.add('progress-rose');
        else if (zone.status === 'Warning') progressEl.classList.add('progress-amber');
        else progressEl.classList.add('progress-cyan');
      }

      if (badgeEl) {
        badgeEl.textContent = zone.status;
        badgeEl.className = 'badge';
        if (zone.status === 'Congested') badgeEl.classList.add('badge-danger');
        else if (zone.status === 'Warning') badgeEl.classList.add('badge-warning');
        else badgeEl.classList.add('badge-success');
      }
    });
  }

  function updateStreamCountDisplay() {
    const activeVal = state.zones[state.activeCamera] ? state.zones[state.activeCamera].count : 0;
    document.getElementById('yolo-stream-count').textContent = activeVal;
  }

  // --- SYSTEM ALERTS TIMELINE ---
  function triggerSystemAlert(zoneKey, message) {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const alertItem = {
      id: Date.now(),
      zone: zoneKey,
      message: message,
      time: timestamp,
      priority: state.zones[zoneKey].priority
    };
    
    state.alerts.unshift(alertItem); // add to top
    state.unreadAlertsCount++;
    
    // Limit to 20 alerts
    if (state.alerts.length > 20) state.alerts.pop();
    
    updateAlertLogs();
    updateBellBadge();
    
    // Play subtle notification noise
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(440, audioCtx.currentTime); // A4 note
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch(e) {}

    // Trigger Desktop Notification if permission is granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`Crowd Alert: ${state.zones[zoneKey].name}`, {
        body: message,
        icon: 'https://cdn-icons-png.flaticon.com/512/564/564619.png'
      });
    }
  }

  function updateAlertLogs() {
    const alertFeed = document.getElementById('alert-feed');
    if (!alertFeed) return;
    
    if (state.alerts.length === 0) {
      alertFeed.innerHTML = `
        <div style="text-align: center; color: var(--text-dark); padding: 40px 10px;">
          <i data-lucide="shield-check" style="width: 32px; height: 32px; margin-bottom: 8px;"></i>
          <p style="font-size: 12px;">All structures clear. Safety threshold parameters operating normal.</p>
        </div>
      `;
      setupLucide();
      return;
    }
    
    alertFeed.innerHTML = state.alerts.map(item => {
      let iconColor = 'purple-bg-trans text-purple';
      let iconName = 'info';
      let borderGlow = '';
      
      if (item.priority === 'High') {
        iconColor = 'rose-bg-trans text-rose';
        iconName = 'alert-octagon';
        borderGlow = 'style="border-left: 3px solid var(--rose)"';
      } else if (item.priority === 'Medium') {
        iconColor = 'amber-bg-trans text-amber';
        iconName = 'alert-triangle';
        borderGlow = 'style="border-left: 3px solid var(--amber)"';
      }
      
      return `
        <div class="alert-feed-item" ${borderGlow}>
          <div class="alert-feed-icon ${iconColor}">
            <i data-lucide="${iconName}" style="width: 14px; height: 14px;"></i>
          </div>
          <div class="alert-feed-info">
            <h5>${state.zones[item.zone].name}</h5>
            <p>${item.message}</p>
            <div class="alert-feed-time">${item.time}</div>
          </div>
        </div>
      `;
    }).join('');
    
    // Update notifications list in header bell dropdown too
    updateBellDropdownUI();
    setupLucide();
  }

  function updateBellBadge() {
    const badge = document.getElementById('bell-badge-count');
    if (state.unreadAlertsCount > 0) {
      badge.textContent = state.unreadAlertsCount;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }

  function updateBellDropdownUI() {
    const list = document.getElementById('dropdown-list');
    if (state.alerts.length === 0) {
      list.innerHTML = `
        <div class="empty-notifications">
          <i data-lucide="bell-off"></i>
          <p>No active alerts. Venue is secure.</p>
        </div>
      `;
    } else {
      list.innerHTML = state.alerts.slice(0, 5).map(item => `
        <div class="notif-item">
          <div class="notif-icon ${item.priority === 'High' ? 'rose-bg-trans text-rose' : 'amber-bg-trans text-amber'}">
            <i data-lucide="${item.priority === 'High' ? 'alert-octagon' : 'alert-triangle'}" style="width: 12px; height: 12px;"></i>
          </div>
          <div class="notif-details">
            <p>${item.message}</p>
            <span class="notif-time">${item.time}</span>
          </div>
        </div>
      `).join('');
    }
    setupLucide();
  }

  // --- CHART.JS HISTORICAL TIMELINE ---
  function initCharts() {
    const ctxFlow = document.getElementById('occupancy-flow-chart').getContext('2d');
    const ctxUtil = document.getElementById('zone-utilization-chart').getContext('2d');
    
    // Base style parameters
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = 'Inter';
    
    // Line Chart: Hourly Flow (Simulated historical counts)
    const hours = ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'];
    state.flowChart = new Chart(ctxFlow, {
      type: 'line',
      data: {
        labels: hours,
        datasets: [
          {
            label: 'Main Auditorium',
            data: [30, 45, 80, 110, 35, 138, 90, 70, 40],
            borderColor: '#06b6d4',
            backgroundColor: 'rgba(6, 182, 212, 0.05)',
            tension: 0.3,
            fill: true,
            borderWidth: 2
          },
          {
            label: 'Registration Hall',
            data: [75, 60, 45, 20, 15, 30, 40, 55, 10],
            borderColor: '#10b981',
            backgroundColor: 'transparent',
            tension: 0.3,
            borderWidth: 2
          },
          {
            label: 'Food Court Plaza',
            data: [10, 25, 40, 85, 95, 75, 45, 35, 20],
            borderColor: '#f59e0b',
            backgroundColor: 'transparent',
            tension: 0.3,
            borderWidth: 2
          },
          {
            label: 'Seminar Hall-A',
            data: [5, 15, 40, 35, 10, 45, 52, 25, 5],
            borderColor: '#8b5cf6',
            backgroundColor: 'transparent',
            tension: 0.3,
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 10, usePointStyle: true } }
        },
        scales: {
          y: { grid: { color: 'rgba(255,255,255,0.03)' }, min: 0 },
          x: { grid: { color: 'transparent' } }
        }
      }
    });

    // Bar Chart: Zone Capacity limits vs Current Dilation
    state.utilChart = new Chart(ctxUtil, {
      type: 'bar',
      data: {
        labels: ['Auditorium', 'Registration', 'Seminar', 'Food Court'],
        datasets: [
          {
            label: 'Current Occupants',
            data: [state.zones.auditorium.count, state.zones.registration.count, state.zones.seminar.count, state.zones.foodcourt.count],
            backgroundColor: ['rgba(6,182,212,0.6)', 'rgba(16,185,129,0.6)', 'rgba(139,92,246,0.6)', 'rgba(245,158,11,0.6)'],
            borderRadius: 6
          },
          {
            label: 'Danger Threshold Limit',
            data: [
              state.zones.auditorium.capacity * (state.zones.auditorium.threshold / 100),
              state.zones.registration.capacity * (state.zones.registration.threshold / 100),
              state.zones.seminar.capacity * (state.zones.seminar.threshold / 100),
              state.zones.foodcourt.capacity * (state.zones.foodcourt.threshold / 100)
            ],
            type: 'line',
            borderColor: '#f43f5e',
            borderWidth: 1.5,
            borderDash: [5, 5],
            backgroundColor: 'transparent',
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 10 } }
        },
        scales: {
          y: { grid: { color: 'rgba(255,255,255,0.03)' } },
          x: { grid: { color: 'transparent' } }
        }
      }
    });
  }

  function updateChartsData() {
    if (!state.flowChart || !state.utilChart) return;
    
    // Update bar chart quantities
    state.utilChart.data.datasets[0].data = [
      state.zones.auditorium.count,
      state.zones.registration.count,
      state.zones.seminar.count,
      state.zones.foodcourt.count
    ];

    state.utilChart.data.datasets[1].data = [
      state.zones.auditorium.capacity * (state.zones.auditorium.threshold / 100),
      state.zones.registration.capacity * (state.zones.registration.threshold / 100),
      state.zones.seminar.capacity * (state.zones.seminar.threshold / 100),
      state.zones.foodcourt.capacity * (state.zones.foodcourt.threshold / 100)
    ];

    state.utilChart.update();
    
    // Line Chart updates the last hour index to match current metrics dynamically
    const currentDataIndex = 5; // e.g. 02:00 PM represents active time block
    state.flowChart.data.datasets[0].data[currentDataIndex] = state.zones.auditorium.count;
    state.flowChart.data.datasets[1].data[currentDataIndex] = state.zones.registration.count;
    state.flowChart.data.datasets[2].data[currentDataIndex] = state.zones.foodcourt.count;
    state.flowChart.data.datasets[3].data[currentDataIndex] = state.zones.seminar.count;
    state.flowChart.update();
  }

  // --- INTERACTIVE ROUTING MAP SYSTEM ---
  function updateRoutingView() {
    const isCongested = (state.zones.auditorium.status === 'Congested' || state.zones.foodcourt.status === 'Congested');
    
    // SVG updates
    const zonesList = ['auditorium', 'registration', 'seminar', 'foodcourt'];
    zonesList.forEach(key => {
      const gEl = document.getElementById(`map-zone-${key}`);
      const rectEl = gEl ? gEl.querySelector('.zone-rect') : null;
      const textStatus = document.getElementById(`map-status-val-${key}`);
      
      if (rectEl && textStatus) {
        rectEl.className.baseVal = 'zone-rect';
        
        const zone = state.zones[key];
        if (zone.status === 'Congested') {
          rectEl.classList.add('status-danger-fill');
          textStatus.textContent = 'Congested';
          textStatus.className.baseVal = 'zone-status-text text-rose';
        } else if (zone.status === 'Warning') {
          rectEl.classList.add('status-warning-fill');
          textStatus.textContent = 'Warning';
          textStatus.className.baseVal = 'zone-status-text text-amber';
        } else {
          rectEl.classList.add('status-normal-fill');
          textStatus.textContent = 'Clear';
          textStatus.className.baseVal = 'zone-status-text text-emerald';
        }
      }
    });

    const routeNormal = document.getElementById('route-path-normal');
    const routeAlternative = document.getElementById('route-path-alternative');
    
    const consoleInfo = document.getElementById('routing-state-display');
    const consoleTitle = document.getElementById('routing-status-title');
    const consoleDesc = document.getElementById('routing-status-desc');
    const stepsContainer = document.getElementById('direction-steps-container');

    if (isCongested) {
      // Switch paths
      routeNormal.classList.add('hidden');
      routeAlternative.classList.remove('hidden');
      
      // Update Routing status bar to red
      consoleInfo.className = 'routing-state-info congested-state';
      consoleTitle.textContent = 'Active Congestion Bypasses Rendered';
      consoleDesc.textContent = 'Caution: High crowd density detected in Central Corridor / Auditorium. Redirecting new arrivals through alternative bypass hallways.';
      
      // Load Alternative Steps
      stepsContainer.innerHTML = `
        <div class="direction-step">
          <div class="step-number">01</div>
          <div class="step-text">
            <h5>Exit Registration & Turn Right</h5>
            <p>Registration hall queue is heavy. Turn right immediately to access the Outer Ring hallway.</p>
          </div>
        </div>
        <div class="direction-step">
          <div class="step-number">02</div>
          <div class="step-text">
            <h5>Follow North Courtyard Pathway (Glowing Cyan Route)</h5>
            <p>Avoid the Central Plaza junction completely. Bypass the main corridor by traversing the outer ring garden path.</p>
          </div>
        </div>
        <div class="direction-step">
          <div class="step-number">03</div>
          <div class="step-text">
            <h5>Auditorium Entry (North Gate)</h5>
            <p>Use the side gates (Door-3 & Door-4) of the Auditorium for entry. Front vestibule lobby is congested.</p>
          </div>
        </div>
      `;
    } else {
      // Normal paths
      routeNormal.classList.remove('hidden');
      routeAlternative.classList.add('hidden');
      
      // Update routing bar to green
      consoleInfo.className = 'routing-state-info normal-state';
      consoleTitle.textContent = 'Symposium Access Clean';
      consoleDesc.textContent = 'All core pathways and access links are operating below crowd limits. Standard corridors are safe to use.';
      
      // Load standard steps
      stepsContainer.innerHTML = `
        <div class="direction-step">
          <div class="step-number">01</div>
          <div class="step-text">
            <h5>Standard Corridor Entry</h5>
            <p>Walk directly through the Central Plaza connecting corridor to reach all events.</p>
          </div>
        </div>
        <div class="direction-step">
          <div class="step-number">02</div>
          <div class="step-text">
            <h5>Auditorium Entrance</h5>
            <p>Standard front doors (Lobby gates A & B) are operating at optimal throughput speed.</p>
          </div>
        </div>
      `;
    }
    setupLucide();
  }

  // --- YOLOv8 INFOGRAPHIC CANVAS SCREEN SIMULATOR ---
  let animationFrameId = null;
  const canvas = document.getElementById('simulated-stream-canvas');
  const canvasCtx = canvas.getContext('2d');

  function initStreamSimulator() {
    state.simulatedPeople = [];
    
    // Generate simulated persons based on active camera count
    const numPeople = state.zones[state.activeCamera] ? state.zones[state.activeCamera].count : 15;
    
    for (let i = 0; i < numPeople; i++) {
      state.simulatedPeople.push(createMockPerson(i));
    }
  }

  function createMockPerson(id) {
    // Random position within coordinates
    const padding = 60;
    return {
      id: id + 1,
      x: padding + Math.random() * (STREAM_WIDTH - padding * 2),
      y: padding + Math.random() * (STREAM_HEIGHT - padding * 2),
      w: 24 + Math.random() * 12,
      h: 55 + Math.random() * 20,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      confidence: (0.8 + Math.random() * 0.18).toFixed(2),
      color: '#10b981' // green YOLO box
    };
  }

  function initStreamSimulatorDrawLoop() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);

    function drawLoop() {
      if (state.connectionMode === 'simulation') {
        renderSimulatedFrame();
      }
      animationFrameId = requestAnimationFrame(drawLoop);
    }
    
    animationFrameId = requestAnimationFrame(drawLoop);
  }

  function renderSimulatedFrame() {
    // 1. Draw camera room backdrop
    canvasCtx.fillStyle = '#020617';
    canvasCtx.fillRect(0, 0, STREAM_WIDTH, STREAM_HEIGHT);
    
    // Draw grid floor lines to give 3D perspective
    canvasCtx.strokeStyle = 'rgba(6, 182, 212, 0.06)';
    canvasCtx.lineWidth = 1;
    for (let i = 0; i < STREAM_WIDTH; i += 40) {
      canvasCtx.beginPath();
      canvasCtx.moveTo(i, STREAM_HEIGHT);
      canvasCtx.lineTo(STREAM_WIDTH / 2 + (i - STREAM_WIDTH / 2) * 0.2, STREAM_HEIGHT - 120);
      canvasCtx.stroke();
    }
    
    // Draw boundary walls of the zone
    canvasCtx.strokeStyle = 'rgba(255,255,255,0.06)';
    canvasCtx.beginPath();
    canvasCtx.moveTo(40, 40);
    canvasCtx.lineTo(STREAM_WIDTH - 40, 40);
    canvasCtx.lineTo(STREAM_WIDTH - 40, STREAM_HEIGHT - 40);
    canvasCtx.lineTo(40, STREAM_HEIGHT - 40);
    canvasCtx.closePath();
    canvasCtx.stroke();

    // Adjust target count dynamically to match simulated stats
    const targetCount = state.zones[state.activeCamera] ? state.zones[state.activeCamera].count : 0;
    while (state.simulatedPeople.length < targetCount) {
      state.simulatedPeople.push(createMockPerson(state.simulatedPeople.length));
    }
    while (state.simulatedPeople.length > targetCount && state.simulatedPeople.length > 0) {
      state.simulatedPeople.pop();
    }

    // 2. Walk people around & Draw Bounding Boxes
    state.simulatedPeople.forEach(person => {
      // Update coordinates
      person.x += person.vx;
      person.y += person.vy;
      
      // Collision with screen limits
      if (person.x < 40 || person.x > STREAM_WIDTH - 60) person.vx *= -1;
      if (person.y < 50 || person.y > STREAM_HEIGHT - 90) person.vy *= -1;

      // Draw bounding box
      const isAuditoriumRed = (state.activeCamera === 'auditorium' && state.zones.auditorium.status === 'Congested');
      const boxColor = isAuditoriumRed ? '#f43f5e' : '#10b981'; // red bounding box if congested
      
      canvasCtx.strokeStyle = boxColor;
      canvasCtx.lineWidth = 1.8;
      canvasCtx.strokeRect(person.x, person.y, person.w, person.h);
      
      // Draw YOLO tag
      canvasCtx.fillStyle = boxColor;
      canvasCtx.font = '8px monospace';
      canvasCtx.fillText(`person id:${person.id} ${person.confidence}`, person.x, person.y - 4);
      
      // Draw inner dot (detected centroid)
      canvasCtx.fillStyle = 'rgba(6, 182, 212, 0.4)';
      canvasCtx.beginPath();
      canvasCtx.arc(person.x + person.w/2, person.y + person.h/2, 3, 0, Math.PI * 2);
      canvasCtx.fill();
    });

    // 3. Scan line simulation overlays
    canvasCtx.fillStyle = 'rgba(6, 182, 212, 0.02)';
    const scanY = (Date.now() / 8) % STREAM_HEIGHT;
    canvasCtx.fillRect(0, scanY, STREAM_WIDTH, 4);
  }

  // Draw simulation pipeline starter
  function initStreamSimulator() {
    state.simulatedPeople = [];
    const numPeople = state.zones[state.activeCamera] ? state.zones[state.activeCamera].count : 15;
    for (let i = 0; i < numPeople; i++) {
      state.simulatedPeople.push(createMockPerson(i));
    }
  }
  
  initStreamSimulatorDrawLoop();

  // --- REPORT EXPORTER MODULE (CSV DOWNLOAD) ---
  function exportReportToCSV() {
    let csvRows = [];
    // CSV headers
    csvRows.push('Log ID,Timestamp,Zone Name,Occupancy Count,Capacity Limit,Ratio (%),Status,Warning Threshold (%)');
    
    // Add active zones counts
    Object.keys(state.zones).forEach((key, index) => {
      const z = state.zones[key];
      csvRows.push(`${index+1},${new Date().toISOString()},${z.name},${z.count},${z.capacity},${z.ratio},${z.status},${z.threshold}`);
    });
    
    // Compile CSV string
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `symposium_crowd_report_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
});
