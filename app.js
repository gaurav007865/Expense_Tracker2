/* ==========================================================
   EXPENSE TRACKER - FINAL UPDATED SCRIPT (FULL PROJECT)
========================================================== */


const API_URL = "https://script.google.com/macros/s/AKfycbwNjlG_qNSNufmWgXHML6wvSTaIJTcGVZ3qXj0wxukwPuHjwbfjHUuoswaXhflfOlDpZA/exec"; // <<< IMPORTANT

/* ==========================================================
   LOGIN + REGISTER SYSTEM
========================================================== */
// this function is use for show all registered userd
function showRegister() {
    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("registerScreen").style.display = "flex";
}

// this function is use for show login screen
function showLogin() {
    document.getElementById("registerScreen").style.display = "none";
    document.getElementById("loginScreen").style.display = "flex";
}

/* ---------------- REGISTER USER (AUTO USER ID) ---------------- */
async function registerUser() {

    const name = document.getElementById("regName").value.trim();
    const pass = document.getElementById("regPassword").value.trim();
    const salary = document.getElementById("regSalary").value.trim();
    const savingGoal = document.getElementById("regSavingGoal").value.trim() || 0;

    if (!name || !pass || !salary) {
        showToast("Please fill all required fields");
        return;
    }

    // AUTO GENERATE USER ID
    const autoId = "USR" + Math.floor(100000 + Math.random() * 900000);

    // SAVE USER
    await apiPOST({
        mode: "register",
        userId: autoId,
        name,
        pass,
        salary,
        savingGoal
    });

    showToast("Account Created! Your User ID: " + autoId);
    alert("Your User ID: " + autoId);

    showLogin();
}

/* ---------------- LOGIN USER ---------------- */
async function loginUser() {
    const userId = document.getElementById("loginUserId").value.trim();
    const pass = document.getElementById("loginPassword").value.trim();

    if (!userId || !pass) {
        showToast("Please enter login credentials");
        return;
    }

    console.log("Sending login request...");

    const res = await apiPOST({
        mode: "login",
        userId,
        pass
    });

    console.log("Login Response:", res);

    if (!res.found) {
        showToast("User not found!");
        return;
    }

    if (!res.valid) {
        showToast("Wrong password!");
        return;
    }

    localStorage.setItem("userId", res.userId);
    localStorage.setItem("userName", res.userName);
    localStorage.setItem("userSalary", res.salary);
    localStorage.setItem("savingGoal", res.savingGoal);

    location.reload();
}

/* ==========================================================
   AUTO LOGIN CHECK
========================================================== */

let currentUser = localStorage.getItem("userId");
let currentName = localStorage.getItem("userName");
let userSalary = localStorage.getItem("userSalary");
let userSavingGoal = localStorage.getItem("savingGoal") || 0;

window.onload = () => {
    if (!currentUser || !currentName || !userSalary) {
        showLogin();
    } else {
        document.getElementById("displayUserId").innerText = currentName;
        document.getElementById("profileUserName").innerText = currentName;
        document.getElementById("profileUserId").innerText = currentUser;
        loadExpenses();
    }
};

/* ---------------- LOGOUT ---------------- */
function logout() {
    localStorage.clear();
    location.reload();
}

/* ==========================================================
   LOADER + TOAST
========================================================== */

function showLoader() { 
    document.getElementById("loader").style.display = "flex"; 
}
function hideLoader() { 
    document.getElementById("loader").style.display = "none"; 
}

function showToast(msg) {
    const el = document.getElementById("toast");
    el.innerText = msg;
    el.style.display = "block";
    el.style.opacity = 1;

    setTimeout(() => {
        el.style.opacity = 0;
        setTimeout(() => el.style.display = "none", 400);
    }, 2000);
}

/* ==========================================================
   PAGE SWITCHING
========================================================== */

