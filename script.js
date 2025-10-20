const $ = id => document.getElementById(id);

const sheets = [
  { label: "Fun Races", url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ0L2HtZ0QC3ZlIpCwOrzGVQY0cOUDGaQj2DtBNQuqvLKwQ4sLfRmAcb5LG4H9Q3D1CFkilV5QdIwge/pub?output=csv", logo: "🏁" },
  { label: "F1", url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSSQ9Zn5aGGooGR9EuRmmMW-08_hlcYR7uB3_au3_tD94jialyB8c_olGXYpQvhf2nMnw7Yd-10IVDu/pub?output=csv", logo: "img/f1.png" },
  { label: "Nascar Cup", url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSH5c-BTz-ZfoJ3Rf58Q4eU9VBvsdq0XnsA99_qJM2Bvdqaq6Ex033d5gH57SQdcOm6haTNL3xi2Koh/pub?output=csv", logo: "img/nascar_cup.png" },
  { label: "NTT Indycar", url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vT7Gfb8BPrv0HhxptUTq6pJmjVHSYIriySGawJa5iNwV_Wz_aj_xs1SHLIZU2RCxgQErF1eXnEBkUQv/pub?output=csv", logo: "img/ntt_indycar.png" },
  { label: "IMSA GT3", url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTcbp-Zy1fdIUZxUre2UFF7ibRCTscw1tMQ0G91rdDbTDmjKH8-MF-y1H3tJJEZxXLELIi0r_5zchBV/pub?output=csv", logo: "img/imsa_gt3.png" },
  { label: "IMSA LMP2", url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ3Sq5RbkXrtMKvVPZS8jZGZu_nN4_J7Eddy-7FmV4wo0QnG_YZb5clpx0TiqDT3DN1S56_VagmRp3P/pub?output=csv", logo: "img/imsa_lmp2.png" }
];

let currentSheet = sheets[0];
let currentData = [];

// Create tabs
const tabsRow = $('tabsRow');
sheets.forEach((s,i)=>{
  const tab = document.createElement('button');
  tab.className = 'tab';
  
  if(s.logo.startsWith("img")) {
    const img = document.createElement('img');
    img.src = s.logo;
    img.className = 'tab-logo';
    tab.appendChild(img);
    const span = document.createElement('span');
    span.textContent = " " + s.label;
    tab.appendChild(span);
  } else {
    tab.textContent = s.logo + " " + s.label;
  }

  tab.addEventListener('click',()=>{
    loadSheet(i);
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    tab.classList.add('active');
  });

  tabsRow.appendChild(tab);
});

// Load initial sheet and set first tab active
loadSheet(0);
tabsRow.children[0].classList.add('active');

function loadSheet(idx){
  currentSheet = sheets[idx];
  fetch(currentSheet.url)
    .then(res=>res.text())
    .then(csv=>{
      currentData = csvToArray(csv);
      populateDropdown();
      resetDisplay();
    });
}

function csvToArray(str){
  const lines = str.trim().split('\n');
  const headers = lines[0].split(',');
  return lines.slice(1).map(l=>{
    const values = l.split(',');
    let obj = {};
    headers.forEach((h,i)=>obj[h.trim()] = values[i] ? values[i].trim() : '');
    return obj;
  });
}

function populateDropdown(){
  const sel = $('trackPicker');
  sel.innerHTML = '<option value="">Select Track</option>';
  const tracks = [...new Set(currentData.map(r=>r['Track']))];
  tracks.forEach(t=>{
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = t;
    sel.appendChild(opt);
  });
}

$('trackPicker').addEventListener('change', e=>{
  const track = e.target.value;
  if(!track){ resetDisplay(); return; }
  const filtered = currentData.filter(r=>r['Track']===track);
  displayPodium(filtered);
  displayLeaderboard(filtered);
  if(filtered[0] && filtered[0]['Date']) $('dateDisplay').textContent = filtered[0]['Date'];
});

function resetDisplay(){
  $('podiumContainer').innerHTML = '';
  $('boardContainer').innerHTML = '<div class="placeholder">Select a track to view results</div>';
  $('dateDisplay').textContent = '';
  $('trackPicker').value = '';
}

function displayPodium(data){
  const podium = $('podiumContainer');
  podium.innerHTML = '';
  const top3 = data.slice(0,3);
  const positions = ['first','second','third'];
  top3.forEach((r,i)=>{
    const div = document.createElement('div');
    div.className = positions[i];
    div.innerHTML = `<div class="pos-label">${i+1}</div>
                     <div class="winner-name">${r['Winner'] || r['Position'] || r['Car']}</div>`;
    podium.appendChild(div);
  });
}

function displayLeaderboard(data){
  const board = $('boardContainer');
  board.innerHTML = '';
  const table = document.createElement('table');
  table.className = 'leaderboard-table';
  const headers = Object.keys(data[0]);
  const thead = document.createElement('thead');
  thead.innerHTML = '<tr>' + headers.map(h=>`<th>${h}</th>`).join('') + '</tr>';
  table.appendChild(thead);
  const tbody = document.createElement('tbody');
  data.forEach((r,i)=>{
    const tr = document.createElement('tr');
    if(i===0) tr.classList.add('top1');
    else if(i===1) tr.classList.add('top2');
    else if(i===2) tr.classList.add('top3');
    tr.innerHTML = headers.map(h=>`<td>${r[h]}</td>`).join('');
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  board.appendChild(table);
}

$('resetTrack').addEventListener('click',()=>resetDisplay());
