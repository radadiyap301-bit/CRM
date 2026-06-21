// Recruitment CRM Dashboard - Application Logic

// --- Database Initialization & State ---
const SEED_DATA = {
  teamLeaders: [
    { id: "TL-01", userId: "TL001", name: "Dhruv Mehta", email: "dhruv@company.com", password: "password123", membersCount: 6, candidatesCount: 620, permission: "Add candidates only" },
    { id: "TL-02", userId: "TL002", name: "Nisha Patel", email: "nisha@company.com", password: "password123", membersCount: 5, candidatesCount: 480, permission: "Add candidates only" },
    { id: "TL-03", userId: "TL003", name: "Ravi Sharma", email: "ravi@company.com", password: "password123", membersCount: 4, candidatesCount: 390, permission: "Add candidates only" },
    { id: "TL-04", userId: "TL004", name: "Priya Desai", email: "priya@company.com", password: "password123", membersCount: 7, candidatesCount: 560, permission: "Add candidates only" }
  ],
  teamMembers: [
    { id: "TM-01", name: "Karan Patel", email: "karan@company.com", password: "password123", candidateCount: 86, access: "View only", tlId: "TL-01" },
    { id: "TM-02", name: "Jignesh Solanki", email: "jignesh@company.com", password: "password123", candidateCount: 73, access: "View only", tlId: "TL-01" },
    { id: "TM-03", name: "Mansi Shah", email: "mansi@company.com", password: "password123", candidateCount: 58, access: "View only", tlId: "TL-01" },
    { id: "TM-04", name: "Neel Desai", email: "neel@company.com", password: "password123", candidateCount: 42, access: "View only", tlId: "TL-01" },
    { id: "TM-05", name: "Rakesh Verma", email: "rakesh@company.com", password: "password123", candidateCount: 95, access: "View only", tlId: "TL-02" },
    { id: "TM-06", name: "Hina Vyas", email: "hina@company.com", password: "password123", candidateCount: 64, access: "View only", tlId: "TL-02" }
  ],
  candidates: [
    {
      id: "C-01",
      name: "Amit Patel",
      email: "amit@gmail.com",
      password: "password123",
      ownerTlId: "TL-01",
      ownerMemberId: "TM-01",
      applications: [
        { srNo: 1, company: "TCS", role: "US IT Recruiter", date: "2026-06-21", type: "Easy Apply", link: "linkedin.com/jobs/123", interviewDate: "21 Jun, 11:30 AM", status: "Today" },
        { srNo: 2, company: "Wipro", role: "Talent Sourcer", date: "2026-06-21", type: "External Application", link: "wipro.com/careers", interviewDate: "22 Jun, 02:00 PM", status: "Upcoming" },
        { srNo: 3, company: "Infosys", role: "HR Executive", date: "2026-06-21", type: "Easy Apply", link: "linkedin.com/jobs/456", interviewDate: "Pending", status: "Pending" },
        { srNo: 4, company: "Accelius Global", role: "BDE", date: "2026-06-22", type: "External Application", link: "company.com/apply", interviewDate: "24 Jun, 04:00 PM", status: "Upcoming" },
        { srNo: 5, company: "Aptus Pharma", role: "QC / Marketing", date: "2026-06-22", type: "Easy Apply", link: "linkedin.com/jobs/789", interviewDate: "Pending", status: "Pending" }
      ]
    },
    {
      id: "C-02",
      name: "Rahul Shah",
      email: "rahul@gmail.com",
      password: "password123",
      ownerTlId: "TL-01",
      ownerMemberId: "TM-01",
      applications: [
        { srNo: 1, company: "Wipro", role: "Talent Sourcer", date: "2026-06-22", type: "Easy Apply", link: "wipro.com/careers", interviewDate: "22 Jun, 02:00 PM", status: "Upcoming" }
      ]
    },
    {
      id: "C-03",
      name: "Meera Joshi",
      email: "meera@gmail.com",
      password: "password123",
      ownerTlId: "TL-01",
      ownerMemberId: "TM-02",
      applications: [
        { srNo: 1, company: "Infosys", role: "HR Executive", date: "2026-06-23", type: "Easy Apply", link: "linkedin.com/jobs/456", interviewDate: "23 Jun, 10:00 AM", status: "Upcoming" }
      ]
    }
  ]
};

