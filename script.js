/* ============================
   STATE & INITIALIZATION
============================ */
let transaksi = JSON.parse(localStorage.getItem("transaksi")) || [];
let budgets = JSON.parse(localStorage.getItem("budgets")) || [];

// Struktur Nabung baru: { nama, target, terkumpul, history: [] }
let nabungTargets = JSON.parse(localStorage.getItem("nabungTargets")) || [];

// Migrasi data lama (jika user dari versi lama)
nabungTargets = nabungTargets.map(n => ({
    nama: n.nama,
    jumlah: n.jumlah || n.target, // handle nama variabel lama
    terkumpul: n.terkumpul || 0,
    history: n.history || []
}));

const els = {
    pages: {
        dashboard: document.getElementById("page-dashboard"),
        budget: document.getElementById("page-budget"),
        nabung: document.getElementById("page-nabung"),
    },
    navLinks: document.querySelectorAll(".nav-link"),
    
    display: {
        saldo: document.getElementById("totalSaldo"),
        pemasukan: document.getElementById("totalPemasukan"),
        pengeluaran: document.getElementById("totalPengeluaran"),
    },
    
    lists: {
        transaksi: document.getElementById("listTransaksi"),
        budget: document.getElementById("listBudget"),
        nabung: document.getElementById("listNabung"),
    },
    
    modals: {
        saldo: document.getElementById("saldoModal"),
        topup: document.getElementById("topupModal"),
    },
    
    inputs: {
        topupIndex: document.getElementById("topupIndex"),
        topupTitle: document.getElementById("topupTitle"),
        jumlahTopup: document.getElementById("jumlahTopup"),
    }
};

const formatRupiah = (num) => "Rp " + num.toLocaleString("id-ID");

/* ============================
   CONFETTI LOGIC (PESTA)
============================ */
function triggerConfetti() {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 999 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        // Confetti jatuh dari atas (tengah)
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
    }, 250);
}

/* ============================
   NAVIGASI & RENDER
============================ */
window.showPage = function(pageId) {
    Object.values(els.pages).forEach(p => p.classList.remove("active"));
    els.navLinks.forEach(btn => btn.classList.remove("active"));
    
    document.getElementById(`page-${pageId}`).classList.add("active");
    els.navLinks.forEach(btn => {
        if(btn.getAttribute("onclick").includes(pageId)) btn.classList.add("active");
    });
};

function saveData() {
    localStorage.setItem("transaksi", JSON.stringify(transaksi));
    localStorage.setItem("budgets", JSON.stringify(budgets));
    localStorage.setItem("nabungTargets", JSON.stringify(nabungTargets));
    updateUI();
}

function updateUI() {
    // Hitung Saldo Dompet Global
    const totalPemasukan = transaksi.filter(t => t.jenis === "pemasukan").reduce((a, b) => a + b.jumlah, 0);
    const totalPengeluaran = transaksi.filter(t => t.jenis === "pengeluaran").reduce((a, b) => a + b.jumlah, 0);
    const saldo = totalPemasukan - totalPengeluaran;

    els.display.saldo.textContent = formatRupiah(saldo);
    els.display.pemasukan.textContent = formatRupiah(totalPemasukan);
    els.display.pengeluaran.textContent = formatRupiah(totalPengeluaran);

    renderLists();
}

