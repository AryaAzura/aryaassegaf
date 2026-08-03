/* ============================================================
   Sistem Pakar — App Logic (Vanilla JS + PHP/MySQL Backend)
   Features: CRUD Gejala, CRUD Kerusakan, CRUD Kasus (CBR), Diagnosa
   Data persisted in XAMPP MySQL Database via PHP API
   ============================================================ */

// Data storage in memory (synced with PHP API)
let dataGejala    = [];
let dataKerusakan = [];
let dataRules     = [];
let dataRiwayat   = []; // Riwayat diagnosa (admin)

// Helper API Fetcher
async function loadData(endpoint) {
  try {
    const response = await fetch(`api/${endpoint}.php`, { credentials: 'same-origin' });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error(`Gagal memuat data ${endpoint}:`, err);
    showToast(`Gagal memuat data ${endpoint} dari server PHP/MySQL`, 'error');
    return [];
  }
}

async function refreshAllData() {
  dataGejala    = await loadData('gejala');
  dataKerusakan = await loadData('kerusakan');
  dataRules     = await loadData('rule');

  renderGejala();
  renderKerusakan();
  renderRules();
  renderDiagnosaCheckboxes(); // selalu render ulang setelah data fresh
  updateStats();
}

// ==================== ROLE RESTRICTIONS ====================
function applyRoleRestrictions(role) {
  if (role === 'admin') return; // Admin: akses penuh

  // Tandai body dengan class role agar CSS bisa ikut menyembunyikan
  document.body.classList.add('role-user');

  // ── Sembunyikan & nonaktifkan tab admin-only ──
  const adminTabIds   = ['tabBtnGejala', 'tabBtnKerusakan', 'tabBtnRule', 'tabBtnRiwayat'];
  const adminPanelIds = ['panelGejala',  'panelKerusakan',  'panelRule',  'panelRiwayat'];

  adminTabIds.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.cssText = 'display:none!important';
    // Ganti node untuk membuang semua event listener tab
    const clone = el.cloneNode(true);
    clone.style.cssText = 'display:none!important';
    el.parentNode.replaceChild(clone, el);
  });

  adminPanelIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.cssText = 'display:none!important';
  });

  // ── Sembunyikan Export & Import (sembunyikan kontainernya sekaligus) ──
  ['btnExport', 'btnImport', 'fileInput', 'headerDataActions'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.cssText = 'display:none!important';
  });

  // ── Sembunyikan header stats ──
  const headerStats = document.getElementById('headerStats');
  if (headerStats) headerStats.style.cssText = 'display:none!important';

  // ── Paksa aktifkan tab Diagnosa ──
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => {
    p.classList.remove('active');
    // Jangan sentuh display panel yang sudah disembunyikan di atas
  });

  const diagBtn   = document.getElementById('tabBtnDiagnosa');
  const diagPanel = document.getElementById('panelDiagnosa');
  if (diagBtn)   diagBtn.classList.add('active');
  if (diagPanel) {
    diagPanel.classList.add('active');
    diagPanel.style.cssText = ''; // pastikan panel diagnosa terlihat
    // renderDiagnosaCheckboxes() akan dipanggil oleh refreshAllData() setelah data loaded
  }
}


// ==================== INITIAL LOAD ====================
document.addEventListener('DOMContentLoaded', async () => {
  // ── Tunggu auth check selesai (await Promise dari index.html) ──
  const user = await (window.__authReady || Promise.resolve(null));
  if (!user) return; // sudah redirect ke login.html

  // ── Tampilkan info user di header ──
  const elNama = document.getElementById('userNamaHeader');
  const elRole = document.getElementById('userRoleHeader');
  if (elNama) elNama.textContent = user.nama || user.username;
  if (elRole) elRole.textContent = user.role;

  // ── Terapkan pembatasan role SEBELUM render apapun ──
  applyRoleRestrictions(user.role);

  // ── Logout button ──
  const btnLogout = document.getElementById('btnLogout');
  if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
      btnLogout.disabled = true;
      btnLogout.textContent = 'Keluar...';
      try {
        await fetch('api/auth.php?action=logout', { credentials: 'same-origin' });
      } catch (_) {}
      try { localStorage.removeItem('sp_laporan_data'); } catch (_) {}
      window.location.replace('login.html');
    });
  }

  refreshAllData();
  attachEventListeners();
});



// ==================== TAB SWITCHING ====================
const tabBtns = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    tabBtns.forEach(b => b.classList.remove('active'));
    tabPanels.forEach(p => p.classList.remove('active'));
    btn.classList.add('active');

    const panelId = {
      gejala:    'panelGejala',
      kerusakan: 'panelKerusakan',
      rule:      'panelRule',
      riwayat:   'panelRiwayat',
      diagnosa:  'panelDiagnosa',
    }[tab];

    document.getElementById(panelId).classList.add('active');

    if (tab === 'diagnosa') renderDiagnosaCheckboxes();
    if (tab === 'riwayat')  loadRiwayat();
  });
});

// ==================== STATS ====================
function updateStats() {
  document.getElementById('statGejala').textContent = dataGejala.length;
  document.getElementById('statKerusakan').textContent = dataKerusakan.length;
  document.getElementById('statRule').textContent = dataRules.length;
}

