// Fills the page with the editable copy saved by the CMS (the JSON files in /content).
// The same copy is also written into the HTML as a fallback, so the site still reads
// correctly if this script or the content files fail to load.
(async () => {
  const page = document.body.dataset.page;

  const load = (name) =>
    fetch(`content/${name}.json`, { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : {}));

  // Adds one paragraph of text to an element, turning [words](link) into a real link
  const addInline = (el, text) => {
    let last = 0;
    for (const match of text.matchAll(/\[([^\]]+)\]\(([^)\s]+)\)/g)) {
      el.append(text.slice(last, match.index));
      const [, label, href] = match;
      if (/^(https?:\/\/|mailto:|tel:|[\w./#-]+$)/i.test(href)) {
        const a = document.createElement('a');
        a.href = href;
        a.textContent = label;
        el.append(a);
      } else {
        el.append(label);
      }
      last = match.index + match[0].length;
    }
    el.append(text.slice(last));
  };

  try {
    const [shared, own] = await Promise.all([load('shared'), load(page)]);
    const data = { ...shared, ...own };

    // Single pieces of text
    document.querySelectorAll('[data-cms]').forEach((el) => {
      const value = data[el.dataset.cms];
      if (typeof value === 'string' && value.trim()) el.textContent = value;
    });

    // Longer text: a blank line starts a new paragraph
    document.querySelectorAll('[data-cms-text]').forEach((el) => {
      const value = data[el.dataset.cmsText];
      if (typeof value !== 'string' || !value.trim()) return;
      const paragraphs = value.split(/\n\s*\n/).filter((para) => para.trim());
      el.replaceChildren(
        ...paragraphs.map((para) => {
          const p = document.createElement('p');
          addInline(p, para.trim());
          return p;
        }),
      );
    });

    // Repeating items (services, testimonials): the first item in the HTML is the pattern
    document.querySelectorAll('[data-cms-list]').forEach((el) => {
      const items = data[el.dataset.cmsList];
      const pattern = el.firstElementChild;
      if (!Array.isArray(items) || !items.length || !pattern) return;
      el.replaceChildren(
        ...items.map((item) => {
          const node = pattern.cloneNode(true);
          node.querySelectorAll('[data-item]').forEach((part) => {
            part.textContent = item[part.dataset.item] ?? '';
          });
          return node;
        }),
      );
    });
  } catch (error) {
    console.error('Could not load editable content:', error.message);
  } finally {
    document.documentElement.classList.remove('cms-loading');
  }
})();
