/*!
 * scroll-parallax.js
 * --------------------------------------------------------------------------
 * Efeito de parallax de scroll suavizado (LERP) reutilizavel.
 *
 * O elemento se desloca em Y e rotaciona conforme o centro de um
 * "trigger" (um elemento de referencia, normalmente uma section) se move
 * em relacao ao centro da viewport.
 *
 * COMO USAR (HTML):
 * --------------------------------------------------------------------------
 *   <!-- Elementos com auto-init via atributo data-scroll-parallax -->
 *   <section id="minha-section">
 *     <div data-scroll-parallax="#minha-section"
 *          data-speed="-0.15"
 *          data-rotate="3">...</div>
 *
 *     <div data-scroll-parallax="#minha-section"
 *          data-speed="0.12"
 *          data-rotate="-2">...</div>
 *   </section>
 *
 *   <!-- Sem trigger compartilhado: usa o proprio bounding box -->
 *   <img data-scroll-parallax data-speed="0.2" data-rotate="0" src="..." />
 *
 *   <script src="scroll-parallax.js" defer></script>
 *
 * COMO USAR (JS):
 * --------------------------------------------------------------------------
 *   ScrollParallax.create({
 *     trigger: '#minha-section',          // opcional (Element ou selector)
 *     targets: '.meu-elemento',           // obrigatorio
 *     lerp: 0.12,                         // suavizacao (0..1) - menor = mais lento
 *     speed: 0.2,                         // fallback se nao houver data-speed
 *     rotate: 0,                          // fallback se nao houver data-rotate
 *     scale: 0,                           // fallback se nao houver data-scale
 *     speedAttr: 'data-speed',            // nome do atributo de velocidade
 *     rotateAttr: 'data-rotate',          // nome do atributo de rotacao
 *     scaleAttr: 'data-scale'             // nome do atributo de escala
 *   });
 *
 * ATRIBUTOS POR ELEMENTO:
 *   data-speed   -> multiplicador do deslocamento vertical (negativo = sobe)
 *   data-rotate  -> graus maximos de rotacao
 *   data-scale   -> intensidade do zoom (ex: 0.5 = cresce ate ~1.5x no extremo)
 *
 * RETORNO:
 *   create() devolve { update(), destroy() } para controle programatico.
 * --------------------------------------------------------------------------
 */
(function (global) {
  'use strict';

  const DEFAULT_LERP = 0.12;
  const SETTLE_Y = 0.12;
  const SETTLE_ROT = 0.02;
  const SETTLE_SCALE = 0.0008;

  function toElements(input) {
    if (!input) return [];
    if (typeof input === 'string') return Array.from(document.querySelectorAll(input));
    if (input instanceof Element) return [input];
    if (input instanceof NodeList || Array.isArray(input)) return Array.from(input);
    return [];
  }

  function toElement(input) {
    if (!input) return null;
    if (typeof input === 'string') return document.querySelector(input);
    if (input instanceof Element) return input;
    return null;
  }

  function num(value, fallback) {
    const n = parseFloat(value);
    return isFinite(n) ? n : fallback;
  }


  // Auto-init: agrupa elementos [data-scroll-parallax] por trigger
  // e cria uma instancia para cada grupo. Elementos sem valor no atributo
  // usam o proprio bounding box como referencia.
  function autoInit() {
    const nodes = document.querySelectorAll('[data-scroll-parallax]');
    if (!nodes.length) return;

    const groups = new Map();
    const standalone = [];

    nodes.forEach((el) => {
      const triggerSel = (el.getAttribute('data-scroll-parallax') || '').trim();
      if (!triggerSel) {
        standalone.push(el);
        return;
      }
      if (!groups.has(triggerSel)) groups.set(triggerSel, []);
      groups.get(triggerSel).push(el);
    });

    groups.forEach((els, sel) => {
      create({ trigger: sel, targets: els });
    });

    standalone.forEach((el) => {
      create({ targets: [el] });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

  global.ScrollParallax = { create };
})(window);