// ==================== TOAST ====================
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icons = {
    success: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    error: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    warning: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  };

  toast.innerHTML = `${icons[type] || icons.success}<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);
}

// ==================== CONFIRM DIALOG ====================
let confirmCallback = null;

function showConfirm(title, message, callback) {
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmMsg').textContent = message;
  document.getElementById('confirmOverlay').classList.add('show');
  confirmCallback = callback;

  document.getElementById('btnConfirmYes').onclick = () => {
    const cb = confirmCallback; // Capture sebelum closeConfirm menghapusnya
    closeConfirm();
    if (cb) cb();
  };
}

function closeConfirm() {
  document.getElementById('confirmOverlay').classList.remove('show');
  confirmCallback = null;
}

// ==================== MODAL SYSTEM ====================
let currentModalType = null;
let currentEditId = null;

function openModal(type, editId = null) {
  currentModalType = type;
  currentEditId = editId;

  const overlay = document.getElementById('modalOverlay');
  const title = document.getElementById('modalTitle');
  const body = document.getElementById('modalBody');

  // Reset button label setiap kali modal dibuka
  const btnSave = document.getElementById('btnModalSave');
  if (btnSave) btnSave.textContent = 'Simpan';

  if (type === 'gejala') {
    const item = editId !== null ? dataGejala.find(g => String(g.id) === String(editId)) : null;
    title.textContent = item ? 'Edit Gejala' : 'Tambah Gejala';
    const currentBobot = item ? (item.bobot ?? 0.5) : 0.5;
    const bobotOptions = [0.0,0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1.0].map(v => {
      const vStr = v.toFixed(1);
      const selected = parseFloat(currentBobot).toFixed(1) === vStr ? 'selected' : '';
      return `<option value="${vStr}" ${selected}>${vStr}</option>`;
    }).join('');
    body.innerHTML = `
      <div class="form-group">
        <label for="inputKodeGejala">Kode Gejala</label>
        <input type="text" class="form-input" id="inputKodeGejala" placeholder="Contoh: G01" value="${item ? item.kode : generateCode('G', dataGejala)}" ${item ? 'readonly style="opacity:0.6;cursor:not-allowed"' : ''}>
      </div>
      <div class="form-group">
        <label for="inputNamaGejala">Nama Gejala</label>
        <input type="text" class="form-input" id="inputNamaGejala" placeholder="Masukkan nama gejala..." value="${item ? escapeHtml(item.nama) : ''}">
      </div>
      <div class="form-group">
        <label for="selectBobotGejala">Bobot Gejala (CBR)</label>
        <select class="form-input" id="selectBobotGejala">${bobotOptions}</select>
        <small style="color:var(--text-muted);font-size:0.75rem;margin-top:4px;display:block;">Bobot menentukan tingkat kepentingan gejala dalam pencocokan kasus (0.0 = tidak berpengaruh, 1.0 = paling kuat).</small>
      </div>
    `;
  } else if (type === 'kerusakan') {
    const item = editId !== null ? dataKerusakan.find(k => String(k.id) === String(editId)) : null;
    title.textContent = item ? 'Edit Kerusakan' : 'Tambah Kerusakan';
    body.innerHTML = `
      <div class="form-group">
        <label for="inputKodeKerusakan">Kode Kerusakan</label>
        <input type="text" class="form-input" id="inputKodeKerusakan" placeholder="Contoh: K01" value="${item ? item.kode : generateCode('K', dataKerusakan)}" ${item ? 'readonly style="opacity:0.6;cursor:not-allowed"' : ''}>
      </div>
      <div class="form-group">
        <label for="inputNamaKerusakan">Nama Kerusakan</label>
        <input type="text" class="form-input" id="inputNamaKerusakan" placeholder="Masukkan nama kerusakan..." value="${item ? escapeHtml(item.nama) : ''}">
      </div>
      <div class="form-group">
        <label for="inputSolusi">Solusi / Penanganan</label>
        <textarea class="form-input" id="inputSolusi" placeholder="Masukkan solusi penanganan...">${item ? escapeHtml(item.solusi || '') : ''}</textarea>
      </div>
    `;
  } else if (type === 'rule') {
    if (dataKerusakan.length === 0 || dataGejala.length === 0) {
      showToast('Tambahkan Gejala dan Kerusakan terlebih dahulu!', 'warning');
      return;
    }
    const item = editId !== null ? dataRules.find(r => String(r.id) === String(editId)) : null;
    title.textContent = item ? 'Edit Kasus' : 'Tambah Kasus';

    let kerusakanOptions = dataKerusakan.map(k =>
      `<option value="${k.id}" ${item && String(item.kerusakanId) === String(k.id) ? 'selected' : ''}>${k.kode} - ${escapeHtml(k.nama)}</option>`
    ).join('');

    let gejalaCheckboxes = dataGejala.map(g => {
      const checked = item && item.gejalaIds.some(gid => String(gid) === String(g.id)) ? 'checked' : '';
      return `
        <div class="modal-checkbox-item" onclick="this.querySelector('input').click()">
          <input type="checkbox" value="${g.id}" ${checked} onclick="event.stopPropagation()">
          <label onclick="event.stopPropagation()">${g.kode} - ${escapeHtml(g.nama)}</label>
        </div>
      `;
    }).join('');

    body.innerHTML = `
      <div class="form-group">
        <label for="selectKerusakan">Kerusakan</label>
        <select class="form-input" id="selectKerusakan" ${item ? 'disabled style="opacity:0.7"' : ''}>
          <option value="">-- Pilih Kerusakan --</option>
          ${kerusakanOptions}
        </select>
      </div>
      <div class="form-group">
        <label>Gejala Terkait</label>
        <div class="modal-checkbox-list" id="ruleGejalaList">
          ${gejalaCheckboxes}
        </div>
      </div>
    `;
  } else if (type === 'revisi') {
    const record = dataRiwayat.find(r => String(r.id) === String(editId));
    if (!record) { showToast('Data riwayat tidak ditemukan', 'error'); return; }

    if (btnSave) btnSave.textContent = 'Simpan Revisi';
    title.textContent = `Revisi CBR — ${record.nama_pasien || 'Tanpa Nama'}`;

    // Gejala snapshot tags
    const gejalaHtml = (record.gejala_snapshot || []).map(g =>
      `<span class="gejala-tag">${g.kode} - ${escapeHtml(g.nama)} <small style="opacity:0.6">(bobot:${parseFloat(g.bobot ?? 0.5).toFixed(1)})</small></span>`
    ).join('') || '<span style="color:var(--text-muted)">—</span>';

    // Top 3 hasil CBR
    const hasilHtml = (record.hasil_cbr || []).slice(0, 3).map((h, i) => {
      const pct = h.percentage ?? 0;
      const c   = pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#8b5cf6';
      return `<div style="padding:8px 12px;margin-bottom:6px;background:var(--card-bg);border-radius:8px;border:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
        <span style="font-weight:600;color:var(--text-primary);font-size:0.87rem;">#${i+1} ${escapeHtml(h.nama || '?')}</span>
        <span style="font-weight:700;color:${c};font-size:0.9rem;">${pct}%</span>
      </div>`;
    }).join('') || '<p style="color:var(--text-muted);font-size:0.85rem;">Tidak ada hasil</p>';

    // Dropdown pilih diagnosa
    const kOpts = dataKerusakan.map(k =>
      `<option value="${k.id}" ${String(k.id) === String(record.diagnosa_revisi_id ?? record.diagnosa_sistem_id) ? 'selected' : ''}>${k.kode} - ${escapeHtml(k.nama)}</option>`
    ).join('');

    body.innerHTML = `
      <div style="margin-bottom:14px;">
        <div style="font-size:0.7rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;font-weight:700;margin-bottom:8px;">Gejala Pasien (${(record.gejala_snapshot||[]).length} gejala)</div>
        <div class="gejala-tags">${gejalaHtml}</div>
      </div>
      <div style="margin-bottom:14px;">
        <div style="font-size:0.7rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;font-weight:700;margin-bottom:8px;">Hasil Diagnosa Sistem CBR (Top 3)</div>
        ${hasilHtml}
      </div>
      <hr style="border:none;border-top:1px solid var(--border);margin:16px 0;">
      <div style="font-size:0.75rem;color:var(--accent);font-weight:700;margin-bottom:12px;letter-spacing:0.03em;">✅ FASE REVISE — VALIDASI ADMIN</div>
      <div class="form-group">
        <label for="selectDiagnosaRevisi">Diagnosa yang Benar</label>
        <select class="form-input" id="selectDiagnosaRevisi">
          <option value="">— Pilih diagnosa yang tepat —</option>
          ${kOpts}
        </select>
      </div>
      <div class="form-group">
        <label for="inputCatatanRevisi">Catatan Revisi</label>
        <textarea class="form-input" id="inputCatatanRevisi" rows="3" placeholder="Tambahkan alasan atau catatan revisi...">${escapeHtml(record.catatan_revisi || '')}</textarea>
      </div>
    `;
  }

  overlay.classList.add('show');
  setTimeout(() => {
    const firstInput = body.querySelector('input:not([readonly]), select, textarea');
    if (firstInput) firstInput.focus();
  }, 300);
}

function closeModal(event) {
  if (event && event.target !== document.getElementById('modalOverlay')) return;
  document.getElementById('modalOverlay').classList.remove('show');
  currentModalType = null;
  currentEditId = null;
}

function saveModal() {
  if (currentModalType === 'gejala')    saveGejala();
  else if (currentModalType === 'kerusakan') saveKerusakan();
  else if (currentModalType === 'rule')      saveRule();
  else if (currentModalType === 'revisi')    saveRevisi();
}

// ==================== GEJALA CRUD ====================
function generateCode(prefix, dataArray) {
  if (dataArray.length === 0) return `${prefix}01`;
  const nums = dataArray.map(d => {
    const match = d.kode.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  });
  const next = Math.max(...nums) + 1;
  return `${prefix}${String(next).padStart(2, '0')}`;
}

async function saveGejala() {
  const kode  = document.getElementById('inputKodeGejala').value.trim();
  const nama  = document.getElementById('inputNamaGejala').value.trim();
  const bobot = parseFloat(document.getElementById('selectBobotGejala')?.value ?? '0.5');

  if (!kode || !nama) {
    showToast('Kode dan Nama Gejala wajib diisi!', 'error');
    return;
  }

  try {
    if (currentEditId) {
      const res = await fetch(`api/gejala.php?id=${currentEditId}`, {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kode, nama, bobot })
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Gagal update gejala');
      showToast('Gejala berhasil diperbarui');
    } else {
      const res = await fetch('api/gejala.php', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kode, nama, bobot })
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Gagal tambah gejala');
      showToast('Gejala berhasil ditambahkan');
    }
    dataGejala = await loadData('gejala');
    renderGejala();
    updateStats();
    closeModal();
  } catch (err) {
    console.error(err);
    showToast(err.message || 'Operasi gagal', 'error');
  }
}

function deleteGejala(id) {
  const item = dataGejala.find(g => String(g.id) === String(id));
  showConfirm('Hapus Gejala', `Yakin ingin menghapus gejala "${item?.nama}"?`, async () => {
    try {
      const res = await fetch(`api/gejala.php?id=${id}`, { method: 'DELETE', credentials: 'same-origin' });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Gagal hapus gejala');

      dataGejala = await loadData('gejala');
      dataRules = await loadData('rule');
      renderGejala();
      renderRules();
      updateStats();
      showToast('Gejala berhasil dihapus');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Gagal menghapus gejala', 'error');
    }
  });
}

function renderGejala() {
  const tbody = document.getElementById('tbodyGejala');
  const empty = document.getElementById('emptyGejala');
  const table = document.getElementById('tableGejala');
  const searchInput = document.getElementById('searchGejala');
  const search = searchInput ? searchInput.value.toLowerCase() : '';

  const filtered = dataGejala.filter(g =>
    g.kode.toLowerCase().includes(search) || g.nama.toLowerCase().includes(search)
  );

  if (filtered.length === 0) {
    table.style.display = 'none';
    empty.classList.add('show');
  } else {
    table.style.display = '';
    empty.classList.remove('show');
  }

  // Warna bobot: merah (0.0) → kuning (0.5) → hijau (1.0)
  function getBobotColor(b) {
    if (b >= 0.8) return '#22c55e';
    if (b >= 0.6) return '#84cc16';
    if (b >= 0.4) return '#f59e0b';
    if (b >= 0.2) return '#f97316';
    return '#64748b';
  }
  tbody.innerHTML = filtered.map(g => {
    const bobot = parseFloat(g.bobot ?? 0.5).toFixed(1);
    const color = getBobotColor(parseFloat(bobot));
    return `
    <tr>
      <td><span class="code-badge">${g.kode}</span></td>
      <td style="color:var(--text-primary);font-weight:500">${escapeHtml(g.nama)}</td>
      <td>
        <span style="display:inline-flex;align-items:center;gap:5px;font-size:0.82rem;font-weight:700;padding:3px 12px;border-radius:20px;background:${color}22;color:${color};border:1px solid ${color}55;font-family:monospace;">
          ${bobot}
        </span>
      </td>
      <td>
        <div class="action-btns">
          <button class="btn-icon" title="Edit" onclick="openModal('gejala','${g.id}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn-icon danger" title="Hapus" onclick="deleteGejala('${g.id}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `;
  }).join('');
}

