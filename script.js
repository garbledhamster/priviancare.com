// =========================
// Privian UI / interactions
// =========================
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// Year
const year = $('#year');
if (year) year.textContent = String(new Date().getFullYear());

// Splash behavior (fade out → reveal site → scroll to owner)
const splash = $('#splash');
const enterBtn = $('#enterSite');
const skipIntro = $('#skipIntro');

const hideSplash = ({ scrollTo = null } = {}) => {
  if (!splash) return;

  splash.classList.add('is-leaving');
  document.body.classList.remove('is-locked');
  localStorage.setItem('prv_seen_splash', '1');

  // After fade completes, remove from accessibility tree
  window.setTimeout(() => {
    splash.style.display = 'none';

    if (scrollTo) {
      const target = $(scrollTo);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Move focus gently for accessibility
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
        window.setTimeout(() => target.removeAttribute('tabindex'), 600);
      }
    }
  }, 700);
};

// If they've visited, skip splash automatically
try {
  if (localStorage.getItem('prv_seen_splash') === '1' && splash) {
    splash.style.display = 'none';
    document.body.classList.remove('is-locked');
  }
} catch { /* ignore */ }

enterBtn?.addEventListener('click', () => hideSplash({ scrollTo: '#owner' }));
skipIntro?.addEventListener('click', (e) => {
  e.preventDefault();
  hideSplash({ scrollTo: '#owner' });
});

// Mobile nav
const burger = $('#burger');
const drawer = $('#drawer');

const setDrawer = (open) => {
  if (!drawer || !burger) return;
  drawer.classList.toggle('open', open);
  burger.setAttribute('aria-expanded', String(open));
};

burger?.addEventListener('click', () => setDrawer(!drawer.classList.contains('open')));
$$('#drawer a').forEach(a => a.addEventListener('click', () => setDrawer(false)));

// Chooser interaction (highlight recommendation)
const choiceBtns = $$('.choice');
const recCards = $$('.recommend');

const highlightRec = (key) => {
  choiceBtns.forEach(b => b.classList.toggle('is-selected', b.dataset.pick === key));
  recCards.forEach(c => c.classList.toggle('is-highlight', c.dataset.rec === key));
};

choiceBtns.forEach(btn => {
  btn.addEventListener('click', () => highlightRec(btn.dataset.pick));
});

// Default highlight
highlightRec('needs-checkins');

// Reveal on scroll + timeline activation (no wheel hacks)
const revealEls = $$('.reveal');

if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('is-active');
    });
  }, { threshold: 0.22 });

  revealEls.forEach(el => io.observe(el));
} else {
  // fallback
  revealEls.forEach(el => el.classList.add('is-active'));
}

// Copy-to-clipboard toast
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
  const val = String(text || '').trim();
  if (!val) return;

  try {
    await navigator.clipboard.writeText(val);
    showToast('Copied: ' + val);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = val;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    showToast('Copied: ' + val);
  }
};

$$('[data-copy-btn]').forEach(btn => {
  btn.addEventListener('click', () => copyText(btn.getAttribute('data-copy-btn')));
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

$$('.shot').forEach(fig => {
  fig.tabIndex = 0;
  fig.setAttribute('role', 'button');
  fig.setAttribute('aria-label', (fig.getAttribute('data-title') || 'Open image') + ' (opens dialog)');

  fig.addEventListener('click', () => openLightbox(fig));
  fig.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openLightbox(fig);
    }
  });
});

lbClose?.addEventListener('click', () => lb.close());
lb?.addEventListener('click', (e) => {
  // click outside closes
  const rect = lb.getBoundingClientRect();
  const inDialog = e.clientX >= rect.left && e.clientX <= rect.right &&
                   e.clientY >= rect.top  && e.clientY <= rect.bottom;
  if (!inDialog) lb.close();
});

// Contact form: validate, then open pre-filled email
const form = $('#contactForm');
form?.addEventListener('submit', (e) => {
  e.preventDefault();

  const data = new FormData(form);
  const name = String(data.get('name') || '').trim();
  const phone = String(data.get('phone') || '').trim();
  const email = String(data.get('email') || '').trim();
  const time = String(data.get('time') || '').trim();
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

  const subject = encodeURIComponent('Privian Consultation Request — ' + name);
  const body = encodeURIComponent(
    `Name: ${name}\nPhone: ${phone}\nEmail: ${email}\nBest time: ${time || 'Not specified'}\n\nMessage:\n${message}\n\n— Sent from priviancare.com`
  );

  const to = 'sheila@priviancare.com';
  window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
});
