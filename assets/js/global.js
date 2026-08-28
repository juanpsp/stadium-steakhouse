/* =========================================================
   STADIUM STEAKHOUSE — COMPORTAMENTO GLOBAL
   Roda em todas as páginas: seletor de idioma, marcação da
   página atual na navegação e indicador de aberto/fechado.
   ========================================================= */

(function (window, document) {
  "use strict";

  var STADIUM = (window.STADIUM = window.STADIUM || {});

  /* ---------------------------------------------------------
     0. UTILIDADES COMPARTILHADAS
     Usadas pela home e pelo cardápio.
     --------------------------------------------------------- */

  function el(tag, classe, texto) {
    var n = document.createElement(tag);
    if (classe) n.className = classe;
    if (texto !== undefined && texto !== null) n.textContent = texto;
    return n;
  }

  function icone(nome, classe) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "ico " + (classe || ""));
    svg.setAttribute("aria-hidden", "true");
    var use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", "#i-" + nome);
    svg.appendChild(use);
    return svg;
  }

  function escapar(texto) {
    var d = document.createElement("div");
    d.textContent = texto;
    return d.innerHTML;
  }

  /* "R$ 59,90" -> R$ e centavos a 62% do tamanho do inteiro,
     como manda o guia. Funciona também em faixas de preço.
     Aceita ponto no lugar da vírgula e normaliza na exibição,
     sem alterar o dado de origem. */
  function marcarPreco(texto) {
    return escapar(String(texto))
      .replace(/(\d)\.(\d{2})(?!\d)/g, "$1,$2")
      .replace(/R\$/g, '<span class="t-price__unit">R$</span>')
      .replace(/,(\d{2})/g, '<span class="t-price__cents">,$1</span>');
  }

  STADIUM.el = el;
  STADIUM.icone = icone;
  STADIUM.escapar = escapar;
  STADIUM.marcarPreco = marcarPreco;

  /* ---------------------------------------------------------
     1. SELETOR DE IDIOMA
     --------------------------------------------------------- */
  function iniciarIdioma() {
    var raiz = document.querySelector("[data-lang]");
    if (!raiz) return;

    var alternar = raiz.querySelector(".lang__toggle");
    var menu = raiz.querySelector(".lang__menu");
    var sigla = raiz.querySelector("[data-lang-current]");
    var opcoes = Array.prototype.slice.call(
      raiz.querySelectorAll(".lang__option")
    );

    function marcar() {
      var atual = STADIUM.i18n.atual();
      if (sigla) sigla.textContent = atual.toUpperCase();
      opcoes.forEach(function (op) {
        op.setAttribute(
          "aria-checked",
          op.getAttribute("data-lang-option") === atual ? "true" : "false"
        );
      });
    }

    function abrir(estado) {
      alternar.setAttribute("aria-expanded", String(estado));
      menu.hidden = !estado;
    }

    alternar.addEventListener("click", function (e) {
      e.stopPropagation();
      abrir(alternar.getAttribute("aria-expanded") !== "true");
    });

    opcoes.forEach(function (op) {
      op.addEventListener("click", function () {
        STADIUM.i18n.definir(op.getAttribute("data-lang-option"));
        marcar();
        abrir(false);
        alternar.focus();
      });
    });

    document.addEventListener("click", function (e) {
      if (!raiz.contains(e.target)) abrir(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && alternar.getAttribute("aria-expanded") === "true") {
        abrir(false);
        alternar.focus();
      }
    });

    marcar();
    document.addEventListener("stadium:idioma", marcar);
  }

  /* ---------------------------------------------------------
     2. PÁGINA ATUAL NA NAVEGAÇÃO
     Marca sozinho, para não depender de editar classe em cada
     arquivo HTML.
     --------------------------------------------------------- */
  function marcarPaginaAtual() {
    var arquivo = window.location.pathname.split("/").pop() || "index.html";

    document
      .querySelectorAll(".bottomnav__item, .topbar__link")
      .forEach(function (link) {
        var alvo = (link.getAttribute("href") || "").split("#")[0];
        if (alvo === arquivo) {
          link.setAttribute("aria-current", "page");
        } else {
          link.removeAttribute("aria-current");
        }
      });
  }

  /* ---------------------------------------------------------
     3. ABERTO OU FECHADO AGORA
     Lê os horários de assets/js/promocoes-dados.js e resolve
     inclusive quem fecha depois da meia-noite.
     --------------------------------------------------------- */
  function paraMinutos(hhmm) {
    var p = hhmm.split(":");
    return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
  }

  function formatar(minutos) {
    var m = ((minutos % 1440) + 1440) % 1440;
    var h = Math.floor(m / 60);
    var min = m % 60;
    return h + "h" + (min ? String(min).padStart(2, "0") : "");
  }

  /* Devolve { aberto: bool, minuto: número } — o minuto é a
     hora de fechar (se aberto) ou a de abrir (se fechado). */
  function calcularStatus(horarios, agora) {
    var diaHoje = agora.getDay();
    var minutoAgora = agora.getHours() * 60 + agora.getMinutes();

    // A janela de ontem pode ter atravessado a meia-noite.
    var diaOntem = (diaHoje + 6) % 7;
    var ontem = horarios[diaOntem];
    if (ontem) {
      var oIni = paraMinutos(ontem[0]);
      var oFim = paraMinutos(ontem[1]);
      if (oFim <= oIni && minutoAgora < oFim) {
        return { aberto: true, minuto: oFim };
      }
    }

    var hoje = horarios[diaHoje];
    if (!hoje) return { aberto: false, minuto: null };

    var ini = paraMinutos(hoje[0]);
    var fim = paraMinutos(hoje[1]);
    if (fim <= ini) fim += 1440; // fecha na madrugada seguinte

    if (minutoAgora >= ini && minutoAgora < fim) {
      return { aberto: true, minuto: fim };
    }
    if (minutoAgora < ini) {
      return { aberto: false, minuto: ini };
    }

    // Já fechou hoje: procura a próxima abertura na semana, para
    // a tela dizer "abre às 8h" em vez de só "fechado".
    for (var d = 1; d <= 7; d++) {
      var proximo = horarios[(diaHoje + d) % 7];
      if (proximo) return { aberto: false, minuto: paraMinutos(proximo[0]) };
    }
    return { aberto: false, minuto: null };
  }

  function atualizarStatus(unidadeId) {
    var el = document.querySelector("[data-status]");
    if (!el || !STADIUM.unidades) return;

    var unidade =
      STADIUM.unidades.filter(function (u) {
        return u.id === unidadeId;
      })[0] || STADIUM.unidades[0];
    if (!unidade) return;

    var estado = calcularStatus(unidade.horarios, new Date());
    var curto = el.querySelector(".status__short");
    var longo = el.querySelector(".status__long");
    var i18n = STADIUM.i18n;

    el.setAttribute("data-open", String(estado.aberto));

    if (curto) {
      curto.textContent = i18n.t(estado.aberto ? "status.open" : "status.closed");
    }

    if (longo) {
      if (estado.minuto === null) {
        longo.textContent = i18n.t("status.closed");
      } else {
        longo.textContent = i18n.t(
          estado.aberto ? "status.openUntil" : "status.opensAt",
          { time: formatar(estado.minuto) }
        );
      }
    }
  }

  STADIUM.atualizarStatus = atualizarStatus;
  STADIUM.calcularStatus = calcularStatus;
  STADIUM.formatarHora = formatar;

  /* ---------------------------------------------------------
     4. PARTIDA
     --------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", function () {
    if (STADIUM.i18n) STADIUM.i18n.iniciar();
    iniciarIdioma();
    marcarPaginaAtual();
    atualizarStatus();

    // O status muda sozinho ao longo da noite.
    window.setInterval(function () {
      atualizarStatus(STADIUM.unidadeAtual);
    }, 60000);

    document.addEventListener("stadium:idioma", function () {
      atualizarStatus(STADIUM.unidadeAtual);
    });
  });
})(window, document);
