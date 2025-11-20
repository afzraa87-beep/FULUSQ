/* ============================
   STATE & INITIALIZATION
============================ */
// Ambil data dari LocalStorage atau inisialisasi array kosong
let transaksi = JSON.parse(localStorage.getItem("transaksi")) || [];
let budgets = JSON.parse(localStorage.getItem("budgets")) || [];
let nabungTargets = JSON.parse(localStorage.getItem("nabungTargets")) || [];

// DOM Elements
const els = {
    transaksiForm: document.getElementById("transaksiForm"),
    listTransaksi: document.getElementById("listTransaksi"),
    budgetForm: document.getElementById("budgetForm"),
    listBudget: document.getElementById("listBudget"),
    nabungForm: document.getElementById("nabungForm"),
    listNabung: document.getElementById("listNabung"),
    display: {
        saldo: document.getElementById("totalSaldo"),
        pemasukan: document.getElementById("totalPemasukan"),
        pengeluaran: document.getElementById("totalPengeluaran"),
    },
    modal: document.getElementById("saldoModal"),
    btnOpenModal: document.getElementById("btnOpenModalSaldo"),
    btnCloseModal: document.querySelector(".close-modal"),
    saldoForm: document.getElementById("saldoForm"),
    modeToggle: document.getElementById("modeToggle")
};

// Format Rupiah Helper
const formatRupiah = (num) => "Rp " + num.toLocaleString("id-ID");

/* ============================
   CORE FUNCTIONS (LOGIC)
============================ */

// Simpan ke LocalStorage
function saveData() {
    localStorage.setItem("transaksi", JSON.stringify(transaksi));
    localStorage.setItem("budgets", JSON.stringify(budgets));
    localStorage.setItem("nabungTargets", JSON.stringify(nabungTargets));
    updateUI();
}

// Hitung Total
function getSummary() {
    const totalPemasukan = transaksi
        .filter(t => t.jenis === "pemasukan")
        .reduce((acc, curr) => acc + curr.jumlah, 0);

    const totalPengeluaran = transaksi
        .filter(t => t.jenis === "pengeluaran")
        .reduce((acc, curr) => acc + curr.jumlah, 0);

    return {
        pemasukan: totalPemasukan,
        pengeluaran: totalPengeluaran,
        saldo: totalPemasukan - totalPengeluaran
    };
}

/* ============================
   RENDERING (VIEW)
============================ */

function updateUI() {
    const summary = getSummary();

    // 1. Update Kartu Dashboard
    els.display.pemasukan.textContent = formatRupiah(summary.pemasukan);
    els.display.pengeluaran.textContent = formatRupiah(summary.pengeluaran);
    els.display.saldo.textContent = formatRupiah(summary.saldo);

    // 2. Render Lists
    renderTransaksiList();
    renderBudgetList();
    renderNabungList(summary.saldo);
    
    // 3. Update Chart
    updateChart(summary);
}

function renderTransaksiList() {
    els.listTransaksi.innerHTML = "";
    // Tampilkan 5 transaksi terakhir (terbaru di atas)
    transaksi.slice().reverse().forEach((t, i) => {
        // Karena kita reverse array copy, kita butuh index asli untuk hapus
        const originalIndex = transaksi.length - 1 - i;
        
        const li = document.createElement("li");
        li.innerHTML = `
            <div class="transaction-info">
                <strong>${t.nama}</strong>
                <span>${t.jenis.toUpperCase()}</span>
            </div>
            <div style="display:flex; align-items:center;">
                <span class="amount ${t.jenis}">${t.jenis === 'pemasukan' ? '+' : '-'} ${formatRupiah(t.jumlah)}</span>
                <button class="delete-btn" onclick="hapusData('transaksi', ${originalIndex})">×</button>
            </div>
        `;
        els.listTransaksi.appendChild(li);
    });
}

function renderBudgetList() {
    els.listBudget.innerHTML = "";
    budgets.forEach((b, i) => {
        const li = document.createElement("li");
        li.innerHTML = `
            <span>${b.nama} <small>(${formatRupiah(b.jumlah)})</small></span>
            <button class="delete-btn" onclick="hapusData('budget', ${i})">×</button>
        `;
        els.listBudget.appendChild(li);
    });
}

