let products = [];
let settings = {};
let editingId = null;
let confirmingDeleteId = null;
let pendingNewImages = [];
let pendingEditImages = {}; // productId -> array of data URLs, staged until saveEdit

/* ---------------- Boot ---------------- */
async function initAdminPage() {
  document.getElementById('loginForm').addEventListener('submit', handleLoginSubmit);
  document.getElementById('addForm').addEventListener('submit', handleAdd);

  if (isLoggedIn()) {
    const ok = await loadDashboard();
    if (ok) showDashboard();
    else logout();
  } else {
    showLogin();
  }
}

function showLogin() {
  document.getElementById('loginView').style.display = 'block';
  document.getElementById('dashboardView').style.display = 'none';
}
function showDashboard() {
  document.getElementById('loginView').style.display = 'none';
  document.getElementById('dashboardView').style.display = 'block';
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  const passcode = document.getElementById('passcodeInput').value;
  const errorEl = document.getElementById('loginError');
  errorEl.textContent = '';
  try {
    const { token } = await apiSend('POST', '/admin-login', { passcode });
    setAdminToken(token);
    const ok = await loadDashboard();
    if (ok) showDashboard();
  } catch (err) {
    errorEl.textContent = err.message || 'That passcode is not right.';
  }
}

function logout() {
  clearAdminToken();
  showLogin();
}

/* ---------------- Load dashboard data ---------------- */
async function loadDashboard() {
  try {
    const [productData, settingsData] = await Promise.all([
      apiGet('/products'),
      apiGet('/settings')
    ]);
    products = productData.products || [];
    settings = settingsData.settings || {};
    applyTheme(settings.activeTheme || 'classic');
    renderThemeGrid();
    renderManage();
    populateSettingsForm();
    return true;
  } catch (err) {
    console.error('Could not load dashboard', err);
    return false;
  }
}

/* ---------------- Product images (add form) ---------------- */
async function handleNewImages(event) {
  const files = Array.from(event.target.files || []);
  const remaining = Math.max(0, 5 - pendingNewImages.length);
  const filesToUse = files.slice(0, remaining);
  for (const file of filesToUse) {
    pendingNewImages.push(await fileToDataUrl(file));
  }
  event.target.value = '';
  renderNewImagesPreview();
}

function removeNewImage(index) {
  pendingNewImages.splice(index, 1);
  renderNewImagesPreview();
}

function renderNewImagesPreview() {
  const wrap = document.getElementById('newImagesPreview');
  const input = document.getElementById('newImages');
  const countNote = document.getElementById('newImagesCount');
  if (pendingNewImages.length === 0) {
    wrap.style.display = 'none';
    wrap.innerHTML = '';
  } else {
    wrap.style.display = 'flex';
    wrap.innerHTML = pendingNewImages.map((img, i) => `
      <div class="thumb-chip">
        <img src="${img}">
        <button type="button" class="thumb-remove" onclick="removeNewImage(${i})">&times;</button>
      </div>`).join('');
  }
  countNote.textContent = `${pendingNewImages.length}/5 photos added`;
  input.disabled = pendingNewImages.length >= 5;
}

async function handleAdd(e) {
  e.preventDefault();
  const name = document.getElementById('newName').value.trim();
  const price = document.getElementById('newPrice').value;
  const description = document.getElementById('newDesc').value.trim();
  if (!name || price === '') return;

  try {
    await apiSend('POST', '/products', {
      name, price: Number(price), description, images: pendingNewImages.slice(0, 5)
    });
    document.getElementById('addForm').reset();
    pendingNewImages = [];
    renderNewImagesPreview();
    await loadDashboard();
  } catch (err) {
    alert(err.message || 'Could not post product.');
  }
}

