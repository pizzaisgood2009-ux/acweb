/* script.js - final integrated file
   - Uses PapaParse to reliably fetch Google Sheets CSV
   - Dropdown uses only "track" column (case-insensitive)
   - Per-sheet config drives podium/table columns
   - Nascar stage glow applied via class names
*/

const $ = id => document.getElementById(id);

/* === sheet configs ===
   update URLs if you replace sheets; logos use img/*.png or emoji
*/
const sheets = [
  { label:"Fun Races", url:"https://docs.google.com/spreadsheets/d/e/2PACX-1vQ0L2HtZ0QC3ZlIpCwOrzGVQY0cOUDGaQj2DtBNQuqvLKwQ4sLfRmAcb5LG4H9Q3D1CFkilV5QdIwge/pub?output=csv", logo:"🏁", config:{ dropdown:'track', podium:[], table:'all' } },
  { label:"F1", url:"https://docs.google.com/spreadsheets/d/e/2PACX-1vSSQ9Zn5aGGooGR9EuRmmMW-08_hlcYR7uB3_au3_tD94jialyB8c_olGXYpQvhf2nMnw7Yd-10IVDu/pub?output=csv", logo:"img/f1.png", config:{ dropdown:'track', podium:['Winner','2nd Place','3rd Place'], table:['4th Place'] } },
  { label:"Nascar Cup", url:"https://docs.google.com/spreadsheets/d/e/2PACX-1vSH5c-BTz-ZfoJ3Rf58Q4eU9VBvsdq0XnsA99_qJM2Bvdqaq6Ex033d5gH57SQdcOm6haTNL3xi2Koh/pub?output=csv", logo:"img/nascar_cup.png", config:{ dropdown:'track', podium:['Race Winner','2nd Place','3rd Place'], table:['4th Place'], stages:{ 'Stage 1 Winner':'pink','Stage 2 Winner':'green' }, excludeFirst:false } },
  { label:"NTT Indycar", url:"https://docs.google.com/spreadsheets/d/e/2PACX-1vT7Gfb8BPrv0HhxptUTq6pJmjVHSYIriySGawJa5iNwV_Wz_aj_xs1SHLIZU2RCxgQErF1eXnEBkUQv/pub?output=csv", logo:"img/ntt_indycar.png", config:{ dropdown:'track', podium:['Winner','2nd Place','3rd Place'], table:[] } },
  { label:"IMSA GT3", url:"https://docs.google.com/spreadsheets/d/e/2PACX-1vTcbp-Zy1fdIUZxUre2UFF7ibRCTscw1tMQ0G91rdDbTDmjKH8-MF-y1H3tJJEZxXLELIi0r_5zchBV/pub?output=csv", logo:"img/imsa_gt3.png", config:{ dropdown:'track', podium:['Winner','2nd Place','3rd Place'], table:['4th Place'] } },
  { label:"IMSA LMP2", url:"https://docs.google.com/spreadsheets/d/e/2PACX-1vQ3Sq5RbkXrtMKvVPZS8jZGZu_nN4_J7Eddy-7FmV4wo0QnG_YZb5clpx0TiqDT3DN1S56_VagmRp3P/pub?output=csv", logo:"img/imsa_lmp2.png", config:{ dropdown:'track', podium:['Winner','2nd Place','3rd Place'], table:['4th Place'] } }
];

let currentSheet = sheets[0];
let currentData = [];

// build tabs
const tabsRow = $('tabsRow');
sheets.forEach((s, idx)=>{
  const btn = document.createElement('button');
  btn.className = 'tab';
  if(s.logo.startsWith('img')){
    const img = document.createElement('img'); img.src = s.logo; img.className='tab-logo'; btn.appendChild(img);
    const span = document.createElement('span'); span.textContent = " " + s.label; btn.appendChild(span);
  } else {
    btn.textContent = s.logo + " " + s.label;
  }
  btn.addEventListener('click', ()=>{
    setActiveTab(idx, btn);
    loadSheet(idx);
  });
  tabsRow.appendChild(btn);
});

// set first tab active
if(tabsRow.children[0]) tabsRow.children[0].classList.add('active');

