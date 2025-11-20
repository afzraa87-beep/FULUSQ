/* ============================
   STATE & INITIALIZATION
============================ */
let transaksi = JSON.parse(localStorage.getItem("transaksi")) || [];
let budgets = JSON.parse(localStorage.getItem("budgets")) || [];
let nabungTargets = JSON.parse(localStorage.getItem("nabungTargets")) || [];

const els = {
    // Halaman
    pages: {
        dashboard: document.getElementById("page-dashboard"),
        budget: document.getElementById("page-budget"),
        nabung: document.getElementById("page-nabung"),
    },
    navLinks: document.querySelectorAll(".nav-link"),
    
    // Display
    saldo: document.getElementById("totalSaldo"),
    pemasukan: document.getElementById("totalPemasukan"),
    pengeluaran: document.getElementById("totalPengeluaran"),
    
    // Lists
    listTransaksi: document.getElementById("listTransaksi"),
    listBudget: document.getElementById("listBudget"),
    listNabung: document.getElementById("listNabung"),
    
    // Modal
    modal: document.getElementById("saldoModal"),
    btnOpenModal: document.getElementById("btnInputSaldo"),
    btnCloseModal: document.querySelector(".close-modal"),
};

const formatRupiah = (num) => "Rp " + num.toLocaleString("id-ID");

/* ============================
   NAVIGASI HALAMAN (TAB)
============================ */
window.showPage = function(pageId) {
    // 1. Sembunyikan semua halaman
    Object.values(els.pages).forEach(page => page.classList.remove("active"));
    
    // 2. Nonaktifkan semua tombol nav
    els.navLinks.forEach(btn => btn.classList.remove("active"));
    
    // 3. Tampilkan halaman yang dipilih
    const targetPage = document.getElementById(`page-${pageId}`);
    if(targetPage) targetPage.classList.add("active");

    // 4. Set tombol nav jadi aktif
    // Kita cari tombol yang onclick-nya mengandung pageId
    els.navLinks.forEach(btn => {
        if(btn.getAttribute("onclick").includes(pageId)) {
            btn.classList.add("active");
        }
    });
};

/* ============================
   CORE LOGIC
============================ */
function saveData() {
    localStorage.setItem("transaksi", JSON.stringify(transaksi));
    localStorage.setItem("budgets", JSON.stringify(budgets));
    localStorage.setItem("nabungTargets", JSON.stringify(nabungTargets));
    updateUI();
}

function updateUI() {
    // Hitung Keuangan
    const totalPemasukan = transaksi.filter(t => t.jenis === "pemasukan").reduce((a, b) => a + b.jumlah, 0);
    const totalPengeluaran = transaksi.filter(t => t.jenis === "pengeluaran").reduce((a, b) => a + b.jumlah, 0);
    const saldo = totalPemasukan - totalPengeluaran;

    // Update Teks
    els.saldo.textContent = formatRupiah(saldo);
    els.pemasukan.textContent = formatRupiah(totalPemasukan);
    els.pengeluaran.textContent = formatRupiah(totalPengeluaran);

    // Render Lists
    renderTransaksiList();
    renderBudgetList(totalPengeluaran); // Pass pengeluaran jika ingin fitur advanced nanti
    renderNabungList(saldo);
}

/* ============================
   RENDER LISTS
============================ */
function renderTransaksiList() {
    els.listTransaksi.innerHTML = "";
    transaksi.slice().reverse().forEach((t, i) => {
        const originalIndex = transaksi.length - 1 - i;
        const li = document.createElement("li");
        li.innerHTML = `
            <div class="item-info">
                <strong>${t.nama}</strong>
                <small>${t.jenis.toUpperCase()}</small>
            </div>
            <div class="amount-group">
                <span class="amount ${t.jenis}">${t.jenis === 'pemasukan' ? '+' : '-'} ${formatRupiah(t.jumlah)}</span>
            </div>
            <button class="delete-icon" onclick="hapusData('transaksi', ${originalIndex})">&times;</button>
        `;
        els.listTransaksi.appendChild(li);
    });
}

