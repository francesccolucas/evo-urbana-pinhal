// Configurações iniciais do Mapa e das Camadas
// Central: -22.192592, -46.747109
// Docs do Leaflet: https://leafletjs.com/

let map, overlays = {}, baseLayers = {}, currentOverlay, currentYear = 2025;
const MAP_CENTER = [-22.192592, -46.747109];
const MAP_BOUNDS = L.latLngBounds([[-22.227, -46.796],[-22.163, -46.698]]); /* Limite liberal */
const ANOS = [1978, 1984, 2000, 2025];

// Para cada imagem histórica, além dos bounds
// você pode ajustar a escala do PNG ao calibrar o alinhamento com a Matriz.
// Exemplo de uso:
// 1978: { img: 'imagens/mapa_1978.png', boundsAdjust: [...], scale: 93.401 },
// Escala: 100 = tamanho original do PNG, 105 = 5% maior, 93 = 7% menor, etc.

// Calcula novo bounds ajustado por escala
function scaleBounds(bounds, scale) {
  if (!scale || scale === 100) return bounds;
  const ne = bounds[0]; // [lat, lon] NW
  const sw = bounds[1]; // [lat, lon] SE
  // Centro dos bounds
  const latC = (ne[0] + sw[0]) / 2;
  const lonC = (ne[1] + sw[1]) / 2;
  const latHalf = (ne[0] - latC) * (scale/100);
  const lonHalf = (ne[1] - lonC) * (scale/100);
  const latHalfSW = (sw[0] - latC) * (scale/100);
  const lonHalfSW = (sw[1] - lonC) * (scale/100);
  // Novo bounds escalado mantendo centro
  return [
    [latC + latHalf, lonC + lonHalf],   // NW
    [latC + latHalfSW, lonC + lonHalfSW]// SE
  ];
}

// Para calibrar: ajuste boundsAdjust, e se precisar, ajuste 'scale' (em %)! Exemplo: scale: 93.12
const OVERLAY_CONFIGS = {
  1978: { img: 'imagens/mapa_1978.png', boundsAdjust: [[-22.20625, -46.83325], [-22.156, -46.692]], scale: 140 },
  1984: { img: 'imagens/mapa_1984.png', boundsAdjust: [[-22.21381, -46.8257], [-22.158, -46.695]], scale: 123.5 },
  2000: { img: 'imagens/mapa_2000.png', boundsAdjust: [[-22.2339, -46.7946], [-22.159, -46.696]], scale: 80.555 },
};

/* Para calibrar as imagens históricas:
     Modifique boundsAdjust das OVERLAY_CONFIGS até a Praça da Matriz alinhar nos anos.
     Pode também ampliar/reduzir modificando respectivamente lat/lon dos cantos.
     Agora também pode ajustar 'scale' (em porcentagem decimal, ex: 97.5 para 2.5% menor).
*/

// Unifica listeners para garantir funcionamento imediato e correto das modais
window.addEventListener('DOMContentLoaded', function() {
  initMap();
  setUpSlider();
  setUpPins();
  setUpSidebarListeners();
  setUpModals();
  setUpLayerSwitch();
});

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('about-btn').onclick = () => openModal('about-modal');
  document.getElementById('import-export-btn').onclick = function() {
    renderModalPinsList();
    openModal('import-export-modal');
  };
  [...document.querySelectorAll('.modal-close')].forEach(btn => btn.onclick = closeModal);
});

function setUpSidebarListeners() {
  document.getElementById('import-export-btn').onclick = function() {
    renderModalPinsList();
    openModal('import-export-modal');
  };
}

// ---------------------------
// Otimização overlays
let overlaysLoading = {};
function setOverlayBySlider(val) {
  // Limita zoom nos overlays históricos
  let limitZoom = false;
  if (val < 2.99) {
    map.options.maxZoom = 18;
    map.options.minZoom = 14;
    limitZoom = true;
  } else {
    map.options.maxZoom = 19;
    map.options.minZoom = 14;
  }
  removeOverlayLoading();

  for(const ano of [1978, 1984, 2000]) overlays[ano].setOpacity(0);
  baseLayers['satellite'].setOpacity(0);
  let anoA, anoB, t;
  if(val < 1) {
    anoA=1978; anoB=1984; t=val-0;
    showOverlayLazy(anoA); showOverlayLazy(anoB);
    overlays[anoA].setOpacity(1-t);
    overlays[anoB].setOpacity(t);
  } else if(val < 2) {
    anoA=1984; anoB=2000; t=val-1;
    showOverlayLazy(anoA); showOverlayLazy(anoB);
    overlays[anoA].setOpacity(1-t);
    overlays[anoB].setOpacity(t);
  } else {
    t = val - 2;
    showOverlayLazy(2000);
    overlays[2000].setOpacity(1-t);
    baseLayers['satellite'].setOpacity(t);
  }
}