// State Object
let state = {
  currentUser: null, // Stores logged in user info
  currentView: "dashboard", // Current active view
  selectedTlId: null, // For TL Details popover
  selectedCandidateId: "C-01", // Active candidate in candidates sheet
  searchQuery: "",
  loginType: "admin", // 'admin' or 'tl' or 'member'
  isTlAuthorized: false, // For Member view authorization
  authorizedTlId: null // Id of TL who authorized
};

// --- Helper Functions ---
function getDb() {
  const db = localStorage.getItem("recruit_crm_db");
  if (!db) {
    localStorage.setItem("recruit_crm_db", JSON.stringify(SEED_DATA));
    return SEED_DATA;
  }
  return JSON.parse(db);
}

function saveDb(data) {
  localStorage.setItem("recruit_crm_db", JSON.stringify(data));
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
      showToast(`Welcome, ${tl.name}!`);
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
      showToast(`Welcome, ${member.name}!`);
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
      saveSession();
      renderApp();
      showToast(`Welcome, ${candidate.name}!`);
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
  localStorage.removeItem("recruit_crm_session");
  renderApp();
  showToast("Logged out successfully");
}

function saveSession() {
  localStorage.setItem("recruit_crm_session", JSON.stringify(state.currentUser));
}

function loadSession() {
  const session = localStorage.getItem("recruit_crm_session");
  if (session) {
    state.currentUser = JSON.parse(session);
  }
}

