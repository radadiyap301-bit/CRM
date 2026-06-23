// Recruitment CRM Dashboard - Application Logic

// --- Company Brand Configuration ---
const COMPANY_CONFIG = {
  name: "Nexgen",
  logoUrl: "logo.png",
  useLogoImage: true
};

// --- Cloud Sync Configuration ---
const CLOUD_SYNC_CONFIG = {
  get binUrl() {
    return localStorage.getItem("recruit_crm_cloud_bin_url") || "";
  },
  get apiKey() {
    return localStorage.getItem("recruit_crm_cloud_api_key") || "";
  }
};

// --- Database Initialization & State ---
const SEED_DATA = {
  teamLeaders: [
    { id: "TL-01", userId: "TL001", name: "parth radadiya", email: "parth@nexgen.com", password: "password123", membersCount: 1, candidatesCount: 2, permission: "Add candidates only" },
    { id: "TL-02", userId: "TL002", name: "raj golani", email: "raj@nexgen.com", password: "password123", membersCount: 1, candidatesCount: 2, permission: "Add candidates only" },
    { id: "TL-03", userId: "TL003", name: "vinay", email: "vinay@nexgen.com", password: "password123", membersCount: 1, candidatesCount: 1, permission: "Add candidates only" },
    { id: "TL-04", userId: "TL004", name: "parth C", email: "parthc@nexgen.com", password: "password123", membersCount: 0, candidatesCount: 0, permission: "Add candidates only" },
    { id: "TL-05", userId: "TL005", name: "tushar", email: "tushar@nexgen.com", password: "password123", membersCount: 0, candidatesCount: 0, permission: "Add candidates only" }
  ],
  teamMembers: [
    { id: "TM-01", name: "Karan Patel", email: "karan@nexgen.com", password: "password123", candidateCount: 2, tlId: "TL-01" },
    { id: "TM-02", name: "Jignesh Solanki", email: "jignesh@nexgen.com", password: "password123", candidateCount: 2, tlId: "TL-02" },
    { id: "TM-03", name: "Mansi Shah", email: "mansi@nexgen.com", password: "password123", candidateCount: 1, tlId: "TL-03" }
  ],
  candidates: [
    {
      id: "C-01",
      name: "surya manoj",
      email: "surya@gmail.com",
      password: "password123",
      ownerTlId: "TL-01",
      ownerMemberId: "TM-01",
      applications: [
        { srNo: 1, company: "TCS", role: "US IT Recruiter", date: "2026-06-21", type: "Easy Apply", link: "linkedin.com/jobs/123", interviewDate: "21 Jun, 11:30 AM", status: "Today" },
        { srNo: 2, company: "Wipro", role: "Talent Sourcer", date: "2026-06-21", type: "External Application", link: "wipro.com/careers", interviewDate: "22 Jun, 02:00 PM", status: "Upcoming" },
        { srNo: 3, company: "Infosys", role: "HR Executive", date: "2026-06-22", type: "Easy Apply", link: "linkedin.com/jobs/456", interviewDate: "Pending", status: "Pending" }
      ]
    },
    {
      id: "C-02",
      name: "manish",
      email: "manish@gmail.com",
      password: "password123",
      ownerTlId: "TL-01",
      ownerMemberId: "TM-01",
      applications: [
        { srNo: 1, company: "Wipro", role: "Talent Sourcer", date: "2026-06-21", type: "Easy Apply", link: "wipro.com/careers", interviewDate: "22 Jun, 02:00 PM", status: "Upcoming" }
      ]
    },
    {
      id: "C-03",
      name: "akansha",
      email: "akansha@gmail.com",
      password: "password123",
      ownerTlId: "TL-02",
      ownerMemberId: "TM-02",
      applications: [
        { srNo: 1, company: "Infosys", role: "HR Executive", date: "2026-06-21", type: "Easy Apply", link: "linkedin.com/jobs/456", interviewDate: "21 Jun, 10:00 AM", status: "Today" }
      ]
    },
    {
      id: "C-04",
      name: "madhu",
      email: "madhu@gmail.com",
      password: "password123",
      ownerTlId: "TL-02",
      ownerMemberId: "TM-02",
      applications: []
    },
    {
      id: "C-05",
      name: "prem",
      email: "prem@gmail.com",
      password: "password123",
      ownerTlId: "TL-03",
      ownerMemberId: "TM-03",
      applications: []
    },
    {
      id: "C-06",
      name: "Karan",
      email: "Karan@gmail.com",
      password: "password123",
      ownerTlId: "TL-03",
      ownerMemberId: "TM-03",
      applications: []
    }
  ]
};

// State Object
let state = {
  currentUser: null, // Stores logged in user info
  currentView: "dashboard", // Current active view
  selectedTlId: null, // For TL Details popover
  selectedInterviewTlId: null, // For interview drilldown view
  selectedCandidateId: "C-01", // Active candidate in candidates sheet
  searchQuery: "",
  filterDate: "", // Date filter for dashboard and candidate sheets
  loginType: "admin", // 'admin' or 'tl' or 'member'
  isTlAuthorized: false, // For Member view authorization
  authorizedTlId: null, // Id of TL who authorized
  cloudLastSynced: null, // Timestamp of last successful sync
  cloudStatus: "local",   // "local", "syncing", "connected", "error"
  googleDriveConnected: false,
  googleDriveToken: null,
  googleDriveEmail: ""
};

// --- Helper Functions ---
function toTitleCaseName(value) {
  return (value || "")
    .trim()
    .split(/\s+/)
    .map(part => part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : "")
    .join(" ");
}

function getDisplayName(value) {
  return toTitleCaseName(value);
}

function getInitial(value) {
  const displayName = getDisplayName(value);
  return displayName ? displayName.charAt(0) : "";
}

// --- Hash Routing Helpers ---
function getHashRoute() {
  const hash = window.location.hash.substring(1);
  if (!hash) return { view: "", params: {} };
  
  const parts = hash.split("?");
  const view = parts[0];
  const queryStr = parts[1] || "";
  const params = {};
  if (queryStr) {
    queryStr.split("&").forEach(pair => {
      const [key, val] = pair.split("=");
      if (key && val) {
        params[key] = decodeURIComponent(val);
      }
    });
  }
  return { view, params };
}

function updateHashFromState() {
  if (!state.currentUser) {
    window.location.hash = "login";
    return;
  }
  let hash = state.currentView;
  if (state.currentView === "candidates-sheet" && state.selectedCandidateId) {
    hash += `?candId=${state.selectedCandidateId}`;
  }
  window.location.hash = hash;
}

function handleHashChange() {
  if (!state.currentUser) return;

  const { view, params } = getHashRoute();
  const validViews = ["dashboard", "team-leaders", "team-members", "candidates-sheet", "interviews-breakdown", "interview-calendar", "settings"];
  
  if (validViews.includes(view)) {
    let changed = false;
    if (state.currentView !== view) {
      state.currentView = view;
      changed = true;
    }
    if (view === "candidates-sheet" && params.candId && state.selectedCandidateId !== params.candId) {
      state.selectedCandidateId = params.candId;
      changed = true;
    }
    
    if (changed) {
      renderApp();
    }
  }
}

function getNewYorkDateTime() {
  const now = new Date();
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(now);
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  }).format(now);
  const labelDate = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    month: "short",
    day: "2-digit",
    year: "numeric"
  }).format(now);
  const day = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    day: "2-digit"
  }).format(now);
  const month = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "short"
  }).format(now).toUpperCase();
  const timeParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  }).formatToParts(now);
  const hour = timeParts.find(part => part.type === "hour")?.value || "";
  const minute = timeParts.find(part => part.type === "minute")?.value || "";
  const second = timeParts.find(part => part.type === "second")?.value || "";
  const period = (timeParts.find(part => part.type === "dayPeriod")?.value || "").toLowerCase();

  return { date, time, labelDate, day, month, hour, minute, second, period };
}

function renderNewYorkTimePanel() {
  const nyDateTime = getNewYorkDateTime();

  return `
    <div class="header-time-panel" title="New York EST / ET time">
      <div class="time-date-block">
        <span class="time-date-day" data-ny-day>${nyDateTime.day}</span>
        <span class="time-date-month" data-ny-month>${nyDateTime.month}</span>
      </div>
      <div class="time-panel-orb"></div>
      <div class="time-clock-block">
        <div class="time-clock-line">
          <span class="time-clock-hour" data-ny-hour>${nyDateTime.hour}</span><span class="time-clock-separator">:</span><span class="time-clock-minute" data-ny-minute>${nyDateTime.minute}</span><span class="time-clock-separator">:</span><span class="time-clock-second" data-ny-second>${nyDateTime.second}</span><span class="time-clock-period" data-ny-period>${nyDateTime.period}</span>
        </div>
        <div class="time-clock-zone">EST</div>
      </div>
    </div>
  `;
}

function normalizeDb(data) {
  let changed = false;

  if (data && Array.isArray(data.teamLeaders)) {
    data.teamLeaders.forEach(tl => {
      if (!tl.code) {
        tl.code = tl.id || "";
        changed = true;
      }
    });
  }

  if (data && Array.isArray(data.teamMembers)) {
    data.teamMembers.forEach(member => {
      if (!member.code) {
        member.code = member.id || "";
        changed = true;
      }
    });
  }

  if (data && Array.isArray(data.candidates)) {
    data.candidates.forEach(candidate => {
      if (Array.isArray(candidate.applications)) {
        candidate.applications.forEach(app => {
          if (!app.handledByMemberId) {
            app.handledByMemberId = candidate.ownerMemberId || "";
            changed = true;
          }
          if (!app.employeeCode) {
            const member = data.teamMembers.find(m => m.id === app.handledByMemberId || m.id === candidate.ownerMemberId);
            app.employeeCode = member ? (member.code || member.id) : "";
            changed = true;
          }
        });
      }
    });
  }

  return { data, changed };
}

function getDb() {
  const db = localStorage.getItem("recruit_crm_db");
  if (!db) {
    const normalized = normalizeDb(SEED_DATA).data;
    localStorage.setItem("recruit_crm_db", JSON.stringify(normalized));
    return normalized;
  }
  const parsed = JSON.parse(db);
  const normalized = normalizeDb(parsed);
  if (normalized.changed) {
    localStorage.setItem("recruit_crm_db", JSON.stringify(normalized.data));
  }
  return normalized.data;
}

function saveDb(data) {
  localStorage.setItem("recruit_crm_db", JSON.stringify(data));
  if (CLOUD_SYNC_CONFIG.binUrl) {
    pushToCloud(data);
  }
  if (state.googleDriveConnected && state.googleDriveToken) {
    syncDbToGoogleDrive();
  }
}

async function pushToCloud(data) {
  state.cloudStatus = "syncing";
  renderCloudStatusWidget();
  
  try {
    const headers = {
      "Content-Type": "application/json"
    };
    if (CLOUD_SYNC_CONFIG.apiKey) {
      if (CLOUD_SYNC_CONFIG.binUrl.includes("jsonbin.io")) {
        headers["X-Master-Key"] = CLOUD_SYNC_CONFIG.apiKey;
        headers["X-Bin-Private"] = "true";
      } else {
        headers["Authorization"] = `Bearer ${CLOUD_SYNC_CONFIG.apiKey}`;
      }
    }
    
    const response = await fetch(CLOUD_SYNC_CONFIG.binUrl, {
      method: "PUT",
      headers: headers,
      body: JSON.stringify(data)
    });
    
    if (response.ok) {
      state.cloudStatus = "connected";
      state.cloudLastSynced = new Date().toISOString();
    } else {
      state.cloudStatus = "error";
    }
  } catch (error) {
    console.error("Cloud push failed:", error);
    state.cloudStatus = "error";
  }
  renderCloudStatusWidget();
}

async function pullFromCloud() {
  if (!CLOUD_SYNC_CONFIG.binUrl) return;
  
  try {
    const headers = {};
    if (CLOUD_SYNC_CONFIG.apiKey) {
      if (CLOUD_SYNC_CONFIG.binUrl.includes("jsonbin.io")) {
        headers["X-Master-Key"] = CLOUD_SYNC_CONFIG.apiKey;
      } else {
        headers["Authorization"] = `Bearer ${CLOUD_SYNC_CONFIG.apiKey}`;
      }
    }
    
    let fetchUrl = CLOUD_SYNC_CONFIG.binUrl;
    if (CLOUD_SYNC_CONFIG.binUrl.includes("jsonbin.io") && !CLOUD_SYNC_CONFIG.binUrl.endsWith("/latest")) {
      fetchUrl = CLOUD_SYNC_CONFIG.binUrl + "/latest";
    }
    
    const res = await fetch(fetchUrl, { headers: headers });
    if (res.ok) {
      const result = await res.json();
      let cloudData = result;
      if (result.record) {
        cloudData = result.record;
      }
      
      if (cloudData && typeof cloudData === "object" && cloudData.candidates) {
        const localDbStr = localStorage.getItem("recruit_crm_db");
        const cloudDbStr = JSON.stringify(cloudData);
        
        if (localDbStr !== cloudDbStr) {
          localStorage.setItem("recruit_crm_db", cloudDbStr);
          state.cloudLastSynced = new Date().toISOString();
          state.cloudStatus = "connected";
          renderApp();
        } else {
          state.cloudStatus = "connected";
        }
      }
    } else {
      state.cloudStatus = "error";
    }
  } catch (error) {
    console.error("Cloud pull failed:", error);
    state.cloudStatus = "error";
  }
  renderCloudStatusWidget();
}

function isCandidateOnline(candidate) {
  if (!candidate || !candidate.lastActive) return false;
  const lastActiveTime = new Date(candidate.lastActive).getTime();
  const now = new Date().getTime();
  return (now - lastActiveTime) < 180000; // 3 minutes
}

let lastActivityPush = 0;
function updateCandidateActivity() {
  if (state.currentUser && state.currentUser.role === "candidate") {
    const now = Date.now();
    if (now - lastActivityPush >= 30000) { // 30 seconds
      lastActivityPush = now;
      const db = getDb();
      const candidate = db.candidates.find(c => c.id === state.currentUser.id);
      if (candidate) {
        candidate.lastActive = new Date().toISOString();
        saveDb(db);
      }
    }
  }
}

function renderCloudStatusWidget() {
  const elements = document.querySelectorAll(".cloud-status-indicator");
  if (elements.length === 0) return;
  
  let iconClass = "ri-cloud-off-line";
  let color = "var(--text-muted)";
  let text = "Local Storage Mode";
  
  if (CLOUD_SYNC_CONFIG.binUrl) {
    if (state.cloudStatus === "syncing") {
      iconClass = "ri-loader-4-line ri-spin";
      color = "#eab308";
      text = "Syncing Cloud...";
    } else if (state.cloudStatus === "connected") {
      iconClass = "ri-cloud-line";
      color = "#10b981";
      text = "Cloud Synced";
    } else if (state.cloudStatus === "error") {
      iconClass = "ri-error-warning-line";
      color = "#ef4444";
      text = "Sync Error";
    }
  }
  
  elements.forEach(el => {
    el.style.color = color;
    el.innerHTML = `<i class="${iconClass}"></i> <span>${text}</span>`;
  });
}

function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  const toastMsg = document.getElementById("toast-message");
  toastMsg.innerText = message;
  
  const icon = toast.querySelector("i");
  if (type === "success") {
    icon.className = "ri-checkbox-circle-fill";
    toast.style.backgroundColor = "#10b981";
  } else {
    icon.className = "ri-error-warning-fill";
    toast.style.backgroundColor = "#ef4444";
  }
  
  toast.classList.add("active");
  setTimeout(() => {
    toast.classList.remove("active");
  }, 3000);
}

// Modal management
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add("active");
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove("active");
}

// --- Authentication Handler ---
function handleLogin(event) {
  event.preventDefault();
  const db = getDb();
  
  if (state.loginType === "admin") {
    const email = document.getElementById("login-admin-email").value;
    const password = document.getElementById("login-admin-password").value;
    
    if (email === "admin@crm.com" && password === "password") {
      state.currentUser = { role: "admin", name: "Admin User", email: email };
      state.currentView = "dashboard";
      saveSession();
      renderApp();
      showToast("Admin Logged In Successfully!");
    } else {
      showToast("Invalid Admin Credentials!", "error");
    }
  } 
  else if (state.loginType === "tl") {
    const tlId = document.getElementById("login-tl-id").value;
    const password = document.getElementById("login-tl-password").value;
    
    const tl = db.teamLeaders.find(t => t.userId === tlId && t.password === password);
    if (tl) {
      state.currentUser = { role: "tl", id: tl.id, name: tl.name, email: tl.email, userId: tl.userId };
      state.currentView = "team-members"; // TL starts on Team Members view
      saveSession();
      renderApp();
      showToast(`Welcome, ${getDisplayName(tl.name)}!`);
    } else {
      showToast("Invalid Team Leader ID or Password!", "error");
    }
  }
  else if (state.loginType === "member") {
    const email = document.getElementById("login-member-email").value;
    const password = document.getElementById("login-member-password").value;
    
    const member = db.teamMembers.find(m => m.email === email && m.password === password);
    if (member) {
      state.currentUser = { role: "member", id: member.id, name: member.name, email: member.email, tlId: member.tlId };
      state.currentView = "candidates-sheet"; // Member starts on Candidate sheet view
      // Find candidate assigned to them
      const candidate = db.candidates.find(c => c.ownerMemberId === member.id);
      if (candidate) {
        state.selectedCandidateId = candidate.id;
      }
      saveSession();
      renderApp();
      showToast(`Welcome, ${getDisplayName(member.name)}!`);
    } else {
      showToast("Invalid Member Email or Password!", "error");
    }
  }
  else if (state.loginType === "candidate") {
    const email = document.getElementById("login-candidate-email").value;
    const password = document.getElementById("login-candidate-password").value;
    
    const candidate = db.candidates.find(c => c.email === email && c.password === password);
    if (candidate) {
      state.currentUser = { role: "candidate", id: candidate.id, name: candidate.name, email: candidate.email };
      state.selectedCandidateId = candidate.id;
      state.currentView = "candidates-sheet"; // Candidate view
      
      // Update activity status on login
      candidate.lastActive = new Date().toISOString();
      saveDb(db);
      
      saveSession();
      renderApp();
      showToast(`Welcome, ${getDisplayName(candidate.name)}!`);
    } else {
      showToast("Invalid Candidate Email or Password!", "error");
    }
  }
}

