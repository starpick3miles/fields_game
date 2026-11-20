// @ts-check
// Update a region to new HTML while keeping its existing elements.
// Buttons stay the same element when only their style or text changes, so a tap
// that starts before an update still lands (rebuilding the element would lose it),
// and running animations on unchanged elements keep going.

/** @param {Element} el @param {string} html */
export function morph(el, html) {
  const cache = /** @type {any} */ (el);
  if (cache.__html === html) return;
  cache.__html = html;
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  patch(el, tpl.content);
}

/** @param {Node} a live parent @param {Node} b new parent */
function patch(a, b) {
  const an = [...a.childNodes], bn = [...b.childNodes];
  bn.forEach((y, i) => {
    const x = an[i];
    if (!x) { a.appendChild(y); return; }
    if (x.nodeType !== y.nodeType || x.nodeName !== y.nodeName) { a.replaceChild(y, x); return; }
    if (x.nodeType !== 1) { if (x.nodeValue !== y.nodeValue) x.nodeValue = y.nodeValue; return; }
    const xe = /** @type {Element} */ (x), ye = /** @type {Element} */ (y);
    for (const { name } of [...xe.attributes]) if (!ye.hasAttribute(name)) xe.removeAttribute(name);
    for (const { name, value } of [...ye.attributes]) if (xe.getAttribute(name) !== value) xe.setAttribute(name, value);
    patch(xe, ye);
  });
  for (let i = an.length - 1; i >= bn.length; i--) a.removeChild(an[i]);
}
