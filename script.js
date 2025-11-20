/* ============================
   MODE SIANG / MALAM
============================ */
const modeToggle = document.getElementById("modeToggle");

modeToggle.addEventListener("click", function() {
    document.body.classList.toggle("dark");

    // ganti ikon
    if(document.body.classList.contains("dark")) {
        modeToggle.textContent = "☀️"; // ikon siang
    } else {
        modeToggle.textContent = "🌙"; // ikon malam
    }
});
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
   CHART KEUANGAN REAL-TIME
============================ */
const ctx = document.getElementById("keuanganChart").getContext("2d");

let keuanganChart = new Chart(ctx, {
    type: "bar",
    data: {
        labels: ["Pemasukan", "Pengeluaran", "Saldo"],
        datasets: [{
            label: "Jumlah (Rp)",
            data: [0, 0, 0],
            backgroundColor: [
                "#FF8C42", // Pemasukan - oranye
                "#A8DADC", // Pengeluaran - biru muda
                "#1D3557"  // Saldo - biru tua
            ]
        }]
    },
    options: {
        responsive: true,
        plugins: {
            legend: {
                display: false
            }
        },
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
});

/* ============================
   UPDATE CHART
============================ */
function updateChart() {
    const totalPemasukan = transaksi
        .filter(t => t.jenis === "pemasukan")
        .reduce((a, b) => a + b.jumlah, 0);

    const totalPengeluaran = transaksi
        .filter(t => t.jenis === "pengeluaran")
        .reduce((a, b) => a + b.jumlah, 0);

    const saldo = totalPemasukan - totalPengeluaran;

    keuanganChart.data.datasets[0].data = [totalPemasukan, totalPengeluaran, saldo];
    keuanganChart.update();
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
       updateDashboard();   // update total saldo, pemasukan, pengeluaran
       updateBarChart();    // update chart bar
       updatePieChart();    // update pie chart pengeluaran per kategori
       updateProgress();    // update progress target nabung

    });
   transaksiForm.addEventListener("submit", function(e) {
    e.preventDefault();
    
    const nama = document.getElementById("namaTransaksi").value;
    const jumlah = parseInt(document.getElementById("jumlahTransaksi").value);
    const jenis = document.getElementById("jenisTransaksi").value;
    const kategori = document.getElementById("kategoriTransaksi").value;

    transaksi.push({nama, jumlah, jenis, kategori});
    transaksiForm.reset();

    renderTransaksi(); // <== otomatis update dashboard & chart
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
       function updateProgress() {
    // hitung saldo saat ini
    const totalSaldo = transaksi
        .filter(t => t.jenis === "pemasukan").reduce((a,b)=>a+b.jumlah,0) -
        transaksi.filter(t => t.jenis === "pengeluaran").reduce((a,b)=>a+b.jumlah,0);
    
    // update semua progress bar sesuai saldo
    nabungTargets.forEach((n, i) => {
        const progress = Math.min((totalSaldo / n.jumlah) * 100, 100);
        const progressBar = document.querySelectorAll(".progress")[i];
        if(progressBar) progressBar.style.width = progress + "%";
    });
}
const inputSaldoBtn = document.getElementById("inputSaldoBtn");

inputSaldoBtn.addEventListener("click", () => {
    const nama = prompt("Keterangan Saldo:");
    if (!nama) return;

    const jumlahInput = prompt("Masukkan jumlah saldo (Rp):");
    const jumlah = parseInt(jumlahInput);
    if (isNaN(jumlah) || jumlah <= 0) {
        alert("Jumlah tidak valid!");
        return;
    }

    // Tambahkan sebagai transaksi pemasukan
    transaksi.push({nama, jumlah, jenis:"pemasukan", kategori:"Saldo"});

    // Render ulang semua data
    renderTransaksi();
});

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
function updateProgress() {
    // hitung saldo saat ini
    const totalSaldo = transaksi
        .filter(t => t.jenis === "pemasukan").reduce((a,b)=>a+b.jumlah,0) -
        transaksi.filter(t => t.jenis === "pengeluaran").reduce((a,b)=>a+b.jumlah,0);
    
    // update semua progress bar sesuai saldo
    nabungTargets.forEach((n, i) => {
        const progress = Math.min((totalSaldo / n.jumlah) * 100, 100);
        const progressBar = document.querySelectorAll(".progress")[i];
        if(progressBar) progressBar.style.width = progress + "%";
    });
}


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
function updateLineChart() {
    // kumpulkan data per hari (misal hanya tanggal transaksi)
    const dates = [...new Set(transaksi.map(t => t.tanggal))].sort();
    const pemasukanData = [];
    const pengeluaranData = [];

    dates.forEach(d => {
        const totalPemasukan = transaksi
            .filter(t => t.jenis === "pemasukan" && t.tanggal === d)
            .reduce((a,b) => a+b.jumlah, 0);
        const totalPengeluaran = transaksi
            .filter(t => t.jenis === "pengeluaran" && t.tanggal === d)
            .reduce((a,b) => a+b.jumlah, 0);
        pemasukanData.push(totalPemasukan);
        pengeluaranData.push(totalPengeluaran);
    });

    if(window.lineChart) window.lineChart.destroy();

    const ctxLine = document.getElementById("lineChart").getContext("2d");
    window.lineChart = new Chart(ctxLine, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [
                { label: 'Pemasukan', data: pemasukanData, borderColor: '#FF8C42', fill: false },
                { label: 'Pengeluaran', data: pengeluaranData, borderColor: '#A8DADC', fill: false }
            ]
        },
        options: { responsive: true }
    });
}
