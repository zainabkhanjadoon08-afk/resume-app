// ===== Global State =====
let currentUser = null;
let users = JSON.parse(localStorage.getItem('taxFilerUsers')) || [];
let filings = JSON.parse(localStorage.getItem('taxFilerFilings')) || [];

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    updateNavigation();
});

// ===== Navigation =====
function showPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Show selected page
    const targetPage = document.getElementById('page-' + pageName);
    if (targetPage) {
        targetPage.classList.add('active');
    }

    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === pageName) {
            link.classList.add('active');
        }
    });

    // Close mobile menu
    document.getElementById('navLinks').classList.remove('show');

    // Scroll to top
    window.scrollTo(0, 0);

    // Page-specific logic
    if (pageName === 'dashboard') {
        loadDashboard();
    }
}

function toggleMenu() {
    document.getElementById('navLinks').classList.toggle('show');
}

// ===== Authentication =====
function checkAuth() {
    const savedUser = localStorage.getItem('taxFilerCurrentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
    }
}

function updateNavigation() {
    const navAuth = document.getElementById('navAuth');
    const navUser = document.getElementById('navUser');

    if (currentUser) {
        navAuth.style.display = 'none';
        navUser.style.display = 'flex';
        document.getElementById('userNameDisplay').textContent = currentUser.name;
    } else {
        navAuth.style.display = 'flex';
        navUser.style.display = 'none';
    }
}