// helper: set active class
function setActiveTab(idx, clickedBtn){
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  clickedBtn.classList.add('active');
}

// load sheet with PapaParse
function loadSheet(idx){
  currentSheet = sheets[idx];
  // show loading placeholder
  $('boardContainer').innerHTML = '<div class="placeholder">Loading...</div>';
  $('podiumContainer').innerHTML = '';
  $('trackPicker').innerHTML = '<option value="">Loading tracks…</option>';
  Papa.parse(currentSheet.url, {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: function(results){
      currentData = results.data || [];
      normalizeRows();
      populateDropdown();
      resetDisplay();
    },
    error: function(err){
      console.error('CSV load error', err);
      $('boardContainer').innerHTML = '<div class="placeholder">Error loading sheet</div>';
    }
  });
}

// normalize keys: trim whitespace from keys for safety (map to trimmed keys)
function normalizeRows(){
  if(!currentData.length) return;
  const normalized = [];
  currentData.forEach(row=>{
    const nr = {};
    Object.keys(row).forEach(k=>{
      const key = String(k).trim();
      nr[key] = row[k] === undefined || row[k] === null ? '' : String(row[k]).trim();
    });
    normalized.push(nr);
  });
  currentData = normalized;
}

// Only unique, non-empty track values in dropdown (exactly from dropdown config)
function populateDropdown(){
  const sel = $('trackPicker');
  sel.innerHTML = '<option value="">Select Track</option>';
  const trackCol = currentSheet.config.dropdown;
  const set = new Set();
  currentData.forEach(r=>{
    const v = r[trackCol];
    if(v && v.toString().trim()) set.add(v.toString().trim());
  });
  const tracks = Array.from(set).sort();
  tracks.forEach(t=>{
    const o = document.createElement('option');
    o.value = t; o.textContent = t;
    sel.appendChild(o);
  });
}

// on track change
$('trackPicker').addEventListener('change', (e)=>{
  const track = e.target.value;
  if(!track){ resetDisplay(); return; }
  let filtered = currentData.filter(r => (r[currentSheet.config.dropdown] || '').toString().trim() === track);
  // if Nascar excludeFirst behavior set (config) - previously user wanted to "exclude number ones if possible" - handle if flag true
  if(currentSheet.config.excludeFirst){
    filtered = filtered.filter(r => (r['Position'] || r['Pos'] || r['Race Winner'] || '').toString().trim() !== '1');
  }
  // Sort by position if a position column exists
  filtered = sortByPositionIfPresent(filtered);
  displayPodium(filtered);
  displayTable(filtered);
  // date show
  const dateKeys = ['Date','date','Race Date','race_date'];
  const row0 = filtered[0] || {};
  for(const k of dateKeys){ if(row0[k]){ $('dateDisplay').textContent = row0[k]; break; } }
});

// reset
$('resetTrack').addEventListener('click', resetDisplay);
function resetDisplay(){
  $('podiumContainer').innerHTML = '';
  $('boardContainer').innerHTML = '<div class="placeholder">Select a track to view results</div>';
  $('trackPicker').value = '';
  $('dateDisplay').textContent = '';
}

// sort by any position-like column if present
function sortByPositionIfPresent(rows){
  if(!rows.length) return rows;
  const posCandidates = ['Position','position','Pos','pos','Place','place','Finish','finish'];
  const keys = Object.keys(rows[0]);
  const posKey = keys.find(k => posCandidates.map(x=>x.toLowerCase()).includes(k.toLowerCase()));
  if(!posKey) return rows;
  return rows.slice().sort((a,b)=>{
    const va = parseInt(a[posKey]) || Infinity;
    const vb = parseInt(b[posKey]) || Infinity;
    return va - vb;
  });
}