// --- Data Modification Handlers ---
function handleCreateTL(event) {
  event.preventDefault();
  const db = getDb();
  
  const name = document.getElementById("add-tl-name").value;
  const email = document.getElementById("add-tl-email").value;
  const userId = document.getElementById("add-tl-userid").value;
  const password = document.getElementById("add-tl-password").value;
  
  if (db.teamLeaders.some(t => t.userId === userId)) {
    showToast("Team Leader User ID already exists!", "error");
    return;
  }
  
  const newTl = {
    id: `TL-0${db.teamLeaders.length + 1}`,
    userId,
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
  
  const name = document.getElementById("add-member-name").value;
  const email = document.getElementById("add-member-email").value;
  const password = document.getElementById("add-member-password").value;
  const access = document.getElementById("add-member-access").value;
  
  // Decide which TL owns this member
  let tlId = "TL-01";
  if (state.currentUser.role === "tl") {
    tlId = state.currentUser.id;
  }
  
  const newMember = {
    id: `TM-0${db.teamMembers.length + 1}`,
    name,
    email,
    password,
    candidateCount: 0,
    access,
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

function handleCreateCandidate(event) {
  event.preventDefault();
  const db = getDb();
  
  const name = document.getElementById("add-cand-name").value;
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
        date: new Date().toISOString().split('T')[0],
        type: 'Easy Apply',
        link: '',
        interviewDate: 'Pending',
        status: 'Pending'
      };
      candidate.applications.push(row);
    } else {
      wasComplete = row.company.trim() !== '' && row.role.trim() !== '';
    }
    
    row[field] = val;
    
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
    
    const isCompleteNow = row.company.trim() !== '' && row.role.trim() !== '';
    
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

function handleSearch(event) {
  state.searchQuery = event.target.value;
  renderView(); // Re-renders the current view space without resetting sidebars
}

// --- Templating & Rendering ---

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
              <h1 class="header-title">RecruitCRM - Candidate Access</h1>
              <span class="header-subtitle">Select a candidate and authorize with your Team Leader to open the sheet</span>
            </div>
            <div class="header-actions">
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
      </div>
    </div>
  `;
  
  renderView();
}

function renderLoginScreen() {
  if (state.loginType === "admin") {
    // Admin login split layout
    return `
      <div class="login-page-container">
        <div class="login-left-panel">
          <div class="login-left-content">
            <div class="login-brand">Recruitment CRM</div>
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
                <input type="email" id="login-admin-email" class="login-input" required value="admin@crm.com" placeholder="admin@company.com">
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
        </div>
      </div>
    `;
  } else if (state.loginType === "tl") {
    // Team Lead Login layout
    return `
      <div class="login-center-layout">
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
      </div>
    `;
  } else if (state.loginType === "member") {
    // Team Member Login layout
    return `
      <div class="login-center-layout">
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
              <input type="email" id="login-member-email" class="login-input" required value="karan@company.com" placeholder="karan@company.com">
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
      </div>
    `;
  } else {
    // Candidate Login layout
    return `
      <div class="login-center-layout">
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
      </div>
    `;
  }
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
          <div class="sidebar-brand">
            <i class="ri-radar-line" style="color: var(--primary);"></i> RecruitCRM
          </div>
          <div class="sidebar-subtitle">Team hiring tracker</div>
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
        <div class="user-profile-card">
          <div class="user-avatar">${state.currentUser.name.charAt(0)}</div>
          <div class="user-info">
            <span class="user-name">${state.currentUser.name}</span>
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
  let subtitle = "All candidate entries, team tracking, interview dates and daily applications";
  
  if (state.currentView === "team-leaders") {
    title = "Team Leader Details";
    subtitle = "Add, view and manage team leaders with login details";
  } else if (state.currentView === "team-members") {
    title = "Team Members";
    subtitle = "Team leader can add members and assign candidate access";
  } else if (state.currentView === "candidates-sheet") {
    title = "Candidate Application Sheet";
    subtitle = "Excel-style job application tracking with view-only sharing and link copy";
  } else if (state.currentView === "interview-calendar") {
    title = "Interview Calendar";
    subtitle = "Track candidate interview schedules and timings";
  } else if (state.currentView === "settings") {
    title = "Settings";
    subtitle = "Customize configuration and reset profile details";
  }
  
  const showAddBtn = state.currentUser.role === 'admin' || (state.currentUser.role === 'tl' && state.currentView === 'team-members');
  
  const isMember = state.currentUser.role === 'member';
  const isCandidate = state.currentUser.role === 'candidate';
  const noSidebar = isMember || isCandidate;
  
  return `
    <div class="header">
      <div class="header-title-area">
        <h1 class="header-title">${title}</h1>
        <span class="header-subtitle">${subtitle}</span>
      </div>
      
      <div class="header-actions">
        <div class="search-bar">
          <i class="ri-search-line"></i>
          <input type="text" placeholder="Search candidate, company..." oninput="handleSearch(event)" value="${state.searchQuery}">
        </div>
        
        ${showAddBtn ? `
          <button class="btn btn-primary" onclick="triggerQuickAdd()"><i class="ri-add-line"></i> Add</button>
        ` : ''}
        
        ${noSidebar ? `
          <button class="btn-logout-header" onclick="handleLogout()">
            <i class="ri-logout-box-r-line"></i> Log Out
          </button>
        ` : ''}
        
        <div class="user-avatar" style="background-color: var(--primary-light); color: var(--primary); width: 34px; height: 34px; font-size:14px;">
          ${state.currentUser.name.charAt(0)}
        </div>
      </div>
    </div>
  `;
}

function switchView(view) {
  state.currentView = view;
  state.searchQuery = ""; // reset search
  state.selectedTlId = null; // hide TL details popup
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
    <option value="${m.id}">${m.name} (${m.email})</option>
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
    default:
      container.innerHTML = `<h3>View under construction</h3>`;
  }
}

// 1. Dashboard View
function renderDashboardView() {
  const db = getDb();
  
  // Calculate dynamic stats
  let totalCandidates = 0;
  db.teamLeaders.forEach(t => totalCandidates += t.candidatesCount);
  
  // Calculate today applications
  const todayAppsCount = 186; // Seeding dashboard values
  const interviewsCount = db.candidates.reduce((acc, c) => {
    return acc + c.applications.filter(a => a.status === "Today").length;
  }, 0) + 14; // baseline + db today entries
  
  // Filter interviews table
  let allApplications = [];
  db.candidates.forEach(c => {
    c.applications.forEach(app => {
      allApplications.push({
        candidateName: c.name,
        company: app.company,
        role: app.role,
        interviewDate: app.interviewDate,
        status: app.status
      });
    });
  });
  
  // Apply Search
  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    allApplications = allApplications.filter(app => 
      app.candidateName.toLowerCase().includes(q) || 
      app.company.toLowerCase().includes(q) || 
      app.role.toLowerCase().includes(q)
    );
  }
  
  // Get upcoming/today interviews
  const sortedInterviews = allApplications.filter(a => a.status === "Today" || a.status === "Upcoming");
  
  return `
    <!-- Top Row Cards -->
    <div class="stats-grid">
      <div class="card stats-card">
        <span class="stats-label">Total Candidates</span>
        <span class="stats-value">3,248</span>
        <div class="stats-footer">
          <span class="tag tag-success">+12.5%</span>
          <span style="color: var(--text-secondary);">active tracking</span>
        </div>
      </div>
      
      <div class="card stats-card">
        <span class="stats-label">Today Applications</span>
        <span class="stats-value">${todayAppsCount}</span>
        <div class="stats-footer">
          <span class="tag tag-info">+28 today</span>
          <span style="color: var(--text-secondary);">from last hour</span>
        </div>
      </div>
      
      <div class="card stats-card">
        <span class="stats-label">Interviews Today</span>
        <span class="stats-value">${interviewsCount}</span>
        <div class="stats-footer">
          <span class="tag tag-warning" style="cursor:pointer;" onclick="switchView('interview-calendar')">Schedule</span>
          <span style="color: var(--text-secondary);">scheduled slots</span>
        </div>
      </div>
      
      <div class="card stats-card">
        <span class="stats-label">Active Teams</span>
        <span class="stats-value">08</span>
        <div class="stats-footer">
          <span class="tag tag-purple">Team wise</span>
          <span style="color: var(--text-secondary);">hiring active</span>
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
          <div class="chart-bar-wrapper">
            <div class="chart-bar" style="height: 48%;" data-value="98"></div>
            <span class="chart-label">Mon</span>
          </div>
          <div class="chart-bar-wrapper">
            <div class="chart-bar" style="height: 68%;" data-value="134"></div>
            <span class="chart-label">Tue</span>
          </div>
          <div class="chart-bar-wrapper">
            <div class="chart-bar" style="height: 58%;" data-value="112"></div>
            <span class="chart-label">Wed</span>
          </div>
          <div class="chart-bar-wrapper">
            <div class="chart-bar" style="height: 85%;" data-value="168"></div>
            <span class="chart-label">Thu</span>
          </div>
          <div class="chart-bar-wrapper">
            <div class="chart-bar" style="height: 72%;" data-value="142"></div>
            <span class="chart-label">Fri</span>
          </div>
          <div class="chart-bar-wrapper">
            <div class="chart-bar" style="height: 98%;" data-value="186"></div>
            <span class="chart-label">Sat</span>
          </div>
          <div class="chart-bar-wrapper">
            <div class="chart-bar" style="height: 80%;" data-value="159"></div>
            <span class="chart-label">Sun</span>
          </div>
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
          <div class="team-track-item">
            <span class="team-name">Dhruv Team</span>
            <span class="team-apps">62 applications</span>
            <span class="tag tag-info">8 interviews</span>
          </div>
          <div class="team-track-item">
            <span class="team-name">Nisha Team</span>
            <span class="team-apps">48 applications</span>
            <span class="tag tag-info">5 interviews</span>
          </div>
          <div class="team-track-item">
            <span class="team-name">Ravi Team</span>
            <span class="team-apps">39 applications</span>
            <span class="tag tag-info">3 interviews</span>
          </div>
          <div class="team-track-item">
            <span class="team-name">Priya Team</span>
            <span class="team-apps">37 applications</span>
            <span class="tag tag-info">1 interview</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Bottom Grid (Interview Details Table) -->
    <div class="card">
      <div class="card-header">
        <div>
          <h3 class="card-title">Interview Date Details</h3>
          <span class="card-subtitle">Upcoming and today candidate interactions</span>
        </div>
      </div>
      
      <div class="table-responsive">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Candidate</th>
              <th>Company</th>
              <th>Role</th>
              <th>Interview Date & Time</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${sortedInterviews.length > 0 ? sortedInterviews.map(i => `
              <tr>
                <td style="font-weight: 600;">${i.candidateName}</td>
                <td>${i.company}</td>
                <td>${i.role}</td>
                <td>${i.interviewDate}</td>
                <td>
                  <span class="tag ${i.status === 'Today' ? 'tag-warning' : 'tag-info'}">${i.status}</span>
                </td>
              </tr>
            `).join('') : `
              <tr>
                <td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 24px;">No upcoming interviews found</td>
              </tr>
            `}
          </tbody>
        </table>
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
              <th>Team Leader</th>
              <th>Email</th>
              <th>Members</th>
              <th>Candidates</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${tls.map(t => `
              <tr>
                <td style="font-weight: 600; color: var(--text-secondary);">${t.id}</td>
                <td style="font-weight: 600;">${t.name}</td>
                <td>${t.email}</td>
                <td>${t.membersCount} Members</td>
                <td>${t.candidatesCount}</td>
                <td>
                  <button class="btn btn-secondary btn-sm" onclick="showTlDetails('${t.id}')">View Details</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- Render TL Popover if selected -->
    ${state.selectedTlId ? renderTlDetailsPopover() : ''}
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
          <span class="popover-val">${tl.name}</span>
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
      <button class="btn btn-primary btn-sm" style="width: 100%;" onclick="copyTlLogin('${tl.userId}', '${tl.password}')">
        <i class="ri-file-copy-line"></i> Copy Login
      </button>
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
    members = members.filter(m => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q));
  }
  
  const showAddBtn = state.currentUser.role === 'admin' || state.currentUser.role === 'tl';
  const displayTeamTitle = state.currentUser.role === "tl" ? `Members under ${state.currentUser.name} Team` : "All Team Members";
  
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
          <span class="card-subtitle">Manage candidate sheet assignment access</span>
        </div>
      </div>
      
      <div class="table-responsive">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Sr No</th>
              <th>Member Name</th>
              <th>Email</th>
              <th>Candidate Count</th>
              <th>Access</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${members.map((m, idx) => `
              <tr>
                <td style="font-weight: 600; color: var(--text-secondary);">${String(idx + 1).padStart(2, '0')}</td>
                <td style="font-weight: 600;">${m.name}</td>
                <td>${m.email}</td>
                <td>${m.candidateCount} Candidates</td>
                <td>
                  <span class="tag tag-success">${m.access}</span>
                </td>
                <td>
                  <button class="btn btn-outline btn-sm" onclick="openMemberSheet('${m.id}')">Open</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
    
    <div class="sheet-disclaimer-banner" style="background-color: var(--primary-light); border-color: #b3d4ff; color: var(--primary);">
      <i class="ri-information-line"></i>
      <span>Important: Candidate name is added only by Team Leader. Member can view sheet and copy links, but cannot edit protected candidate fields.</span>
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
  
  // If search query is present
  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    visibleCandidates = visibleCandidates.filter(c => c.name.toLowerCase().includes(q));
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
    
    // Check if we should append a placeholder row
    let shouldAddPlaceholder = false;
    if (canEdit) {
      if (appsToRender.length === 0) {
        shouldAddPlaceholder = true;
      } else {
        const lastApp = appsToRender[appsToRender.length - 1];
        // Only open the next row if the last row has both Company Name and Role filled
        if (lastApp.company.trim() !== '' && lastApp.role.trim() !== '') {
          shouldAddPlaceholder = true;
        }
      }
    }
    
    if (shouldAddPlaceholder) {
      appsToRender.push({
        srNo: appsToRender.length + 1,
        company: '',
        role: '',
        date: '',
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
              <span class="candidate-detail-value">${currentCandidate.name}</span>
            </div>
            <div>
              <span class="candidate-detail-label">Assigned Leader:</span>
              <span class="candidate-detail-value">${ownerTl ? ownerTl.name : 'Unassigned'}</span>
            </div>
            <div>
              <span class="candidate-detail-label">Assigned Executive:</span>
              <span class="candidate-detail-value">${ownerMember ? ownerMember.name : 'Unassigned'}</span>
            </div>
          </div>
          <span style="font-size:11px; color: var(--text-secondary); margin-top:4px;">
            View-only Mode. This sheet displays your active job applications tracked by our recruitment team.
          </span>
        </div>
        
        <!-- Excel-style applications table -->
        <div class="card" style="padding: 0;">
          <div class="table-responsive">
            <table class="custom-table candidate-grid-table">
              <thead>
                <tr>
                  <th style="width: 60px;">Sr No</th>
                  <th>Company Name</th>
                  <th>Role</th>
                  <th style="width: 130px;">Date</th>
                  <th style="width: 170px;">Apply Type</th>
                  <th>Link</th>
                  <th>Interview Date/Time</th>
                  <th style="width: 80px;">Action</th>
                </tr>
              </thead>
              <tbody>
                ${appsToRender.map(app => `
                  <tr data-srno="${app.srNo}">
                    <td style="font-weight:600; text-align:center; color: var(--text-muted);">${app.srNo}</td>
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
                    <td>
                      ${app.link ? `<button class="btn btn-outline btn-sm" style="padding: 4px 8px; font-size:11px;" onclick="copyToClipboard('https://${app.link}')">Copy</button>` : ''}
                    </td>
                  </tr>
                `).join('')}
                ${appsToRender.length === 0 ? `
                  <tr>
                    <td colspan="8" style="text-align: center; color: var(--text-secondary); padding: 24px;">No applications added yet.</td>
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
  
  return \`
    <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <!-- Candidate Selector Dropdown -->
      <div style="display:flex; align-items:center; gap:12px;">
        <label style="font-size:14px; font-weight:600; color: var(--text-secondary);">Select Candidate:</label>
        <select class="login-input" style="width:220px; padding: 6px 12px;" onchange="changeActiveCandidate(this.value)">
          ${visibleCandidates.map(c => `
            <option value="${c.id}" ${c.id === state.selectedCandidateId ? 'selected' : ''}>${c.name}</option>
          `).join('')}
        </select>
        
        ${canManageCandidates ? `
          <button class="btn btn-secondary btn-sm" onclick="triggerQuickAddCandidate()"><i class="ri-add-line"></i> Add Candidate</button>
        ` : ''}
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
            <span class="candidate-detail-value">${currentCandidate.name}</span>
          </div>
          <div>
            <span class="candidate-detail-label">Owner TL:</span>
            <span class="candidate-detail-value">${ownerTl ? ownerTl.name : 'Unassigned'}</span>
          </div>
          <div>
            <span class="candidate-detail-label">Member:</span>
            <span class="candidate-detail-value">${ownerMember ? ownerMember.name : 'Unassigned'}</span>
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
                <th>Company Name</th>
                <th>Role</th>
                <th style="width: 130px;">Date</th>
                <th style="width: 170px;">Apply Type</th>
                <th>Link</th>
                <th>Interview Date/Time</th>
                ${canEdit ? '<th style="width: 70px; text-align: center;">Action</th>' : '<th style="width: 80px;">Action</th>'}
              </tr>
            </thead>
            <tbody>
              ${appsToRender.map(app => `
                <tr data-srno="${app.srNo}">
                  <td style="font-weight:600; text-align:center; color: var(--text-muted);">${app.srNo}</td>
                  
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
                      <select class="cell-edit" data-field="type" style="padding: 4px 6px;">
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
                  <td colspan="8" style="text-align: center; color: var(--text-secondary); padding: 24px;">No applications added yet.</td>
                </tr>
              ` : ''}
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Bottom information sheets -->
      <div class="sheet-details-bottom-grid">
        <div class="info-box">
          <div class="info-box-title">Dropdown field rules</div>
          <div class="info-box-content">Apply Type dropdown toggle supports "Easy Apply" (green badge) and "External Application" (purple badge) configurations. Ensure type parameters align with application methods.</div>
        </div>
        <div class="info-box">
          <div class="info-box-title">Share Permission</div>
          <div class="info-box-content">Team Members can add job application rows, paste spreadsheet data, and edit row details. Candidate profile name and assignments are managed only by Team Leader / Admin.</div>
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
          candidateName: c.name,
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
  return `
    <div class="card" style="max-width: 600px; margin: 0 auto;">
      <div class="card-header">
        <div>
          <h3 class="card-title">Account Settings</h3>
          <span class="card-subtitle">Manage details of the logged in user</span>
        </div>
      </div>
      
      <div style="display:flex; flex-direction:column; gap:16px;">
        <div class="login-form-group">
          <label class="login-label">Name</label>
          <input type="text" class="login-input" value="${state.currentUser.name}" readonly style="background-color:#f1f5f9;">
        </div>
        <div class="login-form-group">
          <label class="login-label">Email Address</label>
          <input type="text" class="login-input" value="${state.currentUser.email}" readonly style="background-color:#f1f5f9;">
        </div>
        <div class="login-form-group">
          <label class="login-label">Account Role</label>
          <span class="tag tag-info" style="font-size:12px; margin-top:4px;">${state.currentUser.role.toUpperCase()}</span>
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
    date: new Date().toISOString().split('T')[0],
    type: 'Easy Apply',
    link: '',
    interviewDate: 'Pending',
    status: 'Pending'
  };
  
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
        date: new Date().toISOString().split('T')[0],
        type: 'Easy Apply',
        link: '',
        interviewDate: 'Pending',
        status: 'Pending'
      };
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
    <div class="login-center-layout" style="min-height: auto; padding: 40px 0; background: transparent;">
      <div class="login-card" style="box-shadow: var(--shadow-md); border: 1px solid var(--border-color); max-width: 500px;">
        <div class="login-card-header">
          <h2 class="login-card-title" style="font-size: 22px;">Candidate Selection</h2>
          <div class="login-card-subtitle">Choose candidate and request TL Authorization to open candidate sheet</div>
        </div>
        
        <form onsubmit="handleTlAuthorization(event)">
          <div class="login-form-group">
            <label class="login-label">Select Candidate</label>
            <select id="auth-candidate-select" class="login-input" style="padding: 10px 12px; height:42px;" required>
              ${candidates.map(c => `
                <option value="${c.id}" ${c.id === state.selectedCandidateId ? 'selected' : ''}>${c.name}</option>
              `).join('')}
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
    showToast(`Unlocked successfully! Authorized by TL ${tl.name}.`);
  } else {
    // Candidate belongs to another team!
    // Show a confirmation dialog to add/transfer candidate to this team
    const otherTl = db.teamLeaders.find(t => t.id === candidate.ownerTlId);
    const otherTlName = otherTl ? otherTl.name : 'another team';
    
    if (confirm(`This candidate currently belongs to ${otherTlName}. Do you want TL ${tl.name} to add/transfer this candidate to their team?`)) {
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
      showToast(`Candidate transferred to TL ${tl.name} and unlocked!`);
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
    localStorage.removeItem("recruit_crm_db");
    getDb();
    showToast("Database reset to initial design layouts!");
    renderApp();
  }
}

// --- Initialize App ---
document.addEventListener("DOMContentLoaded", () => {
  // Check if a specific candidate query parameter is in URL (for sharing links!)
  const urlParams = new URLSearchParams(window.location.search);
  const candId = urlParams.get("candId");
  if (candId) {
    state.selectedCandidateId = candId;
    state.currentView = "candidates-sheet";
  }
  
  // Seed/Load database
  getDb();
  
  // Run app renderer
  renderApp();
});