function renderBudgetList() {
    els.listBudget.innerHTML = "";
    budgets.forEach((b, i) => {
        const li = document.createElement("li");
        li.style.display = "block"; // Override flex
        li.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                <strong>${b.nama}</strong>
                <span>Limit: ${formatRupiah(b.jumlah)}</span>
            </div>
            <div class="progress-wrapper"><div class="progress-fill" style="width: 50%; background:#ccc;"></div></div>
            <div style="text-align:right; margin-top:5px;">
                <button class="btn-text-danger" onclick="hapusData('budget', ${i})">Hapus</button>
            </div>
        `;
        els.listBudget.appendChild(li);
    });
}

function renderNabungList(currentSaldo) {
    els.listNabung.innerHTML = "";
    nabungTargets.forEach((n, i) => {
        const progress = Math.min((currentSaldo / n.jumlah) * 100, 100);
        const li = document.createElement("li");
        li.style.display = "block"; 
        li.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                <strong>${n.nama}</strong>
                <span class="amount" style="font-size:0.9rem; color:var(--primary)">${formatRupiah(n.jumlah)}</span>
            </div>
            <div class="progress-wrapper">
                <div class="progress-fill" style="width: ${progress}%; background-color: var(--accent)"></div>
            </div>
            <div style="display:flex; justify-content:space-between; margin-top:5px; font-size:0.8rem; color:#888;">
                <span>${Math.floor(progress)}% Tercapai</span>
                <button class="delete-icon" onclick="hapusData('nabung', ${i})" style="font-size:1rem;">&times;</button>
            </div>
        `;
        els.listNabung.appendChild(li);
    });
}

/* ============================
   EVENT LISTENERS
============================ */
// Form Handlers
document.getElementById("transaksiForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const nama = document.getElementById("namaTransaksi").value;
    const jumlah = parseInt(document.getElementById("jumlahTransaksi").value);
    const jenis = document.getElementById("jenisTransaksi").value;
    if(nama && jumlah) { transaksi.push({nama, jumlah, jenis}); e.target.reset(); saveData(); }
});

document.getElementById("budgetForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const nama = document.getElementById("namaBudget").value;
    const jumlah = parseInt(document.getElementById("jumlahBudget").value);
    if(nama && jumlah) { budgets.push({nama, jumlah}); e.target.reset(); saveData(); }
});

document.getElementById("nabungForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const nama = document.getElementById("namaTabungan").value;
    const jumlah = parseInt(document.getElementById("jumlahTarget").value);
    if(nama && jumlah) { nabungTargets.push({nama, jumlah}); e.target.reset(); saveData(); }
});

document.getElementById("saldoForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const nama = document.getElementById("namaSaldo").value;
    const jumlah = parseInt(document.getElementById("jumlahSaldo").value);
    transaksi.push({ nama, jumlah, jenis: "pemasukan" });
    e.target.reset(); els.modal.style.display = "none"; saveData();
});

// Modal
els.btnOpenModal.addEventListener("click", () => els.modal.style.display = "flex");
els.btnCloseModal.addEventListener("click", () => els.modal.style.display = "none");
window.onclick = (e) => { if (e.target == els.modal) els.modal.style.display = "none"; };

// Mode Gelap
document.getElementById("modeToggle").addEventListener("click", function() {
    document.body.classList.toggle("dark");
    this.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
});

// Global Helpers
window.hapusData = function(type, index) {
    if(confirm("Hapus item ini?")) {
        if(type === 'transaksi') transaksi.splice(index, 1);
        if(type === 'budget') budgets.splice(index, 1);
        if(type === 'nabung') nabungTargets.splice(index, 1);
        saveData();
    }
};

window.hapusSemua = function(type) {
    if(confirm("Reset semua transaksi? Data akan hilang.")) {
        transaksi = []; saveData();
    }
};

// Init
updateUI();
