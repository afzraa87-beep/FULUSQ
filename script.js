/* ============================
   STATE & INITIALIZATION
============================ */
let transaksi = JSON.parse(localStorage.getItem("transaksi")) || [];
let budgets = JSON.parse(localStorage.getItem("budgets")) || [];
let nabungTargets = JSON.parse(localStorage.getItem("nabungTargets")) || [];

// Migrasi data lama (handle user dari versi sebelumnya)
nabungTargets = nabungTargets.map(n => ({
    nama: n.nama,
    jumlah: n.jumlah || n.target,
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
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 2000 };
    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        const particleCount = 50 * (timeLeft / duration);
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
    const totalPemasukan = transaksi.filter(t => t.jenis === "pemasukan").reduce((a, b) => a + b.jumlah, 0);
    const totalPengeluaran = transaksi.filter(t => t.jenis === "pengeluaran").reduce((a, b) => a + b.jumlah, 0);
    const saldo = totalPemasukan - totalPengeluaran;

    els.display.saldo.textContent = formatRupiah(saldo);
    els.display.pemasukan.textContent = formatRupiah(totalPemasukan);
    els.display.pengeluaran.textContent = formatRupiah(totalPengeluaran);
    renderLists();
}

function renderLists() {
    // Transaksi
    els.lists.transaksi.innerHTML = "";
    if(transaksi.length === 0) els.lists.transaksi.innerHTML = "<li style='justify-content:center; color:#aaa; border:none;'>Belum ada transaksi</li>";
    
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

    // Budget
    els.lists.budget.innerHTML = "";
    budgets.forEach((b, i) => {
        const li = document.createElement("li");
        li.style.display = "block";
        li.innerHTML = `
            <div style="display:flex; justify-content:space-between;"><strong>${b.nama}</strong><span>${formatRupiah(b.jumlah)}</span></div>
            <div style="text-align:right; margin-top:8px;"><button class="btn-text-danger" onclick="hapusData('budget', ${i})">Hapus</button></div>
        `;
        els.lists.budget.appendChild(li);
    });

    // Nabung
    els.lists.nabung.innerHTML = "";
    nabungTargets.forEach((n, i) => {
        const percent = Math.min((n.terkumpul / n.jumlah) * 100, 100);
        const isFull = n.terkumpul >= n.jumlah;
        let historyHTML = n.history.length ? n.history.map(h => `
            <div class="history-item"><span>${h.date}</span><span>+ ${formatRupiah(h.amount)}</span></div>
        `).join('') : `<div class="history-item" style="justify-content:center;">Belum ada tabungan masuk</div>`;

        const li = document.createElement("li");
        li.style.display = "block";
        li.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <div><strong>${n.nama} ${isFull ? '<span class="badge-complete">LUNAS! 🎉</span>' : ''}</strong></div>
                <span class="amount" style="color:var(--primary)">${formatRupiah(n.terkumpul)} / ${formatRupiah(n.jumlah)}</span>
            </div>
            <div class="progress-wrapper">
                <div class="progress-fill" style="width: ${percent}%; background-color: ${isFull ? 'var(--success)' : 'var(--accent)'}"></div>
            </div>
            <div class="action-btn-group">
                <button class="btn-small btn-topup" onclick="openTopupModal(${i})">➕ Isi</button>
                <button class="btn-small btn-history" onclick="toggleHistory('hist-${i}')">📜 Rincian</button>
                <button class="delete-icon" onclick="hapusData('nabung', ${i})" style="margin-left:auto">&times;</button>
            </div>
            <div id="hist-${i}" class="history-box"><strong>Riwayat Masuk:</strong>${historyHTML}</div>
        `;
        els.lists.nabung.appendChild(li);
    });
}

/* ============================
   INTERAKSI (MODAL & FORMS)
============================ */
window.closeModal = (id) => document.getElementById(id).style.display = "none";
document.getElementById("btnInputSaldo").onclick = () => els.modals.saldo.style.display = "flex";

window.openTopupModal = function(index) {
    els.inputs.topupIndex.value = index;
    els.inputs.topupTitle.textContent = `Menabung untuk: ${nabungTargets[index].nama}`;
    els.inputs.jumlahTopup.value = "";
    els.modals.topup.style.display = "flex";
};

window.toggleHistory = (id) => document.getElementById(id).classList.toggle("show");

/* ============================
   SUBMIT HANDLERS
============================ */
document.getElementById("transaksiForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const nama = document.getElementById("namaTransaksi").value;
    const jumlah = parseInt(document.getElementById("jumlahTransaksi").value);
    const jenis = document.getElementById("jenisTransaksi").value;
    if(nama && jumlah) { transaksi.push({nama, jumlah, jenis}); e.target.reset(); saveData(); }
});

document.getElementById("saldoForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const nama = document.getElementById("namaSaldo").value;
    const jumlah = parseInt(document.getElementById("jumlahSaldo").value);
    if(nama && jumlah) {
        transaksi.push({ nama, jumlah, jenis: "pemasukan" });
        e.target.reset(); els.modals.saldo.style.display = "none"; saveData();
    }
});

document.getElementById("nabungForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const nama = document.getElementById("namaTabungan").value;
    const jumlah = parseInt(document.getElementById("jumlahTarget").value);
    if(nama && jumlah) {
        nabungTargets.push({ nama, jumlah, terkumpul: 0, history: [] });
        e.target.reset(); saveData();
    }
});

document.getElementById("topupForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const index = els.inputs.topupIndex.value;
    const amount = parseInt(els.inputs.jumlahTopup.value);
    if(amount > 0) {
        const today = new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'short'});
        nabungTargets[index].terkumpul += amount;
        nabungTargets[index].history.push({ date: today, amount: amount });
        saveData();
        els.modals.topup.style.display = "none";
        if(nabungTargets[index].terkumpul >= nabungTargets[index].jumlah) triggerConfetti();
    }
});

document.getElementById("budgetForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const nama = document.getElementById("namaBudget").value;
    const jumlah = parseInt(document.getElementById("jumlahBudget").value);
    if(nama && jumlah) { budgets.push({nama, jumlah}); e.target.reset(); saveData(); }
});

/* ============================
   GLOBAL HELPERS
============================ */
window.hapusData = function(type, index) {
    if(confirm("Yakin ingin menghapus data ini?")) {
        if(type === 'transaksi') transaksi.splice(index, 1);
        if(type === 'budget') budgets.splice(index, 1);
        if(type === 'nabung') nabungTargets.splice(index, 1);
        saveData();
    }
};

window.hapusSemua = function(type) {
    if(confirm("Reset SEMUA data transaksi? Data tidak bisa kembali.")) {
        transaksi = []; saveData();
    }
};

document.getElementById("modeToggle").addEventListener("click", function() {
    document.body.classList.toggle("dark");
    this.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
});

// INIT
updateUI();
setTimeout(() => {
    if(nabungTargets.some(n => n.terkumpul >= n.jumlah)) triggerConfetti();
}, 800);