function showSection(sectionId) {
    document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
    document.getElementById(sectionId).classList.add("active");

    document.querySelectorAll(".sidebar nav a").forEach(a => a.classList.remove("active"));
    document.querySelector(`.sidebar nav a[onclick="showSection('${sectionId}')"]`)
        ?.classList.add("active");

    document.getElementById("topTitle").innerText =
        sectionId.charAt(0).toUpperCase() + sectionId.slice(1);
}

/* ==========================================================
   API HELPERS
========================================================== */

async function apiPOST(data) {
    showLoader();
    const res = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify(data)
    });
    hideLoader();
    return res.json();
}

async function apiGET(params = "") {
    showLoader();
    const res = await fetch(API_URL + "?" + params);
    hideLoader();
    return res.json();
}

/* ==========================================================
   EXPENSE ENGINE
========================================================== */

let expenses = [];

/* ---------------- ADD EXPENSE (Salary Check) ---------------- */
async function saveExpense() {

    const salary = Number(localStorage.getItem("userSalary"));
    const savingGoal = Number(localStorage.getItem("savingGoal") || 0);

    let totalSpent = expenses.reduce((t, e) => t + Number(e.amount), 0);
    const remaining = salary - savingGoal - totalSpent;

    if (remaining <= 0) {
        showToast("⚠ Salary Khatam Ho Gayi — Expense Add Nahi Kar Sakte!");
        closeAddModal();
        return;
    }

    const exp = {
        mode: "add",
        userId: currentUser,
        userName: currentName,
        title: document.getElementById("addTitle").value,
        amount: document.getElementById("addAmount").value,
        category: document.getElementById("addCategory").value,
        date: document.getElementById("addDate").value
    };

    if (!exp.title || !exp.amount || !exp.date) {
        showToast("Please fill all fields");
        return;
    }

    await apiPOST(exp);

    closeAddModal();
    showToast("Expense Added!");
    loadExpenses();
}

/* ---------------- LOAD EXPENSES ---------------- */
async function loadExpenses() {
    expenses = await apiGET("userId=" + currentUser);
    renderTable(expenses);
    updateDashboard();
}

/* ---------------- TABLE RENDER ---------------- */
function renderTable(list) {
    const body = document.getElementById("expenseBody");
    body.innerHTML = "";

    list.forEach((e, i) => {
        body.innerHTML += `
            <tr>
                <td>${e.title}</td>
                <td>₹${e.amount}</td>
                <td>${e.category}</td>
                <td>${e.date}</td>
                <td>
                    <button onclick="openEdit(${i})">✏</button>
                    <button onclick="deleteExpense(${i})">🗑</button>
                </td>
            </tr>`;
    });
}

/* ---------------- EDIT EXPENSE ---------------- */
function openEdit(i) {
    const e = expenses[i];

    document.getElementById("editId").value = e.rowId;
    document.getElementById("editTitle").value = e.title;
    document.getElementById("editAmount").value = e.amount;
    document.getElementById("editCategory").value = e.category;
    document.getElementById("editDate").value = e.date;

    openEditModal();
}

async function updateExpense() {
    await apiPOST({
        mode: "update",
        rowId: document.getElementById("editId").value,
        userId: currentUser,
        userName: currentName,
        title: document.getElementById("editTitle").value,
        amount: document.getElementById("editAmount").value,
        category: document.getElementById("editCategory").value,
        date: document.getElementById("editDate").value
    });

    closeEditModal();
    showToast("Updated!");
    loadExpenses();
}

/* ---------------- DELETE EXPENSE ---------------- */
async function deleteExpense(i) {
    if (!confirm("Delete this expense?")) return;

    await apiPOST({
        mode: "delete",
        rowId: expenses[i].rowId
    });

    showToast("Deleted");
    loadExpenses();
}

/* ==========================================================
   SEARCH + FILTERS
========================================================== */
function applyFilters() {
    let s = document.getElementById("search").value.toLowerCase();
    let c = document.getElementById("categoryFilter").value;
    let m = document.getElementById("monthFilter").value;

    let out = expenses;

    if (s) out = out.filter(e => e.title.toLowerCase().includes(s));
    if (c) out = out.filter(e => e.category === c);
    if (m) out = out.filter(e => e.date.startsWith(m));

    renderTable(out);
}

