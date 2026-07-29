/* ============================================================
   Sistem Pakar — App Logic (Vanilla JS)
   Features: CRUD Gejala, CRUD Kerusakan, CRUD Rule, Diagnosa
   Data persisted in localStorage
   ============================================================ */

// ==================== DATA STORE ====================
const STORE_KEYS = {
  gejala: 'sp_gejala',
  kerusakan: 'sp_kerusakan',
  rules: 'sp_rules',
};

function loadData(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

let dataGejala = loadData(STORE_KEYS.gejala);
let dataKerusakan = loadData(STORE_KEYS.kerusakan);
let dataRules = loadData(STORE_KEYS.rules);

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
      gejala: 'panelGejala',
      kerusakan: 'panelKerusakan',
      rule: 'panelRule',
      diagnosa: 'panelDiagnosa',
    }[tab];

    document.getElementById(panelId).classList.add('active');

    if (tab === 'diagnosa') renderDiagnosaCheckboxes();
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
    closeConfirm();
    if (confirmCallback) confirmCallback();
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

  if (type === 'gejala') {
    const item = editId !== null ? dataGejala.find(g => g.id === editId) : null;
    title.textContent = item ? 'Edit Gejala' : 'Tambah Gejala';
    body.innerHTML = `
      <div class="form-group">
        <label for="inputKodeGejala">Kode Gejala</label>
        <input type="text" class="form-input" id="inputKodeGejala" placeholder="Contoh: G01" value="${item ? item.kode : generateCode('G', dataGejala)}" ${item ? 'readonly style="opacity:0.6;cursor:not-allowed"' : ''}>
      </div>
      <div class="form-group">
        <label for="inputNamaGejala">Nama Gejala</label>
        <input type="text" class="form-input" id="inputNamaGejala" placeholder="Masukkan nama gejala..." value="${item ? item.nama : ''}">
      </div>
    `;
  } else if (type === 'kerusakan') {
    const item = editId !== null ? dataKerusakan.find(k => k.id === editId) : null;
    title.textContent = item ? 'Edit Kerusakan' : 'Tambah Kerusakan';
    body.innerHTML = `
      <div class="form-group">
        <label for="inputKodeKerusakan">Kode Kerusakan</label>
        <input type="text" class="form-input" id="inputKodeKerusakan" placeholder="Contoh: K01" value="${item ? item.kode : generateCode('K', dataKerusakan)}" ${item ? 'readonly style="opacity:0.6;cursor:not-allowed"' : ''}>
      </div>
      <div class="form-group">
        <label for="inputNamaKerusakan">Nama Kerusakan</label>
        <input type="text" class="form-input" id="inputNamaKerusakan" placeholder="Masukkan nama kerusakan..." value="${item ? item.nama : ''}">
      </div>
      <div class="form-group">
        <label for="inputSolusi">Solusi / Penanganan</label>
        <textarea class="form-input" id="inputSolusi" placeholder="Masukkan solusi penanganan...">${item ? item.solusi : ''}</textarea>
      </div>
    `;
  } else if (type === 'rule') {
    if (dataKerusakan.length === 0 || dataGejala.length === 0) {
      showToast('Tambahkan Gejala dan Kerusakan terlebih dahulu!', 'warning');
      return;
    }
    const item = editId !== null ? dataRules.find(r => r.id === editId) : null;
    title.textContent = item ? 'Edit Rule' : 'Tambah Rule';

    let kerusakanOptions = dataKerusakan.map(k =>
      `<option value="${k.id}" ${item && item.kerusakanId === k.id ? 'selected' : ''}>${k.kode} - ${k.nama}</option>`
    ).join('');

    let gejalaCheckboxes = dataGejala.map(g => {
      const checked = item && item.gejalaIds.includes(g.id) ? 'checked' : '';
      return `
        <div class="modal-checkbox-item" onclick="this.querySelector('input').click()">
          <input type="checkbox" value="${g.id}" ${checked} onclick="event.stopPropagation()">
          <label onclick="event.stopPropagation()">${g.kode} - ${g.nama}</label>
        </div>
      `;
    }).join('');

    body.innerHTML = `
      <div class="form-group">
        <label for="selectKerusakan">Kerusakan</label>
        <select class="form-input" id="selectKerusakan">
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
  }

  overlay.classList.add('show');
  // Focus first input
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
  if (currentModalType === 'gejala') saveGejala();
  else if (currentModalType === 'kerusakan') saveKerusakan();
  else if (currentModalType === 'rule') saveRule();
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

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function saveGejala() {
  const kode = document.getElementById('inputKodeGejala').value.trim();
  const nama = document.getElementById('inputNamaGejala').value.trim();

  if (!kode || !nama) {
    showToast('Kode dan Nama Gejala wajib diisi!', 'error');
    return;
  }

  if (currentEditId) {
    // Edit
    const idx = dataGejala.findIndex(g => g.id === currentEditId);
    if (idx !== -1) {
      dataGejala[idx].nama = nama;
      showToast('Gejala berhasil diperbarui');
    }
  } else {
    // Check duplicate kode
    if (dataGejala.some(g => g.kode.toLowerCase() === kode.toLowerCase())) {
      showToast('Kode gejala sudah ada!', 'error');
      return;
    }
    dataGejala.push({ id: generateId(), kode: kode.toUpperCase(), nama });
    showToast('Gejala berhasil ditambahkan');
  }

  saveData(STORE_KEYS.gejala, dataGejala);
  renderGejala();
  updateStats();
  closeModal();
}

function deleteGejala(id) {
  const item = dataGejala.find(g => g.id === id);
  showConfirm('Hapus Gejala', `Yakin ingin menghapus "${item?.nama}"?`, () => {
    dataGejala = dataGejala.filter(g => g.id !== id);
    // Also remove from rules
    dataRules.forEach(r => {
      r.gejalaIds = r.gejalaIds.filter(gid => gid !== id);
    });
    // Remove rules with no gejala
    dataRules = dataRules.filter(r => r.gejalaIds.length > 0);
    saveData(STORE_KEYS.gejala, dataGejala);
    saveData(STORE_KEYS.rules, dataRules);
    renderGejala();
    renderRules();
    updateStats();
    showToast('Gejala berhasil dihapus');
  });
}

function renderGejala() {
  const tbody = document.getElementById('tbodyGejala');
  const empty = document.getElementById('emptyGejala');
  const table = document.getElementById('tableGejala');
  const search = document.getElementById('searchGejala').value.toLowerCase();

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

  tbody.innerHTML = filtered.map(g => `
    <tr>
      <td><span class="code-badge">${g.kode}</span></td>
      <td style="color:var(--text-primary);font-weight:500">${g.nama}</td>
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
  `).join('');
}

// ==================== KERUSAKAN CRUD ====================
function saveKerusakan() {
  const kode = document.getElementById('inputKodeKerusakan').value.trim();
  const nama = document.getElementById('inputNamaKerusakan').value.trim();
  const solusi = document.getElementById('inputSolusi').value.trim();

  if (!kode || !nama) {
    showToast('Kode dan Nama Kerusakan wajib diisi!', 'error');
    return;
  }

  if (currentEditId) {
    const idx = dataKerusakan.findIndex(k => k.id === currentEditId);
    if (idx !== -1) {
      dataKerusakan[idx].nama = nama;
      dataKerusakan[idx].solusi = solusi;
      showToast('Kerusakan berhasil diperbarui');
    }
  } else {
    if (dataKerusakan.some(k => k.kode.toLowerCase() === kode.toLowerCase())) {
      showToast('Kode kerusakan sudah ada!', 'error');
      return;
    }
    dataKerusakan.push({ id: generateId(), kode: kode.toUpperCase(), nama, solusi });
    showToast('Kerusakan berhasil ditambahkan');
  }

  saveData(STORE_KEYS.kerusakan, dataKerusakan);
  renderKerusakan();
  updateStats();
  closeModal();
}

function deleteKerusakan(id) {
  const item = dataKerusakan.find(k => k.id === id);
  showConfirm('Hapus Kerusakan', `Yakin ingin menghapus "${item?.nama}"?`, () => {
    dataKerusakan = dataKerusakan.filter(k => k.id !== id);
    // Remove rules referencing this kerusakan
    dataRules = dataRules.filter(r => r.kerusakanId !== id);
    saveData(STORE_KEYS.kerusakan, dataKerusakan);
    saveData(STORE_KEYS.rules, dataRules);
    renderKerusakan();
    renderRules();
    updateStats();
    showToast('Kerusakan berhasil dihapus');
  });
}

function renderKerusakan() {
  const tbody = document.getElementById('tbodyKerusakan');
  const empty = document.getElementById('emptyKerusakan');
  const table = document.getElementById('tableKerusakan');
  const search = document.getElementById('searchKerusakan').value.toLowerCase();

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
      <td style="color:var(--text-primary);font-weight:500">${k.nama}</td>
      <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${escapeHtml(k.solusi)}">${k.solusi || '<span style="color:var(--text-muted)">—</span>'}</td>
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

// ==================== RULE CRUD ====================
function saveRule() {
  const kerusakanId = document.getElementById('selectKerusakan').value;
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

  if (currentEditId) {
    const idx = dataRules.findIndex(r => r.id === currentEditId);
    if (idx !== -1) {
      dataRules[idx].kerusakanId = kerusakanId;
      dataRules[idx].gejalaIds = gejalaIds;
      showToast('Rule berhasil diperbarui');
    }
  } else {
    // Check if rule for this kerusakan already exists
    if (dataRules.some(r => r.kerusakanId === kerusakanId)) {
      showToast('Rule untuk kerusakan ini sudah ada! Gunakan edit.', 'warning');
      return;
    }
    dataRules.push({ id: generateId(), kerusakanId, gejalaIds });
    showToast('Rule berhasil ditambahkan');
  }

  saveData(STORE_KEYS.rules, dataRules);
  renderRules();
  updateStats();
  closeModal();
}

function deleteRule(id) {
  showConfirm('Hapus Rule', 'Yakin ingin menghapus rule ini?', () => {
    dataRules = dataRules.filter(r => r.id !== id);
    saveData(STORE_KEYS.rules, dataRules);
    renderRules();
    updateStats();
    showToast('Rule berhasil dihapus');
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
    const kerusakan = dataKerusakan.find(k => k.id === r.kerusakanId);
    const gejalaTags = r.gejalaIds.map(gid => {
      const gejala = dataGejala.find(g => g.id === gid);
      return gejala ? `<span class="gejala-tag">${gejala.kode} - ${gejala.nama}</span>` : '';
    }).join('');

    return `
      <tr>
        <td style="color:var(--text-muted);font-weight:600">${index + 1}</td>
        <td>
          <span class="kerusakan-badge">
            ${kerusakan ? `${kerusakan.kode} - ${kerusakan.nama}` : '<i>Tidak ditemukan</i>'}
          </span>
        </td>
        <td>
          <div class="gejala-tags">${gejalaTags || '<span style="color:var(--text-muted)">—</span>'}</div>
        </td>
        <td>
          <div class="action-btns">
            <button class="btn-icon" title="Edit" onclick="openModal('rule','${r.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn-icon danger" title="Hapus" onclick="deleteRule('${r.id}')">
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
      <label for="diag_${g.id}" onclick="event.stopPropagation()"><span class="cb-code">${g.kode}</span>${g.nama}</label>
    </div>
  `).join('');
}

function toggleCheckbox(el) {
  const cb = el.querySelector('input[type="checkbox"]');
  cb.checked = !cb.checked;
}

function resetDiagnosa() {
  const checkboxes = document.querySelectorAll('#diagnosaGejalaList input[type="checkbox"]');
  checkboxes.forEach(cb => cb.checked = false);
  document.getElementById('resultPlaceholder').style.display = '';
  document.getElementById('resultContent').style.display = 'none';
  showToast('Diagnosa direset', 'warning');
}

function prosesDiagnosa() {
  const checkboxes = document.querySelectorAll('#diagnosaGejalaList input[type="checkbox"]:checked');
  const selectedGejalaIds = Array.from(checkboxes).map(cb => cb.value);

  if (selectedGejalaIds.length === 0) {
    showToast('Pilih minimal 1 gejala!', 'warning');
    return;
  }

  if (dataRules.length === 0) {
    showToast('Belum ada rule! Tambahkan rule terlebih dahulu.', 'warning');
    return;
  }

  // Calculate match percentage for each rule
  const results = dataRules.map(rule => {
    const matched = rule.gejalaIds.filter(gid => selectedGejalaIds.includes(gid));
    const percentage = (matched.length / rule.gejalaIds.length) * 100;
    const kerusakan = dataKerusakan.find(k => k.id === rule.kerusakanId);

    return {
      rule,
      kerusakan,
      matchedCount: matched.length,
      totalGejala: rule.gejalaIds.length,
      percentage: Math.round(percentage * 10) / 10,
      matchedGejalaIds: matched,
    };
  })
    .filter(r => r.percentage > 0)
    .sort((a, b) => b.percentage - a.percentage);

  const placeholder = document.getElementById('resultPlaceholder');
  const content = document.getElementById('resultContent');

  if (results.length === 0) {
    placeholder.style.display = 'none';
    content.style.display = 'block';
    content.innerHTML = `
      <div class="no-result-msg">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        <p>Tidak ada kerusakan yang cocok</p>
        <span style="font-size:0.8rem;color:var(--text-muted)">Gejala yang dipilih tidak sesuai dengan rule yang ada</span>
      </div>
    `;
    return;
  }

  placeholder.style.display = 'none';
  content.style.display = 'block';

  content.innerHTML = `
    <h3 style="font-size:0.95rem;font-weight:600;margin-bottom:14px;">Hasil Diagnosa</h3>
    ${results.map((r, i) => {
      const matchedGejala = r.matchedGejalaIds.map(gid => {
        const g = dataGejala.find(g => g.id === gid);
        return g ? `<span class="gejala-tag">${g.kode} - ${g.nama}</span>` : '';
      }).join('');

      let barColor = 'linear-gradient(90deg, var(--accent), #8b5cf6)';
      if (r.percentage >= 80) barColor = 'linear-gradient(90deg, #22c55e, #16a34a)';
      else if (r.percentage >= 50) barColor = 'linear-gradient(90deg, #f59e0b, #d97706)';

      return `
        <div class="result-card" style="animation-delay:${i * 0.1}s">
          <div class="result-rank">Hasil #${i + 1}</div>
          <div class="result-name">${r.kerusakan ? r.kerusakan.nama : 'Kerusakan tidak ditemukan'}</div>
          <div class="result-match">${r.percentage}% cocok (${r.matchedCount}/${r.totalGejala} gejala)</div>
          <div class="progress-bar-wrap">
            <div class="progress-bar" style="width:${r.percentage}%;background:${barColor}"></div>
          </div>
          <div style="margin-top:10px;">
            <div style="font-size:0.7rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;font-weight:600;margin-bottom:6px;">Gejala Cocok:</div>
            <div class="gejala-tags">${matchedGejala}</div>
          </div>
          ${r.kerusakan && r.kerusakan.solusi ? `
            <div class="result-solusi">
              <strong>Solusi</strong>
              ${r.kerusakan.solusi}
            </div>
          ` : ''}
        </div>
      `;
    }).join('')}
  `;
}

// ==================== UTILITY ====================
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ==================== INIT ====================
function init() {
  renderGejala();
  renderKerusakan();
  renderRules();
  updateStats();
}

init();
