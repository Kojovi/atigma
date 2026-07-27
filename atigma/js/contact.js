const SOCIAL_ICONS = {
  instagram: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.2c3.2 0 3.6 0 4.9.07 1.2.06 2.05.25 2.5.42.6.24 1 .5 1.5 1 .45.45.75.9 1 1.5.17.45.36 1.3.42 2.5.06 1.3.07 1.7.07 4.9s0 3.6-.07 4.9c-.06 1.2-.25 2.05-.42 2.5-.24.6-.5 1-1 1.5-.45.45-.9.75-1.5 1-.45.17-1.3.36-2.5.42-1.3.06-1.7.07-4.9.07s-3.6 0-4.9-.07c-1.2-.06-2.05-.25-2.5-.42-.6-.24-1-.5-1.5-1-.45-.45-.75-.9-1-1.5-.17-.45-.36-1.3-.42-2.5C2.21 15.6 2.2 15.2 2.2 12s0-3.6.07-4.9c.06-1.2.25-2.05.42-2.5.24-.6.5-1 1-1.5.45-.45.9-.75 1.5-1 .45-.17 1.3-.36 2.5-.42C8.4 2.21 8.8 2.2 12 2.2Zm0 1.8c-3.15 0-3.52 0-4.76.07-1.02.05-1.58.22-1.94.36-.49.19-.84.42-1.2.79-.37.36-.6.71-.79 1.2-.14.36-.31.92-.36 1.94C2.9 8.48 2.9 8.85 2.9 12s0 3.52.07 4.76c.05 1.02.22 1.58.36 1.94.19.49.42.84.79 1.2.36.37.71.6 1.2.79.36.14.92.31 1.94.36 1.24.06 1.6.07 4.76.07s3.52 0 4.76-.07c1.02-.05 1.58-.22 1.94-.36.49-.19.84-.42 1.2-.79.37-.36.6-.71.79-1.2.14-.36.31-.92.36-1.94.06-1.24.07-1.6.07-4.76s0-3.52-.07-4.76c-.05-1.02-.22-1.58-.36-1.94-.19-.49-.42-.84-.79-1.2a3.3 3.3 0 0 0-1.2-.79c-.36-.14-.92-.31-1.94-.36C15.52 4 15.15 4 12 4Zm0 3.4a4.6 4.6 0 1 1 0 9.2 4.6 4.6 0 0 1 0-9.2Zm0 1.8a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6Zm4.8-2.05a1.08 1.08 0 1 1 0 2.15 1.08 1.08 0 0 1 0-2.15Z"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.94 8.5H3.56V20.4h3.38V8.5ZM5.25 3.6a1.96 1.96 0 1 0 0 3.92 1.96 1.96 0 0 0 0-3.92ZM20.4 20.4h-3.38v-6.05c0-1.44-.03-3.3-2.01-3.3-2.01 0-2.32 1.57-2.32 3.2v6.15H9.32V8.5h3.24v1.63h.05c.45-.86 1.56-1.77 3.21-1.77 3.44 0 4.08 2.26 4.08 5.2v6.84Z"/></svg>',
  facebook: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 21.9v-8.1h2.72l.41-3.16h-3.13V8.66c0-.92.25-1.54 1.57-1.54h1.68V4.28C15.98 4.16 15.03 4.1 13.9 4.1c-2.34 0-3.95 1.43-3.95 4.05v2.55H7.22v3.16h2.73v8.1h3.55Z"/></svg>',
  tiktok: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.6 2h-3.2v13.6a2.9 2.9 0 1 1-2.06-2.78v-3.3a6.16 6.16 0 1 0 5.26 6.1V8.9a7.6 7.6 0 0 0 4.4 1.4V7.1a4.4 4.4 0 0 1-4.4-4.4V2Z"/></svg>'
};

let contact = {};

async function initContactPage() {
  contact = (await loadAndApplyTheme()) || {};
  renderContactInfo();
  renderSocialLinks();

  document.querySelector('.msg-form').addEventListener('submit', handleEmailForm);
}

function renderContactInfo() {
  const waLink = `https://wa.me/${(contact.whatsapp || '').replace(/\D/g, '')}?text=${encodeURIComponent(contact.whatsappMsg || '')}`;
  document.getElementById('waButton').href = waLink;
  document.getElementById('waDetail').innerHTML = `
    <div>WhatsApp: +${(contact.whatsapp || '').replace(/\D/g, '')}</div>
    <div>Email: ${escapeHtml(contact.email || '')}</div>
  `;
  document.getElementById('emailHelper').textContent = `Opens a draft addressed to ${contact.email}.`;
}

function renderSocialLinks() {
  const row = document.getElementById('socialRow');
  const section = document.getElementById('socialSection');
  const platforms = [
    { key: 'instagram', label: 'Instagram' },
    { key: 'linkedin', label: 'LinkedIn' },
    { key: 'facebook', label: 'Facebook' },
    { key: 'tiktok', label: 'TikTok' }
  ];
  const active = platforms.filter((p) => contact[p.key]);

  if (active.length === 0) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';
  row.innerHTML = active.map((p) => `
    <a class="social-btn" href="${escapeAttr(contact[p.key])}" target="_blank" rel="noopener" aria-label="${p.label}">
      ${SOCIAL_ICONS[p.key]}
    </a>
  `).join('');
}

function handleEmailForm(e) {
  e.preventDefault();
  const name = document.getElementById('msgName').value.trim();
  const from = document.getElementById('msgEmail').value.trim();
  const body = document.getElementById('msgBody').value.trim();

  const subject = encodeURIComponent(`Question from ${name} - via catalogue`);
  const fullBody = encodeURIComponent(`${body}\n\n- ${name} (${from})`);
  window.location.href = `mailto:${contact.email}?subject=${subject}&body=${fullBody}`;
}

initContactPage();