// ==================== KERUSAKAN CRUD ====================
async function saveKerusakan() {
  const kode = document.getElementById('inputKodeKerusakan').value.trim();
  const nama = document.getElementById('inputNamaKerusakan').value.trim();
  const solusi = document.getElementById('inputSolusi').value.trim();

  if (!kode || !nama) {
    showToast('Kode dan Nama Kerusakan wajib diisi!', 'error');
    return;
  }

  try {
    if (currentEditId) {
      const res = await fetch(`api/kerusakan.php?id=${currentEditId}`, {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kode, nama, solusi })
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Gagal update kerusakan');
      showToast('Kerusakan berhasil diperbarui');
    } else {
      const res = await fetch('api/kerusakan.php', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kode, nama, solusi })
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Gagal tambah kerusakan');
      showToast('Kerusakan berhasil ditambahkan');
    }
    dataKerusakan = await loadData('kerusakan');
    renderKerusakan();
    updateStats();
    closeModal();
  } catch (err) {
    console.error(err);
    showToast(err.message || 'Operasi gagal', 'error');
  }
}

function deleteKerusakan(id) {
  const item = dataKerusakan.find(k => String(k.id) === String(id));
  showConfirm('Hapus Kerusakan', `Yakin ingin menghapus kerusakan "${item?.nama}"?`, async () => {
    try {
      const res = await fetch(`api/kerusakan.php?id=${id}`, { method: 'DELETE', credentials: 'same-origin' });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Gagal hapus kerusakan');

      dataKerusakan = await loadData('kerusakan');
      dataRules = await loadData('rule');
      renderKerusakan();
      renderRules();
      updateStats();
      showToast('Kerusakan berhasil dihapus');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Gagal menghapus kerusakan', 'error');
    }
  });
}