function renderNabungList(currentSaldo) {
    els.listNabung.innerHTML = "";
    nabungTargets.forEach((n, i) => {
        const progress = Math.min((currentSaldo / n.jumlah) * 100, 100);
        const isReached = currentSaldo >= n.jumlah;
        
        const li = document.createElement("li");
        li.style.display = "block"; // Override flex for vertical stack layout inside li
        li.innerHTML = `
            <div style="display:flex; justify-content:space-between;">
                <strong>${n.nama}</strong>
                <span>${formatRupiah(n.jumlah)}</span>
            </div>
            <div class="progress-container">
                <div class="progress-bar" style="width: ${Math.max(0, progress)}%; background-color: ${isReached ? '#4CC9F0' : '#4361EE'}"></div>
            </div>
            <div style="text-align:right; margin-top:5px;">
                <small>${Math.floor(progress)}% tercapai</small>
                <button class="delete-btn" onclick="hapusData('nabung', ${i})">×</button>
            </div>
        `;
        els.listNabung.appendChild(li);
    });
}

/* ============================
   CHART JS
============================ */
let myChart = null;

function updateChart(summary) {
    const ctx = document.getElementById("keuanganChart").getContext("2d");
    
    if (myChart) {
        myChart.data.datasets[0].data = [summary.pemasukan, summary.pengeluaran, summary.saldo];
        myChart.update();
    } else {
        myChart = new Chart(ctx, {
            type: "bar",
            data: {
                labels: ["Pemasukan", "Pengeluaran", "Sisa Saldo"],
                datasets: [{
                    label: "Analisis Keuangan",
                    data: [summary.pemasukan, summary.pengeluaran, summary.saldo],
                    backgroundColor: ["#4CC9F0", "#F72585", "#4361EE"],
                    borderRadius: 8,
                    barThickness: 40
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: '#eee' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }
}

/* ============================
   EVENT LISTENERS
============================ */

// Tambah Transaksi
els.transaksiForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const nama = document.getElementById("namaTransaksi").value;
    const jumlah = parseInt(document.getElementById("jumlahTransaksi").value);
    const jenis = document.getElementById("jenisTransaksi").value;

    if(nama && jumlah) {
        transaksi.push({ nama, jumlah, jenis });
        els.transaksiForm.reset();
        saveData();
    }
});

// Tambah Budget
els.budgetForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const nama = document.getElementById("namaBudget").value;
    const jumlah = parseInt(document.getElementById("jumlahBudget").value);
    if(nama && jumlah) {
        budgets.push({ nama, jumlah });
        els.budgetForm.reset();
        saveData();
    }
});

// Tambah Target Nabung
els.nabungForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const nama = document.getElementById("namaTabungan").value;
    const jumlah = parseInt(document.getElementById("jumlahTarget").value);
    if(nama && jumlah) {
        nabungTargets.push({ nama, jumlah });
        els.nabungForm.reset();
        saveData();
    }
});

// Modal Saldo
els.btnOpenModal.addEventListener("click", () => els.modal.style.display = "flex");
els.btnCloseModal.addEventListener("click", () => els.modal.style.display = "none");
window.onclick = (e) => { if (e.target == els.modal) els.modal.style.display = "none"; };

els.saldoForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const nama = document.getElementById("namaSaldo").value;
    const jumlah = parseInt(document.getElementById("jumlahSaldo").value);
    
    transaksi.push({ nama, jumlah, jenis: "pemasukan" });
    els.saldoForm.reset();
    els.modal.style.display = "none";
    saveData();
});

// Dark Mode
els.modeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    els.modeToggle.textContent = isDark ? "☀️" : "🌙";
});

// Global Function untuk tombol Hapus (karena dipanggil via onclick di HTML string)
window.hapusData = function(type, index) {
    if (confirm("Yakin ingin menghapus data ini?")) {
        if (type === 'transaksi') transaksi.splice(index, 1);
        if (type === 'budget') budgets.splice(index, 1);
        if (type === 'nabung') nabungTargets.splice(index, 1);
        saveData();
    }
};

// Init Pertama Kali
updateUI();
