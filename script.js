// script.js - client-side final (drop-in)
const configSheets = [
  { id:"f1", label:"F1", url:"https://docs.google.com/spreadsheets/d/e/2PACX-1vSSQ9Zn5aGGooGR9EuRmmMW-08_hlcYR7uB3_au3_tD94jialyB8c_olGXYpQvhf2nMnw7Yd-10IVDu/pub?output=csv", logo:"img/f1.png", cfg:{dropdown:"track", podium:["Winner","2nd Place","3rd Place"], table:["4th Place"]} },
  { id:"imsaGT3", label:"IMSA GT3", url:"https://docs.google.com/spreadsheets/d/e/2PACX-1vTcbp-Zy1fdIUZxUre2UFF7ibRCTscw1tMQ0G91rdDbTDmjKH8-MF-y1H3tJJEZxXLELIi0r_5zchBV/pub?output=csv", logo:"img/imsa_gt3.png", cfg:{dropdown:"track", podium:["Winner","2nd Place","3rd Place"], table:["4th Place"]} },
  { id:"imsaLMP2", label:"IMSA LMP2", url:"https://docs.google.com/spreadsheets/d/e/2PACX-1vQ3Sq5RbkXrtMKvVPZS8jZGZu_nN4_J7Eddy-7FmV4wo0QnG_YZb5clpx0TiqDT3DN1S56_VagmRp3P/pub?output=csv", logo:"img/imsa_lmp2.png", cfg:{dropdown:"track", podium:["Winner","2nd Place","3rd Place"], table:["4th Place"]} },
  { id:"indycar", label:"NTT IndyCar", url:"https://docs.google.com/spreadsheets/d/e/2PACX-1vT7Gfb8BPrv0HhxptUTq6pJmjVHSYIriySGawJa5iNwV_Wz_aj_xs1SHLIZU2RCxgQErF1eXnEBkUQv/pub?output=csv", logo:"img/ntt_indycar.png", cfg:{dropdown:"track", podium:["Winner","2nd Place","3rd Place"], table:[]} },
  { id:"nascar", label:"NASCAR Cup", url:"https://docs.google.com/spreadsheets/d/e/2PACX-1vSH5c-BTz-ZfoJ3Rf58Q4eU9VBvsdq0XnsA99_qJM2Bvdqaq6Ex033d5gH57SQdcOm6haTNL3xi2Koh/pub?output=csv", logo:"img/nascar_cup.png", cfg:{dropdown:"track", podium:["Race Winner","2nd Place","3rd Place"], table:["4th Place"], stages:{"Stage 1 Winner":"pink","Stage 2 Winner":"green"}, excludeFirst:false} },
  { id:"superLateModel", label:"Super Late Model", url:"https://docs.google.com/spreadsheets/d/e/2PACX-1vTVDfTXz8FwR6oL03HzFcOwZWJf1V8srF_FHSoXZbBevqS8tV9RFFBNTaHSm4-66ViUwJ8UCkrWVCgn/pub?output=csv", logo:"img/super_late_model.png", cfg:{dropdown:"track", podium:["Race Winner","2nd Place","3rd Place"], table:["4th Place"], stages:{"Stage 1 Winner":"pink","Stage 2 Winner":"green"}, excludeFirst:false} },
  { id:"fun", label:"For Fun", url:"https://docs.google.com/spreadsheets/d/e/2PACX-1vQ0L2HtZ0QC3ZlIpCwOrzGVQY0cOUDGaQj2DtBNQuqvLKwQ4sLfRmAcb5LG4H9Q3D1CFkilV5QdIwge/pub?output=csv", logo:"🏁", cfg:{dropdown:"track", podium:[], table:"all"} }
];

let currentIndex = 0;
let currentData = [];

// DOM refs
const tabsRow = document.getElementById('tabsRow');
const trackPicker = document.getElementById('trackPicker');
const podiumContainer = document.getElementById('podiumContainer');
const boardContainer = document.getElementById('boardContainer');
const dateDisplay = document.getElementById('dateDisplay');
const resetBtn = document.getElementById('resetTrack');