function renderKerusakan() {
  const tbody = document.getElementById('tbodyKerusakan');
  const empty = document.getElementById('emptyKerusakan');
  const table = document.getElementById('tableKerusakan');
  const searchInput = document.getElementById('searchKerusakan');
  const search = searchInput ? searchInput.value.toLowerCase() : '';

  const filtered = dataKerusakan.filter(k =>
    k.kode.toLowerCase().includes(search) || k.nama.toLowerCase().includes(search)
  );

  if (filtered.length === 0) {
    table.style.display = 'none';
    empty.classList.add('show');
  } else {
    table.style.display = '';
    empty.classList.remove('show');
  }

  tbody.innerHTML = filtered.map(k => `
    <tr>
      <td><span class="code-badge">${k.kode}</span></td>
      <td style="color:var(--text-primary);font-weight:500">${escapeHtml(k.nama)}</td>
      <td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${escapeHtml(k.solusi)}">${k.solusi ? escapeHtml(k.solusi) : '<span style="color:var(--text-muted)">—</span>'}</td>
      <td>
        <div class="action-btns">
          <button class="btn-icon" title="Edit" onclick="openModal('kerusakan','${k.id}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn-icon danger" title="Hapus" onclick="deleteKerusakan('${k.id}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ==================== KASUS (CBR) CRUD ====================
async function saveRule() {
  const selectKerusakan = document.getElementById('selectKerusakan');
  const kerusakanId = selectKerusakan.value;
  const checkboxes = document.querySelectorAll('#ruleGejalaList input[type="checkbox"]:checked');
  const gejalaIds = Array.from(checkboxes).map(cb => cb.value);

  if (!kerusakanId) {
    showToast('Pilih kerusakan terlebih dahulu!', 'error');
    return;
  }

  if (gejalaIds.length === 0) {
    showToast('Pilih minimal 1 gejala!', 'error');
    return;
  }

  try {
    if (currentEditId) {
      const res = await fetch(`api/rule.php?id=${currentEditId}`, {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kerusakanId, gejalaIds })
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Gagal update kasus');
      showToast('Kasus berhasil diperbarui');
    } else {
      const res = await fetch('api/rule.php', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kerusakanId, gejalaIds })
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Gagal tambah kasus');
      showToast('Kasus berhasil ditambahkan');
    }
    dataRules = await loadData('rule');
    renderRules();
    updateStats();
    closeModal();
  } catch (err) {
    console.error(err);
    showToast(err.message || 'Operasi gagal', 'error');
  }
}

function deleteRule(id) {
  showConfirm('Hapus Kasus', 'Yakin ingin menghapus kasus ini?', async () => {
    try {
      const res = await fetch(`api/rule.php?id=${id}`, { method: 'DELETE', credentials: 'same-origin' });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Gagal hapus kasus');

      dataRules = await loadData('rule');
      renderRules();
      updateStats();
      showToast('Kasus berhasil dihapus');
    } catch (err) {
      showToast(err.message || 'Gagal menghapus kasus', 'error');
    }
  });
}

function renderRules() {
  const tbody = document.getElementById('tbodyRule');
  const empty = document.getElementById('emptyRule');
  const table = document.getElementById('tableRule');

  if (dataRules.length === 0) {
    table.style.display = 'none';
    empty.classList.add('show');
  } else {
    table.style.display = '';
    empty.classList.remove('show');
  }

  tbody.innerHTML = dataRules.map((r, index) => {
    const kerusakan = dataKerusakan.find(k => String(k.id) === String(r.kerusakanId));
    const gejalaTags = r.gejalaIds.map(gid => {
      const gejala = dataGejala.find(g => String(g.id) === String(gid));
      return gejala ? `<span class="gejala-tag">${gejala.kode} - ${escapeHtml(gejala.nama)}</span>` : '';
    }).join('');

    return `
      <tr>
        <td style="color:var(--text-muted);font-weight:600">${index + 1}</td>
        <td>
          <span class="kerusakan-badge">
            ${kerusakan ? `${kerusakan.kode} - ${escapeHtml(kerusakan.nama)}` : '<i>Tidak ditemukan</i>'}
          </span>
        </td>
        <td>
          <div class="gejala-tags">${gejalaTags || '<span style="color:var(--text-muted)">—</span>'}</div>
        </td>
        <td>
          <div class="action-btns">
            <button class="btn-icon" title="Edit Kasus" onclick="openModal('rule','${r.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn-icon danger" title="Hapus Kasus" onclick="deleteRule('${r.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// ==================== DIAGNOSA ====================
function renderDiagnosaCheckboxes() {
  const container = document.getElementById('diagnosaGejalaList');

  if (dataGejala.length === 0) {
    container.innerHTML = '<p class="text-muted">Tidak ada gejala tersedia. Tambahkan gejala terlebih dahulu.</p>';
    return;
  }

  container.innerHTML = dataGejala.map(g => `
    <div class="checkbox-item" onclick="toggleCheckbox(this)">
      <input type="checkbox" id="diag_${g.id}" value="${g.id}" onclick="event.stopPropagation()">
      <label for="diag_${g.id}" onclick="event.stopPropagation()"><span class="cb-code">${g.kode}</span>${escapeHtml(g.nama)}</label>
    </div>
  `).join('');
}

function toggleCheckbox(el) {
  const cb = el.querySelector('input[type="checkbox"]');
  if (cb) cb.checked = !cb.checked;
}

function resetDiagnosa() {
  const checkboxes = document.querySelectorAll('#diagnosaGejalaList input[type="checkbox"]');
  checkboxes.forEach(cb => cb.checked = false);
  document.getElementById('resultPlaceholder').style.display = '';
  document.getElementById('resultContent').style.display = 'none';
  // Hide print button
  const btnCetak = document.getElementById('btnCetakLaporan');
  if (btnCetak) btnCetak.style.display = 'none';
  lastDiagnosaResults = null;
  lastSelectedGejalaIds = [];
  showToast('Diagnosa direset', 'warning');
}

// Store last diagnosa results for printing
let lastDiagnosaResults = null;
let lastSelectedGejalaIds = [];

// ==================== CBR: Weighted Nearest Neighbor Similarity ====================
// Rumus: Similarity = (Σ bobot gejala pasien yg cocok dgn kasus)
//                    / (Σ bobot seluruh gejala pada kasus basis) × 100
function prosesDiagnosa() {
  const checkboxes = document.querySelectorAll('#diagnosaGejalaList input[type="checkbox"]:checked');
  const selectedGejalaIds = Array.from(checkboxes).map(cb => String(cb.value));

  if (selectedGejalaIds.length === 0) {
    showToast('Pilih minimal 1 gejala!', 'warning');
    return;
  }

  if (dataRules.length === 0) {
    showToast('Belum ada kasus! Tambahkan kasus basis terlebih dahulu.', 'warning');
    return;
  }

  // Buat map gejalaId → bobot untuk lookup O(1)
  const bobotMap = {};
  dataGejala.forEach(g => { bobotMap[String(g.id)] = parseFloat(g.bobot ?? 0.5); });

  // CBR: Hitung kemiripan berbasis bobot (Weighted Nearest Neighbor)
  const results = dataRules.map(rule => {
    const ruleGejalaIds = rule.gejalaIds.map(String);

    // Gejala kasus yang cocok dengan pilihan pasien
    const matched = ruleGejalaIds.filter(gid => selectedGejalaIds.includes(gid));

    // Bobot gejala yang cocok (pembilang)
    const bobotMatched = matched.reduce((sum, gid) => sum + (bobotMap[gid] ?? 0.5), 0);

    // Total bobot seluruh gejala pada kasus basis (penyebut)
    const bobotTotal = ruleGejalaIds.reduce((sum, gid) => sum + (bobotMap[gid] ?? 0.5), 0);

    const similarity = bobotTotal > 0 ? (bobotMatched / bobotTotal) * 100 : 0;
    const kerusakan  = dataKerusakan.find(k => String(k.id) === String(rule.kerusakanId));

    return {
      rule,
      kerusakan,
      matchedCount:    matched.length,
      totalGejala:     ruleGejalaIds.length,
      bobotMatched,
      bobotTotal,
      percentage:      Math.round(similarity * 10) / 10,
      matchedGejalaIds: matched,
    };
  })
    .filter(r => r.percentage > 0)
    .sort((a, b) => b.percentage - a.percentage);

  lastDiagnosaResults  = results;
  lastSelectedGejalaIds = selectedGejalaIds;

  // Auto-save riwayat ke DB (fire-and-forget)
  saveRiwayat(results, selectedGejalaIds);

  const placeholder = document.getElementById('resultPlaceholder');
  const content = document.getElementById('resultContent');
  const btnCetak = document.getElementById('btnCetakLaporan');

  if (results.length === 0) {
    if (btnCetak) btnCetak.style.display = 'none';
    placeholder.style.display = 'none';
    content.style.display = 'block';
    content.innerHTML = `
      <div class="no-result-msg">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        <p>Tidak ada kerusakan yang cocok</p>
        <span style="font-size:0.8rem;color:var(--text-muted)">Gejala yang dipilih tidak sesuai dengan kasus yang ada</span>
      </div>
    `;
    return;
  }

  placeholder.style.display = 'none';
  content.style.display = 'block';

  content.innerHTML = `
    <h3 style="font-size:0.95rem;font-weight:600;margin-bottom:14px;">Hasil Diagnosa — <span style="font-weight:400;color:var(--text-muted);">Metode Case-Based Reasoning (CBR)</span></h3>
    ${results.map((r, i) => {
      const matchedGejala = r.matchedGejalaIds.map(gid => {
        const g = dataGejala.find(g => String(g.id) === String(gid));
        return g ? `<span class="gejala-tag">${g.kode} - ${escapeHtml(g.nama)} <span style="opacity:0.6;font-size:0.7em;">(bobot:${parseFloat(g.bobot ?? 0.5).toFixed(1)})</span></span>` : '';
      }).join('');

      let barColor = 'linear-gradient(90deg, var(--accent), #8b5cf6)';
      if (r.percentage >= 80) barColor = 'linear-gradient(90deg, #22c55e, #16a34a)';
      else if (r.percentage >= 50) barColor = 'linear-gradient(90deg, #f59e0b, #d97706)';

      return `
        <div class="result-card" style="animation-delay:${i * 0.1}s">
          <div class="result-rank">Hasil #${i + 1}</div>
          <div class="result-name">${r.kerusakan ? escapeHtml(r.kerusakan.nama) : 'Kerusakan tidak ditemukan'}</div>
          <div class="result-match">
            Kemiripan CBR: <strong>${r.percentage}%</strong>
            &nbsp;·&nbsp; Bobot cocok: <strong>${r.bobotMatched.toFixed(1)}</strong> / ${r.bobotTotal.toFixed(1)}
            &nbsp;·&nbsp; Gejala: ${r.matchedCount}/${r.totalGejala}
          </div>
          <div class="progress-bar-wrap">
            <div class="progress-bar" style="width:${r.percentage}%;background:${barColor}"></div>
          </div>
          <div style="margin-top:10px;">
            <div style="font-size:0.7rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;font-weight:600;margin-bottom:6px;">Gejala Cocok (dengan bobot):</div>
            <div class="gejala-tags">${matchedGejala}</div>
          </div>
          ${r.kerusakan && r.kerusakan.solusi ? `
            <div class="result-solusi">
              <strong>Solusi / Penanganan:</strong>
              ${escapeHtml(r.kerusakan.solusi)}
            </div>
          ` : ''}
        </div>
      `;
    }).join('')}
  `;

  // Show the print button after results rendered
  if (btnCetak) btnCetak.style.display = '';
}

// ==================== CETAK LAPORAN DIAGNOSA ====================
function cetakLaporan() {
  if (!lastDiagnosaResults || lastDiagnosaResults.length === 0) {
    showToast('Tidak ada hasil diagnosa untuk dicetak', 'warning');
    return;
  }

  const namaPasien = document.getElementById('inputNamaPasien')?.value.trim() || '';
  const namaPemeriksa = document.getElementById('inputNamaPemeriksa')?.value.trim() || '';

  // Build structured selected gejala list (sertakan bobot untuk laporan CBR)
  const selectedGejala = lastSelectedGejalaIds.map(gid => {
    const g = dataGejala.find(g => String(g.id) === String(gid));
    return g ? { id: g.id, kode: g.kode, nama: g.nama, bobot: parseFloat(g.bobot ?? 0.5) } : null;
  }).filter(Boolean);

  // Build structured result list (sertakan info CBR: bobotMatched, bobotTotal)
  const results = lastDiagnosaResults.map(r => ({
    kerusakan: r.kerusakan ? {
      id: r.kerusakan.id,
      kode: r.kerusakan.kode,
      nama: r.kerusakan.nama,
      solusi: r.kerusakan.solusi || ''
    } : null,
    percentage:   r.percentage,
    matchedCount: r.matchedCount,
    totalGejala:  r.totalGejala,
    bobotMatched: r.bobotMatched,
    bobotTotal:   r.bobotTotal,
    matchedGejala: r.matchedGejalaIds.map(gid => {
      const g = dataGejala.find(g => String(g.id) === String(gid));
      return g ? { id: g.id, kode: g.kode, nama: g.nama, bobot: parseFloat(g.bobot ?? 0.5) } : null;
    }).filter(Boolean)
  }));

  // Save to localStorage so laporan.html can read it
  const reportData = {
    namaPasien,
    namaPemeriksa,
    selectedGejala,
    results,
    timestamp: new Date().toISOString()
  };

  localStorage.setItem('sp_laporan_data', JSON.stringify(reportData));

  // Open laporan.html in a new tab
  window.open('laporan.html', '_blank');
}

// ==================== UTILITY ====================
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ==================== EXPORT & IMPORT ====================
function attachEventListeners() {
  const exportBtn = document.getElementById('btnExport');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      window.location.href = 'api/export.php';
    });
  }

  const importBtn = document.getElementById('btnImport');
  const fileInput = document.getElementById('fileInput');

  if (importBtn && fileInput) {
    importBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (file) handleImportFile(file);
      e.target.value = '';
    });
  }
}

