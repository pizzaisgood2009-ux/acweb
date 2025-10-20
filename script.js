const SHEETS = [
  { label: "Fun Races", url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ0L2HtZ0QC3ZlIpCwOrzGVQY0cOUDGaQj2DtBNQuqvLKwQ4sLfRmAcb5LG4H9Q3D1CFkilV5QdIwge/pub?output=csv" },
  { label: "Nascar Cup", url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSH5c-BTz-ZfoJ3Rf58Q4eU9VBvsdq0XnsA99_qJM2Bvdqaq6Ex033d5gH57SQdcOm6haTNL3xi2Koh/pub?output=csv" },
  { label: "F1", url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSSQ9Zn5aGGooGR9EuRmmMW-08_hlcYR7uB3_au3_tD94jialyB8c_olGXYpQvhf2nMnw7Yd-10IVDu/pub?output=csv" },
  { label: "NTT Indycar", url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vT7Gfb8BPrv0HhxptUTq6pJmjVHSYIriySGawJa5iNwV_Wz_aj_xs1SHLIZU2RCxgQErF1eXnEBkUQv/pub?output=csv" },
  { label: "IMSA GT3", url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTcbp-Zy1fdIUZxUre2UFF7ibRCTscw1tMQ0G91rdDbTDmjKH8-MF-y1H3tJJEZxXLELIi0r_5zchBV/pub?output=csv" },
  { label: "IMSA LMP2", url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ3Sq5RbkXrtMKvVPZS8jZGZu_nN4_J7Eddy-7FmV4wo0QnG_YZb5clpx0TiqDT3DN1S56_VagmRp3P/pub?output=csv" }
];

const DEFAULT_TAB = "Fun Races";

function $(id){return document.getElementById(id)}

// ---------- CREATE TABS ----------
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

    // Logo: local images or emoji for Fun Races
    let logoElement;
    if (s.label === "Fun Races") {
      logoElement = document.createElement('span');
      logoElement.textContent = '🏁';
      logoElement.style.fontSize = '20px';
    } else {
      logoElement = document.createElement('img');
      const filename = s.label.toLowerCase().replace(/\s+/g,'_'); 
      logoElement.src = `img/${filename}.png`; 
      logoElement.alt = `${s.label} logo`;
      logoElement.className = 'tab-logo';
    }

    btn.appendChild(logoElement);

    const span = document.createElement('span');
    span.textContent = s.label;
    btn.appendChild(span);

    btn.addEventListener('click', () => selectTab(s.label));
    tabsRow.appendChild(btn);
  });
}

// ---------- CSV PARSING ----------
function parseCSV(str) {
  const [headerLine, ...lines] = str.split(/\r?\n/).filter(l => l.trim());
  const headers = headerLine.split(',').map(h => h.trim().toLowerCase().replace(/\s+/g,'_'));

  return lines.map(line => {
    const vals = parseCSVLine(line);
    const obj = {};
    headers.forEach((h, i) => obj[h] = vals[i]?.trim() || '');
    return obj;
  });
}

// Handles commas inside quotes
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

// ---------- SELECT TAB ----------
let currentData = [];

function selectTab(label){
  SHEETS.forEach(s => s.label === label ? fetchCSV(s.url,label) : null)
  document.querySelectorAll('.tab').forEach(btn => {
    btn.setAttribute('aria-selected', btn.dataset.label===label ? 'true':'false')
  });
}

// ---------- FETCH CSV ----------
async function fetchCSV(url,label){
  const resp = await fetch(url);
  const text = await resp.text();
  currentData = parseCSV(text);
  populateTracks(currentData);
  renderLeaderboard(currentData,label);
}

// ---------- POPULATE TRACK DROPDOWN ----------
function populateTracks(data){
  const picker = $('trackPicker');
  const current = picker.value;
  const tracks = Array.from(new Set(data.map(r=>r.track))).filter(Boolean);
  picker.innerHTML = '<option value="">Select a Track</option>';
  tracks.forEach(t=>{
    const opt = document.createElement('option');
    opt.value=t; opt.textContent=t;
    picker.appendChild(opt);
  });
  if(tracks.includes(current)) picker.value=current;
}

// ---------- TRACK CHANGE ----------
$('trackPicker').addEventListener('change',e=>{
  const track = e.target.value;
  const filtered = currentData.filter(r=>r.track===track);
  renderLeaderboard(filtered);
  if(filtered.length) $('dateDisplay').textContent = filtered[0].date || '';
});

// ---------- RENDER LEADERBOARD ----------
function renderLeaderboard(data){
  const container = $('boardContainer');
  if(!data.length){ container.innerHTML='<div class="placeholder">No data yet</div>'; return;}

  // dynamically detect columns
  const hasLap = Object.keys(data[0]).includes('fastest_lap') && data[0].fastest_lap !== '';
  const hasPosition = Object.keys(data[0]).includes('position') && data[0].position !== '';

  // sort if lap exists
  if(hasLap){
    data.sort((a,b)=>{
      const parse = l=>{ const [m,s]=l.split(':'); return parseInt(m)*60 + parseFloat(s) }
      return parse(a.fastest_lap) - parse(b.fastest_lap);
    });
  }
  // if position exists but not lap, sort by position
  else if(hasPosition){
    data.sort((a,b)=>parseInt(a.position||0)-parseInt(b.position||0));
  }

  let rows = '';
  data.forEach((r,i)=>{
    const posClass = i===0?'first-row':i===1?'second-row':i===2?'third-row':'';
    const pos = i+1;
    const lapOrPos = hasLap ? r.fastest_lap : (hasPosition ? r.position : '');
    const winner = r.race_winner || '';
    const car = r.car || '';
    rows += `<tr class="${posClass}"><td class="pos">${pos}</td><td>${car}</td><td>${lapOrPos}</td><td>${winner}</td></tr>`;
  });

  container.innerHTML = `<div class="table-wrap"><table class="leaderboard-table"><thead><tr><th>Pos</th><th>Car</th><th>${hasLap?'Fastest Lap':'Position'}</th><th>Winner</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

// ---------- INIT ----------
createTabs();
selectTab(DEFAULT_TAB);
