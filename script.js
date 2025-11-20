/* ============================
   ELEMENT SELECTORS
============================ */
const transaksiForm = document.getElementById("transaksiForm");
const listTransaksi = document.getElementById("listTransaksi");

const budgetForm = document.getElementById("budgetForm");
const listBudget = document.getElementById("listBudget");

const nabungForm = document.getElementById("nabungForm");
const listNabung = document.getElementById("listNabung");

const totalSaldoDisplay = document.getElementById("totalSaldo");
const pemasukanDisplay = document.getElementById("totalPemasukan");
const pengeluaranDisplay = document.getElementById("totalPengeluaran");

/* ============================
   STATE DATA
============================ */
let transaksi = [];
let budgets = [];
let nabungTargets = [];

/* ============================
   UPDATE DASHBOARD
============================ */
function updateDashboard() {
    let totalPemasukan = transaksi
        .filter(t => t.jenis === "pemasukan")
        .reduce((a, b) => a + b.jumlah, 0);

    let totalPengeluaran = transaksi
        .filter(t => t.jenis === "pengeluaran")
        .reduce((a, b) => a + b.jumlah, 0);

    let totalSaldo = totalPemasukan - totalPengeluaran;

    pemasukanDisplay.textContent = "Rp " + totalPemasukan.toLocaleString();
    pengeluaranDisplay.textContent = "Rp " + totalPengeluaran.toLocaleString();
    totalSaldoDisplay.textContent = "Rp " + totalSaldo.toLocaleString();
}

/* ============================
   RENDER LIST TRANSAKSI
============================ */
function renderTransaksi() {
    listTransaksi.innerHTML = "";

    transaksi.forEach((t, i) => {
        const li = document.createElement("li");
        li.innerHTML = `
            <span><strong>${t.nama}</strong> — Rp ${t.jumlah.toLocaleString()} (${t.jenis})</span>
            <button class="delete-btn" onclick="hapusTransaksi(${i})">Hapus</button>
        `;
        listTransaksi.appendChild(li);
    });

    updateDashboard();
}

/* ============================
   RENDER LIST BUDGET
============================ */
function renderBudget() {
    listBudget.innerHTML = "";

    budgets.forEach((b, i) => {
        const li = document.createElement("li");
        li.innerHTML = `
            <span><strong>${b.nama}</strong> — Rp ${b.jumlah.toLocaleString()}</span>
            <button class="delete-btn" onclick="hapusBudget(${i})">Hapus</button>
        `;
        listBudget.appendChild(li);
    });
}

/* ============================
   RENDER LIST NABUNG
============================ */
function renderNabung() {
    listNabung.innerHTML = "";

    nabungTargets.forEach((n, i) => {
        const li = document.createElement("li");
        li.innerHTML = `
            <span><strong>${n.nama}</strong> — Target Rp ${n.jumlah.toLocaleString()}</span>
            <button class="delete-btn" onclick="hapusNabung(${i})">Hapus</button>
        `;
        listNabung.appendChild(li);
    });
}

/* ============================
   EVENT: TAMBAH TRANSAKSI
============================ */
transaksiForm.addEventListener("submit", function(e) {
    e.preventDefault();

    const nama = document.getElementById("namaTransaksi").value;
    const jumlah = parseInt(document.getElementById("jumlahTransaksi").value);
    const jenis = document.getElementById("jenisTransaksi").value;

    transaksi.push({ nama, jumlah, jenis });

    transaksiForm.reset();
    renderTransaksi();
});

/* ============================
   EVENT: TAMBAH BUDGET
============================ */
budgetForm.addEventListener("submit", function(e) {
    e.preventDefault();

    const nama = document.getElementById("namaBudget").value;
    const jumlah = parseInt(document.getElementById("jumlahBudget").value);

    budgets.push({ nama, jumlah });

    budgetForm.reset();
    renderBudget();
});

/* ============================
   EVENT: TAMBAH TARGET NABUNG
============================ */
nabungForm.addEventListener("submit", function(e) {
    e.preventDefault();

    const nama = document.getElementById("namaTabungan").value;
    const jumlah = parseInt(document.getElementById("jumlahTarget").value);

    nabungTargets.push({ nama, jumlah });

    nabungForm.reset();
    renderNabung();
});

/* ============================
   DELETE FUNCTIONS
============================ */
function hapusTransaksi(i) {
    transaksi.splice(i, 1);
    renderTransaksi();
}

function hapusBudget(i) {
    budgets.splice(i, 1);
    renderBudget();
}

function hapusNabung(i) {
    nabungTargets.splice(i, 1);
    renderNabung();
}

/* ============================
   INISIALISASI AWAL
============================ */
renderTransaksi();
renderBudget();
renderNabung();
updateDashboard();
