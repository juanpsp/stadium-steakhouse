/* =========================================================
   STADIUM STEAKHOUSE — ANIMAÇÃO DE ENTRADA (GSAP)
   =========================================================

   Só na home. Cardápio e unidades ficam sem animação de
   propósito: são telas de consulta, onde a pessoa quer achar
   um preço, não assistir a nada.

   COMO FUNCIONA

   A animação é AMARRADA À ROLAGEM ("scrub"), não disparada
   por ela. A diferença é tudo:

     disparada — o bloco cruza uma linha e a animação roda
                 sozinha, no tempo dela. Dá a sensação de
                 piscar e jogar o conteúdo na cara.
     amarrada  — o bloco aparece conforme a pessoa arrasta.
                 Parou de arrastar, parou no meio. Voltou,
                 voltou junto. É o dedo que conduz.

   O trecho de rolagem em que isso acontece vai do START ao
   END. Quanto maior a distância entre eles, mais suave e mais
   demorado o surgimento — e mais a pessoa precisa arrastar.

   O "scrub: 0.6" acrescenta um atraso macio: o bloco persegue
   a rolagem em vez de grudar nela. É o que tira o efeito
   mecânico.

   TRÊS REGRAS

   1. Card é conteúdo inteiro. Foto e texto de um mesmo card
      entram juntos, nunca em partes.

   2. Sem JS, a página aparece inteira. O estado inicial é
      aplicado pelo GSAP, nunca pelo CSS.

   3. Quem pede menos movimento recebe só o fade, sem o
      deslocamento.
   ========================================================= */

