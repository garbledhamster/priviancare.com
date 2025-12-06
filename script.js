// =========================
// Modern, small JS helpers
// =========================

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// Year
$('#year').textContent = new Date().getFullYear();

// Mobile drawer
const burger = $('#burger');
const drawer = $('#drawer');

const setDrawer = (open) => {
  drawer.classList.toggle('open', open);
  burger.setAttribute('aria-expanded', String(open));
};

burger?.addEventListener('click', () => setDrawer(!drawer.classList.contains('open')));
$$('#drawer a').forEach(a => a.addEventListener('click', () => setDrawer(false)));

// Active section highlighting
const navLinks = $$('.navlinks a');
const sectionIds = navLinks.map(a => a.getAttribute('href')).filter(h => h && h.startsWith('#'));
const sections = sectionIds.map(id => $(id)).filter(Boolean);

const markActive = (id) => {
  navLinks.forEach(a => {
    const isActive = a.getAttribute('href') === id;
    if (isActive) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
};

if ('IntersectionObserver' in window) {
  const obs = new IntersectionObserver((entries) => {
    const visible = entries
      .filter(e => e.isIntersecting)
      .sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible?.target?.id) markActive('#' + visible.target.id);
  }, { root: null, threshold: [0.18, 0.28, 0.38] });

  sections.forEach(s => obs.observe(s));
}

// Copy-to-clipboard with toast
const toast = $('#toast');
let toastTimer = null;

const showToast = (text) => {
  if (!toast) return;
  toast.textContent = text;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1400);
};

const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    showToast('Copied: ' + text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    showToast('Copied: ' + text);
  }
};

$$('[data-copy-btn]').forEach(btn => {
  btn.addEventListener('click', () => copyText(btn.getAttribute('data-copy-btn') || ''));
});

// Gallery lightbox
const lb = $('#lightbox');
const lbImg = $('#lightboxImg');
const lbTitle = $('#lightboxTitle');
const lbDesc = $('#lightboxDesc');
const lbClose = $('#lightboxClose');

const openLightbox = (fig) => {
  if (!lb || !lbImg || !lbTitle || !lbDesc) return;
  const title = fig.getAttribute('data-title') || 'Preview';
  const desc  = fig.getAttribute('data-desc') || '';
  const img   = fig.getAttribute('data-img')  || '';

  lbTitle.textContent = title;
  lbDesc.textContent = desc;
  lbImg.src = img;
  lbImg.alt = title;

  if (typeof lb.showModal === 'function') lb.showModal();
};

$$('#gallery .shot').forEach(fig => {
  fig.addEventListener('click', () => openLightbox(fig));
  fig.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openLightbox(fig);
    }
  });

  fig.tabIndex = 0;
  fig.setAttribute('role', 'button');
  fig.setAttribute('aria-label', (fig.getAttribute('data-title') || 'Open image') + ' (opens dialog)');
});

lbClose?.addEventListener('click', () => lb.close());
lb?.addEventListener('click', (e) => {
  const rect = lb.getBoundingClientRect();
  const inDialog = e.clientX >= rect.left && e.clientX <= rect.right &&
                   e.clientY >= rect.top && e.clientY <= rect.bottom;
  if (!inDialog) lb.close();
});

// Contact form: validate then open pre-filled email
const form = $('#contactForm');
form?.addEventListener('submit', (e) => {
  e.preventDefault();

  const data = new FormData(form);
  const name = String(data.get('name') || '').trim();
  const phone = String(data.get('phone') || '').trim();
  const email = String(data.get('email') || '').trim();
  const service = String(data.get('service') || '').trim();
  const message = String(data.get('message') || '').trim();

  const errors = [];
  if (!name) errors.push('Name');
  if (!phone) errors.push('Phone');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Valid email');
  if (!message) errors.push('Message');

  if (errors.length) {
    showToast('Please add: ' + errors.join(', '));
    return;
  }

  const subject = encodeURIComponent('Privian Care Consultation Request — ' + name);
  const body = encodeURIComponent(
    `Name: ${name}\nPhone: ${phone}\nEmail: ${email}\nPreferred service: ${service || 'Not specified'}\n\nMessage:\n${message}\n\n— Sent from priviancare.com demo form`
  );

  const to = 'sheila@priviancare.com';
  window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
});
