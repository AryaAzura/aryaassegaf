(function () {
  'use strict';

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }

  function showNoData() {
    const paper = document.getElementById('reportPaper');
    const noData = document.getElementById('noDataMsg');
    if (paper) paper.style.display = 'none';
    if (noData) noData.style.display = '';
  }

  const raw = localStorage.getItem('sp_laporan_data');
  if (!raw) {
    showNoData();
    return;
  }

  let reportData;
  try {
    reportData = JSON.parse(raw);
  } catch (error) {
    showNoData();
    return;
  }

  if (!reportData || reportData.type !== 'daftar' || !Array.isArray(reportData.rows) || reportData.rows.length === 0) {
    showNoData();
    return;
  }

  const paper = document.getElementById('reportPaper');
  const noData = document.getElementById('noDataMsg');
  if (paper) paper.style.display = '';
  if (noData) noData.style.display = 'none';

  const date = new Date(reportData.timestamp || Date.now());
  const hari = date.toLocaleDateString('id-ID', { weekday: 'long' });
  const tanggal = date.toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
  const tanggalLengkap = `Jakarta, ${hari}, ${tanggal}`;
  const jam = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const noDokumen = 'SP-' +
    date.getFullYear() +
    String(date.getMonth() + 1).padStart(2, '0') +
    String(date.getDate()).padStart(2, '0') + '-' +
    String(date.getHours()).padStart(2, '0') +
    String(date.getMinutes()).padStart(2, '0') +
    String(date.getSeconds()).padStart(2, '0');

  document.getElementById('docNo').textContent = noDokumen;
  document.getElementById('docWaktu').textContent = jam + ' WIB';
  document.getElementById('docTanggal').textContent = tanggalLengkap;
  document.getElementById('footerDocNo').textContent = 'Dokumen No: ' + noDokumen;
  document.getElementById('signatureName').textContent = reportData.generatedBy || 'Administrator';
  document.getElementById('reportTitle').textContent = (reportData.title || 'LAPORAN DAFTAR DATA').toUpperCase();
  document.getElementById('reportSubtitle').textContent = `Daftar ${reportData.listLabel || 'data'} yang dibuat secara otomatis oleh sistem.`;
  document.getElementById('infoDibuatOleh').textContent = reportData.generatedBy || '—';
  document.getElementById('infoJenisData').textContent = reportData.listLabel || 'Data';
  document.getElementById('infoTanggal').textContent = tanggalLengkap + ', ' + jam + ' WIB';
  document.getElementById('infoJumlahData').textContent = `${reportData.rows.length} data`;

  const metaHeader = document.querySelector('#daftarTable thead th:last-child');
  if (metaHeader) {
    metaHeader.textContent = reportData.metaLabel || 'Keterangan';
  }

  const daftarBody = document.getElementById('daftarBody');
  daftarBody.innerHTML = reportData.rows.map((row, index) => {
    const kode = row.kode || row.id || '-';
    const nama = row.nama || row.detail || '-';
    const detail = row.detail || row.nama || '-';
    const meta = row.meta || '';

    return `
      <tr>
        <td class="no-cell">${index + 1}</td>
        <td class="kode-cell">${escapeHtml(kode)}</td>
        <td>${escapeHtml(nama)}</td>
        <td>${escapeHtml(detail)}</td>
        <td style="text-align:left;font-weight:600;">${escapeHtml(meta)}</td>
      </tr>
    `;
  }).join('');
})();