function handleLogout() {
  state.currentUser = null;
  state.selectedTlId = null;
  state.isTlAuthorized = false;
  state.authorizedTlId = null;
  state.filterDate = "";
  sessionStorage.removeItem("recruit_crm_session");
  window.location.hash = "login";
  renderApp();
  showToast("Logged out successfully");
}

function saveSession() {
  sessionStorage.setItem("recruit_crm_session", JSON.stringify(state.currentUser));
}

function loadSession() {
  const session = sessionStorage.getItem("recruit_crm_session");
  if (session) {
    state.currentUser = JSON.parse(session);
  }
}

// --- Data Modification Handlers ---
function handleCreateTL(event) {
  event.preventDefault();
  const db = getDb();
  
  const name = toTitleCaseName(document.getElementById("add-tl-name").value);
  const code = document.getElementById("add-tl-code").value.trim();
  const email = document.getElementById("add-tl-email").value.trim();
  const userId = document.getElementById("add-tl-userid").value.trim();
  const password = document.getElementById("add-tl-password").value.trim();
  
  if (db.teamLeaders.some(t => t.code === code)) {
    showToast("Team Leader Code already exists!", "error");
    return;
  }

  if (db.teamLeaders.some(t => t.userId === userId)) {
    showToast("Team Leader User ID already exists!", "error");
    return;
  }
  
  const newTl = {
    id: `TL-0${db.teamLeaders.length + 1}`,
    userId,
    code,
    name,
    email,
    password,
    membersCount: 0,
    candidatesCount: 0,
    permission: "Add candidates only"
  };
  
  db.teamLeaders.push(newTl);
  saveDb(db);
  closeModal("modal-add-tl");
  document.getElementById("form-add-tl").reset();
  renderApp();
  showToast("Team Leader added successfully!");
}

function handleCreateMember(event) {
  event.preventDefault();
  const db = getDb();
  
  const name = toTitleCaseName(document.getElementById("add-member-name").value);
  const code = document.getElementById("add-member-code").value.trim();
  const email = document.getElementById("add-member-email").value.trim();
  const password = document.getElementById("add-member-password").value.trim();
  
  // Decide which TL owns this member
  let tlId = "TL-01";
  if (state.currentUser.role === "tl") {
    tlId = state.currentUser.id;
  }

  if (db.teamMembers.some(m => m.tlId === tlId && m.code === code)) {
    showToast("Member Code already exists in this team!", "error");
    return;
  }
  
  const newMember = {
    id: `TM-0${db.teamMembers.length + 1}`,
    code,
    name,
    email,
    password,
    candidateCount: 0,
    tlId
  };
  
  db.teamMembers.push(newMember);
  
  // Update TL membersCount
  const tl = db.teamLeaders.find(t => t.id === tlId);
  if (tl) {
    tl.membersCount += 1;
  }
  
  saveDb(db);
  closeModal("modal-add-member");
  document.getElementById("form-add-member").reset();
  renderApp();
  showToast("Team Member added successfully!");
}

function updateTlDetails(tlId) {
  const db = getDb();
  const tl = db.teamLeaders.find(t => t.id === tlId);
  if (!tl) {
    showToast("Team Leader not found!", "error");
    return;
  }

  if (state.currentUser.role !== "admin" && !(state.currentUser.role === "tl" && state.currentUser.id === tlId)) {
    showToast("You can only edit your own Team Leader details.", "error");
    return;
  }

  // Populate modal inputs
  document.getElementById("edit-tl-id").value = tl.id;
  document.getElementById("edit-tl-name").value = getDisplayName(tl.name);
  document.getElementById("edit-tl-code").value = tl.code || tl.id;
  document.getElementById("edit-tl-email").value = tl.email;
  document.getElementById("edit-tl-userid").value = tl.userId;
  document.getElementById("edit-tl-password").value = tl.password;

  openModal("modal-edit-tl");
}

function handleSaveTLDetails(event) {
  event.preventDefault();
  const tlId = document.getElementById("edit-tl-id").value;
  const name = document.getElementById("edit-tl-name").value;
  const code = document.getElementById("edit-tl-code").value;
  const email = document.getElementById("edit-tl-email").value;
  const userId = document.getElementById("edit-tl-userid").value;
  const password = document.getElementById("edit-tl-password").value;

  const cleanName = toTitleCaseName(name);
  const cleanCode = code.trim();
  const cleanEmail = email.trim();
  const cleanUserId = userId.trim();
  const cleanPassword = password.trim();

  if (!cleanName || !cleanCode || !cleanEmail || !cleanUserId || !cleanPassword) {
    showToast("All Team Leader fields are required.", "error");
    return;
  }

  const db = getDb();
  const tl = db.teamLeaders.find(t => t.id === tlId);
  if (!tl) {
    showToast("Team Leader not found!", "error");
    return;
  }

  if (db.teamLeaders.some(t => t.id !== tlId && t.code === cleanCode)) {
    showToast("Team Leader Code already exists!", "error");
    return;
  }

  if (db.teamLeaders.some(t => t.id !== tlId && t.userId === cleanUserId)) {
    showToast("Team Leader User ID already exists!", "error");
    return;
  }

  tl.name = cleanName;
  tl.code = cleanCode;
  tl.email = cleanEmail;
  tl.userId = cleanUserId;
  tl.password = cleanPassword;

  if (state.currentUser.role === "tl" && state.currentUser.id === tlId) {
    state.currentUser.name = cleanName;
    state.currentUser.email = cleanEmail;
    saveSession();
  }

  saveDb(db);
  closeModal("modal-edit-tl");
  renderApp();
  showToast("Team Leader details updated!");
}

function updateMemberDetails(memberId) {
  const db = getDb();
  const member = db.teamMembers.find(m => m.id === memberId);
  if (!member) {
    showToast("Team Member not found!", "error");
    return;
  }

  if (state.currentUser.role !== "admin" && !(state.currentUser.role === "tl" && member.tlId === state.currentUser.id)) {
    showToast("You can only edit members from your own team.", "error");
    return;
  }

  // Populate modal inputs
  document.getElementById("edit-member-id").value = member.id;
  document.getElementById("edit-member-name").value = getDisplayName(member.name);
  document.getElementById("edit-member-code").value = member.code || member.id;
  document.getElementById("edit-member-email").value = member.email;
  document.getElementById("edit-member-password").value = member.password;

  openModal("modal-edit-member");
}

function handleSaveMemberDetails(event) {
  event.preventDefault();
  const memberId = document.getElementById("edit-member-id").value;
  const name = document.getElementById("edit-member-name").value;
  const code = document.getElementById("edit-member-code").value;
  const email = document.getElementById("edit-member-email").value;
  const password = document.getElementById("edit-member-password").value;

  const cleanName = toTitleCaseName(name);
  const cleanCode = code.trim();
  const cleanEmail = email.trim();
  const cleanPassword = password.trim();

  if (!cleanName || !cleanCode || !cleanEmail || !cleanPassword) {
    showToast("All Team Member fields are required.", "error");
    return;
  }

  const db = getDb();
  const member = db.teamMembers.find(m => m.id === memberId);
  if (!member) {
    showToast("Team Member not found!", "error");
    return;
  }

  if (db.teamMembers.some(m => m.id !== memberId && m.tlId === member.tlId && m.code === cleanCode)) {
    showToast("Member Code already exists in this team!", "error");
    return;
  }

  member.name = cleanName;
  member.code = cleanCode;
  member.email = cleanEmail;
  member.password = cleanPassword;

  saveDb(db);
  closeModal("modal-edit-member");
  renderApp();
  showToast("Team Member details updated!");
}


function handleCreateCandidate(event) {
  event.preventDefault();
  const db = getDb();
  
  const name = toTitleCaseName(document.getElementById("add-cand-name").value);
  const email = document.getElementById("add-cand-email").value;
  const password = document.getElementById("add-cand-password").value;
  const memberId = document.getElementById("add-cand-member").value;
  
  let tlId = "TL-01";
  if (state.currentUser.role === "tl") {
    tlId = state.currentUser.id;
  }
  
  const newCandidate = {
    id: `C-0${db.candidates.length + 1}`,
    name,
    email,
    password,
    ownerTlId: tlId,
    ownerMemberId: memberId,
    applications: []
  };
  
  db.candidates.push(newCandidate);
  
  // Update member count
  const member = db.teamMembers.find(m => m.id === memberId);
  if (member) member.candidateCount += 1;
  
  // Update TL candidatesCount
  const tl = db.teamLeaders.find(t => t.id === tlId);
  if (tl) tl.candidatesCount += 1;
  
  saveDb(db);
  closeModal("modal-add-candidate");
  document.getElementById("form-add-candidate").reset();
  state.selectedCandidateId = newCandidate.id;
  renderApp();
  showToast("Candidate profile added successfully!");
}



function resolveApplicationHandler(candidate, app) {
  const db = getDb();
  const memberId = app.handledByMemberId || candidate.ownerMemberId;
  const member = db.teamMembers.find(m => m.id === memberId);
  if (!member) {
    return {
      id: memberId || "",
      code: memberId || "Unassigned",
      name: "Unassigned",
      label: "Unassigned"
    };
  }

  return {
    id: member.id,
    code: member.code || member.id,
    name: getDisplayName(member.name),
    label: `${getDisplayName(member.name)} (${member.code || member.id})`
  };
}

function stampApplicationHandler(candidate, app, force = false) {
  if (!candidate || !app) return;
  if (!force && app.handledByMemberId && app.employeeCode) return;

  const db = getDb();
  let memberId = candidate.ownerMemberId || "";

  if (state.currentUser && state.currentUser.role === "member") {
    memberId = state.currentUser.id;
  }

  const member = db.teamMembers.find(m => m.id === memberId);
  app.handledByMemberId = memberId;
  app.employeeCode = member ? (member.code || member.id) : "";
}

function getApplicationEmployeeCode(candidate, app) {
  if (app.employeeCode) return app.employeeCode;
  return resolveApplicationHandler(candidate, app).code || "";
}

function isApplicationRowComplete(app) {
  return !!(app && app.company && app.company.trim() && app.role && app.role.trim() && app.link && app.link.trim());
}

function updateApplicationCell(candidateId, srNo, field, val) {
  const db = getDb();
  const candidate = db.candidates.find(c => c.id === candidateId);
  if (candidate) {
    let row = candidate.applications.find(a => a.srNo === parseInt(srNo));
    let isNewRow = false;
    let wasComplete = false;
    
    if (!row) {
      isNewRow = true;
      row = {
        srNo: parseInt(srNo),
        company: '',
        role: '',
        date: getNewYorkDateTime().date,
        type: 'Easy Apply',
        link: '',
        interviewDate: 'Pending',
        status: 'Pending'
      };
      stampApplicationHandler(candidate, row, true);
      candidate.applications.push(row);
    } else {
      wasComplete = isApplicationRowComplete(row);
    }
    
    row[field] = val;
    stampApplicationHandler(candidate, row, state.currentUser && state.currentUser.role === "member");
    
    // Auto-update status if interviewDate changes
    if (field === "interviewDate") {
      if (val.toLowerCase().includes("today") || val.toLowerCase().includes("21 jun")) {
        row.status = "Today";
      } else if (val.toLowerCase().includes("pending") || val === '') {
        row.status = "Pending";
      } else {
        row.status = "Upcoming";
      }
    }
    
    saveDb(db);
    
    const isCompleteNow = isApplicationRowComplete(row);
    
    // Re-render ONLY if:
    // 1. It is a new row and is complete now (e.g. pasted data)
    // 2. It was incomplete and is now complete (opens the next placeholder row!)
    // 3. It was complete and is now incomplete (removes the extra placeholder row!)
    if ((isNewRow && isCompleteNow) || (wasComplete !== isCompleteNow)) {
      renderView();
    }
  }
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast("Copied to clipboard!");
  }).catch(() => {
    showToast("Failed to copy", "error");
  });
}

// --- Google Drive OAuth & API State ---
let tokenClient = null;

// Ensure we populate tokenClient on load
function initGoogleDriveAuth() {
  const clientId = localStorage.getItem("recruit_crm_gdrive_client_id") || "";
  if (!clientId || !window.google) return;
  
  try {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email',
      callback: handleGoogleAuthCallback,
    });
  } catch (e) {
    console.error("Error initializing Google Identity Services Token Client:", e);
  }
}

function handleGoogleAuthCallback(response) {
  if (response.error !== undefined) {
    showToast("Google authentication failed!", "error");
    console.error(response);
    return;
  }
  
  state.googleDriveToken = response.access_token;
  state.googleDriveConnected = true;
  localStorage.setItem("recruit_crm_gdrive_token", response.access_token);
  
  const expiresAt = Date.now() + (response.expires_in * 1000);
  localStorage.setItem("recruit_crm_gdrive_expires_at", expiresAt);
  
  showToast("Google Drive connected successfully!");
  getGoogleUserInfo();
}

async function getGoogleUserInfo() {
  if (!state.googleDriveToken) return;
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        'Authorization': `Bearer ${state.googleDriveToken}`
      }
    });
    if (res.ok) {
      const data = await res.json();
      state.googleDriveEmail = data.email;
      localStorage.setItem("recruit_crm_gdrive_email", data.email);
      renderApp();
      
      // Auto backup database once authenticated
      await syncDbToGoogleDrive();
    }
  } catch (error) {
    console.error("Failed to fetch Google user info:", error);
  }
}

function connectGoogleDrive() {
  const clientId = document.getElementById("settings-gdrive-client-id").value.trim();
  if (!clientId) {
    showToast("Please enter a Google Client ID first!", "error");
    return;
  }
  localStorage.setItem("recruit_crm_gdrive_client_id", clientId);
  
  initGoogleDriveAuth();
  
  if (tokenClient) {
    tokenClient.requestAccessToken({ prompt: 'consent' });
  } else {
    showToast("Failed to initialize Google Auth client. Check Client ID.", "error");
  }
}

function disconnectGoogleDrive() {
  localStorage.removeItem("recruit_crm_gdrive_token");
  localStorage.removeItem("recruit_crm_gdrive_expires_at");
  localStorage.removeItem("recruit_crm_gdrive_email");
  state.googleDriveToken = null;
  state.googleDriveConnected = false;
  state.googleDriveEmail = "";
  showToast("Disconnected from Google Drive");
  renderApp();
}

function loadGoogleDriveSession() {
  const token = localStorage.getItem("recruit_crm_gdrive_token");
  const email = localStorage.getItem("recruit_crm_gdrive_email");
  const expiresAt = parseInt(localStorage.getItem("recruit_crm_gdrive_expires_at") || "0");
  
  if (token && expiresAt > Date.now()) {
    state.googleDriveToken = token;
    state.googleDriveConnected = true;
    state.googleDriveEmail = email || "Connected";
  } else {
    localStorage.removeItem("recruit_crm_gdrive_token");
    localStorage.removeItem("recruit_crm_gdrive_expires_at");
    state.googleDriveToken = null;
    state.googleDriveConnected = false;
  }
}

async function findGoogleFile(name, mimeType = null, parentId = null) {
  let query = `name = '${name.replace(/'/g, "\\'")}' and trashed = false`;
  if (mimeType) {
    query += ` and mimeType = '${mimeType}'`;
  }
  if (parentId) {
    query += ` and '${parentId}' in parents`;
  }
  
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,webViewLink,webContentLink)`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${state.googleDriveToken}`
    }
  });
  
  if (!response.ok) {
    return null;
  }
  
  const result = await response.json();
  return result.files && result.files.length > 0 ? result.files[0] : null;
}

