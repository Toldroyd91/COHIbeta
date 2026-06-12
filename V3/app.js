import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// === 1. FIREBASE CONFIGURATION ===
// NOTE: Paste your actual Firebase config over this placeholder block
const appConfig = {
    apiKey: "AIzaSyD-QrqKxjes9f1TgyJOffiQzSMRncf84L0",
    projectId: "cohi-survey-engine"
};
const app = initializeApp(appConfig);
const db = getFirestore(app);

// === 2. UI ROUTING ENGINE ===
const views = {
    login: document.getElementById('view-login'),
    customer: document.getElementById('view-customer'),
    designer: document.getElementById('view-designer'),
    admin: document.getElementById('view-admin'),
    nav: document.getElementById('global-nav')
};

function switchView(targetView, roleLabel = "") {
    // Hide all views
    Object.values(views).forEach(v => v.classList.add('hidden-view'));
    
    // Show target view
    views[targetView].classList.remove('hidden-view');
    
    // Handle Global Nav visibility
    if (targetView === 'admin' || targetView === 'designer') {
        views.nav.classList.remove('hidden-view');
        document.getElementById('nav-role-badge').innerText = roleLabel;
        
        if(targetView === 'admin') {
            document.getElementById('brand-selector').classList.remove('hidden');
        } else {
            document.getElementById('brand-selector').classList.add('hidden');
        }
    }
}

// === 3. AUTHENTICATION LOGIC ===
document.getElementById('btn-login').addEventListener('click', async () => {
    const id = document.getElementById('loginId').value.trim().toLowerCase();
    const pin = document.getElementById('loginPin').value.trim();
    const err = document.getElementById('login-error');
    
    err.classList.add('hidden');

    // Admin Access
    if (id === 'admin' && pin === 'master123') {
        switchView('admin', 'GLOBAL ADMIN COMMAND');
        initAdminDashboard();
        return;
    }

    // Designer Access
    if (id === 'designer' && pin === 'survey123') {
        switchView('designer', 'DESIGNER PORTAL');
        initDesignerDashboard('Tom'); 
        return;
    }

    // Customer Vault Lookup (Postcode + Customer Number)
    try {
        const q = query(collection(db, "surveys"), 
            where("data.inputs.postCode", "==", id.toUpperCase()), 
            where("data.inputs.clientNum", "==", pin)
        );
        const snap = await getDocs(q);

        if (!snap.empty) {
            switchView('customer');
            initCustomerVault(snap.docs); 
        } else {
            err.innerText = "Access Denied. Please check your details.";
            err.classList.remove('hidden');
        }
    } catch (error) {
        console.error("Login Error:", error);
        err.innerText = "Database connection failed. Check your Firebase config.";
        err.classList.remove('hidden');
    }
});

document.getElementById('btn-logout').addEventListener('click', () => {
    document.getElementById('loginId').value = '';
    document.getElementById('loginPin').value = '';
    switchView('login');
});

// === 4. DASHBOARD INITIALIZERS ===
function initAdminDashboard() {
    console.log("Loading Admin Global Data...");
}

function initDesignerDashboard(designerName) {
    console.log(`Loading Pipeline for ${designerName}...`);
}

function initCustomerVault(docs) {
    console.log(`Loading Vault with ${docs.length} active quotes...`);
    const clientName = docs[0].data().clientName || "Valued Client";
    document.getElementById('vault-client-name').innerText = clientName;
}