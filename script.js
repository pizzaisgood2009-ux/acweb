const SHEETS = [
  { label:"Fun Races", url:"https://docs.google.com/spreadsheets/d/e/2PACX-1vQ0L2HtZ0QC3ZlIpCwOrzGVQY0cOUDGaQj2DtBNQuqvLKwQ4sLfRmAcb5LG4H9Q3D1CFkilV5QdIwge/pub?output=csv", trackCol:"track", carCol:"car", winnerCol:"race_winner", positionCol:"position", dateCol:"date" },
  { label:"Nascar Cup", url:"https://docs.google.com/spreadsheets/d/e/2PACX-1vSH5c-BTz-ZfoJ3Rf58Q4eU9VBvsdq0XnsA99_qJM2Bvdqaq6Ex033d5gH57SQdcOm6haTNL3xi2Koh/pub?output=csv", trackCol:"track", carCol:"car", winnerCol:"race_winner", positionCol:"position", dateCol:"date" },
  { label:"F1", url:"https://docs.google.com/spreadsheets/d/e/2PACX-1vSSQ9Zn5aGGooGR9EuRmmMW-08_hlcYR7uB3_au3_tD94jialyB8c_olGXYpQvhf2nMnw7Yd-10IVDu/pub?output=csv", trackCol:"track", carCol:"car", winnerCol:"race_winner", positionCol:"position", dateCol:"date" },
  { label:"NTT Indycar", url:"https://docs.google.com/spreadsheets/d/e/2PACX-1vT7Gfb8BPrv0HhxptUTq6pJmjVHSYIriySGawJa5iNwV_Wz_aj_xs1SHLIZU2RCxgQErF1eXnEBkUQv/pub?output=csv", trackCol:"track", carCol:"car", winnerCol:"race_winner", positionCol:"position", dateCol:"date" },
  { label:"IMSA GT3", url:"https://docs.google.com/spreadsheets/d/e/2PACX-1vTcbp-Zy1fdIUZxUre2UFF7ibRCTscw1tMQ0G91rdDbTDmjKH8-MF-y1H3tJJEZxXLELIi0r_5zchBV/pub?output=csv", trackCol:"track", carCol:"car", winnerCol:"race_winner", positionCol:"position", dateCol:"date" },
  { label:"IMSA LMP2", url:"https://docs.google.com/spreadsheets/d/e/2PACX-1vQ3Sq5RbkXrtMKvVPZS8jZGZu_nN4_J7Eddy-7FmV4wo0QnG_YZb5clpx0TiqDT3DN1S56_VagmRp3P/pub?output=csv", trackCol:"track", carCol:"car", winnerCol:"race_winner", positionCol:"position", dateCol:"date" }
];

const DEFAULT_TAB = "Fun Races";
let currentData = [];
let currentSheet = null;

function $(id){ return document.getElementById(id); }

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

    // Logo or emoji
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
    headers.forEach((h,i)=>obj[h]=vals[i]?.trim()||'');
    return obj;
  });
}

// Handles commas inside quotes
function parseCSVLine(line){
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i=0;i<line.length;i++){
    const char = line[i];
    if(char === '"') inQuotes = !inQuotes;
    else if(char === ',' && !inQuotes){ result.push(current); current=''; }
    else current+=char;
  }
  result.push(current);
  return result;
}

// ---------- SELECT TAB ----------
function selectTab(label){
  currentSheet = SHEETS.find(s=>s.label===label);
  fetchCSV(currentSheet.url);
  document.querySelectorAll('.tab').forEach(btn=>{
    btn.setAttribute('aria-selected', btn.dataset.label===label?'true':'false')
  });
}

// ---------- FETCH CSV ----------
async function fetchCSV(url){
  try{
    const resp = await fetch(url);
    const text = await resp.text();
    currentData = parseCSV(text);
    populateTracks();
    renderLeaderboard(currentData);
  } catch(err){
    console.error("CSV load error",err);
    $('boardContainer').innerHTML='<div class="placeholder">Error loading data</div>';
  }
}

// ---------- POPULATE TRACK DROPDOWN ----------
function populateTracks(){
  const picker = $('trackPicker');
  const current = picker.value;
  if(!currentSheet || !currentData.length) return;

  const tracks = Array.from(new Set(currentData.map(r=>r[currentSheet.trackCol]||'-')));
  picker.innerHTML = '<option value="">All Tracks</option>';
  tracks.forEach(t=>{
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = t;
    picker.appendChild(opt);
  });
  if(tracks.includes(current)) picker.value = current;
}

// ---------- TRACK CHANGE ----------
$('trackPicker').addEventListener('change', e=>{
  const track = e.target.value;
  const filtered = track ? currentData.filter(r=>r[currentSheet.trackCol]===track) : currentData;
  renderLeaderboard(filtered);
  if(filtered.length) $('dateDisplay').textContent = filtered[0][currentSheet.dateCol]||'-';
});

// ---------- RENDER LEADERBOARD ----------
function renderLeaderboard(data){
  const container = $('boardContainer');
  if(!data.length){ container.innerHTML='<div class="placeholder">No data yet</div>'; return; }

  // Sort by position if available
  if(currentSheet.positionCol){
    data.sort((a,b)=>parseInt(a[currentSheet.positionCol]||Infinity)-parseInt(b[currentSheet.positionCol]||Infinity));
  }

  let rows = '';
  data.forEach((r,i)=>{
    const posClass = i===0?'first-row':i===1?'second-row':i===2?'third-row':'';
    const pos = i+1;
    const car = r[currentSheet.carCol]||'-';
    const winner = r[currentSheet.winnerCol]||'-';
    rows += `<tr class="${posClass}"><td>${pos}</td><td>${car}</td><td>${winner}</td></tr>`;
  });

  container.innerHTML = `<div class="table-wrap"><table class="leaderboard-table"><thead><tr><th>Pos</th><th>Car</th><th>Winner</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

// ---------- TAB AUTO-RESIZE ----------
function resizeTabs(){
  const tabs = document.querySelectorAll('.tab');
  let maxWidth = 0;
  tabs.forEach(t=>{ t.style.width='auto'; maxWidth = Math.max(maxWidth,t.offsetWidth); });
  tabs.forEach(t=>t.style.width=maxWidth+'px');
}

// ---------- INIT ----------
document.addEventListener('DOMContentLoaded',()=>{
  createTabs();
  selectTab(DEFAULT_TAB);
  resizeTabs();
  window.addEventListener('resize', resizeTabs);
});