(function (window, document) {
  "use strict";

  /* Quanto o bloco sobe enquanto aparece. Sutil de propósito. */
  var SOBE = 28;

  /* O trecho de rolagem que a animação ocupa. START é onde ela
     começa (bloco entrando pela base da tela) e END é onde ela
     termina. Mexer aqui muda a suavidade de toda a página. */
  var START = "top 96%";
  var END = "top 48%";

  /* Atraso macio entre o dedo e o bloco. Maior = mais preguiçoso. */
  var MACIEZ = 0.6;

  function iniciar() {
    if (!window.gsap || !window.ScrollTrigger) return;

    gsap.registerPlugin(ScrollTrigger);

    /* A curva do guia, ponto a ponto. */
    var curva = "power2.out";
    if (window.CustomEase) {
      gsap.registerPlugin(CustomEase);
      CustomEase.create("stadium", "M0,0 C0.2,0.8 0.28,1 1,1");
      curva = "stadium";
    }
    gsap.defaults({ ease: curva });

    /* Dois níveis em vez de liga/desliga: quem pediu menos
       movimento continua vendo o conteúdo aparecer, só não vê
       ele se deslocar. O que incomoda quem tem sensibilidade é
       a translação, não a opacidade. */
    var forcado = /[?&]animar=1/.test(window.location.search);

    gsap.matchMedia().add(
      {
        comMovimento: forcado
          ? "all"
          : "(prefers-reduced-motion: no-preference)",
        semMovimento: forcado ? "not all" : "(prefers-reduced-motion: reduce)",
        /* 900px é onde o retrato do Edivandro sai de baixo do
           texto e sobe para a coluna da direita. A animação dele
           muda junto — ver o bloco "A equipe" lá embaixo. */
        ladoALado: "(min-width: 900px)"
      },
      function (contexto) {
        montar(
          contexto.conditions.comMovimento,
          contexto.conditions.ladoALado
        );
      }
    );

    sombraDoHeader();

    document.addEventListener("stadium:idioma", function () {
      ScrollTrigger.refresh();
    });

    window.addEventListener("load", function () {
      ScrollTrigger.refresh();
    });

    /* O retrato da equipe entra na página depois, por home.js, e
       a imagem dele carrega depois ainda. Cada uma dessas etapas
       muda a altura da seção, e toda medida feita antes fica
       velha. Um recálculo quando a foto termina de carregar. */
    recalcularQuandoAfotoCarregar();

    /* Aba aberta em segundo plano: o navegador congela o relógio
       de animação. Ao voltar, recalcula tudo. */
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) ScrollTrigger.refresh();
    });
  }

  function montar(comMovimento, ladoALado) {
    var deslocamento = comMovimento ? SOBE : 0;

    /* ---------------------------------------------------------
       Aparece conforme a pessoa arrasta.

       "alvos" pode ser um bloco só (um card inteiro) ou vários
       irmãos que entram em leve cascata. O gatilho é sempre o
       primeiro alvo, ou o contêiner indicado — nunca cada peça
       separada, senão um card se desmontaria em pedaços.
       --------------------------------------------------------- */
    function aparecer(seletor, opcoes) {
      var alvos = document.querySelectorAll(seletor);
      if (!alvos.length) return;
      opcoes = opcoes || {};

      var gatilho = opcoes.trigger
        ? document.querySelector(opcoes.trigger)
        : alvos[0];
      if (!gatilho) return;

      gsap.fromTo(
        alvos,
        {
          opacity: 0,
          y: opcoes.sobe === undefined ? deslocamento : (comMovimento ? opcoes.sobe : 0)
        },
        {
          opacity: 1,
          y: 0,
          /* Sem curva própria de propósito. Numa animação
             amarrada à rolagem, quem dita o ritmo é o dedo — uma
             curva "out" por cima faz o bloco chegar a 90% quando
             o arraste está na metade, e o fim parece estufado.
             A curva do guia continua valendo no hover e nas
             animações que rodam sozinhas. */
          ease: "none",
          stagger: opcoes.stagger === undefined ? 0.06 : opcoes.stagger,
          scrollTrigger: {
            trigger: gatilho,
            start: opcoes.start || START,
            end: opcoes.end || END,
            scrub: MACIEZ
          }
        }
      );
    }

    /* O BANNER DO TOPO NÃO ANIMA — DE PROPÓSITO.
       Ele é a primeira coisa que a pessoa vê e o único bloco
       que não tem rolagem para acompanhar, então a entrada teria
       de rodar por tempo. Quando essa entrada engasgava, o slide
       ficava sem título e sem preço: o pior lugar possível para
       um defeito. O carrossel já tem movimento próprio, na
       passagem de um slide para o outro. */

    /* ----- Cabeçalhos de seção -----
       Eyebrow, título e texto sobem em cascata leve. */
    document.querySelectorAll(".section__head").forEach(function (cabeca, i) {
      var filhos = cabeca.children;
      if (!filhos.length) return;
      cabeca.setAttribute("data-cabeca", i);
      aparecer('[data-cabeca="' + i + '"] > *', {
        trigger: '[data-cabeca="' + i + '"]',
        stagger: 0.08
      });
    });

    /* ----- O craque da semana -----
       O card inteiro, de uma vez: foto e texto são a mesma
       peça. O rodapé vem logo depois, no próprio trecho dele. */
    aparecer(".destaque__card", { sobe: 34 });
    aparecer(".destaque__foot > *", {
      trigger: ".destaque__foot",
      stagger: 0.08
    });

    /* ----- Delivery -----
       Cada aplicativo é um bloco fechado: logo, nome e seta
       entram juntos. */
    aparecer(".unit-switch__btn", {
      trigger: ".unit-switch",
      sobe: 16,
      stagger: 0.07
    });
    aparecer(".delivery__item", {
      trigger: ".delivery__list",
      stagger: 0.1
    });

    /* ----- A equipe ----- */
    aparecer(".equipe__pilares li", {
      trigger: ".equipe__pilares",
      stagger: 0.1
    });

    /* O retrato sobe mais que o resto: é peça grande e o olho
       acompanha a subida. Só que ONDE ele está muda tudo.

       Empilhado (celular), ele fecha o bloco por baixo. Entra
       depois dos pilares, no trecho de rolagem dele mesmo, e é
       exatamente isso que se quer ver.

       Lado a lado (900px pra cima), ele ocupa a coluna da
       direita, na altura dos pilares. Aí disparar por si mesmo
       quebra: o topo dele fica bem mais baixo que o dos pilares,
       então a largada dele só é cruzada quando o texto ao lado
       já foi lido inteiro. Resultado, ele passa um bom tempo
       plantado ali meio transparente — parece foto desfocada,
       não animação em curso.

       A correção é olhar para o bloco inteiro, e não para ele:
       o retrato acompanha a mesma rolagem das duas colunas e
       chega junto com elas.

       De quebra isso conserta uma corrida: o retrato é injetado
       por home.js e a imagem carrega depois. Enquanto ela não
       chega, a figure tem altura zero e, encostada na base da
       grade, cai lá no fim da seção — e é sobre essa posição
       errada que o gatilho dele é calculado. ".equipe__grid" já
       tem altura própria vinda do texto, então nasce medido
       certo, com foto ou sem foto. */
    if (ladoALado) {
      aparecer(".equipe__foto", {
        trigger: ".equipe__grid",
        sobe: 44
      });
    } else {
      aparecer(".equipe__foto", {
        sobe: 44,
        start: "top 100%",
        end: "top 45%"
      });
    }

    /* ----- Unidades ----- */
    aparecer(".unit-card", { trigger: ".units__grid", stagger: 0.12 });

    /* ----- Rodapé ----- */
    aparecer(".footer__grid > *", {
      trigger: ".footer__grid",
      sobe: 18,
      stagger: 0.07
    });
  }

  /* Espera o retrato da equipe aparecer no DOM e terminar de
     carregar para remedir os gatilhos. Sem isso, quem chega com
     a imagem em cache pode pegar as medidas erradas e ver a foto
     parada meio transparente. */
  function recalcularQuandoAfotoCarregar() {
    var figura = document.querySelector("[data-equipe-foto]");
    if (!figura) return;

    function ligar(img) {
      if (!img) return false;
      if (img.complete) {
        ScrollTrigger.refresh();
      } else {
        img.addEventListener("load", function () {
          ScrollTrigger.refresh();
        });
      }
      return true;
    }

    if (ligar(figura.querySelector("img"))) return;

    /* Ainda vazia: home.js não desenhou. Observa até a img cair
       dentro e então se desliga. */
    if (!window.MutationObserver) return;
    var observador = new MutationObserver(function () {
      if (ligar(figura.querySelector("img"))) observador.disconnect();
    });
    observador.observe(figura, { childList: true, subtree: true });
  }

  /* Sombra do header ao sair do topo. Fora do bloco de
     animação porque não é enfeite: é o que separa a barra fixa
     do conteúdo que passa por baixo dela. */
  function sombraDoHeader() {
    var topo = document.querySelector(".topbar");
    if (!topo) return;
    ScrollTrigger.create({
      start: 8,
      onEnter: function () {
        topo.classList.add("is-scrolled");
      },
      onLeaveBack: function () {
        topo.classList.remove("is-scrolled");
      }
    });
  }

  document.addEventListener("DOMContentLoaded", iniciar);
})(window, document);