function renderLists() {
    // Render Transaksi
    els.lists.transaksi.innerHTML = "";
    transaksi.slice().reverse().forEach((t, i) => {
        const originalIndex = transaksi.length - 1 - i;
        const li = document.createElement("li");
        li.innerHTML = `
            <div class="item-info"><strong>${t.nama}</strong><small>${t.jenis.toUpperCase()}</small></div>
            <span class="amount ${t.jenis}">${t.jenis === 'pemasukan' ? '+' : '-'} ${formatRupiah(t.jumlah)}</span>
            <button class="delete-icon" onclick="hapusData('transaksi', ${originalIndex})">&times;</button>
        `;
        els.lists.transaksi.appendChild(li);
    });

    // Render Budget
    els.lists.budget.innerHTML = "";
    budgets.forEach((b, i) => {
        const li = document.createElement("li");
        li.style.display = "block";
        li.innerHTML = `
            <div style="display:flex; justify-content:space-between;"><strong>${b.nama}</strong><span>${formatRupiah(b.jumlah)}</span></div>
            <div style="text-align:right; margin-top:5px;"><button class="btn-text-danger" onclick="hapusData('budget', ${i})">Hapus</button></div>
        `;
        els.lists.budget.appendChild(li);
    });

    // Render Nabung (FITUR UTAMA)
    els.lists.nabung.innerHTML = "";
    let hasCompletedTarget = false;

    nabungTargets.forEach((n, i) => {
        const percent = Math.min((n.terkumpul / n.jumlah) * 100, 100);
        const isFull = n.terkumpul >= n.jumlah;
        if(isFull) hasCompletedTarget = true;

        // HTML untuk History Rincian
        let historyHTML = n.history.map(h => `
            <div class="history-item">
                <span>${h.date}</span>
                <span>+ ${formatRupiah(h.amount)}</span>
            </div>
        `).join('');

        if(n.history.length === 0) historyHTML = `<div class="history-item" style="justify-content:center;">Belum ada tabungan masuk</div>`;

        const li = document.createElement("li");
        li.style.display = "block";
        li.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                <div>
                    <strong>${n.nama} ${isFull ? '<span class="badge-complete">LUNAS! 🎉</span>' : ''}</strong>
                </div>
                <span class="amount" style="color:var(--primary)">${formatRupiah(n.terkumpul)} / ${formatRupiah(n.jumlah)}</span>
            </div>
            
            <div class="progress-wrapper">
                <div class="progress-fill" style="width: ${percent}%; background-color: ${isFull ? '#00CECB' : 'var(--accent)'}"></div>
            </div>
            
            <div class="action-btn-group">
                <button class="btn-small btn-topup" onclick="openTopupModal(${i})">+ Isi</button>
                <button class="btn-small btn-history" onclick="toggleHistory('hist-${i}')">📜 Rincian</button>
                <button class="delete-icon" onclick="hapusData('nabung', ${i})" style="margin-left:auto">&times;</button>
            </div>

            <div id="hist-${i}" class="history-box">
                <strong>Riwayat Masuk:</strong>
                ${historyHTML}
            </div>
        `;
        els.lists.nabung.appendChild(li);
    });
}

/* ============================
   LOGIKA INPUT & MODAL
============================ */
// Modal Helper
window.closeModal = (id) => document.getElementById(id).style.display = "none";
document.getElementById("btnInputSaldo").onclick = () => els.modals.saldo.style.display = "flex";

// Buka Modal Isi Tabungan
window.openTopupModal = function(index) {
    const target = nabungTargets[index];
    els.inputs.topupIndex.value = index;
    els.inputs.topupTitle.textContent = `Menabung untuk: ${target.nama}`;
    els.inputs.jumlahTopup.value = "";
    els.modals.topup.style.display = "flex";
};

// Toggle Lihat Rincian
window.toggleHistory = function(id) {
    const el = document.getElementById(id);
    el.classList.toggle("show");
};

/* ============================
   FORM SUBMITS
============================ */
// 1. Submit Transaksi
document.getElementById("transaksiForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const nama = document.getElementById("namaTransaksi").value;
    const jumlah = parseInt(document.getElementById("jumlahTransaksi").value);
    const jenis = document.getElementById("jenisTransaksi").value;
    transaksi.push({nama, jumlah, jenis});
    e.target.reset(); saveData();
});

// 2. Submit Saldo Dompet
document.getElementById("saldoForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const nama = document.getElementById("namaSaldo").value;
    const jumlah = parseInt(document.getElementById("jumlahSaldo").value);
    transaksi.push({ nama, jumlah, jenis: "pemasukan" });
    e.target.reset(); els.modals.saldo.style.display = "none"; saveData();
});

// 3. Submit Target Baru
document.getElementById("nabungForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const nama = document.getElementById("namaTabungan").value;
    const jumlah = parseInt(document.getElementById("jumlahTarget").value);
    // Init target dengan terkumpul 0 & history kosong
    nabungTargets.push({ nama, jumlah, terkumpul: 0, history: [] });
    e.target.reset(); saveData();
});

// 4. Submit ISI TABUNGAN (Topup)
document.getElementById("topupForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const index = els.inputs.topupIndex.value;
    const amount = parseInt(els.inputs.jumlahTopup.value);
    
    if(amount > 0) {
        const today = new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'short'});
        
        // Update Data Nabung
        nabungTargets[index].terkumpul += amount;
        nabungTargets[index].history.push({ date: today, amount: amount });
        
        saveData();
        els.modals.topup.style.display = "none";

        // Cek Jika Penuh -> PESTA!
        if(nabungTargets[index].terkumpul >= nabungTargets[index].jumlah) {
            triggerConfetti();
        }
    }
});

document.getElementById("budgetForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const nama = document.getElementById("namaBudget").value;
    const jumlah = parseInt(document.getElementById("jumlahBudget").value);
    budgets.push({nama, jumlah});
    e.target.reset(); saveData();
});

/* ============================
   GLOBAL & ONLOAD
============================ */
window.hapusData = function(type, index) {
    if(confirm("Hapus item ini?")) {
        if(type === 'transaksi') transaksi.splice(index, 1);
        if(type === 'budget') budgets.splice(index, 1);
        if(type === 'nabung') nabungTargets.splice(index, 1);
        saveData();
    }
};

window.hapusSemua = function(type) {
    if(confirm("Reset semua?")) {
        transaksi = []; saveData();
    }
};

// Mode Gelap
document.getElementById("modeToggle").addEventListener("click", function() {
    document.body.classList.toggle("dark");
    this.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
});

// INIT: Cek Confetti Saat Awal Masuk
updateUI();
setTimeout(() => {
    // Jika ada satu saja target yang sudah lunas saat load, confetti muncul!
    const adaYangLunas = nabungTargets.some(n => n.terkumpul >= n.jumlah);
    if(adaYangLunas) {
        triggerConfetti();
    }
}, 500); // Delay sedikit biar halaman siap dulu