function showOverlayLazy(ano) {
  if(!overlays[ano]) return;
  let overlayImgTag = document.querySelector('.leaflet-overlay-pane img[src*="' + OVERLAY_CONFIGS[ano].img + '"]');
  if (!overlayImgTag) addOverlayLoading('Carregando imagem histórica...');
  overlays[ano].on('load', () => removeOverlayLoading());
}
function addOverlayLoading(txt) {
  if(document.getElementById('overlay-loading')) return;
  let el = document.createElement('div');
  el.id = 'overlay-loading';
  el.innerHTML = '<div>'+txt+'</div>';
  el.style.position = 'absolute';
  el.style.zIndex = 9999;
  el.style.left = '0';
  el.style.right = '0';
  el.style.top = '50%';
  el.style.transform = 'translateY(-50%)';
  el.style.textAlign = 'center';
  el.style.fontSize = '1.2em';
  el.style.background = 'rgba(254,253,250,0.9)';
  el.style.color = '#001f3f';
  el.style.padding = '1.2em 1em';
  document.getElementById('map').appendChild(el);
}
function removeOverlayLoading() {
  let el = document.getElementById('overlay-loading');
  if(el && el.parentNode) el.parentNode.removeChild(el);
}

// Otimiza renderização dos overlays grandes
function initMap() {
  map = L.map('map', {
    center: MAP_CENTER,
    zoom: 16,
    minZoom: 14,
    maxZoom: 19,
    maxBounds: MAP_BOUNDS,
    attributionControl: false,
  });

  baseLayers['satellite'] = L.tileLayer('https://mt1.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', {
    attribution: 'Google',
    maxZoom: 21,
  }).addTo(map);
  baseLayers['osm'] = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'OpenStreetMap',
    maxZoom: 19
  });

  for(const ano of [1978, 1984, 2000]) {
    const c = OVERLAY_CONFIGS[ano];
    const boundsEscalado = scaleBounds(c.boundsAdjust, c.scale);
    overlays[ano] = L.imageOverlay(c.img, boundsEscalado, { opacity: 0, interactive: false });
    overlays[ano].on('add', () => {
      setTimeout(() => {
        let pane = document.querySelector('.leaflet-overlay-pane img[src*="'+c.img+'"]');
        if(pane) {
          pane.style.maxWidth = '100vw';
          pane.style.maxHeight = '100vh';
          pane.style.imageRendering = 'auto';
        }
      }, 200);
    });
    overlays[ano].addTo(map);
  }
  setOverlayBySlider(3);
  map.on('click', function(e) {
    openPinPopup(e.latlng);
  });
}

function setUpSlider() {
  const slider = document.getElementById('year-slider');
  slider.addEventListener('input', function() {
    setOverlayBySlider(parseFloat(slider.value));
  });
}

function setUpLayerSwitch() {
  const osmCheck = document.getElementById('osm-switch');
  osmCheck.addEventListener('change', function() {
    if(osmCheck.checked) baseLayers['osm'].addTo(map);
    else map.removeLayer(baseLayers['osm']);
  });
}

//////////////////////////////// PINS ////////////////////////////////
let pinData = [], markers = [];
const PINS_KEY = 'espinh-pins-v1';

function setUpPins() {
  loadPins();
  renderAllPins();
}
function openPinPopup(latlng, imported=false) {
  const popupContent = document.createElement('div');
  popupContent.innerHTML = `
    <label for='pinname'>Nome/Anotação:<br>
      <input id='pinname' maxlength='60' style='width:180px' placeholder='Digite o nome/síntese'>
    </label>
    <br>
    <button id='add-pin-confirm' style='margin-top:8px; background:#001f3f;color:#fff;'>Adicionar Pin</button>
  `;
  const popup = L.popup().setLatLng(latlng).setContent(popupContent);
  popup.openOn(map);
  popupContent.querySelector('#add-pin-confirm').onclick = () => {
    const name = popupContent.querySelector('#pinname').value.trim().slice(0,60) || `Local (${pinData.length+1})`;
    addPin(latlng, name, imported);
    map.closePopup();
  }
}

