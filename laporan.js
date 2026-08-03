/* ============================================================
   Laporan Diagnosa — Report Renderer
   Reads diagnosis data from localStorage and renders the report
   ============================================================ */

(function () {
  'use strict';

  // Utility
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Read data from localStorage
  const raw = localStorage.getItem('sp_laporan_data');
  if (!raw) {
    showNoData();
    return;
  }

  let reportData;
  try {
    reportData = JSON.parse(raw);
  } catch {
    showNoData();
    return;
  }

  const {
    namaPasien,
    namaPemeriksa,
    selectedGejala,    // array of { id, kode, nama, bobot }
    results,           // array of { kerusakan, percentage, matchedCount, totalGejala, bobotMatched, bobotTotal, matchedGejala }
    timestamp          // ISO string
  } = reportData;

  if (!results || results.length === 0) {
    showNoData();
    return;
  }

  // Show paper, hide no-data
  document.getElementById('reportPaper').style.display = '';
  document.getElementById('noDataMsg').style.display = 'none';

  // --- Fill Header Meta ---
  const date = new Date(timestamp || Date.now());
  const tanggal = date.toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const jam = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const noDokumen = 'SP-' +
    date.getFullYear() +
    String(date.getMonth() + 1).padStart(2, '0') +
    String(date.getDate()).padStart(2, '0') + '-' +
    String(date.getHours()).padStart(2, '0') +
    String(date.getMinutes()).padStart(2, '0') +
    String(date.getSeconds()).padStart(2, '0');

  document.getElementById('docNo').textContent = noDokumen;
  document.getElementById('docTanggal').textContent = tanggal;
  document.getElementById('docWaktu').textContent = jam + ' WIB';

  // --- Fill Patient Info ---
  document.getElementById('infoPasien').textContent = namaPasien || '—';
  document.getElementById('infoPemeriksa').textContent = namaPemeriksa || '—';
  document.getElementById('infoTanggal').textContent = tanggal + ', ' + jam + ' WIB';
  document.getElementById('infoJmlGejala').textContent = (selectedGejala ? selectedGejala.length : 0) + ' gejala';
  document.getElementById('infoJmlHasil').textContent = results.length + ' kerusakan terdeteksi';

  // --- Fill Gejala Table ---
  const gejalaBody = document.getElementById('gejalaBody');
  if (selectedGejala && selectedGejala.length > 0) {
    gejalaBody.innerHTML = selectedGejala.map((g, i) => `
      <tr>
        <td class="no-cell">${i + 1}</td>
        <td class="kode-cell">${escapeHtml(g.kode)}</td>
        <td>${escapeHtml(g.nama)}</td>
        <td style="text-align:center;font-weight:600;">${parseFloat(g.bobot ?? 0.5).toFixed(1)}/1.0</td>
      </tr>
    `).join('');
  } else {
    gejalaBody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#9ca3af;padding:16px;">Tidak ada gejala</td></tr>';
  }

  // --- Fill Result Cards ---
  const resultCards = document.getElementById('resultCards');
  resultCards.innerHTML = results.map((r, i) => {
    const rankClass = i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : 'rank-other';
    let barColor = '#6366f1';
    if (r.percentage >= 80) barColor = '#22c55e';
    else if (r.percentage >= 50) barColor = '#eab308';

    const matchedTagsHtml = (r.matchedGejala || []).map(g =>
      `<span class="matched-tag">${escapeHtml(g.kode)} - ${escapeHtml(g.nama)}${g.bobot !== undefined ? ` <span style="opacity:0.65;font-size:0.78em;">(bobot:${parseFloat(g.bobot).toFixed(1)})</span>` : ''}</span>`
    ).join('');

    // CBR weight info (backward compat: fallback if old data)
    const bobotInfo = (r.bobotMatched !== undefined && r.bobotTotal !== undefined)
      ? ` &nbsp;&middot;&nbsp; Bobot cocok: <strong>${r.bobotMatched.toFixed(1)}</strong>/${r.bobotTotal.toFixed(1)}`
      : '';

    return `
      <div class="result-card ${rankClass}">
        <div class="result-rank">Hasil #${i + 1}${i === 0 ? ' — Diagnosa Utama' : ''}</div>
        <div class="result-name">${r.kerusakan ? escapeHtml(r.kerusakan.nama) : 'Kerusakan tidak ditemukan'}</div>
        <div class="result-pct">
          Kemiripan CBR: <strong>${r.percentage}%</strong>
          (${r.matchedCount} dari ${r.totalGejala} gejala cocok)${bobotInfo}
        </div>
        <div class="progress-wrap">
          <div class="progress-bar" style="width:${r.percentage}%;background:${barColor};"></div>
        </div>
        <div class="matched-label">Gejala yang Cocok (dengan bobot):</div>
        <div class="matched-tags">${matchedTagsHtml || '<span style="color:#9ca3af;">—</span>'}</div>
        ${r.kerusakan && r.kerusakan.solusi ? `
          <div class="solusi-box">
            <div class="solusi-label">Solusi / Penanganan:</div>
            ${escapeHtml(r.kerusakan.solusi)}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  // --- Fill Footer ---
  document.getElementById('footerDocNo').textContent = 'Dokumen No: ' + noDokumen;
  document.getElementById('signatureName').textContent = namaPemeriksa || '—';

  // --- Helper: Show no data state ---
  function showNoData() {
    const paper = document.getElementById('reportPaper');
    const noData = document.getElementById('noDataMsg');
    if (paper) paper.style.display = 'none';
    if (noData) noData.style.display = '';
  }

})();
