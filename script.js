const $ = id => document.getElementById(id);

// Sheet configurations
const sheets = [
  { 
    label: "Fun Races", 
    url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ0L2HtZ0QC3ZlIpCwOrzGVQY0cOUDGaQj2DtBNQuqvLKwQ4sLfRmAcb5LG4H9Q3D1CFkilV5QdIwge/pub?output=csv", 
    logo: "🏁", 
    config: { dropdown: 'track', podium: [], table: 'all' } 
  },
  { 
    label: "F1", 
    url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSSQ9Zn5aGGooGR9EuRmmMW-08_hlcYR7uB3_au3_tD94jialyB8c_olGXYpQvhf2nMnw7Yd-10IVDu/pub?output=csv", 
    logo: "img/f1.png", 
    config: { dropdown: 'track', podium: ['Winner','2nd Place','3rd Place'], table: ['4th Place'] } 
  },
  { 
    label: "Nascar Cup", 
    url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSH5c-BTz-ZfoJ3Rf58Q4eU9VBvsdq0XnsA99_qJM2Bvdqaq6Ex033d5gH57SQdcOm6haTNL3xi2Koh/pub?output=csv", 
    logo: "img/nascar_cup.png", 
    config: { 
      dropdown: 'track', 
      podium: ['Race Winner','2nd Place','3rd Place'], 
      table: ['4th Place'], 
      stages: { 'Stage 1 Winner':'pink', 'Stage 2 Winner':'green' }, 
      excludeFirst: true 
    } 
  },
  { 
    label: "NTT Indycar", 
    url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vT7Gfb8BPrv0HhxptUTq6pJmjVHSYIriySGawJa5iNwV_Wz_aj_xs1SHLIZU2RCxgQErF1eXnEBkUQv/pub?output=csv", 
    logo: "img/ntt_indycar.png", 
    config: { dropdown: 'track', podium: ['Winner','2nd Place','3rd Place'], table: [] } 
  },
  { 
    label: "IMSA GT3", 
    url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTcbp-Zy1fdIUZxUre2UFF7ibRCTscw1tMQ0G91rdDbTDmjKH8-MF-y1H3tJJEZxXLELIi0r_5zchBV/pub?output=csv", 
    logo: "img/imsa_gt3.png", 
    config: { dropdown: 'track', podium: ['Winner','2nd Place','3rd Place'], table: ['4th Place'] } 
  },
  { 
    label: "IMSA LMP2", 
    url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ3Sq5RbkXrtMKvVPZS8jZGZu_nN4_J7Eddy-7FmV4wo0QnG_YZb5clpx0TiqDT3DN1S56_VagmRp3P/pub?output=csv", 
    logo: "img/imsa_lmp2.png", 
    config: { dropdown: 'track', podium: ['Winner','2nd Place','3rd Place'], table: ['4th Place'] } 
  }
];

let currentSheet = sheets[0];
let currentData = [];

// Create Tabs
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

// Initial load
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
  const headers = lines[0].split(',').map(h=>h.trim());
  return lines.slice(1).map(l=>{
    const values = l.split(',');
    let obj = {};
    headers.forEach((h,i)=>obj[h]=values[i] ? values[i].trim() : '');
    return obj;
  });
}

function populateDropdown(){
  const sel = $('trackPicker');
  sel.innerHTML = '<option value="">Select Track</option>';
  const trackCol = currentSheet.config.dropdown; // should always be 'track'

  // Only unique, non-empty track names
  const tracks = [...new Set(
    currentData
      .map(r => r[trackCol]?.trim()) // only the "track" column
      .filter(t => t && t.length > 0) // exclude empty
  )];

  tracks.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = t;
    sel.appendChild(opt);
  });
}


  // Sort alphabetically (optional)
  const tracks = Array.from(trackSet).sort();

  tracks.forEach(t=>{
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = t;
    sel.appendChild(opt);
  });
}

// Dropdown change
$('trackPicker').addEventListener('change', e=>{
  const track = e.target.value;
  if(!track){ resetDisplay(); return; }
  let filtered = currentData.filter(r=>r[currentSheet.config.dropdown]===track);

  // Exclude first for Nascar if configured
  if(currentSheet.config.excludeFirst) filtered = filtered.filter(r=>r['Race Winner']!=='1');

  displayPodium(filtered);
  displayTable(filtered);
});

// Reset podium/table
function resetDisplay(){
  $('podiumContainer').innerHTML = '';
  $('boardContainer').innerHTML = '';
  $('trackPicker').value = '';
}

// Display podium
function displayPodium(data){
  const podium = $('podiumContainer');
  podium.innerHTML = '';
  const podiumCols = currentSheet.config.podium;
  podiumCols.slice(0,3).forEach((col,i)=>{
    const div = document.createElement('div');
    div.className = ['first','second','third'][i];
    let value = data[0][col] || '';

    // Apply glowing rim if configured for stages
    if(currentSheet.config.stages && currentSheet.config.stages[col]){
      const color = currentSheet.config.stages[col];
      div.style.boxShadow = `0 0 15px ${color}`;
    }

    div.innerHTML = `<div class="pos-label">${i+1}</div><div class="winner-name">${value}</div>`;
    podium.appendChild(div);

    // Animate rise
    div.style.transform = 'translateY(50px)';
    div.style.opacity='0';
    setTimeout(()=>{
      div.style.transition='all 0.6s ease';
      div.style.transform='translateY(0)';
      div.style.opacity='1';
    }, 50*i);
  });
}

// Display table
function displayTable(data){
  const board = $('boardContainer');
  board.innerHTML='';
  const tableCols = currentSheet.config.table;

  if(tableCols==='all'){
    // Fun Races: full table
    const headers = Object.keys(data[0]);
    const table = document.createElement('table');
    table.className='leaderboard-table';
    const thead = document.createElement('thead');
    thead.innerHTML='<tr>'+headers.map(h=>`<th>${h}</th>`).join('')+'</tr>';
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    data.forEach(r=>{
      const tr = document.createElement('tr');
      tr.innerHTML = headers.map(h=>`<td>${r[h]}</td>`).join('');
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    board.appendChild(table);
  } else {
    // Display specific columns
    const table = document.createElement('table');
    table.className='leaderboard-table';
    const thead = document.createElement('thead');
    thead.innerHTML='<tr>'+tableCols.map(h=>`<th>${h}</th>`).join('')+'</tr>';
    table.appendChild(thead);
    const tbody = document.createElement('tbody');

    data.forEach(r=>{
      const tr = document.createElement('tr');
      tableCols.forEach(col=>{
        let td = document.createElement('td');
        td.textContent = r[col] || '';

        // Glowing rims for Nascar Stage winners
        if(currentSheet.label==='Nascar Cup' && currentSheet.config.stages){
          for(let stage in currentSheet.config.stages){
            if(col===stage) td.classList.add(currentSheet.config.stages[stage]==='pink'?'glow-pink':'glow-green');
          }
        }
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    board.appendChild(table);
  }
}
