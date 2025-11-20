/* ============================
   STATE & INITIALIZATION
============================ */
let transaksi = JSON.parse(localStorage.getItem("transaksi")) || [];
let budgets = JSON.parse(localStorage.getItem("budgets")) || [];
let nabungTargets = JSON.parse(localStorage.getItem("nabungTargets")) || [];

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

const formatRupiah = (num) => "Rp " + num.toLocaleString("id-ID");

/* ============================
   CORE LOGIC
============================ */

function saveData() {
    localStorage.setItem("transaksi", JSON.stringify(transaksi));
    localStorage.setItem("budgets", JSON.stringify(budgets));
    localStorage.setItem("nabungTargets", JSON.stringify(nabungTargets));
    updateUI();
}

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
   RENDER VIEW
============================ */

function updateUI() {
    const summary = getSummary();

    // Update Summary Cards
    els.display.pemasukan.textContent = formatRupiah(summary.pemasukan);
    els.display.pengeluaran.textContent = formatRupiah(summary.pengeluaran);
    els.display.saldo.textContent = formatRupiah(summary.saldo);

    // Render Lists
    renderTransaksiList();
    renderBudgetList();
    renderNabungList(summary.saldo);
}

function renderTransaksiList() {
    els.listTransaksi.innerHTML = "";
    if (transaksi.length === 0) {
        els.listTransaksi.innerHTML = "<li style='justify-content:center; color:#999;'>Belum ada transaksi</li>";
        return;
    }

    transaksi.slice().reverse().forEach((t, i) => {
        const originalIndex = transaksi.length - 1 - i;
        const li = document.createElement("li");
        li.innerHTML = `
            <div class="transaction-info">
                <strong>${t.nama}</strong>
                <span>${t.jenis.toUpperCase()}</span>
            </div>
            <div style="display:flex; align-items:center;">
                <span class="amount ${t.jenis}">${t.jenis === 'pemasukan' ? '+' : '-'} ${formatRupiah(t.jumlah)}</span>
                <button class="delete-btn" onclick="hapusData('transaksi', ${originalIndex})">Hapus</button>
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
        li.style.display = "block"; 
        li.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                <strong>${n.nama}</strong>
                <span>${formatRupiah(n.jumlah)}</span>
            </div>
            <div class="progress-container">
                <div class="progress-bar" style="width: ${Math.max(0, progress)}%; background-color: ${isReached ? '#4CC9F0' : '#4361EE'}"></div>
            </div>
            <div style="text-align:right; font-size:0.8rem; color:#888; margin-top:4px;">
                ${Math.floor(progress)}% tercapai
                <button class="delete-btn" onclick="hapusData('nabung', ${i})" style="margin-left:10px; padding:2px 8px;">×</button>
            </div>
        `;
        els.listNabung.appendChild(li);
    });
}

/* ============================
   EVENT LISTENERS
============================ */

// Add Transaction
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

// Add Budget
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

// Add Saving Target
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

// Modal Handlers
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

// Dark Mode Toggle
els.modeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    els.modeToggle.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
});

// Helper Functions (Global scope for inline onClick)
window.hapusData = function(type, index) {
    if (confirm("Hapus item ini?")) {
        if (type === 'transaksi') transaksi.splice(index, 1);
        if (type === 'budget') budgets.splice(index, 1);
        if (type === 'nabung') nabungTargets.splice(index, 1);
        saveData();
    }
};

window.hapusSemua = function(type) {
    if (type === 'transaksi' && confirm("Yakin hapus SEMUA riwayat transaksi? Saldo akan berubah.")) {
        transaksi = [];
        saveData();
    }
};

// Init App
updateUI();
