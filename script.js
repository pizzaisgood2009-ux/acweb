// ---------- CONFIG ----------
// Add or edit sheet entries here (tab label and published CSV URL)
// Fun Races is your original sheet (default tab)
const SHEETS = [
  { label: "Fun Races", url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ0L2HtZ0QC3ZlIpCwOrzGVQY0cOUDGaQj2DtBNQuqvLKwQ4sLfRmAcb5LG4H9Q3D1CFkilV5QdIwge/pub?output=csv" },
  { label: "Nascar Cup", url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSH5c-BTz-ZfoJ3Rf58Q4eU9VBvsdq0XnsA99_qJM2Bvdqaq6Ex033d5gH57SQdcOm6haTNL3xi2Koh/pub?output=csv" },
  { label: "F1", url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSSQ9Zn5aGGooGR9EuRmmMW-08_hlcYR7uB3_au3_tD94jialyB8c_olGXYpQvhf2nMnw7Yd-10IVDu/pub?output=csv" },
  { label: "NTT Indycar", url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vT7Gfb8BPrv0HhxptUTq6pJmjVHSYIriySGawJa5iNwV_Wz_aj_xs1SHLIZU2RCxgQErF1eXnEBkUQv/pub?output=csv" },
  { label: "IMSA GT3", url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTcbp-Zy1fdIUZxUre2UFF7ibRCTscw1tMQ0G91rdDbTDmjKH8-MF-y1H3tJJEZxXLELIi0r_5zchBV/pub?output=csv" },
  { label: "IMSA LMP2", url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ3Sq5RbkXrtMKvVPZS8jZGZu_nN4_J7Eddy-7FmV4wo0QnG_YZb5clpx0TiqDT3DN1S56_VagmRp3P/pub?output=csv" }
];

// default tab label (must match a label above)
const DEFAULT_TAB = "Fun Races";

// cache for fetched sheet data
const sheetCache = {};

// ---------- CSV parser (supports quoted fields) ----------
function parseCSV(text) {
  const rows = [];
  let cur = '';
  let row = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i+1];
    if (ch === '"') {
      if (inQuotes && next === '"') { cur += '"'; i++; } // escaped quote
      else inQuotes = !inQuotes;
      continue;
    }
    if (ch === ',' && !inQuotes) { row.push(cur); cur = ''; continue; }
    if ((ch === '\n' || (ch === '\r' && next === '\n')) && !inQuotes) {
      if (ch === '\r' && next === '\n') i++;
      row.push(cur);
      rows.push(row);
      row = []; cur = '';
      continue;
    }
    cur += ch;
  }
  if (cur !== '' || row.length) row.push(cur);
  if (row.length) rows.push(row);
  return rows;
}

// safe value helper (show — for empty)
function valOrDash(v) {
  if (v === undefined || v === null) return '—';
  const s = String(v).trim();
  return s === '' ? '—' : s;
}

// convert m:ss.xx or mm:ss.xx to seconds; returns Infinity if invalid
function lapToSeconds(s) {
  if (!s) return Infinity;
  const str = String(s).trim();
  if (str === '—') return Infinity;
  if (str.includes(':')) {
    const parts = str.split(':');
    const minutes = parseFloat(parts[0]) || 0;
    const seconds = parseFloat(parts[1]) || 0;
    return minutes * 60 + seconds;
  }
  const num = parseFloat(str.replace(/[^\d.]/g, ''));
  return isNaN(num) ? Infinity : num;
}

// ---------- UI helpers ----------
function $(id) { return document.getElementById(id); }

function createTabs() {
  const tabsRow = $('tabsRow');
  tabsRow.innerHTML = '';
  SHEETS.forEach((s, idx) => {
    const btn = document.createElement('button');
    btn.className = 'tab';
    btn.textContent = s.label;
    btn.setAttribute('role','tab');
    btn.setAttribute('aria-selected', s.label === DEFAULT_TAB ? 'true' : 'false');
    btn.dataset.label = s.label;
    btn.addEventListener('click', () => selectTab(s.label));
    tabsRow.appendChild(btn);
  });
}

function setActiveTabUI(label) {
  const buttons = document.querySelectorAll('.tab');
  buttons.forEach(b => {
    b.setAttribute('aria-selected', b.dataset.label === label ? 'true' : 'false');
  });
}

// populate track dropdown for current sheet
function populateTracksForSheet(sheetLabel) {
  const select = $('trackPicker');
  select.innerHTML = '<option value="">Select a Track</option>';
  const rows = sheetCache[sheetLabel] || [];
  const tracks = Array.from(new Set(rows.map(r => valOrDash(r['Track'] || r['track'] || '—')).filter(t => t !== '—'))).sort();
  tracks.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = t;
    select.appendChild(opt);
  });
  $('dateDisplay').textContent = '';
  $('boardContainer').innerHTML = '<div class="placeholder">Select a track to show results.</div>';
}

// render leaderboard for selected sheet & track
function renderLeaderboard(sheetLabel, trackName) {
  const container = $('boardContainer');
  container.innerHTML = '';
  const rows = (sheetCache[sheetLabel] || []).map(r => {
    // fallback keys (case-insensitive)
    return {
      Track: valOrDash(r['Track'] ?? r['track'] ?? ''),
      Car: valOrDash(r['Car'] ?? r['car'] ?? ''),
      FastestLap: valOrDash(r['Fastest Lap'] ?? r['Fastest lap'] ?? r['Fastest'] ?? r['Lap'] ?? ''),
      RaceWinner: valOrDash(r['Race Winner'] ?? r['Winner'] ?? r['race winner'] ?? ''),
      Date: valOrDash(r['Date'] ?? r['date'] ?? '')
    };
  }).filter(r => r.Track === trackName);

  if (rows.length === 0) {
    container.innerHTML = `<div class="placeholder">No results yet for "${trackName}".</div>`;
    $('dateDisplay').textContent = '';
    return;
  }

  // sort by lap seconds (fastest first). rows with invalid times go to bottom.
  rows.sort((a,b) => lapToSeconds(a.FastestLap) - lapToSeconds(b.FastestLap));

  // display date (first non-dash date)
  const dateVal = rows.find(r => r.Date && r.Date !== '—')?.Date ?? '';
  $('dateDisplay').textContent = dateVal ? `Race Date: ${dateVal}` : '';

  // build table
  const table = document.createElement('table');
  table.className = 'leaderboard-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th class="pos">#</th>
        <th>Car</th>
        <th>Fastest Lap</th>
        <th>Race Winner</th>
        <th>Date</th>
      </tr>
    </thead>
  `;
  const tbody = document.createElement('tbody');

  rows.forEach((r, i) => {
    const tr = document.createElement('tr');
    if (i === 0) tr.className = 'first-row';
    else if (i === 1) tr.className = 'second-row';
    else if (i === 2) tr.className = 'third-row';

    tr.innerHTML = `
      <td class="pos">${i+1}</td>
      <td>${escapeHtml(r.Car)}</td>
      <td>${escapeHtml(r.FastestLap)}</td>
      <td>${escapeHtml(r.RaceWinner)}</td>
      <td>${escapeHtml(r.Date)}</td>
    `;
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  const wrap = document.createElement('div');
  wrap.className = 'table-wrap';
  wrap.appendChild(table);
  container.appendChild(wrap);
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
}

// ---------- fetching sheet CSV and processing ----------
async function fetchSheetCSV(sheet) {
  // if cached, return
  if (sheetCache[sheet.label]) return sheetCache[sheet.label];

  try {
    const resp = await fetch(sheet.url, { cache: "no-store" });
    if (!resp.ok) throw new Error(`Fetch failed (${resp.status})`);
    const text = await resp.text();
    const parsed = parseCSV(text).filter(r => r.length > 0);
    if (parsed.length < 1) return [];
    const headers = parsed[0].map(h => (h || '').trim());
    const rows = parsed.slice(1).map(r => {
      const obj = {};
      for (let i = 0; i < headers.length; i++) {
        obj[headers[i]] = r[i] !== undefined ? r[i].trim() : '';
      }
      return obj;
    });
    // store in cache
    sheetCache[sheet.label] = rows;
    return rows;
  } catch (err) {
    console.error('Sheet load error', sheet.label, err);
    sheetCache[sheet.label] = [];
    return [];
  }
}

// load a tab (sheet) on demand (and cache)
async function selectTab(label) {
  setActiveTabUI(label);
  // find sheet config
  const sheet = SHEETS.find(s => s.label === label);
  if (!sheet) return;
  // fetch if needed
  await fetchSheetCSV(sheet);
  populateTracksForSheet(label);
  // default dropdown to Select a Track (user wanted blank select by default)
  $('trackPicker').value = '';
  // placeholder
  $('boardContainer').innerHTML = '<div class="placeholder">Select a track to show results.</div>';
}

// ---------- wiring ----------
document.addEventListener('DOMContentLoaded', async () => {
  // build tabs UI
  createTabs();

  // Wire track picker change
  const trackPicker = document.getElementById('trackPicker');
  trackPicker.addEventListener('change', (e) => {
    const track = e.target.value;
    const activeTab = Array.from(document.querySelectorAll('.tab')).find(b => b.getAttribute('aria-selected') === 'true');
    const label = activeTab ? activeTab.dataset.label : DEFAULT_TAB;
    if (!track) {
      document.getElementById('boardContainer').innerHTML = '<div class="placeholder">Select a track to show results.</div>';
      document.getElementById('dateDisplay').textContent = '';
      return;
    }
    renderLeaderboard(label, track);
  });

  // initialize default tab
  const initial = SHEETS.find(s => s.label === DEFAULT_TAB) ? DEFAULT_TAB : SHEETS[0].label;
  // prefetch default tab data and select it
  await fetchSheetCSV(SHEETS.find(s => s.label === initial));
  selectTab(initial);
});
