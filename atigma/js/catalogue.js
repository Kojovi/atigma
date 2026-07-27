let products = [];
let contact = {};

let modalProductId = null;
let modalImageIndex = 0;
let modalView = 'gallery'; // 'gallery' | 'request'
let modalRequestType = null; // 'order' | 'preorder'

async function initCataloguePage() {
  contact = (await loadAndApplyTheme()) || {};
  await loadProducts();
  document.getElementById('searchInput').addEventListener('input', renderCatalogue);
}

async function loadProducts() {
  try {
    const data = await apiGet('/products');
    products = data.products || [];
  } catch (err) {
    console.error('Could not load products', err);
    products = [];
  }
  renderCatalogue();
}

function getProductImages(p) {
  return Array.isArray(p.images) ? p.images.slice(0, 5) : [];
}

function renderCatalogue() {
  const grid = document.getElementById('catalogueGrid');
  const query = (document.getElementById('searchInput').value || '').toLowerCase().trim();
  const filtered = products.filter((p) => p.name.toLowerCase().includes(query));

  document.getElementById('countPill').textContent =
    filtered.length + (filtered.length === 1 ? ' item' : ' items');

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
      <p class="big">${products.length === 0 ? 'No products yet' : 'No matches'}</p>
      <p>${products.length === 0 ? 'Check back soon for new pieces.' : 'Try a different search term.'}</p>
    </div>`;
    return;
  }

  grid.innerHTML = filtered.map((p) => {
    const images = getProductImages(p);
    const mainImage = images[0];
    return `
    <div class="product-card ${p.soldOut ? 'sold' : ''}" onclick="openProductModal('${p.id}')">
      <div class="card-image-wrap">
        ${mainImage
          ? `<img src="${mainImage}" alt="${escapeAttr(p.name)}">`
          : `<div class="card-image-placeholder">No image yet</div>`}
        ${images.length > 1 ? `<span class="image-count-badge">${images.length} photos</span>` : ''}
        ${p.soldOut ? '<div class="sold-stamp">Sold out</div>' : ''}
      </div>
      <div class="card-strip"></div>
      <div class="card-body">
        <div class="card-top-row">
          <span>${p.id}</span>
          <span class="status-badge ${p.soldOut ? 'out' : ''}">${p.soldOut ? 'Sold out' : 'In stock'}</span>
        </div>
        <h3>${escapeHtml(p.name)}</h3>
        <p class="product-desc">${escapeHtml(p.description || 'No description provided.')}</p>
        <div class="card-price">${formatPrice(p.price)}</div>
      </div>
    </div>`;
  }).join('');
}

/* ---------------- Modal ---------------- */
function openProductModal(id) {
  modalProductId = id;
  modalImageIndex = 0;
  modalView = 'gallery';
  modalRequestType = null;
  document.getElementById('productModalOverlay').classList.add('open');
  renderModal();
}
function closeProductModal() {
  document.getElementById('productModalOverlay').classList.remove('open');
  modalProductId = null;
}
function handleOverlayClick(event) {
  if (event.target.id === 'productModalOverlay') closeProductModal();
}
function selectGalleryImage(index) {
  modalImageIndex = index;
  renderModal();
}
function showRequestForm(type) {
  modalRequestType = type;
  modalView = 'request';
  renderModal();
}
function backToGallery() {
  modalView = 'gallery';
  renderModal();
}

function renderModal() {
  const p = products.find((x) => x.id === modalProductId);
  if (!p) { closeProductModal(); return; }
  if (modalView === 'gallery') renderModalGallery(p);
  else renderModalRequestForm(p);
}

function renderModalGallery(p) {
  const images = getProductImages(p);
  const main = images[modalImageIndex] || images[0];
  const thumbsHtml = images.length > 1
    ? `<div class="modal-thumbs">${images.map((img, i) => `<img src="${img}" class="modal-thumb ${i === modalImageIndex ? 'active' : ''}" onclick="selectGalleryImage(${i})">`).join('')}</div>`
    : '';
  const imageHtml = main
    ? `<img src="${main}" class="modal-main-image" alt="${escapeAttr(p.name)}">`
    : `<div class="modal-main-placeholder">No photos yet</div>`;

  document.getElementById('modalContent').innerHTML = `
    <div class="modal-gallery">
      ${imageHtml}
      ${thumbsHtml}
    </div>
    <div class="modal-info">
      <div class="modal-top-row">
        <span>${p.id}</span>
        <span class="status-badge ${p.soldOut ? 'out' : ''}">${p.soldOut ? 'Sold out' : 'In stock'}</span>
      </div>
      <h3 class="modal-title">${escapeHtml(p.name)}</h3>
      <p class="modal-desc">${escapeHtml(p.description || 'No description provided.')}</p>
      <div class="modal-price">${formatPrice(p.price)}</div>
      <button class="btn btn-primary btn-full" onclick="showRequestForm('${p.soldOut ? 'preorder' : 'order'}')">
        ${p.soldOut ? 'Preorder this item' : 'Order this item'}
      </button>
    </div>
  `;
}

function renderModalRequestForm(p) {
  const verb = modalRequestType === 'preorder' ? 'Preorder' : 'Order';
  document.getElementById('modalContent').innerHTML = `
    <div class="modal-info" style="padding:26px; flex:1 1 100%;">
      <button class="modal-back" onclick="backToGallery()">&larr; Back to photos</button>
      <h3 class="modal-title">${verb} request</h3>
      <p class="modal-desc" style="margin-bottom:6px;">${escapeHtml(p.name)} (${p.id}) &mdash; ${formatPrice(p.price)}</p>

      <label for="reqName">Your name</label>
      <input type="text" id="reqName">

      <label for="reqContact">Phone or email</label>
      <input type="text" id="reqContact" placeholder="How should we reach you?">

      <label for="reqComment">Comment</label>
      <textarea id="reqComment" placeholder="Size, colour, quantity, anything else..."></textarea>

      <div class="modal-error" id="modalReqError"></div>
      <div class="modal-send-actions">
        <button class="btn btn-primary" onclick="sendRequest('whatsapp')">Send via WhatsApp</button>
        <button class="btn" onclick="sendRequest('email')">Send via Email</button>
      </div>
    </div>
  `;
}

function sendRequest(channel) {
  const p = products.find((x) => x.id === modalProductId);
  if (!p) return;

  const name = document.getElementById('reqName').value.trim();
  const contactInfo = document.getElementById('reqContact').value.trim();
  const comment = document.getElementById('reqComment').value.trim();

  if (!name || !contactInfo) {
    document.getElementById('modalReqError').textContent = 'Please add your name and a way to reach you.';
    return;
  }

  const verb = modalRequestType === 'preorder' ? 'Preorder request' : 'Order request';
  const message = `${verb}: ${p.name} (${p.id}) - ${formatPrice(p.price)}\nName: ${name}\nContact: ${contactInfo}\nComment: ${comment || 'None'}`;

  if (channel === 'whatsapp') {
    const link = `https://wa.me/${(contact.whatsapp || '').replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(link, '_blank');
  } else {
    const subject = encodeURIComponent(`${verb}: ${p.name} (${p.id})`);
    window.location.href = `mailto:${contact.email}?subject=${subject}&body=${encodeURIComponent(message)}`;
  }
}

initCataloguePage();