/* ==========================================================
   SAVINGS GOAL UPDATE
========================================================== */
function updateSavingGoal() {
    const g = prompt("Enter new Saving Goal:");

    if (!g || Number(g) < 0) {
        showToast("Invalid savings goal!");
        return;
    }

    localStorage.setItem("savingGoal", g);
    userSavingGoal = g;

    showToast("Savings Updated!");
    updateDashboard();
}

/* ==========================================================
   DASHBOARD + CHARTS
========================================================== */

let categoryChart, monthlyChart;

function updateDashboard() {

    const salary = Number(localStorage.getItem("userSalary"));
    const savingGoal = Number(localStorage.getItem("savingGoal") || 0);

    let total = expenses.reduce((t, e) => t + Number(e.amount), 0);
    let remaining = salary - savingGoal - total;

    document.getElementById("salaryAmount").innerText = "₹" + salary;
    document.getElementById("savingsGoal").innerText = "₹" + savingGoal;
    document.getElementById("remainingBalance").innerText = "₹" + remaining;

    let dailyLimit = (salary - savingGoal) / 30;
    document.getElementById("dailyLimit").innerText = "₹" + dailyLimit.toFixed(0);

    // Disable Add button if no money
    const addBtn = document.querySelector(".addBtn");
    if (remaining <= 0) {
        addBtn.disabled = true;
        addBtn.style.opacity = "0.4";
        addBtn.style.cursor = "not-allowed";
    } else {
        addBtn.disabled = false;
        addBtn.style.opacity = "1";
        addBtn.style.cursor = "pointer";
    }

    loadCategoryChart();
    loadMonthlyTrendChart();
}

function loadCategoryChart() {
    const totals = {};

    expenses.forEach(e => {
        totals[e.category] = (totals[e.category] || 0) + Number(e.amount);
    });

    if (categoryChart) categoryChart.destroy();

    categoryChart = new Chart(document.getElementById("categoryChart"), {
        type: "pie",
        data: {
            labels: Object.keys(totals),
            datasets: [{
                data: Object.values(totals),
                backgroundColor: ["#1976d2", "#ef5350", "#66bb6a", "#ffb300", "#8e24aa"]
            }]
        }
    });
}

function loadMonthlyTrendChart() {
    const monthly = {};

    expenses.forEach(e => {
        let m = e.date.slice(0, 7);
        monthly[m] = (monthly[m] || 0) + Number(e.amount);
    });

    if (monthlyChart) monthlyChart.destroy();

    monthlyChart = new Chart(document.getElementById("monthlyChart"), {
        type: "line",
        data: {
            labels: Object.keys(monthly),
            datasets: [{
                data: Object.values(monthly),
                borderColor: "#0d47a1",
                borderWidth: 2,
                tension: 0.3
            }]
        }
    });
}

/* ==========================================================
   PROFILE BAR CHART
========================================================== */
function loadProfileBarChart() {
    const cats = {};

    expenses.forEach(e => {
        cats[e.category] = (cats[e.category] || 0) + Number(e.amount);
    });

    new Chart(document.getElementById("profileBarChart"), {
        type: "bar",
        data: {
            labels: Object.keys(cats),
            datasets: [{
                label: "Expense",
                data: Object.values(cats),
                backgroundColor: "#0d47a1"
            }]
        }
    });
}

document.querySelector(`a[onclick="showSection('profile')"]`)
    .addEventListener("click", loadProfileBarChart);

/* ==========================================================
   MODALS
========================================================== */
function openAddModal() { document.getElementById("addModal").style.display = "flex"; }
function closeAddModal() { document.getElementById("addModal").style.display = "none"; }

function openEditModal() { document.getElementById("editModal").style.display = "flex"; }
function closeEditModal() { document.getElementById("editModal").style.display = "none"; }

/* ==========================================================
   DEFAULT OPEN PAGE
========================================================== */
showSection("dashboard");