/* ---------------- Manage list ---------------- */
function renderManage() {
  const list = document.getElementById('manageList');
  if (products.length === 0) {
    list.innerHTML = `<div class="empty-state"><p class="big">Nothing posted yet</p><p>Use the form to add your first product.</p></div>`;
    return;
  }

  list.innerHTML = products.map((p) => {
    if (editingId === p.id) {
      const imgs = pendingEditImages[p.id] || [];
      const thumbsHtml = imgs.map((img, i) => `
        <div class="thumb-chip">
          <img src="${img}">
          <button type="button" class="thumb-remove" onclick="removeEditImage('${p.id}', ${i})">&times;</button>
        </div>`).join('');
      return `
        <div class="manage-row">
          <div class="edit-form">
            <div class="row2">
              <input type="text" id="edit-name-${p.id}" value="${escapeAttr(p.name)}" placeholder="Product name">
              <input type="number" id="edit-price-${p.id}" value="${p.price}" min="0" step="0.01" style="max-width:130px;">
            </div>
            <textarea id="edit-desc-${p.id}" placeholder="Description">${escapeHtml(p.description || '')}</textarea>
            <label style="margin:0;">Photos (up to 5)</label>
            <input type="file" accept="image/*" multiple onchange="handleEditImages(event, '${p.id}')" ${imgs.length >= 5 ? 'disabled' : ''}>
            <div class="thumb-strip" style="${imgs.length ? '' : 'display:none;'}">${thumbsHtml}</div>
            <p class="image-count-note">${imgs.length}/5 photos</p>
            <div class="m-actions">
              <button class="btn btn-primary btn-sm" onclick="saveEdit('${p.id}')">Save changes</button>
              <button class="btn btn-ghost btn-sm" onclick="cancelEdit()">Cancel</button>
            </div>
          </div>
        </div>`;
    }

    const thumbImage = (p.images || [])[0];
    return `
      <div class="manage-row ${p.soldOut ? 'sold' : ''}">
        ${thumbImage ? `<img class="m-thumb" src="${thumbImage}" alt="">` : `<div class="m-thumb m-thumb-empty">No photo</div>`}
        <div class="m-id">${p.id}</div>
        <div class="m-info">
          <h4>${escapeHtml(p.name)}</h4>
          <p>${p.soldOut ? 'Sold out' : 'In stock'}</p>
        </div>
        <div class="m-price">${formatPrice(p.price)}</div>
        <div class="m-actions">
          <button class="btn btn-sm" onclick="editProduct('${p.id}')">Edit</button>
          <button class="btn btn-sm ${p.soldOut ? '' : 'btn-ghost'}" onclick="toggleSoldOut('${p.id}')">${p.soldOut ? 'Mark in stock' : 'Mark sold out'}</button>
          ${confirmingDeleteId === p.id
            ? `<span class="confirm-inline">Delete for good?
                 <button class="btn btn-danger btn-sm" onclick="deleteProduct('${p.id}')">Yes, delete</button>
                 <button class="btn btn-ghost btn-sm" onclick="cancelDelete()">Cancel</button>
               </span>`
            : `<button class="btn btn-danger btn-sm" onclick="askDelete('${p.id}')">Delete</button>`}
        </div>
      </div>`;
  }).join('');
}

function editProduct(id) {
  confirmingDeleteId = null;
  editingId = id;
  const p = products.find((x) => x.id === id);
  pendingEditImages[id] = p ? (p.images || []).slice() : [];
  renderManage();
}
function cancelEdit() {
  if (editingId) delete pendingEditImages[editingId];
  editingId = null;
  renderManage();
}

async function handleEditImages(event, id) {
  if (!pendingEditImages[id]) pendingEditImages[id] = [];
  const files = Array.from(event.target.files || []);
  const remaining = Math.max(0, 5 - pendingEditImages[id].length);
  const filesToUse = files.slice(0, remaining);
  for (const file of filesToUse) {
    pendingEditImages[id].push(await fileToDataUrl(file));
  }
  event.target.value = '';
  renderManage();
}
function removeEditImage(id, index) {
  if (pendingEditImages[id]) {
    pendingEditImages[id].splice(index, 1);
    renderManage();
  }
}

async function saveEdit(id) {
  const name = document.getElementById('edit-name-' + id).value.trim();
  const price = document.getElementById('edit-price-' + id).value;
  const description = document.getElementById('edit-desc-' + id).value.trim();

  try {
    await apiSend('PUT', '/products', {
      id,
      name: name || undefined,
      price: price !== '' ? Number(price) : undefined,
      description,
      images: pendingEditImages[id] || []
    });
    delete pendingEditImages[id];
    editingId = null;
    await loadDashboard();
  } catch (err) {
    alert(err.message || 'Could not save changes.');
  }
}

