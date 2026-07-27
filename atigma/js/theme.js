// Seven theme presets. Applied by setting CSS custom properties on <html>.
// Used on every page (to display the live theme) and on admin.html
// (to let the admin pick one).

const THEMES = {
  classic: {
    name: 'Ledger Classic', desc: 'Forest ink & gold',
    vars: { '--ink':'#16231C','--ink-soft':'#1E2E24','--ink-softer':'#26382C','--paper':'#F3EFE4','--paper-dim':'#E7E1CE','--ledger-green':'#3B5D42','--ledger-green-light':'#547A5C','--gold':'#C9A227','--gold-soft':'#E0C568','--stamp-red':'#A63D2F','--line':'#8B8570','--text-on-ink':'#F3EFE4','--text-muted':'#AFA88F' }
  },
  sunset: {
    name: 'Sunset Bazaar', desc: 'Coral, amber & plum',
    vars: { '--ink':'#2B1220','--ink-soft':'#3A1B2B','--ink-softer':'#4A2536','--paper':'#FFF3E4','--paper-dim':'#FBE3C8','--ledger-green':'#E85D3B','--ledger-green-light':'#FF8259','--gold':'#F4A93B','--gold-soft':'#FFC46B','--stamp-red':'#C1272D','--line':'#C98A63','--text-on-ink':'#FBEADD','--text-muted':'#D9A98C' }
  },
  ocean: {
    name: 'Ocean Market', desc: 'Teal, aqua & sun gold',
    vars: { '--ink':'#08202B','--ink-soft':'#0E2E3C','--ink-softer':'#15404F','--paper':'#EAF6F5','--paper-dim':'#D3ECE9','--ledger-green':'#0FA3A3','--ledger-green-light':'#39C4C0','--gold':'#F2C14E','--gold-soft':'#F7D97E','--stamp-red':'#E4572E','--line':'#6FA8A6','--text-on-ink':'#E8F7F5','--text-muted':'#9BC6C2' }
  },
  royal: {
    name: 'Royal Violet', desc: 'Deep purple & gold',
    vars: { '--ink':'#1F1229','--ink-soft':'#2C1A3B','--ink-softer':'#3A254D','--paper':'#F5EFE0','--paper-dim':'#E9DFC8','--ledger-green':'#7A4FB5','--ledger-green-light':'#9B72D6','--gold':'#D9A441','--gold-soft':'#EAC272','--stamp-red':'#B23A48','--line':'#9E86B8','--text-on-ink':'#F0E9F7','--text-muted':'#B9A6CF' }
  },
  citrus: {
    name: 'Citrus Pop', desc: 'Navy, orange & yellow',
    vars: { '--ink':'#0B1B2B','--ink-soft':'#132A3F','--ink-softer':'#1D3B54','--paper':'#FFFDF5','--paper-dim':'#FFF3D6','--ledger-green':'#FF6F3C','--ledger-green-light':'#FF9662','--gold':'#FFD23F','--gold-soft':'#FFE180','--stamp-red':'#D7263D','--line':'#9FB8C9','--text-on-ink':'#F2F8FC','--text-muted':'#8FB0C4' }
  },
  rose: {
    name: 'Rose Quartz', desc: 'Berry & rose gold',
    vars: { '--ink':'#2B0F1B','--ink-soft':'#3A1626','--ink-softer':'#4A1F31','--paper':'#FDF0EC','--paper-dim':'#F7DCD3','--ledger-green':'#E0607E','--ledger-green-light':'#EE87A0','--gold':'#E8A87C','--gold-soft':'#F1C29E','--stamp-red':'#9B2333','--line':'#C98C9C','--text-on-ink':'#FBE9EE','--text-muted':'#D9A5B4' }
  },
  tropical: {
    name: 'Tropical Emerald', desc: 'Jungle green & mango',
    vars: { '--ink':'#08261F','--ink-soft':'#0F362C','--ink-softer':'#17493B','--paper':'#FBF6E9','--paper-dim':'#F1E7C8','--ledger-green':'#1FA97A','--ledger-green-light':'#3FCB9A','--gold':'#F5B942','--gold-soft':'#FBD57F','--stamp-red':'#E15554','--line':'#7EBBA3','--text-on-ink':'#EAF7F1','--text-muted':'#94C7B0' }
  }
};

function applyTheme(key) {
  const t = THEMES[key];
  if (!t) return;
  Object.entries(t.vars).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
}

// Fetches the live theme from settings and applies it. Call on every page.
async function loadAndApplyTheme() {
  try {
    const { settings } = await apiGet('/settings');
    applyTheme(settings.activeTheme || 'classic');
    return settings;
  } catch (err) {
    console.error('Could not load theme', err);
    applyTheme('classic');
    return null;
  }
}
