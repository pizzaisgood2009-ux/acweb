// script.js
// Responsible for:
// - fetching CSV from the published Google Sheet URL
// - parsing the CSV robustly (handles quoted fields with commas)
// - grouping by Track, sorting by Fastest Lap (lowest first)
// - populating dropdown and rendering selected track leaderboard
// - auto-refreshing every 2 minutes and keeping selection if possible

const sheetUrl = SHEET_URL; // from index.html

// Robust CSV parser that handles quoted fields and commas inside quotes
function parseCSV(text) {
  const rows = [];
  let cur = '';
  let row = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i+1];
    if (ch === '"' ) {
      if (inQuotes && next === '"') { // escaped quote
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === ',' && !inQuotes) {
      row.push(cur);
      cur = '';
      continue;
    }
    if ((ch === '\n' || (ch === '\r' && next === '\n')) && !inQuotes) {
      // handle CRLF and LF
      if (ch === '\r' && next === '\n') i++;
      row.push(cur);
      rows.push(row);
      row = [];
      cur = '';
      continue;
    }
    cur += ch;
  }
  // push last
  if (cur !== '' || row.length) row.push(cur);
  if (row.length) rows.push(row);
  return rows;
}

// Convert "m:ss.xx" or "mm:ss.xx" or "s.ss" to seconds (number)
function lapToSeconds(str) {
  if (!str) return Infinity;
  const clean = String(str).trim();
  // mm:ss.xx
  if (clean.includes(':')) {
    const parts = clean.split(':');
    const minutes = parseFloat(parts[0]) || 0;
    const seconds = parseFloat(parts[1]) || 0;
    return minutes * 60 + seconds;
  }
  // plain seconds
  const val = parseFloat(clean.replace(/[^\d.]/g, ''));
  return isNaN(val) ? Infinity : val;
}

let dataRows = []; // array of objects
let tracksMap = {}; // { trackName: [rows] }
let headers = [];

// Fetch & process CSV
async function fetchAndProcess() {
  try {
    const res = await fetch(sheetUrl, {cache: "no-store"});
    if (!res.ok) throw new Error(`CSV fetch failed: ${res.status}`);
    const text = await res.text();
    const parsed = parseCSV(text).filter(r => r.length > 0 && r.some(c => c !== ''));
    if (parsed.length === 0) throw new Error('CSV empty');
    headers = parsed[0].map(h => h.trim());
    const rows = parsed.slice(1).map(r => {
      // map headers to values (if a row is short, fill with empty strings)
      const obj = {};
      for (let i = 0; i < headers.length; i++) obj[headers[i]] = (r[i] || '').trim();
      return obj;
    }).filter(r => {
      // eliminate rows that have no Track or no Fastest Lap (tolerant)
      return (r['Track'] || r['track'] || '').trim() !== '';
    });

    dataRows = rows;
    buildTracks(rows);
    populateTrackPicker();
    // if a track is selected, re-render the current selection
    const current = document.getElementById('trackPicker').value;
    if (current) renderTrack(current);
  } catch (err) {
    console.error(err);
    showError(`Error loading sheet: ${err.message}`);
  }
}

function buildTracks(rows) {
  tracksMap = {};
  rows.forEach(r => {
    const track = r['Track'] || r['track'] || 'Unknown Track';
    if (!tracksMap[track]) tracksMap[track] = [];
    const fastest = r['Fastest Lap'] || r['Fastest lap'] || r['Fastest'] || '';
    tracksMap[track].push({
      raw: r,
      car: r['Car'] || r['car'] || '',
      fastestLap: fastest,
      winner: r['Race Winner'] || r['Winner'] || r['race winner'] || '',
      date: r['Date'] || r['date'] || '',
      lapSeconds: lapToSeconds(fastest)
    });
  });
}

function populateTrackPicker() {
  const select = document.getElementById('trackPicker');
  const current = select.value;
  // clear all except default option
  select.innerHTML = '<option value="">Select a Track</option>';
  const tracks = Object.keys(tracksMap).sort();
  tracks.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = t;
    select.appendChild(opt);
  });
  // restore selection if still valid
  if (current && tracks.includes(current)) select.value = current;
}

// Build and render the leaderboard for a single track
function renderTrack(trackName) {
  const container = document.getElementById('boardContainer');
  const dateDisplay = document.getElementById('dateDisplay');
  const list = tracksMap[trackName] ? [...tracksMap[trackName]] : [];
  if (!list.length) {
    container.innerHTML = `<div class="placeholder">No results for "${trackName}".</div>`;
    dateDisplay.textContent = '';
    return;
  }
  // Sort by lapSeconds ascending (fastest first)
  list.sort((a,b) => a.lapSeconds - b.lapSeconds);

  // For date display: if rows have date values, pick the most common or first non-empty
  const dateVals = list.map(x => x.date).filter(Boolean);
  const dateText = dateVals.length ? dateVals[0] : '';
  dateDisplay.textContent = dateText ? `Race Date: ${dateText}` : '';

  // Build html table
  let table = document.createElement('table');
  table.className = 'leaderboard-table';
  // header
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th class="pos">#</th>
      <th>Car</th>
      <th>Fastest Lap</th>
      <th>Race Winner</th>
      <th>Date</th>
    </tr>
  `;
  table.appendChild(thead);
  const tbody = document.createElement('tbody');

  list.forEach((row, i) => {
    const tr = document.createElement('tr');
    // top 3 classes
    if (i === 0) tr.className = 'first-row';
    else if (i === 1) tr.className = 'second-row';
    else if (i === 2) tr.className = 'third-row';

    tr.innerHTML = `
      <td class="pos">${i+1}</td>
      <td>${escapeHtml(row.car || row.raw['Car'] || '')}</td>
      <td>${escapeHtml(row.fastestLap || '')}</td>
      <td class="${i===0 ? 'winner-cell' : ''}">${escapeHtml(row.winner || '')}</td>
      <td>${escapeHtml(row.date || '')}</td>
    `;
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);

  const wrap = document.createElement('div');
  wrap.className = 'table-wrap';
  wrap.appendChild(table);

  container.innerHTML = '';
  container.appendChild(wrap);
}

// Simple text-escaping
function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
}

function showError(msg) {
  const container = document.getElementById('boardContainer');
  container.innerHTML = `<div class="placeholder" style="color:#ff6b6b">${msg}</div>`;
}

// handle selection
document.addEventListener('DOMContentLoaded', () => {
  const select = document.getElementById('trackPicker');
  select.addEventListener('change', (e) => {
    const val = e.target.value;
    if (!val) {
      document.getElementById('boardContainer').innerHTML = '<div class="placeholder">No track selected — pick one above</div>';
      document.getElementById('dateDisplay').textContent = '';
      return;
    }
    renderTrack(val);
  });

  // fetch now and every 2 minutes
  fetchAndProcess();
  setInterval(fetchAndProcess, 120000);
});