async function toggleSoldOut(id) {
  const p = products.find((x) => x.id === id);
  if (!p) return;
  try {
    await apiSend('PUT', '/products', { id, soldOut: !p.soldOut });
    await loadDashboard();
  } catch (err) {
    alert(err.message || 'Could not update product.');
  }
}

function askDelete(id) { confirmingDeleteId = id; renderManage(); }
function cancelDelete() { confirmingDeleteId = null; renderManage(); }

async function deleteProduct(id) {
  try {
    await apiSend('DELETE', '/products', { id });
    confirmingDeleteId = null;
    await loadDashboard();
  } catch (err) {
    alert(err.message || 'Could not delete product.');
  }
}

/* ---------------- Theme ---------------- */
function renderThemeGrid() {
  const grid = document.getElementById('themeGrid');
  const active = settings.activeTheme || 'classic';
  grid.innerHTML = Object.entries(THEMES).map(([key, t]) => `
    <button type="button" class="theme-swatch ${active === key ? 'active' : ''}" onclick="selectTheme('${key}')">
      <div class="swatch-preview">
        <span style="background:${t.vars['--ink']}"></span>
        <span style="background:${t.vars['--ledger-green']}"></span>
        <span style="background:${t.vars['--gold']}"></span>
        <span style="background:${t.vars['--paper']}"></span>
      </div>
      <span class="swatch-name">${t.name}</span>
      <span class="swatch-desc">${t.desc}</span>
    </button>
  `).join('');
}

async function selectTheme(key) {
  if (!THEMES[key]) return;
  applyTheme(key);
  settings.activeTheme = key;
  renderThemeGrid();
  try {
    await apiSend('PUT', '/settings', { activeTheme: key });
  } catch (err) {
    console.error('Could not save theme', err);
  }
}

/* ---------------- Site settings & founder photo ---------------- */
function populateSettingsForm() {
  document.getElementById('settingEmail').value = settings.email || '';
  document.getElementById('settingWa').value = settings.whatsapp || '';
  document.getElementById('settingWaMsg').value = settings.whatsappMsg || '';
  document.getElementById('settingInstagram').value = settings.instagram || '';
  document.getElementById('settingLinkedin').value = settings.linkedin || '';
  document.getElementById('settingFacebook').value = settings.facebook || '';
  document.getElementById('settingTiktok').value = settings.tiktok || '';

  const photoImg = document.getElementById('founderPhotoPreview');
  if (settings.founderPhoto) {
    photoImg.src = settings.founderPhoto;
    photoImg.style.display = 'block';
  } else {
    photoImg.style.display = 'none';
  }
}

async function handleFounderPhoto(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const dataUrl = await fileToDataUrl(file);
  try {
    await apiSend('PUT', '/settings', { founderPhoto: dataUrl });
    settings.founderPhoto = dataUrl;
    populateSettingsForm();
  } catch (err) {
    alert(err.message || 'Could not save photo.');
  }
  event.target.value = '';
}

async function saveContactSettings() {
  const body = {
    email: document.getElementById('settingEmail').value.trim(),
    whatsapp: document.getElementById('settingWa').value.trim(),
    whatsappMsg: document.getElementById('settingWaMsg').value.trim(),
    instagram: document.getElementById('settingInstagram').value.trim(),
    linkedin: document.getElementById('settingLinkedin').value.trim(),
    facebook: document.getElementById('settingFacebook').value.trim(),
    tiktok: document.getElementById('settingTiktok').value.trim()
  };
  const newPasscode = document.getElementById('settingPasscode').value.trim();
  if (newPasscode) body.adminPasscode = newPasscode;

  try {
    await apiSend('PUT', '/settings', body);
    document.getElementById('settingPasscode').value = '';
    document.getElementById('settingsSavedNote').textContent = 'Saved.';
    setTimeout(() => { document.getElementById('settingsSavedNote').textContent = ''; }, 2500);
  } catch (err) {
    alert(err.message || 'Could not save settings.');
  }
}

initAdminPage();