function register(event) {
    event.preventDefault();

    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim().toLowerCase();
    const cnic = document.getElementById('regCnic').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;

    // Validation
    if (password !== confirmPassword) {
        showToast('پاس ورڈ مماثل نہیں ہے', 'error');
        return;
    }

    if (password.length < 8) {
        showToast('پاس ورڈ کم از کم 8 حروف کا ہونا چاہیے', 'error');
        return;
    }

    // Check if user already exists
    if (users.find(u => u.email === email)) {
        showToast('یہ ای میل پہلے سے رجسٹرڈ ہے', 'error');
        return;
    }

    if (users.find(u => u.cnic === cnic)) {
        showToast('یہ CNIC پہلے سے رجسٹرڈ ہے', 'error');
        return;
    }

    // Create new user
    const newUser = {
        id: Date.now().toString(),
        name,
        email,
        cnic,
        phone,
        password,
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem('taxFilerUsers', JSON.stringify(users));

    // Auto login
    currentUser = newUser;
    localStorage.setItem('taxFilerCurrentUser', JSON.stringify(currentUser));

    updateNavigation();
    showToast('رجسٹریشن کامیاب! خوش آمدید', 'success');
    showPage('dashboard');

    // Clear form
    event.target.reset();
}

function login(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;

    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        currentUser = user;
        localStorage.setItem('taxFilerCurrentUser', JSON.stringify(currentUser));
        updateNavigation();
        showToast('لاگ ان کامیاب! خوش آمدید', 'success');
        showPage('dashboard');
        event.target.reset();
    } else {
        showToast('ای میل یا پاس ورڈ غلط ہے', 'error');
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('taxFilerCurrentUser');
    updateNavigation();
    showToast('لاگ آؤٹ کامیاب', 'success');
    showPage('home');
}

// ===== Dashboard =====
function loadDashboard() {
    if (!currentUser) {
        showPage('login');
        return;
    }

    document.getElementById('dashboardUserName').textContent = currentUser.name;
    document.getElementById('dashName').textContent = currentUser.name;
    document.getElementById('dashCnic').textContent = currentUser.cnic;
    document.getElementById('dashEmail').textContent = currentUser.email;
    document.getElementById('dashPhone').textContent = currentUser.phone;

    // Load tax history
    const userFilings = filings.filter(f => f.userId === currentUser.id);
    const historyContainer = document.getElementById('taxHistory');

    if (userFilings.length === 0) {
        historyContainer.innerHTML = '<p class="no-data">ابھی تک کوئی ٹیکس فائل نہیں کی گئی</p>';
    } else {
        historyContainer.innerHTML = userFilings.map(f => `
            <div class="info-item">
                <span>${f.year} - ${getFilingTypeName(f.type)}</span>
                <span>Rs. ${formatNumber(f.totalTax)}</span>
            </div>
        `).join('');
    }
}

function getFilingTypeName(type) {
    const types = {
        'salary': 'تنخواہ',
        'business': 'کاروبار',
        'freelance': 'فری لانس',
        'other': 'دیگر'
    };
    return types[type] || type;
}

// ===== Tax Filing =====
function calculateFilingTax() {
    const basicSalary = parseFloat(document.getElementById('basicSalary').value) || 0;
    const allowances = parseFloat(document.getElementById('allowances').value) || 0;
    const bonus = parseFloat(document.getElementById('bonus').value) || 0;
    const otherIncome = parseFloat(document.getElementById('otherIncome').value) || 0;

    const zakat = parseFloat(document.getElementById('zakat').value) || 0;
    const charity = parseFloat(document.getElementById('charity').value) || 0;
    const insurance = parseFloat(document.getElementById('insurance').value) || 0;
    const otherDeductions = parseFloat(document.getElementById('otherDeductions').value) || 0;

    const totalIncome = basicSalary + allowances + bonus + otherIncome;
    const totalDeductions = zakat + charity + insurance + otherDeductions;
    const taxableIncome = Math.max(0, totalIncome - totalDeductions);
    const totalTax = calculateTaxAmount(taxableIncome);

    document.getElementById('filingTotalIncome').textContent = 'Rs. ' + formatNumber(totalIncome);
    document.getElementById('filingTotalDeductions').textContent = 'Rs. ' + formatNumber(totalDeductions);
    document.getElementById('filingTaxableIncome').textContent = 'Rs. ' + formatNumber(taxableIncome);
    document.getElementById('filingTotalTax').textContent = 'Rs. ' + formatNumber(totalTax);
}

function submitFiling(event) {
    event.preventDefault();

    if (!currentUser) {
        showToast('براہ کرم پہلے لاگ ان کریں', 'error');
        showPage('login');
        return;
    }

    const filing = {
        id: Date.now().toString(),
        userId: currentUser.id,
        year: document.getElementById('filingYear').value,
        type: document.getElementById('filingType').value,
        basicSalary: parseFloat(document.getElementById('basicSalary').value) || 0,
        allowances: parseFloat(document.getElementById('allowances').value) || 0,
        bonus: parseFloat(document.getElementById('bonus').value) || 0,
        otherIncome: parseFloat(document.getElementById('otherIncome').value) || 0,
        zakat: parseFloat(document.getElementById('zakat').value) || 0,
        charity: parseFloat(document.getElementById('charity').value) || 0,
        insurance: parseFloat(document.getElementById('insurance').value) || 0,
        otherDeductions: parseFloat(document.getElementById('otherDeductions').value) || 0,
        totalIncome: parseFloat(document.getElementById('filingTotalIncome').textContent.replace(/[^0-9.-]+/g, '')) || 0,
        totalDeductions: parseFloat(document.getElementById('filingTotalDeductions').textContent.replace(/[^0-9.-]+/g, '')) || 0,
        taxableIncome: parseFloat(document.getElementById('filingTaxableIncome').textContent.replace(/[^0-9.-]+/g, '')) || 0,
        totalTax: parseFloat(document.getElementById('filingTotalTax').textContent.replace(/[^0-9.-]+/g, '')) || 0,
        submittedAt: new Date().toISOString()
    };

    filings.push(filing);
    localStorage.setItem('taxFilerFilings', JSON.stringify(filings));

    showToast('ٹیکس فائل کامیابی سے جمع ہو گئی', 'success');
    showPage('dashboard');
}

// ===== Tax Calculator =====
function calculateTax() {
    const annualIncome = parseFloat(document.getElementById('annualIncome').value) || 0;
    const deductions = parseFloat(document.getElementById('deductions').value) || 0;

    const taxableIncome = Math.max(0, annualIncome - deductions);
    const totalTax = calculateTaxAmount(taxableIncome);
    const monthlyTax = totalTax / 12;

    document.getElementById('totalIncome').textContent = 'Rs. ' + formatNumber(annualIncome);
    document.getElementById('totalDeductions').textContent = 'Rs. ' + formatNumber(deductions);
    document.getElementById('taxableIncome').textContent = 'Rs. ' + formatNumber(taxableIncome);
    document.getElementById('totalTax').textContent = 'Rs. ' + formatNumber(totalTax);
    document.getElementById('monthlyTax').textContent = 'Rs. ' + formatNumber(monthlyTax);
}

// ===== Tax Calculation Logic (Pakistan Tax Slabs 2024) =====
function calculateTaxAmount(taxableIncome) {
    let tax = 0;

    // Pakistan tax slabs for salaried individuals (2024)
    if (taxableIncome <= 600000) {
        tax = 0;
    } else if (taxableIncome <= 1200000) {
        tax = (taxableIncome - 600000) * 0.05;
    } else if (taxableIncome <= 2200000) {
        tax = 30000 + (taxableIncome - 1200000) * 0.15;
    } else if (taxableIncome <= 3200000) {
        tax = 180000 + (taxableIncome - 2200000) * 0.20;
    } else if (taxableIncome <= 4100000) {
        tax = 380000 + (taxableIncome - 3200000) * 0.25;
    } else {
        tax = 605000 + (taxableIncome - 4100000) * 0.30;
    }

    return Math.round(tax);
}

// ===== Contact Form =====
function sendMessage(event) {
    event.preventDefault();
    showToast('آپ کا پیغام بھیج دیا گیا ہے', 'success');
    event.target.reset();
}

// ===== Utilities =====
function formatNumber(num) {
    return new Intl.NumberFormat('en-PK').format(num);
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast ' + type;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}