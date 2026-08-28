/* =========================================================
   STADIUM STEAKHOUSE — ÍCONES
   =========================================================

   Conjunto único: Lucide. Contorno, traço 2px, ponta
   arredondada, monocromático. Herdam a cor do contexto.

   Este arquivo injeta um sprite no topo do <body>. Carregue-o
   logo depois da tag <body> de cada página:

       <script src="assets/js/icones.js"></script>

   Para usar um ícone no HTML:

       <svg class="ico" aria-hidden="true"><use href="#i-home"/></svg>

   Tamanhos: .ico--sm (16px) em micro-labels, .ico (20px) em
   botões e listas, .ico--lg (24px) em destaques.

   Regra: ícone nunca carrega informação sozinho — sempre
   acompanha texto. Emoji não é usado em nenhuma superfície.
   ========================================================= */

(function (document) {
  "use strict";

  var icones = {
    home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    menu: '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
    "chevron-down": '<path d="m6 9 6 6 6-6"/>',
    "chevron-left": '<path d="m15 18-6-6 6-6"/>',
    "chevron-right": '<path d="m9 18 6-6-6-6"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    minus: '<path d="M5 12h14"/>',
    pause: '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
    play: '<path d="M6 3.5v17l14-8.5z"/>',
    tv: '<rect x="2" y="7" width="20" height="15" rx="2"/><path d="m17 2-5 5-5-5"/>',
    billiards: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="1"/>',
    smile: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01"/><path d="M15 9h.01"/>',
    coffee: '<path d="M10 2v2"/><path d="M14 2v2"/><path d="M6 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"/>',
    bike: '<circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/>',
    message: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
    external: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    "arrow-right": '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    megaphone: '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
    facebook: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
    instagram: '<rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><path d="M17.5 6.5h.01"/>',

    /* ----- ACOMPANHAMENTOS -----
       A lista de Assistências é longa e todos os cards são
       iguais: só nome e botão. O ícone é o que deixa a varredura
       rápida — o olho acha "o do brócolis" antes de ler.

       Mesmo traço de 2px e ponta arredondada do resto do
       conjunto, para não virar corpo estranho no meio dos
       outros ícones da tela. */
    arroz: '<path d="M3 12h18a9 9 0 0 1-18 0z"/><circle cx="8.5" cy="8.6" r="1.1"/><circle cx="12" cy="6.9" r="1.1"/><circle cx="15.5" cy="8.6" r="1.1"/>',
    /* A copa é escalopada de propósito: com um arco liso só, o
       desenho vira árvore ou cogumelo. São os quatro caroços em
       cima que fazem o olho ler brócolis. */
    brocolis: '<path d="M4.5 11.5a3 3 0 0 1 2.2-5 3.2 3.2 0 0 1 5.3-2.2 3.2 3.2 0 0 1 5.3 2.2 3 3 0 0 1 2.2 5z"/><path d="M9.6 11.5 10 19a2 2 0 0 0 4 0l.4-7.5"/>',
    legumes: '<path d="M15.5 9.5c-1 5-4.5 9-11 11.5C7 14.5 10.5 10.5 15.5 9.5z"/><path d="M15.5 9.5c1.5-1.5 4-1.5 5.5 0-1.5 1.5-4 1.5-5.5 0z"/><path d="M15.5 9.5c-1.5-1.5-1.5-4 0-5.5 1.5 1.5 1.5 4 0 5.5z"/>',
    batata: '<path d="M5.5 10h13l-1.2 10.2a2 2 0 0 1-2 1.8H8.7a2 2 0 0 1-2-1.8z"/><path d="M6.3 14.5h11.4"/><path d="M9.3 10V5a1.3 1.3 0 0 1 2.6 0v5"/><path d="M12.6 10V4a1.3 1.3 0 0 1 2.6 0v6"/>',
    /* Mesma tigela do arroz e da salada, com uma bola dentro em
       vez de grãos ou folhas. Sozinha, a cúpula sobre um prato
       lia como ponte; dentro da tigela, o conjunto das três
       vira uma família e a diferença fica no recheio. */
    pure: '<path d="M3 13h18a9 9 0 0 1-18 0z"/><path d="M8 13a4 4 0 0 1 8 0"/>',
    salada: '<path d="M3 13h18a9 9 0 0 1-18 0z"/><path d="M12.5 13c-.3-3 1.6-5.7 4.5-6.4.4 3.1-1.4 5.9-4.5 6.4z"/><path d="M11 13c-1.9-1.4-2.5-3.9-1.5-6 2.1.9 3.2 3.2 2.5 5.4"/>',
    feijao: '<path d="M7 16.5c-2.2 0-4-1.5-4-3.6C3 9.6 5.9 7 9.3 7c2.1 0 3.7 1.4 3.7 3.4 0 3.3-2.8 6.1-6 6.1z"/><path d="M14.7 20c-2.2 0-4-1.5-4-3.6 0-3.3 2.9-5.9 6.3-5.9 2.1 0 3.7 1.4 3.7 3.4 0 3.3-2.8 6.1-6 6.1z"/>',
    ovo: '<path d="M12 21.5c-3.9 0-7-2.9-7-7C5 9.4 8.1 2.5 12 2.5s7 6.9 7 12c0 4.1-3.1 7-7 7z"/>',
    cebola: '<path d="M12 21.5c-3.9 0-7-2.8-7-6.6C5 10.6 8.1 7 12 7s7 3.6 7 7.9c0 3.8-3.1 6.6-7 6.6z"/><path d="M12 7c.2-2 1.4-3.6 3.2-4.4"/><path d="M12 7c-.2-1.7-1.2-3.1-2.7-3.8"/><path d="M12 21.5c-1.7-2.1-2.6-4.4-2.6-6.8S10.3 10 12 8"/><path d="M12 21.5c1.7-2.1 2.6-4.4 2.6-6.8S13.7 10 12 8"/>',
    molho: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
    porcao: '<circle cx="12" cy="12" r="9"/><path d="M9 12h6"/><path d="M12 9v6"/>'
  };

  var partes = ['<svg class="sprite" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">'];
  Object.keys(icones).forEach(function (nome) {
    partes.push(
      '<symbol id="i-' + nome + '" viewBox="0 0 24 24">' + icones[nome] + "</symbol>"
    );
  });
  partes.push("</svg>");

  function injetar() {
    if (document.querySelector(".sprite")) return;
    var caixa = document.createElement("div");
    caixa.innerHTML = partes.join("");
    document.body.insertBefore(caixa.firstChild, document.body.firstChild);
  }

  if (document.body) {
    injetar();
  } else {
    document.addEventListener("DOMContentLoaded", injetar);
  }
})(document);