function addPin(latlng, name, imported=false) {
  const id = `pin_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const pin = { id, latlng, name, imported };
  pinData.push(pin);
  savePins();
  renderAllPins();
}
function savePins() {
  localStorage.setItem(PINS_KEY, JSON.stringify(pinData));
}
function loadPins() {
  try { pinData = JSON.parse(localStorage.getItem(PINS_KEY) || '[]'); } catch { pinData = []; }
}
function renderAllPins() {
  // Remove anteriores
  markers.forEach(m=>map.removeLayer(m.marker));
  markers = [];
  pinData.forEach((pin,i) => {
    let icon = L.divIcon({
      className: 'custom-icon' + (pin.selected ? ' pin-selected-red' : ''),
      html: `<div style="width:20px;height:20px;background:${pin.selected? '#c1272d': (pin.imported? '#d4af37':'#001f3f')};border: 2px solid #fff; transform: perspective(40px) rotateX(20deg) rotateZ(-45deg);
  border-radius: 50% 50% 50% 0; box-shadow:0 0 3px #333;"></div>`
    });
    let marker = L.marker(pin.latlng, { icon })
      .addTo(map)
      .on('click', () => showPinPopup(pin));
    markers.push({ pin, marker });
  });
  renderSidebarPins();
}

// Popup com nome completo ao clicar no pin
function showPinPopup(pin) {
  L.popup()
    .setLatLng(pin.latlng)
    .setContent('<b>' + (pin.name || 'Pin sem nome') + '</b>')
    .openOn(map);
  selectPin(pin.id, false); // Destaca pin (ficando vermelho), mas sem centralizar ao clicar no próprio pin
}

function renderSidebarPins() {
  const ul = document.getElementById('pins-list');
  ul.innerHTML = '';
  pinData.forEach((pin,i) => {
    const li = document.createElement('li');
    li.className = 'pin-item';
    li.innerHTML = `<span class="pin-icon${pin.imported?' imported':''}"></span><span class="pin-label${pin.imported?' imported':''}" title="${pin.name}">${pin.name}${pin.imported? ' (Importado)': ''}</span><span class="pin-actions"><button class='pin-action rename' title='Renomear'>✏️</button><button class='pin-action' title='Excluir'>✖</button></span>`;
    li.querySelector('.pin-label').onclick = () => selectPin(pin.id, true);
    li.querySelector('.pin-action.rename').onclick = () => renamePin(pin.id);
    li.querySelector('.pin-action[title="Excluir"]').onclick = () => deletePin(pin.id);
    ul.appendChild(li);
  });
}

function selectPin(id, center=false) {
  // Limpa seleção anterior
  pinData.forEach(pin=>{ pin.selected = false });
  const idx = pinData.findIndex(p=>p.id===id);
  if(idx < 0) return;
  pinData[idx].selected = true;
  savePins();
  renderAllPins();
  if(center && markers[idx]) {
    map.setView(markers[idx].pin.latlng, 18, { animate: true });
  }
  // Sidebar
  [...document.querySelectorAll('.pin-item')].forEach(li=>li.classList.remove('selected'));
  if(idx>=0) document.querySelectorAll('.pin-item')[idx].classList.add('selected');
}

