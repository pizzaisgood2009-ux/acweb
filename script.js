// ---------- CONFIG ----------
// Add / edit sheet entries here (label and published CSV URL)
const SHEETS = [
  { label: "Fun Races", url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ0L2HtZ0QC3ZlIpCwOrzGVQY0cOUDGaQj2DtBNQuqvLKwQ4sLfRmAcb5LG4H9Q3D1CFkilV5QdIwge/pub?output=csv" },
  { label: "Nascar Cup", url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSH5c-BTz-ZfoJ3Rf58Q4eU9VBvsdq0XnsA99_qJM2Bvdqaq6Ex033d5gH57SQdcOm6haTNL3xi2Koh/pub?output=csv" },
  { label: "F1", url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSSQ9Zn5aGGooGR9EuRmmMW-08_hlcYR7uB3_au3_tD94jialyB8c_olGXYpQvhf2nMnw7Yd-10IVDu/pub?output=csv" },
  { label: "NTT Indycar", url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vT7Gfb8BPrv0HhxptUTq6pJmjVHSYIriySGawJa5iNwV_Wz_aj_xs1SHLIZU2RCxgQErF1eXnEBkUQv/pub?output=csv" },
  { label: "IMSA GT3", url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTcbp-Zy1fdIUZxUre2UFF7ibRCTscw1tMQ0G91rdDbTDmjKH8-MF-y1H3tJJEZxXLELIi0r_5zchBV/pub?output=csv" },
  { label: "IMSA LMP2", url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ3Sq5RbkXrtMKvVPZS8jZGZu_nN4_J7Eddy-7FmV4wo0QnG_YZb5clpx0TiqDT3DN1S56_VagmRp3P/pub?output=csv" }
];

// default tab label
const DEFAULT_TAB = "Fun Races";

// logos (web-hosted). If any URL stops working later, replace it with another hosted copy.
const LOGOS = {
  "Fun Races": "https://upload.wikimedia.org/wikipedia/commons/1/16/Flag_racing_checkered.svg",
  "Nascar Cup": "https://upload.wikimedia.org/wikipedia/en/2/24/NASCAR_logo.svg",
  "F1": "https://upload.wikimedia.org/wikipedia/en/8/85/Formula_1_Logo.svg",
  "NTT Indycar": "https://upload.wikimedia.org/wikipedia/commons/4/4f/IndyCar_logo.svg",
  "IMSA GT3": "https://upload.wikimedia.org/wikipedia/en/6/6a/IMSA_logo.svg",
  "IMSA LMP2": "https://upload.wikimedia.org/wikipedia/en/6/6a/IMSA_logo.svg"
};

// ---------- cache ----------
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

// ---------- helpers ----------
function valOrDash(v) { if (v === undefined || v === null) return '—'; const s = String(v).trim(); return s === '' ? '—' : s; }
function escapeHtml(s) { return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]); }
function $(id) { return document.getElementById(id); }

// parse lap to seconds; return Infinity if not valid
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

// detect if any rows have a valid fastest lap
function sheetHasLap(rows, lapKeys) {
  return rows.some(r => {
    for (const k of lapKeys) {
      if (r[k] && lapToSeconds(r[k]) !== Infinity) return true;
    }
    return false;
  });
}

// find positional column key (Position/Pos/Place/Finish)
function findPositionKey(headers) {
  const keys = headers.map(h => (h||'').toLowerCase());
  const candidates = ['position','pos','place','placing','finish','result'];
  for (const c of candidates) {
    const idx = keys.findIndex(k => k.includes(c));
    if (idx !== -1) return headers[idx];
  }
  return null;
}

// ---------- UI building ----------
function createTabs() {
  const tabsRow = $('tabsRow');
  tabsRow.innerHTML = '';
  SHEETS.forEach(s => {
    const btn = document.createElement('button');
    btn.className = 'tab';
    btn.type = 'button';
    btn.setAttribute('role','tab');
    btn.setAttribute('aria-selected', s.label === DEFAULT_TAB ? 'true' : 'false');
    btn.dataset.label = s.label;

    // logo (if available)
    const logoUrl = LOGOS[s.label];
    if (logoUrl) {
      const img = document.createElement('img');
      img.src = logoUrl;
      img.alt = `${s.label} logo`;
      img.loading = 'lazy';
      btn.appendChild(img);
    }

    const span = document.createElement('span');
    span.textContent = s.label;
    btn.appendChild(span);

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

// populate track dropdown for a sheet
function populateTracksForSheet(sheetLabel) {
  const select = $('trackPicker');
  select.innerHTML = '<option value="">Select a Track</option>';
  const rows = sheetCache[sheetLabel] || [];
  const tracks = Array.from(new Set(rows.map(r => valOrDash(r['Track'] || r['track'] || '')).filter(t => t !== '—'))).sort();
  tracks.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = t;
    select.appendChild(opt);
  });
  $('dateDisplay').textContent = '';
  $('boardContainer').innerHTML = '<div class="placeholder">Select a track to show results.</div>';
}

// render leaderboard for given sheet & track
function renderLeaderboard(sheetLabel, trackName) {
  const container = $('boardContainer');
  container.innerHTML = '';
  const rawRows = sheetCache[sheetLabel] || [];
  if (!rawRows.length) {
    container.innerHTML = `<div class="placeholder">No results in ${sheetLabel}.</div>`;
    $('dateDisplay').textContent = '';
    return;
  }

  // normalize rows to consistent keys
  const headers = Object.keys(rawRows[0] || {});
  const rowObjs = rawRows.map(r => {
    return {
      raw: r,
      Track: valOrDash(r['Track'] ?? r['track'] ?? ''),
      Car: valOrDash(r['Car'] ?? r['car'] ?? ''),
      FastestLap: valOrDash(r['Fastest Lap'] ?? r['Fastest lap'] ?? r['Fastest'] ?? r['Lap'] ?? ''),
      RaceWinner: valOrDash(r['Race Winner'] ?? r['Winner'] ?? r['winner'] ?? ''),
      Date: valOrDash(r['Date'] ?? r['date'] ?? '')
    };
  }).filter(r => r.Track === trackName);

  if (rowObjs.length === 0) {
    container.innerHTML = `<div class="placeholder">No results yet for "${trackName}".</div>`;
    $('dateDisplay').textContent = '';
    return;
  }

  // determine sorting method
  // 1) if any FastestLap parseable -> sort by lap
  const lapKeys = ['FastestLap','Fastest Lap','Fastest lap','Fastest','Lap'];
  const hasLap = rowObjs.some(r => lapToSeconds(r.FastestLap) !== Infinity);

  // 2) else if sheet has a numeric position column -> sort by that
  const rawHeaders = Object.keys(rawRows[0] || {});
  const posKey = findPositionKey(rawHeaders);

  if (hasLap) {
    rowObjs.sort((a,b) => lapToSeconds(a.FastestLap) - lapToSeconds(b.FastestLap));
  } else if (posKey) {
    // build an array with numeric position if possible, else Infinity
    rowObjs.sort((a,b) => {
      const aVal = parseInt(a.raw[posKey]) || Infinity;
      const bVal = parseInt(b.raw[posKey]) || Infinity;
      return aVal - bVal;
    });
  } else {
    // fallback: keep original order the sheet provided (rowObjs already in sheet order)
  }

  // show date: prefer first non-dash date in rows
  const dateVal = rowObjs.find(r => r.Date && r.Date !== '—')?.Date ?? '';
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

  rowObjs.forEach((r, i) => {
    const tr = document.createElement('tr');
    if (i === 0) tr.className = 'first-row';
    else if (i === 1) tr.className = 'second-row';
    else if (i === 2) tr.className = 'third-row';

    tr.innerHTML = `
      <td class="pos">${i+1}</td>
      <td>${escapeHtml(r.Car)}</td>
      <td>${escapeHtml(r.FastestLap !== '—' ? r.FastestLap : '—')}</td>
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

// ---------- fetching CSV ----------
async function fetchSheetCSV(sheet) {
  if (sheetCache[sheet.label]) return sheetCache[sheet.label];
  try {
    const resp = await fetch(sheet.url, { cache: "no-store" });
    if (!resp.ok) throw new Error(`Fetch failed (${resp.status})`);
    const text = await resp.text();
    const parsed = parseCSV(text).filter(r => r.length > 0);
    if (parsed.length < 1) {
      sheetCache[sheet.label] = [];
      return [];
    }
    const headers = parsed[0].map(h => (h || '').trim());
    const rows = parsed.slice(1).map(r => {
      const obj = {};
      for (let i = 0; i < headers.length; i++) {
        obj[headers[i]] = r[i] !== undefined ? r[i].trim() : '';
      }
      return obj;
    });
    sheetCache[sheet.label] = rows;
    return rows;
  } catch (err) {
    console.error('Sheet load error', sheet.label, err);
    sheetCache[sheet.label] = [];
    return [];
  }
}

// ---------- main tab select ----------
async function selectTab(label) {
  setActiveTabUI(label);
  const sheet = SHEETS.find(s => s.label === label);
  if (!sheet) return;
  await fetchSheetCSV(sheet);
  populateTracksForSheet(label);
  $('trackPicker').value = '';
  $('boardContainer').innerHTML = '<div class="placeholder">Select a track to show results.</div>';
}

// ---------- wiring ----------
document.addEventListener('DOMContentLoaded', async () => {
  createTabs();

  // wire track picker
  const trackPicker = $('trackPicker');
  trackPicker.addEventListener('change', (e) => {
    const track = e.target.value;
    const activeTab = Array.from(document.querySelectorAll('.tab')).find(b => b.getAttribute('aria-selected') === 'true');
    const label = activeTab ? activeTab.dataset.label : DEFAULT_TAB;
    if (!track) {
      $('boardContainer').innerHTML = '<div class="placeholder">Select a track to show results.</div>';
      $('dateDisplay').textContent = '';
      return;
    }
    renderLeaderboard(label, track);
  });

  // initialize default tab
  const initial = SHEETS.find(s => s.label === DEFAULT_TAB) ? DEFAULT_TAB : SHEETS[0].label;
  await fetchSheetCSV(SHEETS.find(s => s.label === initial));
  selectTab(initial);
});
