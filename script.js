// ---------- Settings ----------
// How the contact form is delivered, in order of preference:
//   1. formEndpoint: a form service URL (FormSubmit) that emails each enquiry to Jules
//   2. email:        opens the visitor's email app with the enquiry filled in
//   3. neither set:  opens WhatsApp with the enquiry filled in, ready to send
const CONFIG = {
  whatsappNumber: '447340473016',
  email: 'thepaintressdevon@gmail.com',
  formEndpoint: 'https://formsubmit.co/ajax/thepaintressdevon@gmail.com',
};

// ---------- Contact form ----------
const form = document.getElementById('contact-form');

if (form) {
  const note = document.getElementById('form-note');

  if (!CONFIG.formEndpoint) {
    note.textContent = CONFIG.email
      ? 'Sending opens your email app with your message ready to go.'
      : 'Sending opens WhatsApp with your message ready to go.';
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const details = [
      `Name: ${data.get('name')}`,
      data.get('phone') && `Phone: ${data.get('phone')}`,
      data.get('email') && `Email: ${data.get('email')}`,
    ].filter(Boolean);
    if (!data.get('phone') && !data.get('email')) {
      note.textContent = 'Please add a phone number or email so Jules can reply.';
      return;
    }
    const text = `Hi Jules, I'd like to enquire about some decorating.\n${details.join('\n')}\n\n${data.get('message')}`;

    if (CONFIG.formEndpoint) {
      const button = form.querySelector('button[type="submit"]');
      button.disabled = true;
      note.textContent = 'Sending…';
      try {
        const response = await fetch(CONFIG.formEndpoint, {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: data,
        });
        const result = await response.json();
        // FormSubmit answers 200 even when it refuses, so check its own success flag
        if (!response.ok || String(result.success) !== 'true') throw new Error(result.message);
        form.reset();
        note.textContent = 'Thank you! Your message has been sent and Jules will be in touch soon.';
      } catch (error) {
        // Visible in the browser console, to help diagnose delivery problems
        console.error('Contact form not sent:', error.message);
        note.textContent = 'Sorry, something went wrong. Please call or WhatsApp Jules on 07340 473016 instead.';
      } finally {
        button.disabled = false;
      }
    } else if (CONFIG.email) {
      window.location.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent('Decorating enquiry')}&body=${encodeURIComponent(text)}`;
    } else {
      window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    }
  });
}

// ---------- Gallery: before & after lightbox ----------
const lightbox = document.getElementById('lightbox');

if (lightbox) {
  const beforeFigure = lightbox.querySelector('.compare-before');
  const before = beforeFigure.querySelector('img');
  const after = lightbox.querySelector('.compare-after img');
  let opener = null;

  const close = () => {
    lightbox.hidden = true;
    if (opener) opener.focus();
  };

  // No "before" photo yet: show the "coming soon" panel in its place
  before.addEventListener('error', () => beforeFigure.classList.add('is-missing'));

  document.querySelectorAll('.gallery button').forEach((button) => {
    button.addEventListener('click', () => {
      const img = button.querySelector('img');
      opener = button;
      after.src = button.dataset.full;
      after.alt = `After: ${img.alt}`;
      beforeFigure.classList.remove('is-missing');
      before.alt = `Before: ${img.alt}`;
      before.src = button.dataset.before;
      // The "coming soon" panel takes the shape of the after photo
      beforeFigure.style.setProperty('--shape', `${img.naturalWidth} / ${img.naturalHeight}`);
      lightbox.hidden = false;
      lightbox.querySelector('.lightbox-close').focus();
    });
  });

  lightbox.addEventListener('click', (event) => {
    if (!event.target.closest('figure')) close();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !lightbox.hidden) close();
  });
}