async function handleImportFile(file) {
  const reader = new FileReader();
  reader.onload = async e => {
    try {
      const jsonContent = JSON.parse(e.target.result);
      const response = await fetch('api/import.php', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jsonContent)
      });
      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || 'Import gagal');

      showToast('Data berhasil di-import ke MySQL!');
      refreshAllData();
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Gagal import data', 'error');
    }
  };
  reader.readAsText(file);
}

// ==================== RIWAYAT DIAGNOSA ====================

/**
 * Auto-save riwayat setelah prosesDiagnosa() — fire-and-forget.
 * Dipanggil untuk semua role (user maupun admin).
 */
async function saveRiwayat(results, selectedGejalaIds) {
  try {
    const namaPasien    = document.getElementById('inputNamaPasien')?.value.trim()    || '';
    const namaPemeriksa = document.getElementById('inputNamaPemeriksa')?.value.trim() || '';

    const gejalaSnapshot = selectedGejalaIds.map(gid => {
      const g = dataGejala.find(g => String(g.id) === String(gid));
      return g ? { id: g.id, kode: g.kode, nama: g.nama, bobot: parseFloat(g.bobot ?? 0.5) } : null;
    }).filter(Boolean);

    const hasilCbr = results.map(r => ({
      kerusakanId:  r.kerusakan?.id   || null,
      nama:         r.kerusakan?.nama || null,
      kode:         r.kerusakan?.kode || null,
      solusi:       r.kerusakan?.solusi || '',
      percentage:   r.percentage,
      matchedCount: r.matchedCount,
      totalGejala:  r.totalGejala,
      bobotMatched: r.bobotMatched,
      bobotTotal:   r.bobotTotal,
      // Simpan detail gejala yang cocok per kerusakan agar cetak dari riwayat identik
      matchedGejala: r.matchedGejalaIds.map(gid => {
        const g = dataGejala.find(g => String(g.id) === String(gid));
        return g ? { id: g.id, kode: g.kode, nama: g.nama, bobot: parseFloat(g.bobot ?? 0.5) } : null;
      }).filter(Boolean),
    }));

    const diagnosaSistemId = results.length > 0 ? (results[0].kerusakan?.id || null) : null;

    await fetch('api/riwayat.php', {
      method:      'POST',
      credentials: 'same-origin',
      headers:     { 'Content-Type': 'application/json' },
      body:        JSON.stringify({ namaPasien, namaPemeriksa, gejalaSnapshot, hasilCbr, diagnosaSistemId }),
    });
  } catch (e) {
    // Silent fail — jangan ganggu pengalaman pengguna
    console.warn('Auto-save riwayat gagal:', e);
  }
}

