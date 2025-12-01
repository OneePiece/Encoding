// encoder_web_script.js - Final Version

console.log("encoder_web_script.js loaded");

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.readAsText(file, 'UTF-8');
  });
}

function hitungFrekuensi(teks) {
  const freq = {};
  // Initialize all lowercase letters to 0
  for (let i = 0; i < 26; i++) {
    const letter = String.fromCharCode(97 + i);
    freq[letter] = 0;
  }
  // Count occurrences in the text
  for (const ch of teks.toLowerCase()) {
    if (/[a-z]/.test(ch)) freq[ch]++;
  }
  return freq;
}

function shannonFano(probMap) {
  const daftar = Object.entries(probMap).sort((a,b) => b[1] - a[1]);
  const kode = {};
  for (const [s] of daftar) kode[s] = "";

  function rekursif(sublist) {
    if (sublist.length <= 1) return;
    const total = sublist.reduce((acc, p) => acc + p[1], 0);
    let ak = 0;
    let idx = 0;
    for (let i = 0; i < sublist.length; i++) {
      ak += sublist[i][1];
      if (ak >= total/2) { idx = i; break; }
    }
    const kiri = sublist.slice(0, idx+1);
    const kanan = sublist.slice(idx+1);

    kiri.forEach(([s]) => kode[s] += "0");
    kanan.forEach(([s]) => kode[s] += "1");

    rekursif(kiri);
    rekursif(kanan);
  }

  if (daftar.length === 1) { kode[daftar[0][0]] = "0"; return kode; }
  rekursif(daftar);
  return kode;
}

function huffman(probMap) {
  let heap = Object.entries(probMap).map(([s,p]) => ({ p, nodes: [[s,""]] }));

  if (heap.length === 1) return { [heap[0].nodes[0][0]]: "0" };

  while (heap.length > 1) {
    heap.sort((a,b) => a.p - b.p);
    const kiri = heap.shift();
    const kanan = heap.shift();

    kiri.nodes.forEach(n => n[1] = "0" + n[1]);
    kanan.nodes.forEach(n => n[1] = "1" + n[1]);

    heap.push({ p: kiri.p + kanan.p, nodes: kiri.nodes.concat(kanan.nodes) });
  }

  const hasil = {};
  heap[0].nodes.forEach(n => hasil[n[0]] = n[1]);
  return hasil;
}

function ekstensi(probMap) {
  const keys = Object.keys(probMap).sort();
  const panjang = Math.ceil(Math.log2(Math.max(1, keys.length)));
  const kode = {};

  keys.forEach((k, i) => kode[k] = i.toString(2).padStart(panjang, '0'));
  return kode;
}

function hitungTabel(freq, kode, total) {
  const baris = [];
  let total_pi = 0;
  let total_pili = 0;
  let total_entropi = 0;

  const keys = Object.keys(freq).sort();
  for (const s of keys) {
    const jumlah = freq[s];
    const pi = jumlah / total;
    const log_pi = (pi > 0) ? -Math.log2(pi) : 0;
    let li = (kode[s] || '').length;
    if (li === 0) li = 1;

    const pili = pi * li;
    const entropi = pi * log_pi;

    baris.push({ Simbol: s, Jumlah: jumlah, Pi: Number(pi.toFixed(4)), NegLog: Number(log_pi.toFixed(4)), li, Kode: kode[s], Pili: Number(pili.toFixed(4)), Entropi: Number(entropi.toFixed(4)) });

    total_pi += pi;
    total_pili += pili;
    total_entropi += entropi;
  }

  return { baris, total_pi, total_pili, total_entropi };
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function tampilkanTabel(baris, total, totals) {
  const container = document.getElementById('resultTable');
  let html = `
  <table>
    <thead>
      <tr>
        <th>Simbol</th><th>Jumlah</th><th>Pi</th><th>-log2(Pi)</th><th>li</th><th>Kode</th><th>Pi × li</th><th>-Pi·log2(Pi)</th>
      </tr>
    </thead><tbody>
  `;

  baris.forEach(r => {
    html += `<tr>
      <td>${escapeHtml(r.Simbol)}</td>
      <td>${r.Jumlah}</td>
      <td>${r.Pi.toFixed(4)}</td>
      <td>${r.NegLog.toFixed(4)}</td>
      <td>${r.li}</td>
      <td>${r.Kode}</td>
      <td>${r.Pili.toFixed(4)}</td>
      <td>${r.Entropi.toFixed(4)}</td>
    </tr>`;
  });

  html += `</tbody></table>`;

  const H = totals.total_entropi;
  const L = totals.total_pili;
  const ef = (L > 0) ? (H/L*100) : 0;

  html += `<br><div class="summary">
    <h3>Ringkasan</h3>
    <table class="summary-table">
      <tr><td>Total Karakter:</td><td>${total}</td></tr>
      <tr><td>Rata-rata Panjang Bit (L):</td><td>${L.toFixed(4)}</td></tr>
      <tr><td>Entropi (H):</td><td>${H.toFixed(4)}</td></tr>
      <tr><td>Efisiensi (H/L):</td><td>${ef.toFixed(2)}%</td></tr>
      <tr><td>Redundansi:</td><td>${(100-ef).toFixed(2)}%</td></tr>
    </table>
  </div>`;

  container.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', () => {
  const tombol = document.getElementById('processBtn');
  const fileInput = document.getElementById('fileInput');
  const select = document.getElementById('methodSelect');

  tombol.addEventListener('click', async () => {
    let teks = '';
    const file = fileInput.files[0];
    const textArea = document.getElementById('textInput').value.trim();

    if (file) {
      teks = await readFileAsText(file);
    } else if (textArea) {
      teks = textArea;
    } else {
      alert("Pilih file atau masukkan teks terlebih dahulu!");
      return;
    }

    const freq = hitungFrekuensi(teks);
    const total = Object.values(freq).reduce((sum, val) => sum + val, 0);
    const prob = {};
    if (total > 0) {
      Object.keys(freq).forEach(k => prob[k] = freq[k] / total);
    } else {
      // If no letters, assign equal probability to all
      Object.keys(freq).forEach(k => prob[k] = 1 / 26);
    }

    let kode = {};
    const metode = select.value;
    if (metode === 'sf') kode = shannonFano(prob);
    else if (metode === 'huffman') kode = huffman(prob);
    else kode = ekstensi(prob);

    // Ensure all letters have a code, even if prob 0
    for (let i = 0; i < 26; i++) {
      const letter = String.fromCharCode(97 + i);
      if (!(letter in kode)) kode[letter] = "0";
    }

    const hasil = hitungTabel(freq, kode, total);
    tampilkanTabel(hasil.baris, total, hasil);
  });
});