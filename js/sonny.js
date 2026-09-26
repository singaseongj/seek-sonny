(function () {
  "use strict";

  /** Returns Sonny's SVG markup. Edit this one function to replace his design everywhere. */
  function createSonnySVG(options = {}) {
    const id = options.id || `sonny-${Math.random().toString(36).slice(2)}`;
    return `
      <svg viewBox="0 0 120 140" role="img" aria-label="Sonny" xmlns="http://www.w3.org/2000/svg">
        <defs><clipPath id="${id}-face"><circle cx="60" cy="66" r="43"/></clipPath></defs>
        <g stroke="#18231d" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M60 13V3M26 25l-8-8M94 25l8-8M14 59H3M106 59h11" fill="none"/>
          <circle cx="60" cy="66" r="43" fill="#f5c94a"/>
          <path d="M19 73c18 8 30-11 43-7 17 6 27-5 40-1v31H18z" fill="#ef5b2a" clip-path="url(#${id}-face)" stroke="none"/>
          <circle cx="45" cy="59" r="3.5" fill="#18231d" stroke="none"/><circle cx="76" cy="59" r="3.5" fill="#18231d" stroke="none"/>
          <path d="M47 77c7 8 19 8 26 0" fill="none"/>
          <path d="M40 108l-5 22M80 108l5 22M35 130l-10 4M85 130l10 4" fill="none"/>
        </g>
      </svg>`;
  }

  /** Creates the accessible button used for a playable Sonny. */
  function createSonnyElement(index) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "sonny";
    button.dataset.sonnyIndex = index;
    button.setAttribute("aria-label", `Hidden Sonny ${index + 1}`);
    button.innerHTML = createSonnySVG({ id: `game-sonny-${index}` });
    return button;
  }

  window.Sonny = { createSVG: createSonnySVG, createElement: createSonnyElement };
})();