/** Load riwayat dari server (admin only) */
async function loadRiwayat() {
  try {
    const res = await fetch('api/riwayat.php', { credentials: 'same-origin' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    dataRiwayat = await res.json();
    renderRiwayat();
  } catch (e) {
    console.error(e);
    showToast('Gagal memuat riwayat: ' + e.message, 'error');
  }
}

/** Render tabel riwayat diagnosa */
function renderRiwayat() {
  const tbody = document.getElementById('tbodyRiwayat');
  const empty = document.getElementById('emptyRiwayat');
  const table = document.getElementById('tableRiwayat');
  if (!tbody) return;

  if (dataRiwayat.length === 0) {
    table.style.display = 'none';
    empty.classList.add('show');
    return;
  }
  table.style.display = '';
  empty.classList.remove('show');

  const badgeHTML = {
    pending:  '<span style="background:#f59e0b22;color:#f59e0b;border:1px solid #f59e0b44;padding:3px 10px;border-radius:20px;font-size:0.72rem;font-weight:700;">⏳ Pending</span>',
    valid:    '<span style="background:#22c55e22;color:#22c55e;border:1px solid #22c55e44;padding:3px 10px;border-radius:20px;font-size:0.72rem;font-weight:700;">✅ Valid</span>',
    direvisi: '<span style="background:#8b5cf622;color:#8b5cf6;border:1px solid #8b5cf644;padding:3px 10px;border-radius:20px;font-size:0.72rem;font-weight:700;">✏️ Direvisi</span>',
  };

  tbody.innerHTML = dataRiwayat.map((r, i) => {
    const tgl = new Date(r.created_at).toLocaleString('id-ID', {
      day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'
    });
    const diagnosaNama = r.nama_kerusakan_sistem
      ? `${escapeHtml(r.nama_kerusakan_sistem)} <span style="font-size:0.72rem;color:var(--text-muted)">(${r.kode_kerusakan_sistem})</span>`
      : '<span style="color:var(--text-muted);font-style:italic">Tidak cocok</span>';
    const badge = badgeHTML[r.status] || badgeHTML.pending;

    return `
      <tr>
        <td style="color:var(--text-muted);font-weight:600">${i + 1}</td>
        <td style="font-size:0.8rem;color:var(--text-muted);white-space:nowrap">${tgl}</td>
        <td style="font-weight:500;color:var(--text-primary)">${escapeHtml(r.nama_pasien) || '<span style="color:var(--text-muted)">—</span>'}</td>
        <td style="font-size:0.85rem;color:var(--text-muted)">${escapeHtml(r.nama_pemeriksa) || '—'}</td>
        <td style="text-align:center"><span class="code-badge">${(r.gejala_snapshot||[]).length}</span></td>
        <td style="font-size:0.87rem">${diagnosaNama}</td>
        <td>${badge}</td>
        <td>
          <div class="action-btns" style="flex-wrap:wrap;gap:5px;">
            <button class="btn btn-print btn-sm" onclick="cetakRiwayat('${r.id}')" title="Cetak laporan diagnosa ini">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              Cetak
            </button>
            <button class="btn btn-primary btn-sm" onclick="openModal('revisi','${r.id}')" title="Revisi / Validasi CBR">
              ✏️ Revisi
            </button>
            <button class="btn-icon danger" onclick="deleteRiwayat('${r.id}')" title="Hapus riwayat">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

/** Submit revisi admin (fase Revise CBR) */
async function saveRevisi() {
  const diagnosaRevisiId = document.getElementById('selectDiagnosaRevisi')?.value;
  const catatanRevisi    = document.getElementById('inputCatatanRevisi')?.value.trim() || '';
  const revisedBy        = window.__currentUser?.nama || window.__currentUser?.username || 'admin';

  if (!diagnosaRevisiId) {
    showToast('Pilih diagnosa yang benar terlebih dahulu!', 'error');
    return;
  }

  try {
    const res = await fetch(`api/riwayat.php?id=${currentEditId}`, {
      method:      'PUT',
      credentials: 'same-origin',
      headers:     { 'Content-Type': 'application/json' },
      body:        JSON.stringify({ diagnosaRevisiId: parseInt(diagnosaRevisiId), catatanRevisi, revisedBy }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Gagal menyimpan revisi');

    const label = data.status === 'direvisi' ? '✏️ Direvisi' : '✅ Valid';
    showToast(`Revisi berhasil — Status: ${label}`);
    closeModal();
    await loadRiwayat();
  } catch (e) {
    console.error(e);
    showToast(e.message || 'Gagal menyimpan revisi', 'error');
  }
}

/** Cetak laporan dari riwayat yang sudah tersimpan */
function cetakRiwayat(id) {
  const r = dataRiwayat.find(r => String(r.id) === String(id));
  if (!r) {
    showToast('Data riwayat tidak ditemukan', 'error');
    return;
  }

  const gejalaSnapshot = r.gejala_snapshot || [];
  const hasilCbr       = r.hasil_cbr       || [];

  if (hasilCbr.length === 0) {
    showToast('Riwayat ini tidak memiliki hasil diagnosa untuk dicetak', 'warning');
    return;
  }

  // Rekonstruksi format results identik dengan cetakLaporan()
  // hasilCbr sekarang menyimpan matchedGejala, matchedCount, totalGejala, solusi lengkap
  const results = hasilCbr.map(h => {
    // Ambil solusi terbaru dari dataKerusakan (master), fallback ke snapshot DB
    const kerusakanMaster = h.kerusakanId
      ? dataKerusakan.find(k => String(k.id) === String(h.kerusakanId))
      : null;

    const kerusakan = h.kerusakanId ? {
      id:     h.kerusakanId,
      kode:   h.kode   || '',
      nama:   h.nama   || '',
      solusi: kerusakanMaster?.solusi || h.solusi || ''
    } : null;

    // matchedGejala: pakai data presisi yang tersimpan di DB
    // Jika data lama (sebelum update), fallback ke gejalaSnapshot
    const matchedGejala = (h.matchedGejala && h.matchedGejala.length > 0)
      ? h.matchedGejala
      : gejalaSnapshot;

    return {
      kerusakan,
      percentage:    h.percentage   ?? 0,
      matchedCount:  h.matchedCount ?? matchedGejala.length,
      totalGejala:   h.totalGejala  ?? matchedGejala.length,
      bobotMatched:  h.bobotMatched ?? 0,
      bobotTotal:    h.bobotTotal   ?? 0,
      matchedGejala
    };
  });

  const reportData = {
    namaPasien:     r.nama_pasien    || '',
    namaPemeriksa:  r.nama_pemeriksa || '',
    selectedGejala: gejalaSnapshot,
    results,
    timestamp: r.created_at || new Date().toISOString()
  };

  localStorage.setItem('sp_laporan_data', JSON.stringify(reportData));
  window.open('laporan.html', '_blank');
}

/** Hapus riwayat (admin only) */
function deleteRiwayat(id) {
  const r = dataRiwayat.find(r => String(r.id) === String(id));
  showConfirm(
    'Hapus Riwayat',
    `Yakin ingin menghapus riwayat diagnosa "${r?.nama_pasien || 'ini'}"?`,
    async () => {
      try {
        const res  = await fetch(`api/riwayat.php?id=${id}`, { method: 'DELETE', credentials: 'same-origin' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Gagal hapus');
        showToast('Riwayat berhasil dihapus');
        await loadRiwayat();
      } catch (e) {
        showToast(e.message || 'Gagal menghapus riwayat', 'error');
      }
    }
  );
}