// create tabs
configSheets.forEach((s, idx) => {
  const btn = document.createElement('button');
  btn.className = 'tab';
  btn.dataset.idx = idx;
  if (s.logo.startsWith('img')) {
    const img = document.createElement('img'); img.src = s.logo; img.className='tab-logo'; btn.appendChild(img);
    const span = document.createElement('span'); span.textContent = " " + s.label; btn.appendChild(span);
  } else {
    btn.textContent = s.logo + " " + s.label;
  }
  btn.addEventListener('click', ()=> { document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active')); btn.classList.add('active'); loadSheet(idx); });
  tabsRow.appendChild(btn);
});

// activate first
if(tabsRow.children[0]) tabsRow.children[0].classList.add('active');

// load sheet
function loadSheet(idx){
  currentIndex = idx;
  const sheet = configSheets[idx];
  podiumContainer.innerHTML = '';
  boardContainer.innerHTML = '<div class="placeholder">Loading…</div>';
  dateDisplay.textContent = '';
  trackPicker.innerHTML = '<option>Loading tracks…</option>';

  Papa.parse(sheet.url, {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: results => {
      currentData = normalize(results.data || []);
      populateDropdown();
      resetDisplay();
    },
    error: err => {
      console.error(err);
      boardContainer.innerHTML = '<div class="placeholder">Failed to load sheet</div>';
    }
  });
}

function normalize(rows){
  return rows.map(r=>{
    const out = {};
    Object.keys(r).forEach(k => out[String(k).trim()] = r[k]===null||r[k]===undefined ? '' : String(r[k]).trim());
    return out;
  }).filter(r => Object.keys(r).length>0);
}

// populate dropdown with only the configured track column, unique + trimmed
function populateDropdown(){
  const cfg = configSheets[currentIndex].cfg;
  const trackCol = cfg.dropdown;
  const set = new Set();
  currentData.forEach(r => {
    const v = r[trackCol];
    if(v && v.toString().trim()) set.add(v.toString().trim());
  });
  const arr = Array.from(set).sort();
  trackPicker.innerHTML = '<option value="">Select Track</option>';
  arr.forEach(t => {
    const o = document.createElement('option'); o.value = t; o.textContent = t; trackPicker.appendChild(o);
  });
}

trackPicker.addEventListener('change', ()=>{
  const t = trackPicker.value;
  if(!t){ resetDisplay(); return; }
  let rows = currentData.filter(r => (r[configSheets[currentIndex].cfg.dropdown]||'').toString().trim() === t);
  rows = sortByPositionIfPresent(rows);
  displayPodium(rows);
  displayTable(rows);
  const d = findKeyCaseInsensitive(rows[0]||{}, ['Date','date','Race Date']);
  dateDisplay.textContent = d || '';
});

resetBtn.addEventListener('click', resetDisplay);

function resetDisplay(){
  podiumContainer.innerHTML = '';
  boardContainer.innerHTML = '<div class="placeholder">Select a track to view results</div>';
  trackPicker.value = '';
  dateDisplay.textContent = '';
}

function sortByPositionIfPresent(rows){
  if(!rows.length) return rows;
  const posKeys = ['Position','position','Pos','pos','Place','place','Finish','finish'];
  const k = Object.keys(rows[0]).find(h => posKeys.includes(h));
  if(!k) return rows;
  return rows.slice().sort((a,b)=>{
    const va = parseInt(a[k])||Infinity, vb = parseInt(b[k])||Infinity; return va-vb;
  });
}

function displayPodium(rows){
  const cfg = configSheets[currentIndex].cfg;
  podiumContainer.innerHTML = '';
  if(!cfg.podium || !cfg.podium.length) return;

  const values = [];
  for(let i=0;i<3;i++){
    values.push(findValueCaseInsensitive(rows[0]||{}, cfg.podium[i]) || '');
  }

  const order = [1,0,2];
  order.forEach((idx, posIndex)=>{
    const div = document.createElement('div');
    div.className = ['second','first','third'][posIndex];
    const label = posIndex===1 ? '1st' : (posIndex===0 ? '2nd':'3rd');
    const val = escapeHtml(values[idx] || '-');

    if((configSheets[currentIndex].label === 'NASCAR' || configSheets[currentIndex].label === 'Super Late Model') && configSheets[currentIndex].cfg.stages){
      for(const stage in configSheets[currentIndex].cfg.stages){
        if(stage.toLowerCase() === (cfg.podium[idx]||'').toLowerCase()){
          const color = configSheets[currentIndex].cfg.stages[stage];
          div.classList.add(color === 'pink' ? 'glow-pink' : 'glow-green');
        }
      }
    }

    div.innerHTML = `<div class="pos-label">${label}</div><div class="winner-name">${val}</div>`;
    podiumContainer.appendChild(div);
  });

  Array.from(podiumContainer.children).forEach((el,i)=>{
    el.style.transform='translateY(40px)'; el.style.opacity='0';
    setTimeout(()=>{ el.style.transition='all .55s cubic-bezier(.2,.9,.3,1)'; el.style.transform='translateY(0)'; el.style.opacity='1'; }, 80*i);
  });
}

function displayTable(rows){
  const cfg = configSheets[currentIndex].cfg;
  boardContainer.innerHTML = '';
  if(!rows.length){ boardContainer.innerHTML = '<div class="placeholder">No results</div>'; return; }

  if(cfg.table === 'all'){
    const headers = Object.keys(rows[0]);
    buildTable(boardContainer, headers, rows);
    return;
  }

  buildTable(boardContainer, cfg.table, rows, true);
}

function buildTable(container, reqHeaders, rows, resolveKeys=false){
  const table = document.createElement('table'); table.className='leaderboard-table';
  const thead = document.createElement('thead'); thead.innerHTML = '<tr>' + reqHeaders.map(h=>`<th>${h}</th>`).join('') + '</tr>'; table.appendChild(thead);
  const tbody = document.createElement('tbody');

  rows.forEach((r,i)=>{
    const tr = document.createElement('tr');
    if(i===0) tr.classList.add('top1'); else if(i===1) tr.classList.add('top2'); else if(i===2) tr.classList.add('top3');
    reqHeaders.forEach(req=>{
      let val = '';
      if(resolveKeys) val = findValueCaseInsensitive(r, req) || '';
      else val = r[req] || '';
      const td = document.createElement('td'); td.innerHTML = escapeHtml(val);

      if((configSheets[currentIndex].label === 'NASCAR' || configSheets[currentIndex].label === 'Super Late Model') && configSheets[currentIndex].cfg.stages){
        for(const stage in configSheets[currentIndex].cfg.stages){
          if(stage.toLowerCase() === req.toLowerCase()){
            td.classList.add(configSheets[currentIndex].cfg.stages[stage] === 'pink' ? 'glow-pink' : 'glow-green');
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

function findValueCaseInsensitive(row, want){
  if(!row) return '';
  for(const k of Object.keys(row)){
    if(k.toLowerCase() === want.toLowerCase()) return row[k];
  }
  return '';
}
function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]); }

// initial load
loadSheet(0);