// display podium (uses config.podium column names)
function displayPodium(data){
  const podium = $('podiumContainer'); podium.innerHTML = '';
  const pCols = currentSheet.config.podium || [];
  // if no podium config -> no podium (e.g., Fun Races)
  if(!pCols.length) return;

  // build top3 values from the filtered data using the column names in config
  const top3 = [];
  for(let i=0;i<3;i++){
    // for each podium column, try to resolve column name in actual row keys (case-insensitive)
    const col = pCols[i];
    const val = data[0] ? findValueInRow(data[0], col) : '';
    top3.push(val || '');
  }

  // create elements: second, first, third (left, center, right)
  const order = [1,0,2]; // second, first, third DOM order
  order.forEach((idx, posIndex)=>{
    const div = document.createElement('div');
    div.className = ['second','first','third'][posIndex];
    const label = posIndex===1? '1st': (posIndex===0?'2nd':'3rd');
    const name = top3[idx] || '-';
    // special nascar stage glow if matching
    if(currentSheet.label === 'Nascar Cup' && currentSheet.config.stages){
      const stageCols = currentSheet.config.stages;
      // if the configured column for stage matches the podium column name, apply color
      for(const stageName in stageCols){
        if(stageName.toLowerCase() === (pCols[idx]||'').toLowerCase()){
          div.classList.add(stageCols[stageName] === 'pink' ? 'glow-pink' : 'glow-green');
        }
      }
    }
    div.innerHTML = `<div class="pos-label">${label}</div><div class="winner-name">${escapeHtml(name)}</div>`;
    podium.appendChild(div);
    // animate
    requestAnimationFrame(()=>{ div.style.transform='translateY(0)'; div.style.opacity='1'; });
  });

  // ensure initial styles for animation
  Array.from(podium.children).forEach((el,i)=>{
    el.style.transform='translateY(40px)';
    el.style.opacity='0';
    el.style.transition='all .55s cubic-bezier(.2,.9,.3,1)';
    setTimeout(()=>{ el.style.transform='translateY(0)'; el.style.opacity='1'; }, 60*i);
  });
}

// display table (either 'all' or specified columns)
function displayTable(data){
  const board = $('boardContainer'); board.innerHTML = '';
  const cols = currentSheet.config.table;

  if(!data.length){
    board.innerHTML = '<div class="placeholder">No results</div>'; return;
  }

  if(cols === 'all'){
    const headers = Object.keys(data[0]);
    buildTable(board, headers, data);
    return;
  }

  // map configured column names to actual header keys (case-insensitive) and build
  const headers = cols.slice();
  buildTable(board, headers, data, true);
}

// build table helper: if resolveKeys true, map requested headers to existing person keys ignoring case
function buildTable(container, requestedHeaders, rows, resolveKeys=false){
  const table = document.createElement('table'); table.className='leaderboard-table';
  const thead = document.createElement('thead');
  thead.innerHTML = '<tr>' + requestedHeaders.map(h=>`<th>${h}</th>`).join('') + '</tr>';
  table.appendChild(thead);
  const tbody = document.createElement('tbody');

  rows.forEach((r, i) => {
    const tr = document.createElement('tr');
    if(i===0) tr.classList.add('top1');
    else if(i===1) tr.classList.add('top2');
    else if(i===2) tr.classList.add('top3');

    requestedHeaders.forEach(req => {
      let val = '';
      if(resolveKeys){
        // find matching key in row (case-insensitive)
        for(const k of Object.keys(r)){
          if(k.toLowerCase() === req.toLowerCase()) { val = r[k]; break; }
        }
      } else {
        val = r[req] || '';
      }
      const td = document.createElement('td'); td.innerHTML = escapeHtml(val);

      // nascar stage glow handling for specific column names
      if(currentSheet.label === 'Nascar Cup' && currentSheet.config.stages){
        for(const stageName in currentSheet.config.stages){
          if(stageName.toLowerCase() === req.toLowerCase()){
            const color = currentSheet.config.stages[stageName];
            td.classList.add(color === 'pink' ? 'glow-pink' : 'glow-green');
          }
        }
      }

      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  container.appendChild(table);
}

// utility: find value in row case-insensitively
function findValueInRow(row, wantKey){
  if(!row) return '';
  for(const k of Object.keys(row)){
    if(k.toLowerCase() === wantKey.toLowerCase()) return row[k];
  }
  return '';
}

// escape HTML small helper
function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]); }