async function ensureGoogleFolder(folderName, parentId = null) {
  const existing = await findGoogleFile(folderName, 'application/vnd.google-apps.folder', parentId);
  if (existing) {
    return existing.id;
  }
  
  const metadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder'
  };
  if (parentId) {
    metadata.parents = [parentId];
  }
  
  const response = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${state.googleDriveToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(metadata)
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create folder ${folderName}`);
  }
  const folder = await response.json();
  return folder.id;
}

async function uploadFileToDrive(fileBlob, name, mimeType, parents = [], fileId = null) {
  const metadata = {
    name: name,
    mimeType: mimeType
  };
  if (parents.length > 0) {
    metadata.parents = parents;
  }
  
  const boundary = 'foo_bar_boundary';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;
  
  const reader = new FileReader();
  const base64Promise = new Promise((resolve) => {
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.readAsDataURL(fileBlob);
  });
  
  const base64Data = await base64Promise;
  
  const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: ' + mimeType + '\r\n' +
      'Content-Transfer-Encoding: base64\r\n\r\n' +
      base64Data +
      closeDelimiter;
  
  const url = fileId 
    ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart&fields=id,name,webViewLink,webContentLink`
    : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink';
    
  const method = fileId ? 'PATCH' : 'POST';
  
  const response = await fetch(url, {
    method: method,
    headers: {
      'Authorization': `Bearer ${state.googleDriveToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: multipartRequestBody
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Drive Upload Error: ${errorText}`);
  }
  
  return await response.json();
}

async function syncDbToGoogleDrive() {
  if (!state.googleDriveConnected || !state.googleDriveToken) return;
  
  try {
    const rootId = await ensureGoogleFolder('Recruitment_CRM');
    const existingFile = await findGoogleFile('recruit_crm_db.json', 'application/json', rootId);
    
    const db = getDb();
    const dbBlob = new Blob([JSON.stringify(db)], { type: 'application/json' });
    
    await uploadFileToDrive(
      dbBlob, 
      'recruit_crm_db.json', 
      'application/json', 
      existingFile ? [] : [rootId], 
      existingFile ? existingFile.id : null
    );
    
    state.cloudLastSynced = new Date().toISOString();
    state.cloudStatus = "connected";
    renderCloudStatusWidget();
  } catch (error) {
    console.error("Google Drive DB sync failed:", error);
    state.cloudStatus = "error";
    renderCloudStatusWidget();
  }
}

async function ensureCandidateMainResumesFolder(candidateName) {
  const rootId = await ensureGoogleFolder('Recruitment_CRM');
  const candidatesId = await ensureGoogleFolder('Candidates', rootId);
  const candFolderId = await ensureGoogleFolder(candidateName, candidatesId);
  const mainFolderId = await ensureGoogleFolder('Main_Resumes', candFolderId);
  return mainFolderId;
}

async function ensureCandidateTailoredFolder(candidateName, companyName) {
  const rootId = await ensureGoogleFolder('Recruitment_CRM');
  const candidatesId = await ensureGoogleFolder('Candidates', rootId);
  const candFolderId = await ensureGoogleFolder(candidateName, candidatesId);
  const tailoredFolderId = await ensureGoogleFolder('Tailored_Resumes', candFolderId);
  const companyFolderId = await ensureGoogleFolder(companyName, tailoredFolderId);
  return companyFolderId;
}

async function deleteFileFromDrive(fileId) {
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${state.googleDriveToken}`
      }
    });
  } catch (error) {
    console.error("Failed to delete file from Google Drive:", error);
  }
}

// --- Resume Management Helper Functions ---
function downloadFile(base64Data, fileName) {
  const link = document.createElement("a");
  link.href = base64Data;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function truncateString(str, num) {
  if (!str) return '';
  if (str.length <= num) return str;
  return str.slice(0, num) + '...';
}

function renderMainResumeUI(candidate) {
  // Migrate schema dynamically if needed
  if (candidate.mainResume && !candidate.mainResumeHistory) {
    candidate.mainResumeHistory = [candidate.mainResume];
    delete candidate.mainResume;
  }
  
  const history = candidate.mainResumeHistory || [];
  const isAuthorizedToChange = state.currentUser.role === "admin" || state.currentUser.role === "tl";
  
  if (history.length > 0) {
    const options = history.map((item, idx) => {
      const dateLabel = new Date(item.uploadedAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
      return `<option value="${idx}">${dateLabel} - ${truncateString(item.name, 12)}</option>`;
    }).join('');
    
    const dropdown = `
      <select id="main-resume-select-${candidate.id}" class="login-input" style="width: auto; max-width: 170px; padding: 2px 6px; height: 26px; font-size:11px; display:inline-block; vertical-align: middle;">
        ${options}
      </select>
    `;
    
    const downloadBtn = `<button class="btn-resume-action" onclick="downloadSelectedMainResume('${candidate.id}')" title="Download Selected Resume Version" style="vertical-align: middle;"><i class="ri-download-2-line"></i></button>`;
    
    const deleteBtn = isAuthorizedToChange 
      ? `<button class="btn-resume-action btn-resume-danger" onclick="deleteSelectedMainResume('${candidate.id}')" title="Delete Selected Version" style="vertical-align: middle;"><i class="ri-delete-bin-line"></i></button>`
      : '';
      
    const uploadNewBtn = isAuthorizedToChange
      ? `
        <button class="btn btn-outline btn-sm" style="padding: 2px 6px; height: 26px; font-size: 11px; vertical-align: middle; display: inline-flex; align-items: center; gap: 2px;" onclick="triggerMainResumeUpload('${candidate.id}')" title="Upload New Resume Version"><i class="ri-upload-2-line"></i> New</button>
        <input type="file" id="main-resume-input-${candidate.id}" style="display:none;" onchange="handleMainResumeUpload(event, '${candidate.id}')" accept=".pdf,.doc,.docx">
      `
      : '';
      
    return `
      <div style="display: inline-flex; align-items: center; gap: 4px;">
        ${dropdown}
        ${downloadBtn}
        ${deleteBtn}
        ${uploadNewBtn}
      </div>
    `;
  } else {
    if (isAuthorizedToChange) {
      return `
        <button class="btn btn-outline btn-sm" style="padding: 4px 8px; font-size: 11px; display: inline-flex; align-items: center; gap: 4px;" onclick="triggerMainResumeUpload('${candidate.id}')" title="Upload Main Resume"><i class="ri-upload-2-line"></i> Upload</button>
        <input type="file" id="main-resume-input-${candidate.id}" style="display:none;" onchange="handleMainResumeUpload(event, '${candidate.id}')" accept=".pdf,.doc,.docx">
      `;
    } else {
      return `<span style="color: var(--text-muted); font-size: 11px; font-style: italic;">No resume uploaded</span>`;
    }
  }
}

function triggerMainResumeUpload(candId) {
  const input = document.getElementById(`main-resume-input-${candId}`);
  if (input) input.click();
}

async function handleMainResumeUpload(event, candId) {
  const file = event.target.files[0];
  if (!file) return;
  
  if (file.size > 1024 * 1024) { // 1MB limit
    showToast("File is too large! Maximum allowed size is 1MB.", "error");
    return;
  }
  
  const nyDateTime = getNewYorkDateTime();
  const todayStr = nyDateTime.date;
  const db = getDb();
  const candidate = db.candidates.find(c => c.id === candId);
  if (!candidate) return;
  
  if (!candidate.mainResumeHistory) {
    candidate.mainResumeHistory = [];
  }
  
  showToast("Uploading resume version...");
  
  if (state.googleDriveConnected && state.googleDriveToken) {
    try {
      const parentId = await ensureCandidateMainResumesFolder(candidate.name);
      // Save with filename starting with upload date so Drive stays organized: YYYY-MM-DD_Filename
      const driveFile = await uploadFileToDrive(file, `${todayStr}_${file.name}`, file.type, [parentId]);
      
      const newResume = {
        name: file.name,
        uploadedAt: new Date().toISOString(),
        googleFileId: driveFile.id,
        googleUrl: driveFile.webContentLink || driveFile.webViewLink
      };
      
      candidate.mainResumeHistory.unshift(newResume); // Put newest first
      saveDb(db);
      renderView();
      showToast("Main Resume uploaded to Google Drive!");
    } catch (error) {
      console.error(error);
      showToast("Failed to upload to Google Drive!", "error");
    }
  } else {
    // Local storage Base64 fallback
    const reader = new FileReader();
    reader.onload = function(e) {
      const newResume = {
        name: file.name,
        data: e.target.result,
        uploadedAt: new Date().toISOString()
      };
      candidate.mainResumeHistory.unshift(newResume); // Put newest first
      saveDb(db);
      renderView();
      showToast("Main Resume version saved locally!");
    };
    reader.readAsDataURL(file);
  }
}

function downloadSelectedMainResume(candId) {
  const db = getDb();
  const candidate = db.candidates.find(c => c.id === candId);
  if (!candidate || !candidate.mainResumeHistory || candidate.mainResumeHistory.length === 0) return;
  
  const select = document.getElementById(`main-resume-select-${candId}`);
  const idx = select ? parseInt(select.value) : 0;
  const resume = candidate.mainResumeHistory[idx];
  
  if (resume) {
    if (resume.googleUrl) {
      window.open(resume.googleUrl, '_blank');
    } else {
      downloadFile(resume.data, resume.name);
    }
    showToast(`Downloading: ${resume.name}`);
  }
}

function deleteSelectedMainResume(candId) {
  if (!confirm("Are you sure you want to delete this specific resume version?")) return;
  const db = getDb();
  const candidate = db.candidates.find(c => c.id === candId);
  if (!candidate || !candidate.mainResumeHistory) return;
  
  const select = document.getElementById(`main-resume-select-${candId}`);
  const idx = select ? parseInt(select.value) : 0;
  const resume = candidate.mainResumeHistory[idx];
  
  if (resume) {
    candidate.mainResumeHistory.splice(idx, 1);
    
    if (state.googleDriveConnected && resume.googleFileId) {
      deleteFileFromDrive(resume.googleFileId);
    }
    
    saveDb(db);
    renderView();
    showToast("Resume version deleted!");
  }
}

function renderTailoredResumeUI(candId, app) {
  if (app.isPlaceholder) return '';
  
  const isAuthorizedToChange = state.currentUser.role === "admin" || state.currentUser.role === "tl" || state.currentUser.role === "member";
  
  if (app.tailoredResume && app.tailoredResume.name) {
    const downloadBtn = `<button class="btn-resume-action" style="padding: 3px 6px; font-size: 11px;" onclick="downloadTailoredResume('${candId}', ${app.srNo})" title="Download Tailored Resume"><i class="ri-download-2-line"></i></button>`;
    const deleteBtn = isAuthorizedToChange 
      ? `<button class="btn-resume-action btn-resume-danger" style="padding: 3px 6px; font-size: 11px;" onclick="deleteTailoredResume('${candId}', ${app.srNo})" title="Delete Tailored Resume"><i class="ri-delete-bin-line"></i></button>`
      : '';
    return `
      <div style="display: inline-flex; align-items: center; gap: 4px; justify-content: center;">
        <span class="resume-badge" title="${app.tailoredResume.name}" style="font-size: 11px; padding: 2px 6px;"><i class="ri-file-text-line"></i> ${truncateString(app.tailoredResume.name, 10)}</span>
        ${downloadBtn}
        ${deleteBtn}
      </div>
    `;
  } else {
    if (isAuthorizedToChange) {
      return `
        <button class="btn btn-outline btn-sm" style="padding: 4px 8px; font-size: 11px; display: inline-flex; align-items: center; gap: 4px;" onclick="triggerTailoredResumeUpload('${candId}', ${app.srNo})" title="Upload Tailored Resume"><i class="ri-upload-2-line"></i> Upload</button>
        <input type="file" id="tailored-resume-input-${candId}-${app.srNo}" style="display:none;" onchange="handleTailoredResumeUpload(event, '${candId}', ${app.srNo})" accept=".pdf,.doc,.docx">
      `;
    } else {
      return `<span style="color: var(--text-muted); font-size: 11px;">-</span>`;
    }
  }
}

function triggerTailoredResumeUpload(candId, srNo) {
  const input = document.getElementById(`tailored-resume-input-${candId}-${srNo}`);
  if (input) input.click();
}

async function handleTailoredResumeUpload(event, candId, srNo) {
  const file = event.target.files[0];
  if (!file) return;
  
  if (file.size > 1024 * 1024) { // 1MB limit
    showToast("File is too large! Maximum allowed size is 1MB.", "error");
    return;
  }
  
  const db = getDb();
  const candidate = db.candidates.find(c => c.id === candId);
  if (!candidate) return;
  
  const app = candidate.applications.find(a => a.srNo === parseInt(srNo));
  if (!app) return;
  
  // Get date for name from application, fallback to today
  const appDate = app.date || new Date().toISOString().split('T')[0];
  const companyName = app.company || "UnknownCompany";
  const driveFileName = `${companyName.replace(/\s+/g, '_')}_${appDate}_${file.name}`;
  
  showToast("Uploading tailored resume...");
  
  if (state.googleDriveConnected && state.googleDriveToken) {
    try {
      const parentId = await ensureCandidateTailoredFolder(candidate.name, companyName);
      const driveFile = await uploadFileToDrive(file, driveFileName, file.type, [parentId]);
      
      app.tailoredResume = {
        name: file.name,
        uploadedAt: new Date().toISOString(),
        googleFileId: driveFile.id,
        googleUrl: driveFile.webContentLink || driveFile.webViewLink
      };
      
      saveDb(db);
      renderView();
      showToast("Tailored Resume uploaded to Google Drive!");
    } catch (error) {
      console.error(error);
      showToast("Failed to upload to Google Drive!", "error");
    }
  } else {
    // Local storage Base64 fallback
    const reader = new FileReader();
    reader.onload = function(e) {
      app.tailoredResume = {
        name: file.name,
        data: e.target.result,
        uploadedAt: new Date().toISOString()
      };
      saveDb(db);
      renderView();
      showToast("Tailored Resume saved locally!");
    };
    reader.readAsDataURL(file);
  }
}

function downloadTailoredResume(candId, srNo) {
  const db = getDb();
  const candidate = db.candidates.find(c => c.id === candId);
  if (candidate) {
    const app = candidate.applications.find(a => a.srNo === parseInt(srNo));
    if (app && app.tailoredResume) {
      const resume = app.tailoredResume;
      if (resume.googleUrl) {
        window.open(resume.googleUrl, '_blank');
      } else {
        downloadFile(resume.data, resume.name);
      }
      showToast(`Downloading: ${resume.name}`);
      return;
    }
  }
  showToast("Tailored resume not found!", "error");
}

function deleteTailoredResume(candId, srNo) {
  if (!confirm(`Are you sure you want to delete the tailored resume for row ${srNo}?`)) return;
  const db = getDb();
  const candidate = db.candidates.find(c => c.id === candId);
  if (candidate) {
    const app = candidate.applications.find(a => a.srNo === parseInt(srNo));
    if (app && app.tailoredResume) {
      const fileId = app.tailoredResume.googleFileId;
      delete app.tailoredResume;
      
      if (state.googleDriveConnected && fileId) {
        deleteFileFromDrive(fileId);
      }
      
      saveDb(db);
      renderView();
      showToast("Tailored Resume deleted!");
    }
  }
}


function handleSearch(event) {
  state.searchQuery = event.target.value;
  renderView(); // Re-renders the current view space without resetting sidebars
}

function handleDateFilterChange(event) {
  state.filterDate = event.target.value;
  renderView();
}

function updateNewYorkTimePanel() {
  const nyDateTime = getNewYorkDateTime();
  document.querySelectorAll("[data-ny-day]").forEach(el => el.textContent = nyDateTime.day);
  document.querySelectorAll("[data-ny-month]").forEach(el => el.textContent = nyDateTime.month);
  document.querySelectorAll("[data-ny-hour]").forEach(el => el.textContent = nyDateTime.hour);
  document.querySelectorAll("[data-ny-minute]").forEach(el => el.textContent = nyDateTime.minute);
  document.querySelectorAll("[data-ny-second]").forEach(el => el.textContent = nyDateTime.second);
  document.querySelectorAll("[data-ny-period]").forEach(el => el.textContent = nyDateTime.period);
}

function showCurrentTlDetails(event) {
  if (event) event.stopPropagation();
  if (!state.currentUser || state.currentUser.role !== "tl") return;
  state.selectedTlId = state.currentUser.id;
  renderApp();
}

// --- Templating & Rendering ---
function renderSplashScreen() {
  const logoHtml = `<div class="splash-logo-text"><span class="part-nex">Nex</span><span class="part-gen">gen</span></div>`;

  return `
    <div class="splash-screen">
      <div class="splash-grid"></div>
      <div class="splash-orb splash-orb-one"></div>
      <div class="splash-orb splash-orb-two"></div>
      <div class="splash-orb splash-orb-three"></div>
      <div class="splash-brand">
        <div class="splash-kicker">Recruitment CRM</div>
        ${logoHtml}
        <div class="splash-welcome">Welcome to ${COMPANY_CONFIG.name}</div>
        <div class="splash-subline">Placement operations, interviews, and candidate flow in one place.</div>
        <div class="splash-loader">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  `;
}

function renderApp() {
  loadSession();
  const app = document.getElementById("app");
  
  if (!state.currentUser) {
    app.innerHTML = renderLoginScreen();
    return;
  }
  
  const isMember = state.currentUser.role === "member";
  const isCandidate = state.currentUser.role === "candidate";
  const noSidebar = isMember || isCandidate;
  
  if (isMember && !state.isTlAuthorized) {
    app.innerHTML = `
      <div class="main-layout">
        <div class="main-content no-sidebar">
          <div class="header">
            <div class="header-title-area">
                            
            </div>
            <div class="header-actions">
              ${renderNewYorkTimePanel()}
              <button class="btn-logout-header" onclick="handleLogout()">
                <i class="ri-logout-box-r-line"></i> Log Out
              </button>
            </div>
          </div>
          <div class="container-fluid" id="view-container">
            <!-- Selector view renders here -->
          </div>
        </div>
      </div>
    `;
    renderMemberSelectionView();
    renderCloudStatusWidget();
    updateNewYorkTimePanel();
    return;
  }
  
  app.innerHTML = `
    <div class="main-layout">
      ${noSidebar ? '' : renderSidebar()}
      <div class="main-content ${noSidebar ? 'no-sidebar' : ''}">
        ${renderHeader()}
        <div class="container-fluid" id="view-container">
          <!-- Render View here -->
        </div>
        ${state.selectedTlId ? renderTlDetailsPopover() : ''}
      </div>
    </div>
  `;
  
  renderView();
  renderCloudStatusWidget();
  updateNewYorkTimePanel();
}

function renderLoginScreen() {
  let cardHtml = "";
  if (state.loginType === "admin") {
    cardHtml = `
      <div class="login-card">
        <div class="login-switch-tab">
          <button class="login-tab-btn active" onclick="switchLoginType('admin')">Admin</button>
          <button class="login-tab-btn" onclick="switchLoginType('tl')">Team Lead</button>
          <button class="login-tab-btn" onclick="switchLoginType('member')">Team Member</button>
          <button class="login-tab-btn" onclick="switchLoginType('candidate')">Candidate</button>
        </div>
        
        <div class="login-card-header">
          <h2 class="login-card-title">Admin Login</h2>
          <div class="login-card-subtitle">Login to open full CRM dashboard</div>
        </div>
        
        <form onsubmit="handleLogin(event)">
          <div class="login-form-group">
            <label class="login-label">Email / Username</label>
            <input type="email" id="login-admin-email" class="login-input" required value="admin@crm.com" placeholder="admin@nexgen.com">
          </div>
          
          <div class="login-form-group">
            <label class="login-label">Password</label>
            <input type="password" id="login-admin-password" class="login-input" required value="password" placeholder="••••••••">
          </div>
          
          <button type="submit" class="btn btn-primary" style="width:100%; margin-top:12px;">Log In</button>
          
          <div class="login-card-footer">
            <a href="#" onclick="showToast('Password reset link sent to admin@crm.com')">Forgot password?</a>
            <p style="margin-top: 24px; font-size: 11px; color: var(--text-secondary);">After login: Dashboard + all candidate data view</p>
          </div>
        </form>
      </div>
    `;
  } else if (state.loginType === "tl") {
    cardHtml = `
      <div class="login-card">
        <div class="login-switch-tab">
          <button class="login-tab-btn" onclick="switchLoginType('admin')">Admin</button>
          <button class="login-tab-btn active" onclick="switchLoginType('tl')">Team Lead</button>
          <button class="login-tab-btn" onclick="switchLoginType('member')">Team Member</button>
          <button class="login-tab-btn" onclick="switchLoginType('candidate')">Candidate</button>
        </div>
        
        <div class="login-card-header">
          <h2 class="login-card-title">Team Lead Login</h2>
          <div class="login-card-subtitle">Only team leader can add candidate names and open member sheets.</div>
        </div>
        
        <form onsubmit="handleLogin(event)">
          <div class="login-form-group">
            <label class="login-label">Team Leader ID</label>
            <input type="text" id="login-tl-id" class="login-input" required value="TL001" placeholder="TL001">
          </div>
          
          <div class="login-form-group">
            <label class="login-label">Password</label>
            <input type="password" id="login-tl-password" class="login-input" required value="password123" placeholder="••••••••">
          </div>
          
          <button type="submit" class="btn btn-primary" style="width:100%; margin-top:12px;">Login as Team Leader</button>
          
          <div class="info-box" style="margin-top:24px;">
            <div class="info-box-title" style="font-size:12px; margin-bottom:4px;">Permission rules</div>
            <div class="info-box-content" style="font-size:11px;">Members cannot change TL candidate names.</div>
          </div>
        </form>
      </div>
    `;
  } else if (state.loginType === "member") {
    cardHtml = `
      <div class="login-card">
        <div class="login-switch-tab">
          <button class="login-tab-btn" onclick="switchLoginType('admin')">Admin</button>
          <button class="login-tab-btn" onclick="switchLoginType('tl')">Team Lead</button>
          <button class="login-tab-btn active" onclick="switchLoginType('member')">Team Member</button>
          <button class="login-tab-btn" onclick="switchLoginType('candidate')">Candidate</button>
        </div>
        
        <div class="login-card-header">
          <h2 class="login-card-title">Team Member Login</h2>
          <div class="login-card-subtitle">Access your assigned candidate application sheets in view-only mode.</div>
        </div>
        
        <form onsubmit="handleLogin(event)">
          <div class="login-form-group">
            <label class="login-label">Email Address</label>
            <input type="email" id="login-member-email" class="login-input" required value="karan@nexgen.com" placeholder="karan@nexgen.com">
          </div>
          
          <div class="login-form-group">
            <label class="login-label">Password</label>
            <input type="password" id="login-member-password" class="login-input" required value="password123" placeholder="••••••••">
          </div>
          
          <button type="submit" class="btn btn-primary" style="width:100%; margin-top:12px;">Login as Team Member</button>
          
          <div class="info-box" style="margin-top:24px; background-color: var(--warning-bg); border-color:#ffe0b2;">
            <div class="info-box-title" style="font-size:12px; margin-bottom:4px; color: var(--warning-text);">View-only access</div>
            <div class="info-box-content" style="font-size:11px; color: var(--warning-text);">Members can view sheet and copy links, but cannot edit protected fields.</div>
          </div>
        </form>
      </div>
    `;
  } else {
    cardHtml = `
      <div class="login-card">
        <div class="login-switch-tab">
          <button class="login-tab-btn" onclick="switchLoginType('admin')">Admin</button>
          <button class="login-tab-btn" onclick="switchLoginType('tl')">Team Lead</button>
          <button class="login-tab-btn" onclick="switchLoginType('member')">Team Member</button>
          <button class="login-tab-btn active" onclick="switchLoginType('candidate')">Candidate</button>
        </div>
        
        <div class="login-card-header">
          <h2 class="login-card-title">Candidate Login</h2>
          <div class="login-card-subtitle">Log in with your personal email to view your recruitment sheet.</div>
        </div>
        
        <form onsubmit="handleLogin(event)">
          <div class="login-form-group">
            <label class="login-label">Personal Email Address</label>
            <input type="email" id="login-candidate-email" class="login-input" required value="amit@gmail.com" placeholder="amit@gmail.com">
          </div>
          
          <div class="login-form-group">
            <label class="login-label">Password</label>
            <input type="password" id="login-candidate-password" class="login-input" required value="password123" placeholder="••••••••">
          </div>
          
          <button type="submit" class="btn btn-primary" style="width:100%; margin-top:12px;">Login as Candidate</button>
          
          <div class="info-box" style="margin-top:24px; background-color: var(--primary-light); border-color:#b3d4ff; color: var(--primary);">
            <div class="info-box-title" style="font-size:12px; margin-bottom:4px;">View-only Candidate Sheet</div>
            <div class="info-box-content" style="font-size:11px; color: var(--text-secondary);">Candidates have read-only access to their personal application tracking sheet.</div>
          </div>
        </form>
      </div>
    `;
  }

  return `
    <div class="login-page-container">
      <div class="login-left-panel">
        <div class="login-left-content">
          ${COMPANY_CONFIG.useLogoImage 
            ? `<img src="${COMPANY_CONFIG.logoUrl}" alt="${COMPANY_CONFIG.name}" style="max-height: 48px; width: auto; object-fit: contain; margin-bottom: 24px; align-self: flex-start;">`
            : `<div class="login-brand">${COMPANY_CONFIG.name}</div>`
          }
          <div class="login-desc">Track candidates, team leaders, interviews and daily job applications in one clean system.</div>
          
          <div class="live-preview-card">
            <div class="live-preview-title">Live Dashboard Preview</div>
            
            <div class="preview-subcard">
              <div class="label">Today Applications</div>
              <div class="value">128</div>
              <div><span class="tag tag-success">+18 today</span></div>
            </div>
            
            <div class="preview-subcard">
              <div class="label">Interviews</div>
              <div class="value">24</div>
              <div><span class="tag tag-info">Today</span></div>
            </div>
          </div>
        </div>
      </div>
      <div class="login-right-panel">
        ${cardHtml}
      </div>
    </div>
  `;
}

function switchLoginType(type) {
  state.loginType = type;
  const app = document.getElementById("app");
  app.innerHTML = renderLoginScreen();
}

function renderSidebar() {
  const isAdmin = state.currentUser.role === "admin";
  const isTL = state.currentUser.role === "tl";
  const isMember = state.currentUser.role === "member";
  
  return `
    <div class="sidebar">
      <div>
        <div class="sidebar-header">
          <div class="sidebar-brand" style="display: flex; align-items: center; gap: 8px;">
            ${COMPANY_CONFIG.useLogoImage 
              ? `<img src="${COMPANY_CONFIG.logoUrl}" alt="${COMPANY_CONFIG.name}" style="max-height: 50px; width: auto; object-fit: contain;">`
              : `<i class="ri-radar-line" style="color: var(--primary);"></i> ${COMPANY_CONFIG.name}`
            }
          </div>
                  </div>
        
        <ul class="sidebar-menu">
          ${isAdmin ? `
            <li class="sidebar-item ${state.currentView === 'dashboard' ? 'active' : ''}">
              <a href="#" onclick="switchView('dashboard')"><i class="ri-dashboard-line"></i> Dashboard</a>
            </li>
            <li class="sidebar-item ${state.currentView === 'team-leaders' ? 'active' : ''}">
              <a href="#" onclick="switchView('team-leaders')"><i class="ri-user-star-line"></i> Team Leaders</a>
            </li>
          ` : ''}
          
          ${isAdmin || isTL ? `
            <li class="sidebar-item ${state.currentView === 'team-members' ? 'active' : ''}">
              <a href="#" onclick="switchView('team-members')"><i class="ri-group-line"></i> Team Members</a>
            </li>
          ` : ''}
          
          <li class="sidebar-item ${state.currentView === 'candidates-sheet' ? 'active' : ''}">
            <a href="#" onclick="switchView('candidates-sheet')"><i class="ri-file-excel-2-line"></i> Candidates Sheet</a>
          </li>
          
          <li class="sidebar-item ${state.currentView === 'interview-calendar' ? 'active' : ''}">
            <a href="#" onclick="switchView('interview-calendar')"><i class="ri-calendar-event-line"></i> Interview Calendar</a>
          </li>
          
          <li class="sidebar-item ${state.currentView === 'settings' ? 'active' : ''}">
            <a href="#" onclick="switchView('settings')"><i class="ri-settings-4-line"></i> Settings</a>
          </li>
        </ul>
      </div>
      
      <div class="sidebar-footer">
        <div class="cloud-status-indicator" style="font-size: 11px; margin-bottom: 12px; display: flex; align-items: center; gap: 6px; font-weight:600; color: var(--text-secondary);">
          <i class="ri-cloud-off-line"></i> <span>Local Storage Mode</span>
        </div>
        <div class="user-profile-card">
          <div class="user-avatar">${getInitial(state.currentUser.name)}</div>
          <div class="user-info">
            <span class="user-name">${getDisplayName(state.currentUser.name)}</span>
            <span class="user-role">${state.currentUser.role === 'admin' ? 'Admin User' : state.currentUser.role === 'tl' ? 'Team Leader' : 'Team Member'}</span>
          </div>
        </div>
        <button class="logout-btn" onclick="handleLogout()"><i class="ri-logout-box-r-line"></i> Log Out</button>
      </div>
    </div>
  `;
}

function renderHeader() {
  let title = "Dashboard Overview";
  
  if (state.currentView === "team-leaders") {
    title = "Team Leader Details";
  } else if (state.currentView === "team-members") {
    title = "Team Members";
  } else if (state.currentView === "candidates-sheet") {
    title = "Candidate Application Sheet";
  } else if (state.currentView === "interviews-breakdown") {
    title = "Interview Performance";
  } else if (state.currentView === "interview-calendar") {
    title = "Interview Calendar";
  } else if (state.currentView === "settings") {
    title = "Settings";
  }
  
  const showAddBtn = state.currentUser.role === 'admin' || (state.currentUser.role === 'tl' && state.currentView === 'team-members');
  
  const isMember = state.currentUser.role === 'member';
  const isCandidate = state.currentUser.role === 'candidate';
  const noSidebar = isMember || isCandidate;
  const searchPlaceholder = state.currentView === "candidates-sheet" ? "Search company, role, link..." : "Search candidate, company...";
  
  return `
    <div class="header">
      <div class="header-title-area">
        <h1 class="header-title">${title}</h1>
      </div>
      
      <div class="header-actions">
        ${renderNewYorkTimePanel()}
        <div class="search-bar">
          <i class="ri-search-line"></i>
          <input type="text" placeholder="${searchPlaceholder}" oninput="handleSearch(event)" value="${state.searchQuery}">
        </div>
        
        ${showAddBtn ? `
          <button class="btn btn-primary" onclick="triggerQuickAdd()"><i class="ri-add-line"></i> Add</button>
        ` : ''}
        
        ${noSidebar ? `
          <button class="btn-logout-header" onclick="handleLogout()">
            <i class="ri-logout-box-r-line"></i> Log Out
          </button>
        ` : ''}
        
        <div class="header-profile-menu-wrap">
          <div class="user-avatar header-user-avatar ${state.currentUser.role === 'tl' ? 'clickable' : ''}" onclick="showCurrentTlDetails(event)" title="${state.currentUser.role === 'tl' ? 'View TL details' : getDisplayName(state.currentUser.name)}" style="background-color: var(--primary-light); color: var(--primary); width: 34px; height: 34px; font-size:14px;">
            ${getInitial(state.currentUser.name)}
          </div>
        </div>
      </div>
    </div>
  `;
}

function switchView(view) {
  state.currentView = view;
  state.searchQuery = ""; // reset search
  state.selectedTlId = null; // hide TL details popup
  if (view !== "interviews-breakdown") {
    state.selectedInterviewTlId = null;
  }
  updateHashFromState();
  renderApp();
}

function triggerQuickAddCandidate() {
  populateCandidateModalDropdown();
  openModal("modal-add-candidate");
}

function triggerQuickAdd() {
  if (state.currentView === "team-leaders" && state.currentUser.role === 'admin') {
    openModal("modal-add-tl");
  } else if (state.currentView === "team-members" && (state.currentUser.role === 'admin' || state.currentUser.role === 'tl')) {
    openModal("modal-add-member");
  } else if (state.currentView === "candidates-sheet") {
    if (state.currentUser.role !== "member") {
      openModal("modal-add-row");
    } else {
      showToast("Members do not have permission to add rows", "error");
    }
  } else {
    // Default action: Add a Candidate
    if (state.currentUser.role !== "member") {
      triggerQuickAddCandidate();
    } else {
      showToast("Members cannot add candidates", "error");
    }
  }
}

function populateCandidateModalDropdown() {
  const db = getDb();
  const dropdown = document.getElementById("add-cand-member");
  if (!dropdown) return;
  
  let members = db.teamMembers;
  if (state.currentUser.role === "tl") {
    members = db.teamMembers.filter(m => m.tlId === state.currentUser.id);
  }
  
  dropdown.innerHTML = members.map(m => `
    <option value="${m.id}">${getDisplayName(m.name)} (${m.code || m.id}) - ${m.email}</option>
  `).join("");
}

// --- View Router Renderers ---
function renderView() {
  const container = document.getElementById("view-container");
  if (!container) return;
  
  if (state.currentUser && state.currentUser.role === "candidate") {
    state.currentView = "candidates-sheet";
  }
  
  switch(state.currentView) {
    case "dashboard":
      container.innerHTML = renderDashboardView();
      break;
    case "team-leaders":
      container.innerHTML = renderTeamLeadersView();
      break;
    case "team-members":
      container.innerHTML = renderTeamMembersView();
      break;
    case "candidates-sheet":
      container.innerHTML = renderCandidatesSheetView();
      setupSheetCellListeners();
      break;
    case "interview-calendar":
      container.innerHTML = renderCalendarView();
      break;
    case "settings":
      container.innerHTML = renderSettingsView();
      break;
    case "candidates-breakdown":
      container.innerHTML = renderCandidatesBreakdownView();
      break;
    case "interviews-breakdown":
      container.innerHTML = renderInterviewsBreakdownView();
      break;
    default:
      container.innerHTML = `<h3>View under construction</h3>`;
  }
}

// 1. Dashboard View
function renderDashboardView() {
  const db = getDb();
  
  // Calculate dynamic stats
  const totalCandidates = db.candidates.length;
  const activeTeams = db.teamLeaders.length;
  
  // Calculate today's applications count using New York date.
  const nyDateTime = getNewYorkDateTime();
  const todayStr = nyDateTime.date;
  const todayAppsCount = db.candidates.reduce((acc, c) => {
    return acc + c.applications.filter(a => a.date === todayStr).length;
  }, 0);
  
  const interviewsCount = db.candidates.reduce((acc, c) => {
    return acc + c.applications.filter(a => a.status === "Today").length;
  }, 0);

  // Calculate new stats (Total Applications, Easy Apply, External Application)
  const allApps = db.candidates.reduce((acc, c) => acc.concat(c.applications), []);
  const totalApplicationsCount = allApps.length;
  const easyAppsCount = allApps.filter(a => a.type === "Easy Apply").length;
  const externalAppsCount = allApps.filter(a => a.type === "External Application").length;
  
  // Filter interviews table
  let allApplications = [];
  db.candidates.forEach(c => {
    c.applications.forEach(app => {
      allApplications.push({
        candidateName: getDisplayName(c.name),
        company: app.company,
        role: app.role,
        date: app.date,
        type: app.type,
        link: app.link,
        interviewDate: app.interviewDate,
        status: app.status,
        ownerTlId: c.ownerTlId,
        employeeCode: getApplicationEmployeeCode(c, app)
      });
    });
  });
  
  // Apply Search
  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    allApplications = allApplications.filter(app => 
      app.candidateName.toLowerCase().includes(q) || 
      app.company.toLowerCase().includes(q) || 
      app.role.toLowerCase().includes(q) ||
      app.employeeCode.toLowerCase().includes(q)
    );
  }

  // Apply Date Filter
  if (state.filterDate) {
    allApplications = allApplications.filter(app => app.date === state.filterDate);
  }
  
  // Get upcoming/today interviews or filtered date log
  let displayApps = [];
  if (state.filterDate) {
    displayApps = allApplications;
  } else {
    displayApps = allApplications.filter(a => a.status === "Today" || a.status === "Upcoming");
  }

  // Calculate last 7 days chart dynamically
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    
    const count = db.candidates.reduce((acc, c) => {
      return acc + c.applications.filter(a => a.date === dateStr).length;
    }, 0);
    
    last7Days.push({ dayName, dateStr, count });
  }
  const maxCount = Math.max(...last7Days.map(d => d.count), 1);

  // Generate dynamic chart HTML
  const chartHtml = last7Days.map(d => {
    const heightPercent = (d.count / maxCount) * 80 + 5;
    return `
      <div class="chart-bar-wrapper">
        <div class="chart-bar" style="height: ${heightPercent}%;" data-value="${d.count}"></div>
        <span class="chart-label">${d.dayName}</span>
      </div>
    `;
  }).join('');

  // Calculate Team-wise Tracking dynamically
  const teamTrackerHtml = db.teamLeaders.map(tl => {
    const tlCandidates = db.candidates.filter(c => c.ownerTlId === tl.id);
    const appCount = tlCandidates.reduce((acc, c) => acc + c.applications.length, 0);
    const interviewCount = tlCandidates.reduce((acc, c) => {
      return acc + c.applications.filter(a => a.status === "Today" || a.status === "Upcoming").length;
    }, 0);
    
    return `
      <div class="team-track-item">
        <span class="team-name" style="text-transform: capitalize;">${getDisplayName(tl.name)} Team</span>
        <span class="team-apps">${appCount} applications</span>
        <span class="tag tag-info">${interviewCount} active</span>
      </div>
    `;
  }).join('');

  const totalInterviewCount = db.candidates.reduce((total, candidate) => {
    return total + candidate.applications.filter(app => app.interviewDate && app.interviewDate !== "Pending").length;
  }, 0);
  
  return `
    <!-- Top Row Cards -->
    <div class="stats-grid">
      <div class="card stats-card clickable" onclick="switchView('candidates-breakdown')" title="Click to view candidate breakdown & warnings">
        <span class="stats-label">Total Candidates</span>
        <span class="stats-value">${totalCandidates}</span>
        <div class="stats-footer">
          <span class="tag tag-success">Active</span>
          <span style="color: var(--text-secondary);">click to view breakdown</span>
        </div>
      </div>

      <div class="card stats-card">
        <span class="stats-label">Total Applications</span>
        <span class="stats-value">${totalApplicationsCount}</span>
        <div class="stats-footer">
          <span class="tag tag-info">Submissions</span>
          <span style="color: var(--text-secondary);">grand total</span>
        </div>
      </div>

      <div class="card stats-card">
        <span class="stats-label">Easy Apply Count</span>
        <span class="stats-value">${easyAppsCount}</span>
        <div class="stats-footer">
          <span class="tag tag-success">Easy Apply</span>
          <span style="color: var(--text-secondary);">one-click jobs</span>
        </div>
      </div>

      <div class="card stats-card">
        <span class="stats-label">External Applications</span>
        <span class="stats-value">${externalAppsCount}</span>
        <div class="stats-footer">
          <span class="tag tag-purple">External</span>
          <span style="color: var(--text-secondary);">manual apply</span>
        </div>
      </div>
      
      <div class="card stats-card">
        <span class="stats-label">Today Applications</span>
        <span class="stats-value">${todayAppsCount}</span>
        <div class="stats-footer">
          <span class="tag tag-info">Submissions</span>
          <span style="color: var(--text-secondary);">on current date</span>
        </div>
      </div>
      
      <div class="card stats-card">
        <span class="stats-label">Interviews Today</span>
        <span class="stats-value">${interviewsCount}</span>
        <div class="stats-footer">
          <span class="tag tag-warning" style="cursor:pointer;" onclick="switchView('interview-calendar')">Schedule</span>
          <span style="color: var(--text-secondary);">slots pending</span>
        </div>
      </div>

      <div class="card stats-card clickable" onclick="switchView('interviews-breakdown')" title="Click to view team-wise interview performance">
        <span class="stats-label">Interview</span>
        <span class="stats-value">${totalInterviewCount}</span>
        <div class="stats-footer">
          <span class="tag tag-warning">Total</span>
          <span style="color: var(--text-secondary);">team performance</span>
        </div>
      </div>
      
      <div class="card stats-card">
        <span class="stats-label">Active Teams</span>
        <span class="stats-value">${activeTeams}</span>
        <div class="stats-footer">
          <span class="tag tag-purple">Active Leads</span>
          <span style="color: var(--text-secondary);">teams tracking</span>
        </div>
      </div>

    </div>
    
    <!-- Middle Grid (Daily Applications Chart & Team tracking) -->
    <div class="dashboard-grid-middle">
      <div class="card" style="display:flex; flex-direction:column; justify-content:space-between;">
        <div class="card-header">
          <div>
            <h3 class="card-title">Daily Applications</h3>
            <span class="card-subtitle">Last 7 days application tracking</span>
          </div>
          <i class="ri-bar-chart-2-line" style="color: var(--text-secondary); font-size: 20px;"></i>
        </div>
        
        <!-- Custom HTML/CSS Bar Chart matching Figma -->
        <div class="chart-container">
          ${chartHtml}
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <div>
            <h3 class="card-title">Team-wise Tracking</h3>
            <span class="card-subtitle">Leader board application submissions</span>
          </div>
          <i class="ri-trophy-line" style="color: var(--text-secondary); font-size: 20px;"></i>
        </div>
        
        <div class="team-track-list">
          ${teamTrackerHtml || '<div style="color: var(--text-secondary); padding: 12px; font-size:12px;">No team data available</div>'}
        </div>
      </div>
    </div>

    <!-- Bottom Grid (Interview Details Table) -->
    <div class="card">
      <div class="card-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
        <div>
          <h3 class="card-title">${state.filterDate ? `Daily Log: ${state.filterDate}` : 'Upcoming & Today Interactions'}</h3>
          <span class="card-subtitle">${state.filterDate ? `Candidate submissions and schedules for ${state.filterDate}` : 'Overview of scheduled candidate interviews'}</span>
        </div>
        
        <!-- Date filter picker -->
        <div style="display:flex; align-items:center; gap:8px;">
          <label style="font-size:12px; font-weight:600; color: var(--text-secondary);">Select Date:</label>
          <input type="date" class="login-input" style="width:160px; padding: 4px 8px; height: 32px; font-size:12px;" onchange="handleDateFilterChange(event)" value="${state.filterDate}">
          ${state.filterDate ? `<button class="btn btn-outline btn-sm" style="padding:4px 8px; height:32px; font-size:11px;" onclick="handleDateFilterChange({target:{value:''}})">Clear</button>` : ''}
        </div>
      </div>
      
      <div class="table-responsive">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Candidate</th>
              <th>Company</th>
              <th>Role</th>
              <th>Submission Date</th>
              <th style="width: 190px;">Apply Type</th>
              <th>Interview Date & Time</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${displayApps.length > 0 ? displayApps.map(i => {
              const candObj = db.candidates.find(c => c.name.toLowerCase() === i.candidateName.toLowerCase());
              const onlineDot = (candObj && isCandidateOnline(candObj)) ? "🟢 " : "";
              return `
                <tr>
                  <td style="font-weight: 600; text-transform: capitalize;">${onlineDot}${getDisplayName(i.candidateName)}</td>
                  <td>${i.company}</td>
                  <td>${i.role}</td>
                  <td>${i.date || 'N/A'}</td>
                  <td>
                    <span class="tag ${i.type === 'Easy Apply' ? 'tag-success' : 'tag-purple'}">${i.type}</span>
                  </td>
                  <td>${i.interviewDate}</td>
                  <td>
                    <span class="tag ${i.status === 'Today' ? 'tag-warning' : i.status === 'Upcoming' ? 'tag-info' : 'tag-secondary'}">${i.status}</span>
                  </td>
                </tr>
              `;
            }).join('') : `
              <tr>
                <td colspan="7" style="text-align: center; color: var(--text-secondary); padding: 24px;">No records found.</td>
              </tr>
            `}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// Candidates Breakdown View (Clicked from Dashboard Total Candidates stats card)
function renderCandidatesBreakdownView() {
  const db = getDb();
  
  // Calculate stats for each candidate
  let breakdownData = db.candidates.map(candidate => {
    // Filter candidate applications if date is selected
    const filteredApps = state.filterDate 
      ? candidate.applications.filter(a => a.date === state.filterDate)
      : candidate.applications;

    const totalApps = filteredApps.length;
    const easyCount = filteredApps.filter(a => a.type === "Easy Apply").length;
    const externalCount = filteredApps.filter(a => a.type === "External Application").length;
    
    // Find Owner TL & Member details
    const tl = db.teamLeaders.find(t => t.id === candidate.ownerTlId);
    const member = db.teamMembers.find(m => m.id === candidate.ownerMemberId);
    
    // Warning status: if Easy Apply is strictly more than External Application
    const showWarning = easyCount > externalCount;
    
    return {
      id: candidate.id,
      name: getDisplayName(candidate.name),
      email: candidate.email,
      tlName: tl ? getDisplayName(tl.name) : "Unassigned",
      memberName: member ? getDisplayName(member.name) : "Unassigned",
      totalApps,
      easyCount,
      externalCount,
      showWarning,
      rawCandidate: candidate // store original candidate object for helper functions like isCandidateOnline
    };
  });
  
  // Filter search
  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    breakdownData = breakdownData.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.email.toLowerCase().includes(q) ||
      c.tlName.toLowerCase().includes(q) ||
      c.memberName.toLowerCase().includes(q)
    );
  }
  
  const warnedCandidates = breakdownData.filter(c => c.showWarning);
  const totalWarned = warnedCandidates.length;
  
  return `
    <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <div>
        <button class="btn btn-outline btn-sm" onclick="switchView('dashboard')" style="padding: 6px 12px; font-size:12px; display:inline-flex; align-items:center; gap:6px;">
          <i class="ri-arrow-left-line"></i> Back to Dashboard
        </button>
      </div>
      <div>
        <span style="font-size:13px; font-weight:600; color: var(--text-secondary);">
          Total Candidates: <span style="color: var(--text-primary); font-weight:700;">${breakdownData.length}</span>
        </span>
      </div>
    </div>

    ${totalWarned > 0 ? `
      <div class="sheet-disclaimer-banner" style="background-color: var(--warning-bg); border-color: #ffe0b2; color: var(--warning-text); display: flex; align-items: center; gap: 8px; margin-bottom: 20px;">
        <i class="ri-alert-line" style="font-size:18px;"></i>
        <span><strong>Attention Required:</strong> ${totalWarned} candidate(s) have a high "Easy Apply" ratio compared to "External Applications". We recommend diversifying submission strategies.</span>
      </div>
    ` : ''}

    <div class="card">
      <div class="card-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
        <div>
          <h3 class="card-title">Candidate Applications Breakdown</h3>
          <span class="card-subtitle">Detailed audit showing application counts by submission channel and ratio balance warning flags</span>
        </div>
        
        <!-- Date filter picker for breakdown -->
        <div style="display:flex; align-items:center; gap:8px;">
          <label style="font-size:12px; font-weight:600; color: var(--text-secondary);">Select Date:</label>
          <input type="date" class="login-input" style="width:160px; padding: 4px 8px; height: 32px; font-size:12px;" onchange="handleDateFilterChange(event)" value="${state.filterDate}">
          ${state.filterDate ? `<button class="btn btn-outline btn-sm" style="padding:4px 8px; height:32px; font-size:11px;" onclick="handleDateFilterChange({target:{value:''}})">Clear</button>` : ''}
        </div>
      </div>
      
      <div class="table-responsive">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Candidate Name</th>
              <th>Date</th>
              <th>Assigned Team Lead</th>
              <th>Assigned Executive</th>
              <th style="text-align: center;">Total Applications</th>
              <th style="text-align: center;">Easy Apply</th>
              <th style="text-align: center;">External Application</th>
              <th>Ratio Warning Alert</th>
            </tr>
          </thead>
          <tbody>
            ${breakdownData.length > 0 ? breakdownData.map(c => `
              <tr>
                <td style="font-weight:600; text-transform: capitalize;">
                  ${isCandidateOnline(c.rawCandidate) ? '🟢 ' : ''}${c.name}
                </td>
                <td>${state.filterDate ? state.filterDate : 'All Dates'}</td>
                <td style="text-transform: capitalize;">${c.tlName}</td>
                <td style="text-transform: capitalize;">${c.memberName}</td>
                <td style="font-weight: 700; text-align: center; color: var(--primary);">${c.totalApps}</td>
                <td style="text-align: center;">
                  <span class="tag tag-success" style="font-weight:600; padding: 2px 8px;">${c.easyCount}</span>
                </td>
                <td style="text-align: center;">
                  <span class="tag tag-purple" style="font-weight:600; padding: 2px 8px;">${c.externalCount}</span>
                </td>
                <td>
                  ${c.showWarning ? `
                    <span class="tag tag-warning" style="display:inline-flex; align-items:center; gap:4px; font-weight:700; border: 1px solid rgba(176,96,0,0.15);">
                      <i class="ri-error-warning-line"></i> Easy-Heavy (${c.easyCount} vs ${c.externalCount})
                    </span>
                  ` : `
                    <span class="tag tag-success" style="display:inline-flex; align-items:center; gap:4px; font-weight:600; color: #15803d; background-color: #f0fdf4; border: 1px solid rgba(22,163,74,0.15);">
                      <i class="ri-checkbox-circle-line"></i> Balanced Ratio
                    </span>
                  `}
                </td>
              </tr>
            `).join('') : `
              <tr>
                <td colspan="8" style="text-align: center; color: var(--text-secondary); padding: 24px;">No records found.</td>
              </tr>
            `}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function getInterviewBreakdownData() {
  const db = getDb();

  return db.teamLeaders.map(tl => {
    const members = db.teamMembers.filter(member => member.tlId === tl.id).map(member => {
      const candidates = db.candidates.filter(candidate => candidate.ownerMemberId === member.id).map(candidate => {
        const interviews = candidate.applications
          .filter(app => app.interviewDate && app.interviewDate !== "Pending")
          .map(app => ({
            company: app.company || "Unknown Company",
            role: app.role || "Role not added",
            date: app.date || "-",
            interviewDate: app.interviewDate,
            status: app.status || "Pending"
          }));

        return {
          id: candidate.id,
          name: getDisplayName(candidate.name),
          interviews
        };
      });

      const totalInterviews = candidates.reduce((sum, candidate) => sum + candidate.interviews.length, 0);
      return {
        id: member.id,
        code: member.code || member.id,
        name: getDisplayName(member.name),
        candidates,
        totalInterviews
      };
    });

    const unassignedCandidates = db.candidates.filter(candidate => candidate.ownerTlId === tl.id && !members.some(member => member.id === candidate.ownerMemberId));
    if (unassignedCandidates.length > 0) {
      const candidates = unassignedCandidates.map(candidate => {
        const interviews = candidate.applications
          .filter(app => app.interviewDate && app.interviewDate !== "Pending")
          .map(app => ({
            company: app.company || "Unknown Company",
            role: app.role || "Role not added",
            date: app.date || "-",
            interviewDate: app.interviewDate,
            status: app.status || "Pending"
          }));

        return {
          id: candidate.id,
          name: getDisplayName(candidate.name),
          interviews
        };
      });

      members.push({
        id: "unassigned",
        code: "-",
        name: "Unassigned",
        candidates,
        totalInterviews: candidates.reduce((sum, candidate) => sum + candidate.interviews.length, 0)
      });
    }

    return {
      id: tl.id,
      name: getDisplayName(tl.name),
      members,
      totalInterviews: members.reduce((sum, member) => sum + member.totalInterviews, 0)
    };
  });
}

function selectInterviewTl(tlId) {
  state.selectedInterviewTlId = tlId;
  renderView();
}

function renderInterviewsBreakdownView() {
  const teams = getInterviewBreakdownData();
  const selectedTeam = teams.find(team => team.id === state.selectedInterviewTlId);
  const totalInterviews = teams.reduce((sum, team) => sum + team.totalInterviews, 0);

  if (!selectedTeam) {
    return `
      <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <button class="btn btn-outline btn-sm" onclick="switchView('dashboard')" style="padding: 6px 12px; font-size:12px; display:inline-flex; align-items:center; gap:6px;">
          <i class="ri-arrow-left-line"></i> Back to Dashboard
        </button>
        <span style="font-size:13px; font-weight:600; color: var(--text-secondary);">
          Total Interviews: <span style="color: var(--text-primary); font-weight:700;">${totalInterviews}</span>
        </span>
      </div>

      <div class="card">
        <div class="card-header">
          <div>
            <h3 class="card-title">Interview Performance</h3>
            <span class="card-subtitle">Click a TL name to see member and candidate interview details</span>
          </div>
          <i class="ri-user-voice-line" style="color: var(--text-secondary); font-size: 20px;"></i>
        </div>

        <div class="interview-team-list">
          ${teams.map(team => `
            <button type="button" class="interview-team-row" onclick="selectInterviewTl('${team.id}')">
              <span>${team.name} Team</span>
              <span class="tag tag-info">${team.totalInterviews} interviews</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  return `
    <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 20px; gap:12px; flex-wrap:wrap;">
      <div style="display:flex; gap:10px; flex-wrap:wrap;">
        <button class="btn btn-outline btn-sm" onclick="state.selectedInterviewTlId=null; renderView();" style="padding: 6px 12px; font-size:12px; display:inline-flex; align-items:center; gap:6px;">
          <i class="ri-arrow-left-line"></i> All TLs
        </button>
        <button class="btn btn-outline btn-sm" onclick="switchView('dashboard')" style="padding: 6px 12px; font-size:12px; display:inline-flex; align-items:center; gap:6px;">
          Dashboard
        </button>
      </div>
      <span style="font-size:13px; font-weight:600; color: var(--text-secondary);">
        ${selectedTeam.name} Team: <span style="color: var(--text-primary); font-weight:700;">${selectedTeam.totalInterviews} interviews</span>
      </span>
    </div>

    <div class="card">
      <div class="card-header">
        <div>
          <h3 class="card-title">${selectedTeam.name} Team Interview Details</h3>
          <span class="card-subtitle">Member-wise candidate interviews with submission date and interview date/time</span>
        </div>
      </div>

      <div class="interview-member-list">
        ${selectedTeam.members.map(member => `
          <div class="interview-member-group">
            <div class="interview-member-header">
              <div>
                <div class="interview-member-title">${member.name} <span class="tag tag-info">${member.code}</span></div>
                <div class="interview-member-subtitle">${member.candidates.length} candidate profiles</div>
              </div>
              <span class="tag tag-warning">${member.totalInterviews} interviews</span>
            </div>
            <div class="table-responsive">
              <table class="custom-table compact-interview-table">
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Company</th>
                    <th>Role</th>
                    <th>Submission Date</th>
                    <th>Interview Date/Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${member.candidates.flatMap(candidate => (
                    candidate.interviews.length > 0
                      ? candidate.interviews.map(interview => `
                        <tr>
                          <td style="font-weight:700;">${candidate.name}</td>
                          <td>${interview.company}</td>
                          <td>${interview.role}</td>
                          <td>${interview.date}</td>
                          <td>${interview.interviewDate}</td>
                          <td><span class="tag ${interview.status === 'Today' ? 'tag-warning' : interview.status === 'Upcoming' ? 'tag-info' : 'tag-secondary'}">${interview.status}</span></td>
                        </tr>
                      `)
                      : [`
                        <tr>
                          <td style="font-weight:700;">${candidate.name}</td>
                          <td colspan="5" style="color: var(--text-secondary);">No interviews added</td>
                        </tr>
                      `]
                  )).join('')}
                  ${member.candidates.length === 0 ? `
                    <tr>
                      <td colspan="6" style="color: var(--text-secondary); text-align:center; padding:18px;">No candidates assigned to this member.</td>
                    </tr>
                  ` : ''}
                </tbody>
              </table>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// 2. Team Leaders View
function renderTeamLeadersView() {
  const db = getDb();
  let tls = db.teamLeaders;
  
  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    tls = tls.filter(t => t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q) || t.userId.toLowerCase().includes(q));
  }
  
  return `
    <div style="display:flex; justify-content: flex-end; margin-bottom: 16px;">
      <button class="btn btn-primary btn-sm" onclick="openModal('modal-add-tl')"><i class="ri-add-line"></i> Add Team Leader</button>
    </div>
    
    <div class="card">
      <div class="card-header">
        <div>
          <h3 class="card-title">Team Leaders</h3>
          <span class="card-subtitle">Overall administration and member control listings</span>
        </div>
      </div>
      
      <div class="table-responsive">
        <table class="custom-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Code</th>
              <th>Team Leader</th>
              <th>Email</th>
              <th>Members</th>
              <th>Candidates</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${tls.map(t => {
              const membersCount = db.teamMembers.filter(m => m.tlId === t.id).length;
              const candidatesCount = db.candidates.filter(c => c.ownerTlId === t.id).length;
              return `
                <tr>
                  <td style="font-weight: 600; color: var(--text-secondary);">${t.id}</td>
                  <td><span class="tag tag-info">${t.code || t.id}</span></td>
                  <td style="font-weight: 600; text-transform: capitalize;">${getDisplayName(t.name)}</td>
                  <td>${t.email}</td>
                  <td>${membersCount} Members</td>
                  <td>${candidatesCount}</td>
                  <td>
                    <button class="btn btn-secondary btn-sm" onclick="showTlDetails('${t.id}')">View Details</button>
                    <button class="btn btn-outline btn-sm" onclick="updateTlDetails('${t.id}')"><i class="ri-edit-line"></i> Edit</button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function showTlDetails(id) {
  state.selectedTlId = id;
  renderView();
}

function hideTlDetails() {
  state.selectedTlId = null;
  renderView();
}

function renderTlDetailsPopover() {
  const db = getDb();
  const tl = db.teamLeaders.find(t => t.id === state.selectedTlId);
  if (!tl) return '';
  
  return `
    <div class="tl-details-popover">
      <div class="popover-header">
        <h4 class="popover-title">Selected TL Details</h4>
        <button class="popover-close" onclick="hideTlDetails()"><i class="ri-close-line"></i></button>
      </div>
      <div class="popover-body">
        <div class="popover-row">
          <span class="popover-label">Name:</span>
          <span class="popover-val">${getDisplayName(tl.name)}</span>
        </div>
        <div class="popover-row">
          <span class="popover-label">Code:</span>
          <span class="popover-val">${tl.code || tl.id}</span>
        </div>
        <div class="popover-row">
          <span class="popover-label">User ID:</span>
          <span class="popover-val">${tl.userId}</span>
        </div>
        <div class="popover-row">
          <span class="popover-label">Password:</span>
          <div style="display:flex; align-items:center; gap:8px;">
            <span id="tl-pass-display" class="popover-val" style="font-family: monospace;" data-password="${tl.password}">••••••••</span>
            <button onclick="toggleTlPasswordDisplay()" style="background:none; border:none; cursor:pointer; color:var(--text-secondary); display:flex; align-items:center;">
              <i id="tl-pass-toggle-icon" class="ri-eye-off-line" style="font-size: 16px;"></i>
            </button>
          </div>
        </div>
        <div class="popover-row" style="margin-top: 8px; border-top: 1px solid var(--border-color); padding-top: 8px;">
          <span class="popover-label">Permission:</span>
          <span class="tag tag-success" style="font-size: 10px;">${tl.permission}</span>
        </div>
      </div>
      <div style="display:flex; gap:8px;">
        <button class="btn btn-outline btn-sm" style="flex: 1;" onclick="updateTlDetails('${tl.id}')">
          <i class="ri-edit-line"></i> Edit
        </button>
        <button class="btn btn-primary btn-sm" style="flex: 1;" onclick="copyTlLogin('${tl.userId}', '${tl.password}')">
          <i class="ri-file-copy-line"></i> Copy Login
        </button>
      </div>
    </div>
  `;
}

function copyTlLogin(uid, pass) {
  const loginDetails = `Team Leader Login Details:\nUser ID: ${uid}\nPassword: ${pass}\nURL: ${window.location.href}`;
  copyToClipboard(loginDetails);
}

// 3. Team Members View
function renderTeamMembersView() {
  const db = getDb();
  let members = db.teamMembers;
  
  // If Team Leader is logged in, show only their members
  if (state.currentUser.role === "tl") {
    members = members.filter(m => m.tlId === state.currentUser.id);
  }
  
  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    members = members.filter(m => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || (m.code || m.id).toLowerCase().includes(q));
  }
  
  const showAddBtn = state.currentUser.role === 'admin' || state.currentUser.role === 'tl';
  const displayTeamTitle = state.currentUser.role === "tl" ? `Members under ${getDisplayName(state.currentUser.name)} Team` : "All Team Members";
  
  return `
    ${showAddBtn ? `
      <div style="display:flex; justify-content: flex-end; margin-bottom: 16px;">
        <button class="btn btn-primary btn-sm" onclick="openModal('modal-add-member')"><i class="ri-add-line"></i> Add Team Member</button>
      </div>
    ` : ''}
    
    <div class="card">
      <div class="card-header">
        <div>
          <h3 class="card-title">${displayTeamTitle}</h3>
          <span class="card-subtitle">Manage team member details and assigned candidate sheets</span>
        </div>
      </div>
      
      <div class="table-responsive">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Sr No</th>
              <th>Member Code</th>
              <th>Member Name</th>
              <th>Email</th>
              <th>Candidate Count</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${members.map((m, idx) => {
              const candidateCount = db.candidates.filter(c => c.ownerMemberId === m.id).length;
              return `
                <tr>
                  <td style="font-weight: 600; color: var(--text-secondary);">${String(idx + 1).padStart(2, '0')}</td>
                  <td><span class="tag tag-info">${m.code || m.id}</span></td>
                  <td style="font-weight: 600; text-transform: capitalize;">${getDisplayName(m.name)}</td>
                  <td>${m.email}</td>
                  <td>${candidateCount} Candidates</td>
                  <td>
                    <button class="btn btn-outline btn-sm" onclick="openMemberSheet('${m.id}')">Open</button>
                    ${state.currentUser.role === 'admin' || state.currentUser.role === 'tl' ? `
                      <button class="btn btn-secondary btn-sm" onclick="updateMemberDetails('${m.id}')"><i class="ri-edit-line"></i> Edit</button>
                    ` : ''}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
    
    <div class="sheet-disclaimer-banner" style="background-color: var(--primary-light); border-color: #b3d4ff; color: var(--primary);">
      <i class="ri-information-line"></i>
      <span>Important: Candidates remain view-only. Admin, Team Leaders, and Members can edit application rows.</span>
    </div>
  `;
}

function openMemberSheet(memberId) {
  const db = getDb();
  // Find candidate assigned to this member
  const candidate = db.candidates.find(c => c.ownerMemberId === memberId);
  if (candidate) {
    state.selectedCandidateId = candidate.id;
    switchView("candidates-sheet");
  } else {
    showToast("This member does not have any assigned candidates yet", "error");
  }
}

// 4. Candidate Application Sheet View
function renderCandidatesSheetView() {
  const db = getDb();
  
  // Filter candidates list based on role permissions
  let visibleCandidates = db.candidates;
  if (state.currentUser.role === "tl") {
    visibleCandidates = db.candidates.filter(c => c.ownerTlId === state.currentUser.id);
  } else if (state.currentUser.role === "member") {
    visibleCandidates = db.candidates.filter(c => c.ownerMemberId === state.currentUser.id);
  } else if (state.currentUser.role === "candidate") {
    visibleCandidates = db.candidates.filter(c => c.id === state.currentUser.id);
  }
  
  // Check if our active candidate is still in the visible candidates list
  let currentCandidate = visibleCandidates.find(c => c.id === state.selectedCandidateId);
  if (!currentCandidate && visibleCandidates.length > 0) {
    currentCandidate = visibleCandidates[0];
    state.selectedCandidateId = currentCandidate.id;
  }
  
  // Members can also add details and edit application sheets!
  const canEdit = state.currentUser.role === "admin" || state.currentUser.role === "tl" || state.currentUser.role === "member";
  const canManageCandidates = state.currentUser.role === "admin" || state.currentUser.role === "tl";
  const isCandidate = state.currentUser.role === "candidate";
  
  // Find owner TL and Member details
  const ownerTl = currentCandidate ? db.teamLeaders.find(t => t.id === currentCandidate.ownerTlId) : null;
  const ownerMember = currentCandidate ? db.teamMembers.find(m => m.id === currentCandidate.ownerMemberId) : null;
  
  // Prepare applications list with an extra empty placeholder row at the bottom for Excel-style addition
  let appsToRender = [];
  if (currentCandidate) {
    appsToRender = [...currentCandidate.applications];
    
    // Filter by date if active
    if (state.filterDate) {
      appsToRender = appsToRender.filter(a => a.date === state.filterDate);
    }

    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      appsToRender = appsToRender.filter(a =>
        (a.company || '').toLowerCase().includes(q) ||
        (a.role || '').toLowerCase().includes(q) ||
        (a.link || '').toLowerCase().includes(q) ||
        (a.interviewDate || '').toLowerCase().includes(q) ||
        getApplicationEmployeeCode(currentCandidate, a).toLowerCase().includes(q) ||
        getDisplayName(currentCandidate.name).toLowerCase().includes(q)
      );
    }
    
    // Check if we should append a placeholder row
    let shouldAddPlaceholder = false;
    if (canEdit && !state.filterDate && !state.searchQuery) {
      if (appsToRender.length === 0) {
        shouldAddPlaceholder = true;
      } else {
        const lastApp = appsToRender[appsToRender.length - 1];
        // Only open the next row if company, role, and link are filled.
        if (isApplicationRowComplete(lastApp)) {
          shouldAddPlaceholder = true;
        }
      }
    }
    
    if (shouldAddPlaceholder) {
      appsToRender.push({
        srNo: appsToRender.length + 1,
        company: '',
        role: '',
        date: getNewYorkDateTime().date,
        type: 'Easy Apply',
        link: '',
        interviewDate: '',
        status: 'Pending',
        isPlaceholder: true
      });
    }
  }

  if (isCandidate) {
    return `
      ${currentCandidate ? `
        <!-- Active Candidate Details Block -->
        <div class="candidate-detail-header-card">
          <div class="candidate-details-row">
            <div>
              <span class="candidate-detail-label">Candidate Name:</span>
              <span class="candidate-detail-value" style="text-transform: capitalize;">
                ${getDisplayName(currentCandidate.name)} ${isCandidateOnline(currentCandidate) ? '<span class="tag tag-success" style="font-size:10px; margin-left:8px; padding:2px 6px; border-radius:12px;">🟢 Online</span>' : ''}
              </span>
            </div>
            <div>
              <span class="candidate-detail-label">Assigned Leader:</span>
              <span class="candidate-detail-value">${ownerTl ? getDisplayName(ownerTl.name) : 'Unassigned'}</span>
            </div>
            <div>
              <span class="candidate-detail-label">Assigned Executive:</span>
              <span class="candidate-detail-value">${ownerMember ? `${getDisplayName(ownerMember.name)} (${ownerMember.code || ownerMember.id})` : 'Unassigned'}</span>
            </div>
            <div>
              <span class="candidate-detail-label">Main Resume:</span>
              <span class="candidate-detail-value" style="display: inline-flex; align-items: center; gap: 6px;">
                ${renderMainResumeUI(currentCandidate)}
              </span>
            </div>
          </div>
          <div style="margin-top: 12px; display: flex; align-items: center; gap: 8px; justify-content: space-between; flex-wrap: wrap;">
            <span style="font-size:11px; color: var(--text-secondary);">
              View-only Mode. This sheet displays your active job applications tracked by our recruitment team.
            </span>
            <div style="display:flex; align-items:center; gap:6px;">
              <label style="font-size:11px; font-weight:600; color: var(--text-secondary);">Filter by Date:</label>
              <input type="date" class="login-input" style="width:140px; padding: 2px 6px; height: 26px; font-size:11px;" onchange="handleDateFilterChange(event)" value="${state.filterDate}">
              ${state.filterDate ? `<button class="btn btn-outline btn-sm" style="padding:2px 6px; height:26px; font-size:10px;" onclick="handleDateFilterChange({target:{value:''}})">Clear</button>` : ''}
            </div>
          </div>
        </div>
        
        <!-- Excel-style applications table -->
        <div class="card" style="padding: 0;">
          <div class="table-responsive">
            <table class="custom-table candidate-grid-table">
              <thead>
                <tr>
                  <th style="width: 60px;">Sr No</th>
                  <th style="width: 110px;">Employee Code</th>
                  <th>Company Name</th>
                  <th>Role</th>
                  <th style="width: 130px;">Date</th>
                  <th style="width: 190px;">Apply Type</th>
              <th>Link</th>
              <th>Interview Date/Time</th>
              <th style="width: 150px; text-align: center;">Tailored Resume</th>
              <th style="width: 80px;">Action</th>
                </tr>
              </thead>
              <tbody>
                ${appsToRender.map(app => `
                  <tr data-srno="${app.srNo}">
                    <td style="font-weight:600; text-align:center; color: var(--text-muted);">${app.srNo}</td>
                    <td><span class="tag tag-info">${getApplicationEmployeeCode(currentCandidate, app) || '-'}</span></td>
                    <td>${app.company}</td>
                    <td>${app.role}</td>
                    <td>${app.date}</td>
                    <td>
                      <span class="tag ${app.type === 'Easy Apply' ? 'tag-success' : 'tag-purple'}">${app.type}</span>
                    </td>
                    <td>
                      ${app.link ? `<a href="https://${app.link}" target="_blank" style="display:flex; align-items:center; gap:4px;"><i class="ri-external-link-line"></i> ${app.link}</a>` : ''}
                    </td>
                    <td>${app.interviewDate}</td>
                    <td style="text-align: center; vertical-align: middle;">
                      ${renderTailoredResumeUI(currentCandidate.id, app)}
                    </td>
                    <td>
                      ${app.link ? `<button class="btn btn-outline btn-sm" style="padding: 4px 8px; font-size:11px;" onclick="copyToClipboard('https://${app.link}')">Copy</button>` : ''}
                    </td>
                  </tr>
                `).join('')}
                ${appsToRender.length === 0 ? `
                  <tr>
                    <td colspan="10" style="text-align: center; color: var(--text-secondary); padding: 24px;">${state.searchQuery ? 'No matching company/application found.' : 'No applications added yet.'}</td>
                  </tr>
                ` : ''}
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- Bottom information sheets -->
        <div class="sheet-details-bottom-grid">
          <div class="info-box">
            <div class="info-box-title">About this sheet</div>
            <div class="info-box-content">This spreadsheet lists all application details sent/processed on your behalf. If you see any discrepancy, please contact your assigned executive.</div>
          </div>
        </div>
      ` : `
        <div class="card" style="text-align: center; padding: 48px; color: var(--text-secondary);">
          <i class="ri-user-unfollow-line" style="font-size:48px; display:block; margin-bottom:16px;"></i>
          <h3>No candidates found</h3>
        </div>
      `}
    `;
  }
  
  return `
    <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
      <!-- Candidate Selector Dropdown -->
      <div style="display:flex; align-items:center; gap:12px; flex-wrap: wrap;">
        <label style="font-size:14px; font-weight:600; color: var(--text-secondary);">Select Candidate:</label>
        <select class="login-input" style="width:220px; padding: 6px 12px;" onchange="changeActiveCandidate(this.value)">
          ${visibleCandidates.map(c => {
            const onlineDot = isCandidateOnline(c) ? "🟢 " : "";
            return `<option value="${c.id}" ${c.id === state.selectedCandidateId ? 'selected' : ''}>${onlineDot}${getDisplayName(c.name)}</option>`;
          }).join('')}
        </select>
        
        ${canManageCandidates ? `
          <button class="btn btn-secondary btn-sm" onclick="triggerQuickAddCandidate()"><i class="ri-add-line"></i> Add Candidate</button>
        ` : ''}
        
        <!-- Date Filter Picker -->
        <div style="display:flex; align-items:center; gap:6px; margin-left: 12px;">
          <label style="font-size:13px; font-weight:600; color: var(--text-secondary);">Filter Date:</label>
          <input type="date" class="login-input" style="width:155px; padding: 4px 8px; height: 32px; font-size:12px;" onchange="handleDateFilterChange(event)" value="${state.filterDate}">
          ${state.filterDate ? `<button class="btn btn-outline btn-sm" style="padding:4px 8px; height:32px; font-size:11px;" onclick="handleDateFilterChange({target:{value:''}})">Clear</button>` : ''}
        </div>
      </div>
      
      <div style="display:flex; gap:10px;">
        ${state.currentUser.role === 'member' ? `
          <button class="btn btn-outline btn-sm" style="border-color: #fca5a5; color: #dc2626;" onclick="lockMemberSheet()">
            <i class="ri-lock-line"></i> Lock Sheet
          </button>
        ` : ''}
        <button class="btn btn-outline btn-sm" onclick="copyCandidateSheetLink()"><i class="ri-link"></i> Copy Sheet Link</button>
      </div>
    </div>
    
    ${currentCandidate ? `
      <!-- Active Candidate Details Block -->
      <div class="candidate-detail-header-card">
        <div class="candidate-details-row">
          <div>
            <span class="candidate-detail-label">Candidate:</span>
            <span class="candidate-detail-value" style="text-transform: capitalize;">
              ${getDisplayName(currentCandidate.name)} ${isCandidateOnline(currentCandidate) ? '<span class="tag tag-success" style="font-size:10px; margin-left:8px; padding:2px 6px; border-radius:12px;">🟢 Online</span>' : ''}
            </span>
          </div>
          <div>
            <span class="candidate-detail-label">Owner TL:</span>
            <span class="candidate-detail-value">${ownerTl ? getDisplayName(ownerTl.name) : 'Unassigned'}</span>
          </div>
          <div>
            <span class="candidate-detail-label">Member:</span>
            <span class="candidate-detail-value">${ownerMember ? `${getDisplayName(ownerMember.name)} (${ownerMember.code || ownerMember.id})` : 'Unassigned'}</span>
          </div>
          <div>
            <span class="candidate-detail-label">Main Resume:</span>
            <span class="candidate-detail-value" style="display: inline-flex; align-items: center; gap: 6px;">
              ${renderMainResumeUI(currentCandidate)}
            </span>
          </div>
        </div>
        <span style="font-size:11px; color: var(--text-secondary); margin-top:4px;">
          ${canEdit ? 'Full Edit Mode. Click cells to edit. Press Ctrl+V on a cell to paste columns/rows from Excel directly! Type in the blank bottom row to add a new row.' : 'View-only Mode. Copy links or view statuses.'}
        </span>
      </div>
      
      <!-- Excel-style applications table -->
      <div class="card" style="padding: 0;">
        <div class="table-responsive">
          <table class="custom-table candidate-grid-table">
            <thead>
              <tr>
                <th style="width: 60px;">Sr No</th>
                <th style="width: 110px;">Employee Code</th>
                <th>Company Name</th>
                <th>Role</th>
                <th style="width: 130px;">Date</th>
                <th style="width: 190px;">Apply Type</th>
                <th>Link</th>
                <th>Interview Date/Time</th>
                <th style="width: 160px; text-align: center;">Tailored Resume</th>
                ${canEdit ? '<th style="width: 70px; text-align: center;">Action</th>' : '<th style="width: 80px;">Action</th>'}
              </tr>
            </thead>
            <tbody>
              ${appsToRender.map(app => `
                <tr data-srno="${app.srNo}">
                  <td style="font-weight:600; text-align:center; color: var(--text-muted);">${app.srNo}</td>
                  <td><span class="tag tag-info">${getApplicationEmployeeCode(currentCandidate, app) || '-'}</span></td>
                  
                  <td>
                    ${canEdit ? `
                      <input type="text" class="cell-edit" data-field="company" value="${app.company}" placeholder="Type company name...">
                    ` : app.company}
                  </td>
                  
                  <td>
                    ${canEdit ? `
                      <input type="text" class="cell-edit" data-field="role" value="${app.role}" placeholder="Type job role...">
                    ` : app.role}
                  </td>
                  
                  <td>
                    ${canEdit ? `
                      <input type="date" class="cell-edit" data-field="date" value="${app.date}">
                    ` : app.date}
                  </td>
                  
                  <td>
                    ${canEdit ? `
                      <select class="cell-edit apply-type-select ${app.type === 'External Application' ? 'apply-type-external' : 'apply-type-easy'}" data-field="type">
                        <option value="Easy Apply" ${app.type === 'Easy Apply' ? 'selected' : ''}>Easy Apply</option>
                        <option value="External Application" ${app.type === 'External Application' ? 'selected' : ''}>External Application</option>
                      </select>
                    ` : `<span class="tag ${app.type === 'Easy Apply' ? 'tag-success' : 'tag-purple'}">${app.type}</span>`}
                  </td>
                  
                  <td>
                    ${canEdit ? `
                      <input type="text" class="cell-edit" data-field="link" value="${app.link}" placeholder="e.g. linkedin.com/jobs/123">
                    ` : `<a href="https://${app.link}" target="_blank" style="display:flex; align-items:center; gap:4px;"><i class="ri-external-link-line"></i> ${app.link}</a>`}
                  </td>
                  
                  <td>
                    ${canEdit ? `
                      <input type="text" class="cell-edit" data-field="interviewDate" value="${app.interviewDate}" placeholder="e.g. Pending or date...">
                    ` : app.interviewDate}
                  </td>

                  <td style="text-align: center; vertical-align: middle;">
                    ${renderTailoredResumeUI(currentCandidate.id, app)}
                  </td>
                  
                  ${canEdit ? `
                    <td style="text-align: center;">
                      ${!app.isPlaceholder ? `
                        <button class="btn btn-outline btn-sm" style="padding: 4px 8px; border-color: #fca5a5; color: #ef4444;" onclick="handleDeleteRow(${app.srNo})" title="Delete Row">
                          <i class="ri-delete-bin-line"></i>
                        </button>
                      ` : `
                        <span style="color: var(--text-muted); font-size: 11px;">New Row</span>
                      `}
                    </td>
                  ` : `
                    <td>
                      <button class="btn btn-outline btn-sm" style="padding: 4px 8px; font-size:11px;" onclick="copyToClipboard('https://${app.link}')">Copy</button>
                    </td>
                  `}
                </tr>
              `).join('')}
              ${appsToRender.length === 0 ? `
                <tr>
                  <td colspan="10" style="text-align: center; color: var(--text-secondary); padding: 24px;">${state.searchQuery ? 'No matching company/application found.' : 'No applications added yet.'}</td>
                </tr>
              ` : ''}
            </tbody>
          </table>
        </div>
      </div>
      

    ` : `
      <div class="card" style="text-align: center; padding: 48px; color: var(--text-secondary);">
        <i class="ri-user-unfollow-line" style="font-size:48px; display:block; margin-bottom:16px;"></i>
        <h3>No candidates found</h3>
        <p style="font-size:13px; margin-top:8px;">You don't have any candidates assigned to you yet.</p>
      </div>
    `}
  `;
}

function changeActiveCandidate(id) {
  state.selectedCandidateId = id;
  updateHashFromState();
  renderView();
}

function copyCandidateSheetLink() {
  const shareableUrl = `${window.location.origin}${window.location.pathname}?candId=${state.selectedCandidateId}`;
  copyToClipboard(shareableUrl);
}

function setupSheetCellListeners() {
  // Bind live updates to editable cells
  const editables = document.querySelectorAll(".cell-edit");
  editables.forEach(el => {
    el.addEventListener("change", (e) => {
      const tr = e.target.closest("tr");
      const srNo = tr.getAttribute("data-srno");
      const field = e.target.getAttribute("data-field");
      const val = e.target.value;
      updateApplicationCell(state.selectedCandidateId, srNo, field, val);
      if (field === "type") {
        e.target.classList.toggle("apply-type-easy", val === "Easy Apply");
        e.target.classList.toggle("apply-type-external", val === "External Application");
      }
      showToast("Cell updated!");
    });
    
    // Bind excel paste handler to inputs
    el.addEventListener("paste", handleTablePaste);
  });
}

// 5. Interview Calendar View
function renderCalendarView() {
  const db = getDb();
  
  // Extract all calendar events (interviews)
  let events = [];
  db.candidates.forEach(c => {
    c.applications.forEach(app => {
      if (app.interviewDate && app.interviewDate !== "Pending") {
        events.push({
          candidateName: getDisplayName(c.name),
          company: app.company,
          role: app.role,
          dateStr: app.interviewDate, // e.g. "21 Jun, 11:30 AM"
          status: app.status
        });
      }
    });
  });
  
  // Simple June 2026 Calendar grid renderer
  // June 1st 2026 is a Monday
  const totalDays = 30;
  const days = [];
  
  for (let i = 1; i <= totalDays; i++) {
    const dateNum = i;
    // Find events matching this date (assume Jun 2026)
    const dayEvents = events.filter(e => {
      const matchPattern = `${dateNum} Jun`;
      return e.dateStr.toLowerCase().includes(matchPattern.toLowerCase());
    });
    
    days.push({ dayNum: dateNum, events: dayEvents });
  }
  
  return `
    <div class="calendar-view">
      <div class="calendar-header">
        <h3 class="calendar-month"><i class="ri-calendar-line"></i> June 2026</h3>
        <span style="font-size:12px; color: var(--text-secondary);">Interactive hiring timeline view</span>
      </div>
      
      <div class="calendar-grid">
        <div class="calendar-day-label">Mon</div>
        <div class="calendar-day-label">Tue</div>
        <div class="calendar-day-label">Wed</div>
        <div class="calendar-day-label">Thu</div>
        <div class="calendar-day-label">Fri</div>
        <div class="calendar-day-label">Sat</div>
        <div class="calendar-day-label">Sun</div>
        
        ${days.map(d => {
          const isToday = d.dayNum === 21; // Assume June 21 is today
          return `
            <div class="calendar-day" style="${isToday ? 'border-color: var(--primary); background-color: var(--primary-light);' : ''}">
              <div class="calendar-day-num" style="${isToday ? 'color: var(--primary); font-weight:700;' : ''}">${d.dayNum}</div>
              <div class="calendar-day-events">
                ${d.events.map(ev => `
                  <div class="calendar-event-dot ${ev.status === 'Today' ? 'calendar-event-today' : 'calendar-event-upcoming'}" 
                       title="${ev.candidateName} - ${ev.company}"
                       onclick="showToast('${ev.candidateName} interview with ${ev.company} at ${ev.dateStr}')">
                    ${ev.candidateName.split(' ')[0]}
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// 6. Settings View
function renderSettingsView() {
  const gdriveClientId = localStorage.getItem("recruit_crm_gdrive_client_id") || "";
  
  return `
    <div class="card" style="max-width: 600px; margin: 0 auto;">
      <div class="card-header">
        <div>
          <h3 class="card-title">Account Settings</h3>
          <span class="card-subtitle">Manage details of the logged in user</span>
        </div>
        ${state.currentUser.role === "tl" ? `
          <button type="button" class="btn btn-secondary btn-sm" onclick="updateTlDetails('${state.currentUser.id}')">
            <i class="ri-edit-line"></i> Edit My Details
          </button>
        ` : ''}
      </div>
      
      <div style="display:flex; flex-direction:column; gap:16px;">
        <div class="login-form-group">
          <label class="login-label">Name</label>
          <input type="text" class="login-input" value="${getDisplayName(state.currentUser.name)}" readonly>
        </div>
        <div class="login-form-group">
          <label class="login-label">Email Address</label>
          <input type="text" class="login-input" value="${state.currentUser.email}" readonly>
        </div>
        <div class="login-form-group">
          <label class="login-label">Account Role</label>
          <span class="tag tag-info" style="font-size:12px; margin-top:4px;">${state.currentUser.role.toUpperCase()}</span>
        </div>

        <!-- Google Drive Sync Integration -->
        <div class="cloud-settings-card">
          <h4 style="font-weight:700; font-size:14px; margin-bottom:12px;"><i class="ri-google-fill" style="color: var(--primary);"></i> Google Drive Sync Integration</h4>
          <p style="font-size:12px; color: var(--text-secondary); margin-bottom:16px;">Attach your personal Google Drive to backup your CRM database and store resumes candidate-wise & company-wise.</p>
          
          <div class="login-form-group" style="margin-bottom: 12px;">
            <label class="login-label">Google OAuth Client ID</label>
            <input type="text" id="settings-gdrive-client-id" class="login-input" value="${gdriveClientId}" placeholder="Enter Client ID for Web Apps...">
            <span style="font-size: 10px; color: var(--text-secondary); display: block; margin-top: 4px; line-height:1.4;">
              <i class="ri-information-line"></i> Generate in Google Cloud Console. Enable Google Drive API, configure OAuth Consent screen, and set Javascript Origin to current URL.
            </span>
          </div>
          
          <div style="margin-bottom: 12px; display:flex; flex-direction:column; gap:8px;">
            ${state.googleDriveConnected ? `
              <div class="gdrive-status-badge connected">
                <i class="ri-checkbox-circle-fill"></i> Connected to: ${state.googleDriveEmail}
              </div>
              <div>
                <button type="button" class="btn btn-outline btn-sm" onclick="disconnectGoogleDrive()" style="border-color: #fca5a5; color: #dc2626; display:inline-flex; align-items:center; gap:4px;"><i class="ri-logout-box-r-line"></i> Disconnect Drive</button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="syncDbToGoogleDrive()" style="display:inline-flex; align-items:center; gap:4px;"><i class="ri-refresh-line"></i> Backup Now</button>
              </div>
            ` : `
              <div class="gdrive-status-badge disconnected">
                <i class="ri-error-warning-line"></i> Not connected to Google Drive
              </div>
              <div>
                <button type="button" class="btn btn-primary btn-sm" onclick="connectGoogleDrive()" style="display:inline-flex; align-items:center; gap:4px;"><i class="ri-links-line"></i> Connect Google Drive</button>
              </div>
            `}
          </div>
        </div>

        <!-- Cloud Sync Configurations -->
        <div class="cloud-settings-card">
          <h4 style="font-weight:700; font-size:14px; margin-bottom:12px;"><i class="ri-cloud-line" style="color: var(--primary);"></i> Cloud Sync Configuration (Alternative)</h4>
          <p style="font-size:12px; color: var(--text-secondary); margin-bottom:16px;">Configure your JSON Bin URL and API Key for syncing candidates tracker state automatically to the cloud.</p>
          
          <form onsubmit="handleSaveCloudSettings(event)" style="display:flex; flex-direction:column; gap:12px;">
            <div class="login-form-group" style="margin-bottom: 0;">
              <label class="login-label">JSONBin Bin URL</label>
              <input type="text" id="settings-cloud-url" class="login-input" value="${CLOUD_SYNC_CONFIG.binUrl}" placeholder="e.g. https://api.jsonbin.io/v3/b/123456...">
            </div>
            
            <div class="login-form-group" style="margin-bottom: 0;">
              <label class="login-label">JSONBin Master Key (API Key)</label>
              <input type="password" id="settings-cloud-key" class="login-input" value="${CLOUD_SYNC_CONFIG.apiKey}" placeholder="Enter API secret/key...">
            </div>
            
            <div style="display: flex; gap: 10px; margin-top: 6px;">
              <button type="submit" class="btn btn-primary btn-sm" style="flex: 1;"><i class="ri-save-line"></i> Save Cloud Config</button>
              ${CLOUD_SYNC_CONFIG.binUrl ? `
                <button type="button" class="btn btn-outline btn-sm" onclick="triggerManualSync()" style="flex: 1;"><i class="ri-refresh-line"></i> Sync Now</button>
              ` : ''}
            </div>
          </form>
        </div>
        
        <div style="border-top:1px solid var(--border-color); padding-top:20px; margin-top:10px;">
          <h4 style="font-weight:700; font-size:14px; margin-bottom:12px;">Database Operations</h4>
          <p style="font-size:12px; color: var(--text-secondary); margin-bottom:16px;">Reset the database back to initial seed data. This will erase all added team leaders, members, and custom row modifications.</p>
          <button class="btn btn-outline" style="border-color: #fca5a5; color: #dc2626;" onclick="resetDatabase()"><i class="ri-delete-bin-line"></i> Reset Database to Default</button>
        </div>
      </div>
    </div>
  `;
}

function handleSaveCloudSettings(event) {
  event.preventDefault();
  const url = document.getElementById("settings-cloud-url").value.trim();
  const key = document.getElementById("settings-cloud-key").value.trim();
  
  if (url) {
    localStorage.setItem("recruit_crm_cloud_bin_url", url);
  } else {
    localStorage.removeItem("recruit_crm_cloud_bin_url");
  }
  
  if (key) {
    localStorage.setItem("recruit_crm_cloud_api_key", key);
  } else {
    localStorage.removeItem("recruit_crm_cloud_api_key");
  }
  
  showToast("Cloud sync configurations updated!");
  renderApp();
}

async function triggerManualSync() {
  const db = getDb();
  showToast("Forcing cloud synchronization...");
  await pushToCloud(db);
  await pullFromCloud();
  showToast("Synchronization complete!");
}


function toggleTlPasswordDisplay() {
  const display = document.getElementById("tl-pass-display");
  const icon = document.getElementById("tl-pass-toggle-icon");
  if (!display || !icon) return;
  
  const actualPassword = display.getAttribute("data-password");
  if (display.innerText === "••••••••") {
    display.innerText = actualPassword;
    icon.className = "ri-eye-line";
  } else {
    display.innerText = "••••••••";
    icon.className = "ri-eye-off-line";
  }
}

function handleAddRowInline() {
  const db = getDb();
  const candidate = db.candidates.find(c => c.id === state.selectedCandidateId);
  if (!candidate) return;
  
  const newRow = {
    srNo: candidate.applications.length + 1,
    company: '',
    role: '',
    date: getNewYorkDateTime().date,
    type: 'Easy Apply',
    link: '',
    interviewDate: 'Pending',
    status: 'Pending'
  };
  stampApplicationHandler(candidate, newRow, true);
  
  candidate.applications.push(newRow);
  saveDb(db);
  renderView();
  showToast("Row added inline!");
  
  // Focus on the newly added row's first input cell
  setTimeout(() => {
    const lastTr = document.querySelector(`.candidate-grid-table tbody tr[data-srno="${newRow.srNo}"]`);
    if (lastTr) {
      const firstInput = lastTr.querySelector('input');
      if (firstInput) firstInput.focus();
    }
  }, 50);
}

function handleDeleteRow(srNo) {
  if (!confirm(`Are you sure you want to delete row ${srNo}?`)) return;
  const db = getDb();
  const candidate = db.candidates.find(c => c.id === state.selectedCandidateId);
  if (!candidate) return;
  
  // Filter out the row
  candidate.applications = candidate.applications.filter(a => a.srNo !== parseInt(srNo));
  
  // Re-index srNo
  candidate.applications.forEach((app, index) => {
    app.srNo = index + 1;
  });
  
  saveDb(db);
  renderView();
  showToast("Row deleted!");
}

function handleTablePaste(e) {
  const clipboardData = e.clipboardData || window.clipboardData;
  if (!clipboardData) return;
  
  const pastedText = clipboardData.getData('text');
  if (!pastedText) return;
  
  // Parse TSV (Tab Separated Values) from Excel
  const rows = pastedText.split(/\r?\n/).map(row => row.split('\t'));
  if (rows.length === 0 || (rows.length === 1 && rows[0].length === 1 && rows[0][0] === '')) return;
  
  e.preventDefault(); // Stop default paste
  
  const target = e.target;
  const currentTr = target.closest('tr');
  if (!currentTr) return;
  
  const startSrNo = parseInt(currentTr.getAttribute('data-srno'));
  const startField = target.getAttribute('data-field');
  
  const db = getDb();
  const candInDb = db.candidates.find(c => c.id === state.selectedCandidateId);
  if (!candInDb) return;
  
  // Define fields mapping based on HTML column layout
  const fields = ['company', 'role', 'date', 'type', 'link', 'interviewDate'];
  const startColIndex = fields.indexOf(startField);
  if (startColIndex === -1) return;
  
  // Loop through pasted rows and columns
  rows.forEach((rowCells, rIdx) => {
    // Skip empty trailing rows
    if (rowCells.length === 1 && rowCells[0] === '') return;
    
    const targetSrNo = startSrNo + rIdx;
    let appRow = candInDb.applications.find(a => a.srNo === targetSrNo);
    
    // If row doesn't exist in the database, automatically insert it!
    if (!appRow) {
      appRow = {
        srNo: targetSrNo,
        company: '',
        role: '',
        date: getNewYorkDateTime().date,
        type: 'Easy Apply',
        link: '',
        interviewDate: 'Pending',
        status: 'Pending'
      };
      stampApplicationHandler(candInDb, appRow, true);
      candInDb.applications.push(appRow);
    }
    
    rowCells.forEach((cellVal, cIdx) => {
      const targetColIndex = startColIndex + cIdx;
      if (targetColIndex < fields.length) {
        const fieldName = fields[targetColIndex];
        let cleanedVal = cellVal.trim();
        
        // Normalize Apply Type if needed
        if (fieldName === 'type') {
          if (cleanedVal.toLowerCase().includes('easy')) {
            cleanedVal = 'Easy Apply';
          } else if (cleanedVal.toLowerCase().includes('external') || cleanedVal.toLowerCase().includes('apply')) {
            cleanedVal = 'External Application';
          } else {
            cleanedVal = 'Easy Apply';
          }
        }
        
        appRow[fieldName] = cleanedVal;
        stampApplicationHandler(candInDb, appRow, state.currentUser && state.currentUser.role === "member");
        
        // Auto-update status if interviewDate changes
        if (fieldName === 'interviewDate') {
          if (cleanedVal.toLowerCase().includes('today') || cleanedVal.toLowerCase().includes('21 jun')) {
            appRow.status = 'Today';
          } else if (cleanedVal.toLowerCase().includes('pending') || cleanedVal === '') {
            appRow.status = 'Pending';
          } else {
            appRow.status = 'Upcoming';
          }
        }
      }
    });
  });
  
  saveDb(db);
  renderView(); // Re-render spreadsheet to display updated values
  showToast(`Successfully pasted ${rows.length} rows of Excel details!`);
}

function renderMemberSelectionView() {
  const container = document.getElementById("view-container");
  if (!container) return;
  
  const db = getDb();
  const candidates = db.candidates;
  
  container.innerHTML = `
    <div style="display: flex; justify-content: center; align-items: center; padding: 40px 0; min-height: calc(100vh - var(--header-height) - 100px);">
      <div class="login-card" style="box-shadow: var(--shadow-md); border: 1px solid var(--border-color); max-width: 500px; width: 100%;">
        <div class="login-card-header">
          <h2 class="login-card-title" style="font-size: 22px;">Candidate Selection</h2>
          <div class="login-card-subtitle">Choose candidate and request TL Authorization to open candidate sheet</div>
        </div>
        
        <form onsubmit="handleTlAuthorization(event)">
          <div class="login-form-group">
            <label class="login-label">Select Candidate</label>
            <select id="auth-candidate-select" class="login-input" style="padding: 10px 12px; height:42px;" required>
              ${candidates.map(c => {
                const onlineDot = isCandidateOnline(c) ? "🟢 " : "";
                return `<option value="${c.id}" ${c.id === state.selectedCandidateId ? 'selected' : ''}>${onlineDot}${getDisplayName(c.name)}</option>`;
              }).join('')}
            </select>
          </div>
          
          <div style="margin: 24px 0 16px 0; border-top: 1px solid var(--border-color); padding-top: 16px;">
            <h4 style="font-weight: 700; font-size: 13px; color: var(--text-primary); margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
              <i class="ri-lock-2-line" style="color: var(--primary);"></i> Team Leader Authorization
            </h4>
            
            <div class="login-form-group">
              <label class="login-label">Team Leader ID</label>
              <input type="text" id="auth-tl-id" class="login-input" required placeholder="e.g. TL001">
            </div>
            
            <div class="login-form-group" style="margin-bottom:0;">
              <label class="login-label">Password</label>
              <input type="password" id="auth-tl-password" class="login-input" required placeholder="••••••••">
            </div>
          </div>
          
          <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 24px;">
            <i class="ri-key-2-line"></i> Verify & Open Sheet
          </button>

          <button type="button" class="btn btn-outline" onclick="handleLogout()" style="width: 100%; margin-top: 12px; gap: 8px;">
            <i class="ri-logout-box-r-line"></i> Log Out / Switch User
          </button>
        </form>
      </div>
    </div>
  `;
}

function handleTlAuthorization(event) {
  event.preventDefault();
  const db = getDb();
  
  const candId = document.getElementById("auth-candidate-select").value;
  const tlUserId = document.getElementById("auth-tl-id").value;
  const tlPassword = document.getElementById("auth-tl-password").value;
  
  const tl = db.teamLeaders.find(t => t.userId === tlUserId && t.password === tlPassword);
  if (!tl) {
    showToast("Invalid Team Leader ID or Password!", "error");
    return;
  }
  
  const candidate = db.candidates.find(c => c.id === candId);
  if (!candidate) {
    showToast("Candidate not found!", "error");
    return;
  }
  
  // Check if candidate belongs to this TL's team
  if (candidate.ownerTlId === tl.id) {
    // Authorized directly!
    state.isTlAuthorized = true;
    state.authorizedTlId = tl.id;
    state.selectedCandidateId = candId;
    state.currentView = "candidates-sheet";
    renderApp();
    showToast(`Unlocked successfully! Authorized by TL ${getDisplayName(tl.name)}.`);
  } else {
    // Candidate belongs to another team!
    // Show a confirmation dialog to add/transfer candidate to this team
    const otherTl = db.teamLeaders.find(t => t.id === candidate.ownerTlId);
    const otherTlName = otherTl ? getDisplayName(otherTl.name) : 'another team';
    
    if (confirm(`This candidate currently belongs to ${otherTlName}. Do you want TL ${getDisplayName(tl.name)} to add/transfer this candidate to their team?`)) {
      const oldMemberId = candidate.ownerMemberId;
      const oldTlId = candidate.ownerTlId;
      
      // Transfer ownership to current TL and Member
      candidate.ownerTlId = tl.id;
      candidate.ownerMemberId = state.currentUser.id;
      
      // Decrement counts on old owners
      if (oldMemberId) {
        const oldMember = db.teamMembers.find(m => m.id === oldMemberId);
        if (oldMember && oldMember.candidateCount > 0) oldMember.candidateCount -= 1;
      }
      if (oldTlId) {
        const oldTl = db.teamLeaders.find(t => t.id === oldTlId);
        if (oldTl && oldTl.candidatesCount > 0) oldTl.candidatesCount -= 1;
      }
      
      // Increment counts on new owners
      const currentMember = db.teamMembers.find(m => m.id === state.currentUser.id);
      if (currentMember) currentMember.candidateCount += 1;
      tl.candidatesCount += 1;
      
      saveDb(db);
      
      state.isTlAuthorized = true;
      state.authorizedTlId = tl.id;
      state.selectedCandidateId = candId;
      state.currentView = "candidates-sheet";
      renderApp();
      showToast(`Candidate transferred to TL ${getDisplayName(tl.name)} and unlocked!`);
    }
  }
}

function lockMemberSheet() {
  state.isTlAuthorized = false;
  state.authorizedTlId = null;
  renderApp();
  showToast("Sheet locked successfully!");
}

function resetDatabase() {
  if (confirm("Are you sure you want to reset the database? This will clear all changes.")) {
    saveDb(SEED_DATA);
    showToast("Database reset to initial design layouts!");
    renderApp();
  }
}

// --- Initialize App ---
document.addEventListener("DOMContentLoaded", () => {
  // If no active sessionStorage exists, default to admin login screen
  const session = sessionStorage.getItem("recruit_crm_session");
  if (!session) {
    state.currentUser = null;
    state.loginType = "admin";
  }

  const app = document.getElementById("app");
  if (app) {
    app.innerHTML = renderSplashScreen();
  }

  // Load Google Drive session and auth client
  loadGoogleDriveSession();
  initGoogleDriveAuth();

  // Check if a specific candidate query parameter is in URL (for sharing links!)
  const urlParams = new URLSearchParams(window.location.search);
  const candId = urlParams.get("candId");
  if (candId) {
    state.selectedCandidateId = candId;
    state.currentView = "candidates-sheet";
  }
  
  // Seed/Load database
  getDb();
  
  // Run app renderer after welcome animation
  setTimeout(() => {
    // Sync state from initial hash if present
    const { view, params } = getHashRoute();
    const validViews = ["dashboard", "team-leaders", "team-members", "candidates-sheet", "interviews-breakdown", "interview-calendar", "settings"];
    if (validViews.includes(view)) {
      state.currentView = view;
      if (view === "candidates-sheet" && params.candId) {
        state.selectedCandidateId = params.candId;
      }
    }
    
    // Register hash listener
    window.addEventListener("hashchange", handleHashChange);
    
    renderApp();
    pullFromCloud();
    if (state.googleDriveConnected) {
      syncDbToGoogleDrive();
    }
  }, 3600);
  
  setInterval(() => {
    updateNewYorkTimePanel();
  }, 1000);

  setInterval(() => {
    updateCandidateActivity();
    pullFromCloud();
    if (state.googleDriveConnected) {
      syncDbToGoogleDrive();
    }
  }, 10000);
});