function renamePin(id) {
  const idx = pinData.findIndex(p=>p.id===id);
  if(idx<0) return;
  const novo = prompt('Digite novo nome (máx. 60 caracteres)', pinData[idx].name || '')?.trim().slice(0,60);
  if(novo) { pinData[idx].name = novo; savePins(); renderAllPins(); }
}
function deletePin(id) {
  if(!confirm('Tem certeza que deseja remover o pin?')) return;
  pinData = pinData.filter(p=>p.id!==id); savePins(); renderAllPins();
}
///////////////////////////////// MODAIS /////////////////////////////////
function setUpModals() {
  document.getElementById('about-btn').onclick = () => openModal('about-modal');
  document.getElementById('export-selected').onclick = exportSelectedPins;
  document.getElementById('select-all-pins').onclick = toggleSelectAllPins;
  document.getElementById('import-file').onchange = importPinsFromFile;
  [...document.querySelectorAll('.modal-close')].forEach(btn=>btn.onclick = closeModal);
}
function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
}
function closeModal() {
  document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
}
function renderModalPinsList() {
  const tbody = document.getElementById('modal-pins-list');
  tbody.innerHTML = '';
  pinData.forEach((pin,idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td><input type='checkbox' class='modal-pin-select' data-i='${idx}'></td><td>${pin.name.length>54? pin.name.slice(0,54)+'..': pin.name}${pin.imported?' <span class="imported">(Importado)</span>':''}</td><td>${pin.imported? 'Amarelo' : 'Azul'}</td>`;
    tbody.appendChild(tr);
  });
}
function toggleSelectAllPins() {
  const all = document.getElementById('select-all-pins').checked;
  document.querySelectorAll('.modal-pin-select').forEach(chk=>chk.checked = all);
}
function exportSelectedPins() {
  const checks = [...document.querySelectorAll('.modal-pin-select')];
  const sel = checks.map((c,i)=>c.checked ? pinData[i]:null).filter(p=>p!=null);
  if(!sel.length) { alert('Selecione pelo menos 1 pin para exportar.'); return; }
  const blob = new Blob([JSON.stringify(sel,null,2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'pins_espinh.json';
  a.click(); setTimeout(()=>URL.revokeObjectURL(url),800);
}
function importPinsFromFile(e) {
  const file = e.target.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      let imported = JSON.parse(evt.target.result);
      if(!Array.isArray(imported)) imported = [imported];
      let addedCount = 0;
      imported.forEach(p => {
        if(p.latlng && p.name) {
          addPin(p.latlng, `${p.name}`.slice(0,60), true);
          addedCount++;
        }
      });
      if(addedCount) alert('Pins importados com sucesso.');
      closeModal();
    } catch {
      alert('Arquivo inválido!');
    }
    e.target.value = '';
  }
  reader.readAsText(file);
}
window.addEventListener('keydown', function(e){
  if(e.key==='Escape') closeModal();
});

/*
  CSS sugerido para destacar o marker selecionado:
  .pin-selected-red > div {
    background: #c1272d !important;
    box-shadow: 0 0 10px 3px #c1272d;
    transition: background 0.2s;
  }
  .leaflet-overlay-pane img {
    image-rendering: auto !important;
    max-width: 100vw !important;
    max-height: 100vh !important;
  }
*/


// Adicione este código no final do seu JavaScript

// Função para configurar o menu hamburger no mobile
function setupMobileMenu() {
  // Adicionar o ícone de hamburger ao lado do título "Pins"
  const sidebarH2 = document.querySelector('#sidebar h2');
  const hamburgerMenu = document.createElement('div');
  hamburgerMenu.className = 'hamburger-menu';
  hamburgerMenu.innerHTML = '<div class="bar"></div><div class="bar"></div><div class="bar"></div>';
  sidebarH2.prepend(hamburgerMenu);
  
  // Criar o menu mobile de pins
  const mobileMenu = document.createElement('div');
  mobileMenu.className = 'mobile-pin-menu';
  mobileMenu.innerHTML = `
    <h3>Gerenciar Pins <button class="close-menu">&times;</button></h3>
    <ul class="mobile-pin-list"></ul>
  `;
  document.body.appendChild(mobileMenu);
  
  // Event listener para abrir o menu
  hamburgerMenu.addEventListener('click', function() {
    mobileMenu.classList.add('visible');
    renderMobilePinsList();
  });
  
  // Event listener para fechar o menu
  mobileMenu.querySelector('.close-menu').addEventListener('click', function() {
    mobileMenu.classList.remove('visible');
  });
  
  // Atualizar a função de render pins para incluir a versão mobile
  const originalRenderSidebarPins = renderSidebarPins;
  renderSidebarPins = function() {
    originalRenderSidebarPins();
    if (window.innerWidth <= 768) {
      renderMobilePinsList();
    }
  };
}

// Função para renderizar os pins na versão mobile
function renderMobilePinsList() {
  const mobilePinList = document.querySelector('.mobile-pin-list');
  mobilePinList.innerHTML = '';
  
  pinData.forEach((pin, i) => {
    const li = document.createElement('li');
    li.className = 'mobile-pin-item';
    li.innerHTML = `<span class="pin-icon${pin.imported?' imported':''}"></span>
      <span class="mobile-pin-name">${pin.name}${pin.imported ? ' (Importado)' : ''}</span>
      <div class="mobile-pin-actions">

      
        <button class="mobile-pin-action rename">✏️</button>
        <button class="mobile-pin-action delete">✖</button>
      </div>
    `;
    
    // Adicionar event listener para selecionar o pin
    li.querySelector('.mobile-pin-name').addEventListener('click', function() {
      selectPin(pin.id, true);
      document.querySelector('.pin-menu').classList.remove('visible');
    });
    
    // Adicionar event listeners para renomear e excluir
    li.querySelector('.mobile-pin-action.rename').addEventListener('click', function() {
      renamePin(pin.id);
      renderMobilePinsList();
    });
    
    li.querySelector('.mobile-pin-action.delete').addEventListener('click', function() {
      deletePin(pin.id);
      renderMobilePinsList();
    });
    
    mobilePinList.appendChild(li);
  });
}

// Melhorar a modal "Sobre" para mobile
function improveAboutModal() {
  const aboutModal = document.getElementById('about-modal');
  const modalContent = aboutModal.querySelector('.modal-content');
  
  // Garantir que o botão de fechar fique visível
  const closeBtn = modalContent.querySelector('.modal-close');
  if (closeBtn) {
    closeBtn.style.position = 'sticky';
    closeBtn.style.bottom = '15px';
    closeBtn.style.left = '50%';
    closeBtn.style.transform = 'translateX(-50%)';
  }
}

// Inicializar melhorias para mobile quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
  setupMobileMenu();
  improveAboutModal();
  
  // Verificar redimensionamento da tela
  window.addEventListener('resize', function() {
    if (window.innerWidth <= 768) {
      renderMobilePinsList();
    }
  });
});