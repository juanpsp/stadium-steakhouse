/* =========================================================
   STADIUM STEAKHOUSE — HOME
   Monta o carrossel de novidades do topo, o card do craque da
   semana, os canais de delivery e o resumo das unidades a
   partir de assets/js/promocoes-dados.js.
   ========================================================= */

(function (window, document) {
  "use strict";

  var STADIUM = window.STADIUM || {};
  var i18n = STADIUM.i18n;

  /* Quanto tempo cada banner fica parado antes de passar para o
     próximo. O deslize em si leva 0.9s e acontece depois disso. */
  var INTERVALO_BANNER = 8000;

  /* ---------- utilidades ---------- */

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
     como manda o guia. Funciona também em faixas de preço. */
  function marcarPreco(texto) {
    return escapar(texto)
      .replace(/R\$/g, '<span class="t-price__unit">R$</span>')
      .replace(/,(\d{2})/g, '<span class="t-price__cents">,$1</span>');
  }

  function nomeUnidade(id) {
    var u = (STADIUM.unidades || []).filter(function (x) {
      return x.id === id;
    })[0];
    return u ? i18n.campo(u.nome) : "";
  }

  function prefereMenosMovimento() {
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  /* ---------------------------------------------------------
     CARROSSEL GENÉRICO
     Rolagem nativa com encaixe: dá arraste no celular de graça.
     A passagem automática é opcional e sempre pode ser parada —
     por botão, por hover, por foco de teclado ou por toque.
     --------------------------------------------------------- */
  function criarCarrossel(raiz, opcoes) {
    opcoes = opcoes || {};

    var trilha = raiz.querySelector(opcoes.trilha || ".carousel__track");
    var pontos = raiz.querySelector(opcoes.pontos || ".carousel__dots");
    var anterior = raiz.querySelector('[data-carousel="prev"]');
    var proximo = raiz.querySelector('[data-carousel="next"]');
    var classePonto = opcoes.classePonto || "carousel__dot";

    var timer = null;
    var pausadoPorContato = false;

    function itens() {
      return Array.prototype.slice.call(trilha.children);
    }

    function indiceVisivel() {
      var lista = itens();
      if (!lista.length) return 0;
      var melhor = 0;
      var menorDistancia = Infinity;
      lista.forEach(function (item, i) {
        var d = Math.abs(item.offsetLeft - trilha.offsetLeft - trilha.scrollLeft);
        if (d < menorDistancia) {
          menorDistancia = d;
          melhor = i;
        }
      });
      return melhor;
    }

    function sincronizar() {
      var atual = indiceVisivel();

      if (pontos) {
        Array.prototype.slice.call(pontos.children).forEach(function (p, i) {
          p.setAttribute("aria-current", i === atual ? "true" : "false");
        });
      }

      if (!opcoes.circular) {
        /* Tolerância de 2px: o navegador arredonda scrollLeft. */
        if (anterior) anterior.disabled = trilha.scrollLeft <= 2;
        if (proximo) {
          proximo.disabled =
            trilha.scrollLeft + trilha.clientWidth >= trilha.scrollWidth - 2;
        }
      }
    }

    function irPara(indice, instantaneo) {
      var lista = itens();
      if (!lista.length) return;

      if (opcoes.circular) {
        if (indice < 0) indice = lista.length - 1;
        if (indice > lista.length - 1) indice = 0;
      } else {
        indice = Math.max(0, Math.min(indice, lista.length - 1));
      }

      var destino = lista[indice].offsetLeft - trilha.offsetLeft;

      if (instantaneo) {
        trilha.scrollLeft = destino;
        return;
      }

      /* A troca precisa PARECER um arraste, não um corte. O
         "scroll-behavior: smooth" do navegador não serve aqui:
         ele é desligado por quem pede menos movimento no
         sistema, e aí o slide pula de uma vez.

         Deslizar na horizontal é a função do componente — sem
         isso ninguém percebe que existe outro slide ao lado. Por
         isso ele desliza sempre; para quem pediu menos
         movimento, apenas mais depressa. */
      var rapido =
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      var duracao = rapido ? 0.45 : 0.9;

      if (window.gsap) {
        /* O encaixe automático briga com a animação e puxa o
           slide de volta no meio do caminho; sai de cena
           enquanto o deslize acontece e volta no fim. */
        var encaixe = trilha.style.scrollSnapType;
        trilha.style.scrollSnapType = "none";
        window.gsap.to(trilha, {
          scrollLeft: destino,
          duration: duracao,
          ease: "power2.inOut",
          overwrite: true,
          onComplete: function () {
            trilha.style.scrollSnapType = encaixe;
          }
        });
        return;
      }

      trilha.scrollTo({ left: destino, behavior: "smooth" });
    }

    function reconstruirPontos() {
      if (!pontos) return;
      pontos.innerHTML = "";
      itens().forEach(function (_, i) {
        var b = el("button", classePonto);
        b.type = "button";
        b.setAttribute("aria-label", i18n.t("banner.goto", { n: i + 1 }));
        b.addEventListener("click", function () {
          irPara(i);
        });
        pontos.appendChild(b);
      });
    }

    /* ----- passagem automática ----- */

    function podeRodar() {
      return (
        opcoes.autoplay &&
        !pausadoPorContato &&
        !document.hidden &&
        itens().length > 1
      );
    }

    function parar() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    function rodar() {
      parar();
      if (!podeRodar()) return;
      timer = window.setInterval(function () {
        /* Sempre deslizando: é o deslize que mostra que existe
           outro slide ao lado. O irPara ajusta a velocidade para
           quem pediu menos movimento. */
        irPara(indiceVisivel() + 1);
      }, opcoes.intervalo || INTERVALO_BANNER);
    }

    if (opcoes.autoplay) {
      /* Encostar, focar ou tocar no carrossel congela a passagem:
         ninguém perde o banner que estava lendo. */
      raiz.addEventListener("mouseenter", function () {
        pausadoPorContato = true;
        parar();
      });
      raiz.addEventListener("mouseleave", function () {
        pausadoPorContato = false;
        rodar();
      });
      raiz.addEventListener("focusin", function () {
        pausadoPorContato = true;
        parar();
      });
      raiz.addEventListener("focusout", function () {
        if (!raiz.contains(document.activeElement)) {
          pausadoPorContato = false;
          rodar();
        }
      });
      trilha.addEventListener("pointerdown", function () {
        pausadoPorContato = true;
        parar();
      });
      trilha.addEventListener("pointerup", function () {
        pausadoPorContato = false;
        rodar();
      });

      document.addEventListener("visibilitychange", function () {
        if (document.hidden) parar();
        else rodar();
      });
    }

    trilha.addEventListener("scroll", sincronizar, { passive: true });
    window.addEventListener("resize", sincronizar);

    if (anterior) {
      anterior.addEventListener("click", function () {
        irPara(indiceVisivel() - 1);
      });
    }
    if (proximo) {
      proximo.addEventListener("click", function () {
        irPara(indiceVisivel() + 1);
      });
    }

    return {
      atualizar: function () {
        irPara(0, true);
        reconstruirPontos();
        sincronizar();
        rodar();
      }
    };
  }

  /* ---------------------------------------------------------
     1. BANNERS DO TOPO
     --------------------------------------------------------- */

  function montarBanner(banner) {
    var item = el("li", "banner banner--" + (banner.tema || "noite"));

    var media = el("div", "banner__media");
    if (banner.imagem) {
      /* A foto sempre preenche o quadro inteiro. O que muda de
         tela para tela é ONDE ela corta: o "foco" diz qual parte
         da imagem nunca pode sair — as canecas, os pães, os
         rostos. Sem isso o navegador corta pelo centro e come o
         assunto da foto. */
      var foto = el("img", "banner__foto");
      foto.src = banner.imagem;
      foto.alt = "";
      foto.style.setProperty("--foco", banner.foco || "50% 50%");
      foto.style.setProperty(
        "--foco-lg",
        banner.focoDesktop || banner.foco || "50% 50%"
      );
      if (banner.zoom) foto.style.setProperty("--zoom", banner.zoom);
      if (banner.zoomDesktop) {
        foto.style.setProperty("--zoom-lg", banner.zoomDesktop);
      }

      media.appendChild(foto);

      /* Se o arquivo não existir, o fundo do tema assume. */
      foto.addEventListener("error", function () {
        foto.remove();
      });
    }
    item.appendChild(media);

    var scrim = el("div", "banner__scrim");
    scrim.setAttribute("aria-hidden", "true");
    item.appendChild(scrim);

    var inner = el("div", "container banner__inner");

    /* Etiqueta de horário é informativa, então não vai de ouro:
       o ouro da tela fica reservado para o gancho de preço. */
    var tags = el("div", "banner__tags");
    tags.appendChild(el("span", "tag", i18n.campo(banner.etiqueta)));
    if (banner.unidade) {
      tags.appendChild(el("span", "tag", nomeUnidade(banner.unidade)));
    }
    inner.appendChild(tags);

    inner.appendChild(el("h2", "banner__title", i18n.campo(banner.titulo)));
    inner.appendChild(el("p", "banner__desc", i18n.campo(banner.descricao)));

    if (banner.destaque) {
      var gancho = el("p", "banner__hook");
      gancho.innerHTML = marcarPreco(i18n.campo(banner.destaque));
      inner.appendChild(gancho);
    }

    if (banner.acao) {
      var acao = el(
        "a",
        "btn btn--sm btn--outline on-photo",
        i18n.campo(banner.acao.rotulo)
      );
      acao.href = banner.acao.href;
      acao.appendChild(icone("arrow-right"));
      inner.appendChild(acao);
    }

    item.appendChild(inner);
    return item;
  }

  function iniciarBanners() {
    var secao = document.querySelector("[data-banners]");
    if (!secao || !STADIUM.banners) return;

    var trilha = secao.querySelector(".banners__track");
    var carrossel = criarCarrossel(secao, {
      trilha: ".banners__track",
      pontos: ".banners__dots",
      classePonto: "banners__dot",
      autoplay: true,
      circular: true,
      intervalo: INTERVALO_BANNER
    });

    function desenhar() {
      trilha.innerHTML = "";
      STADIUM.banners.forEach(function (banner) {
        trilha.appendChild(montarBanner(banner));
      });
      carrossel.atualizar();
    }

    desenhar();
    document.addEventListener("stadium:idioma", desenhar);
  }

  /* ---------------------------------------------------------
     2. O CRAQUE DA SEMANA
     --------------------------------------------------------- */

  function iniciarDestaque() {
    var caixa = document.querySelector("[data-destaque-card]");
    if (!caixa || !STADIUM.destaque) return;
    var d = STADIUM.destaque;

    function desenhar() {
      caixa.innerHTML = "";

      var media = el("div", "destaque__media");
      if (d.imagem) {
        var img = el("img");
        img.src = d.imagem;
        img.alt = i18n.campo(d.nome);
        img.loading = "lazy";
        media.appendChild(img);
      } else {
        media.appendChild(
          el("p", "destaque__placeholder", i18n.t("destaque.photo"))
        );
      }
      media.appendChild(
        el("p", "sticker destaque__selo", i18n.campo(d.selo))
      );
      caixa.appendChild(media);

      var body = el("div", "destaque__body");
      body.appendChild(el("h3", "t-h2 destaque__nome", i18n.campo(d.nome)));
      if (d.meta) body.appendChild(el("p", "t-meta", i18n.campo(d.meta)));
      body.appendChild(
        el("p", "t-body destaque__desc", i18n.campo(d.descricao))
      );

      var precos = el("div", "destaque__precos");
      if (d.precoDe) {
        var de = el("p", "destaque__de");
        de.textContent = i18n.t("destaque.was") + " " + d.precoDe;
        precos.appendChild(de);
      }
      var preco = el("p", "t-price destaque__preco");
      preco.innerHTML = marcarPreco(d.preco);
      precos.appendChild(preco);
      body.appendChild(precos);

      var acao = el("div", "destaque__acao");
      var botao = el(
        "a",
        "btn btn--gold btn--block",
        i18n.campo(d.acao.rotulo)
      );
      botao.href = d.acao.href;
      acao.appendChild(botao);
      body.appendChild(acao);

      caixa.appendChild(body);
    }

    desenhar();
    document.addEventListener("stadium:idioma", desenhar);
  }

  /* ---------------------------------------------------------
     3. A EQUIPE
     --------------------------------------------------------- */

  function iniciarEquipe() {
    var caixa = document.querySelector("[data-equipe-foto]");
    if (!caixa || !STADIUM.equipe) return;
    var e = STADIUM.equipe;

    function desenhar() {
      caixa.innerHTML = "";

      var cargo = i18n.campo(e.cargo);
      var img = el("img", "equipe__retrato");
      img.src = e.foto;
      /* Pessoa real na foto: o alt descreve quem é, não "imagem". */
      img.alt = e.nome + ", " + cargo.toLowerCase() + " do Stadium Steakhouse";
      img.loading = "lazy";
      /* Se o arquivo sumir, a seção continua de pé sem buraco. */
      img.addEventListener("error", function () {
        caixa.remove();
      });
      caixa.appendChild(img);

      var legenda = el("figcaption", "equipe__credito");
      legenda.appendChild(el("strong", null, e.nome));
      legenda.appendChild(el("span", null, cargo));
      caixa.appendChild(legenda);
    }

    desenhar();
    document.addEventListener("stadium:idioma", desenhar);
  }

  /* ---------------------------------------------------------
     4. DELIVERY
     --------------------------------------------------------- */

  var CHAVE_UNIDADE = "stadium:unidade";

  function lerUnidadeSalva() {
    try {
      return window.localStorage.getItem(CHAVE_UNIDADE);
    } catch (e) {
      return null;
    }
  }

  function salvarUnidade(id) {
    try {
      window.localStorage.setItem(CHAVE_UNIDADE, id);
    } catch (e) {
      /* segue sem persistir */
    }
  }

  function iniciarDelivery() {
    var lista = document.querySelector("[data-delivery]");
    if (!lista || !STADIUM.delivery) return;

    var alternador = document.querySelector("[data-delivery-switch]");
    var unidades = STADIUM.unidades || [];

    /* A escolha vale para a visita inteira e volta na próxima. */
    var salva = lerUnidadeSalva();
    var existe = unidades.some(function (u) {
      return u.id === salva;
    });
    STADIUM.unidadeAtual =
      existe && salva ? salva : unidades.length ? unidades[0].id : null;

    function desenharAlternador() {
      if (!alternador || unidades.length < 2) return;
      alternador.innerHTML = "";
      unidades.forEach(function (unidade) {
        var b = el("button", "unit-switch__btn", i18n.campo(unidade.nome));
        b.type = "button";
        b.setAttribute("role", "tab");
        b.setAttribute(
          "aria-selected",
          unidade.id === STADIUM.unidadeAtual ? "true" : "false"
        );
        b.addEventListener("click", function () {
          if (STADIUM.unidadeAtual === unidade.id) return;
          STADIUM.unidadeAtual = unidade.id;
          salvarUnidade(unidade.id);
          desenharAlternador();
          desenhar();
          /* o indicador aberto/fechado do topo acompanha */
          if (STADIUM.atualizarStatus) {
            STADIUM.atualizarStatus(unidade.id);
          }
        });
        alternador.appendChild(b);
      });
    }

    /* Link da loja escolhida; se o canal não tiver link por
       unidade, cai no href único. */
    function linkDoCanal(canal) {
      if (canal.links && STADIUM.unidadeAtual) {
        var alvo = canal.links[STADIUM.unidadeAtual];
        if (alvo) return alvo;
      }
      return canal.href || "#";
    }

    function desenhar() {
      lista.innerHTML = "";
      STADIUM.delivery.forEach(function (canal) {
        var li = el("li");
        var a = el("a", "delivery__item");
        a.href = linkDoCanal(canal);
        a.target = "_blank";
        a.rel = "noopener noreferrer";

        /* Logo da marca parceira quando existir; o ícone de
           entrega fica como reserva se o arquivo faltar. O alt
           é vazio de propósito: o nome já vem em texto ao lado,
           e repetir faria o leitor de tela falar duas vezes. */
        var caixa = el("span", "delivery__icon");
        if (canal.logo) {
          var marca = el("img", "delivery__logo");
          marca.src = canal.logo;
          marca.alt = "";
          marca.loading = "lazy";
          marca.addEventListener("error", function () {
            marca.remove();
            caixa.appendChild(icone(canal.icone, "ico--lg"));
          });
          caixa.appendChild(marca);
        } else {
          caixa.appendChild(icone(canal.icone, "ico--lg"));
        }
        a.appendChild(caixa);

        var texto = el("span", "delivery__text");
        texto.appendChild(el("span", "delivery__name", canal.nome));
        texto.appendChild(el("span", "delivery__hint", i18n.campo(canal.hint)));
        a.appendChild(texto);

        /* O ícone sozinho não carrega informação: o destino
           externo e a unidade escolhida são ditos em texto para
           quem usa leitor de tela. */
        var aviso = "(" + i18n.t("delivery.newTab") + ")";
        if (STADIUM.unidadeAtual) {
          aviso = "— " + nomeUnidade(STADIUM.unidadeAtual) + " " + aviso;
        }
        a.appendChild(el("span", "sr-only", aviso));
        a.appendChild(icone("external", "ico--go"));

        li.appendChild(a);
        lista.appendChild(li);
      });
    }

    desenharAlternador();
    desenhar();
    document.addEventListener("stadium:idioma", function () {
      desenharAlternador();
      desenhar();
    });
  }

  /* ---------------------------------------------------------
     4. RESUMO DAS UNIDADES
     --------------------------------------------------------- */

  function iniciarUnidades() {
    var grade = document.querySelector("[data-units]");
    if (!grade || !STADIUM.unidades) return;

    function desenhar() {
      grade.innerHTML = "";
      STADIUM.unidades.forEach(function (unidade) {
        var card = el("article", "unit-card");
        card.appendChild(el("h3", "t-h3", i18n.campo(unidade.nome)));

        var endereco = el("p", "unit-card__addr");
        endereco.appendChild(icone("pin", "ico--sm"));
        endereco.appendChild(el("span", null, unidade.endereco));
        card.appendChild(endereco);

        var tags = el("ul", "unit-card__tags");
        (unidade.destaques[i18n.atual()] || unidade.destaques.pt).forEach(
          function (d) {
            tags.appendChild(el("li", "tag", d));
          }
        );
        card.appendChild(tags);

        var foot = el("div", "unit-card__foot");
        var link = el("a", "btn btn--sm btn--outline", i18n.t("units.cta"));
        link.href = "unidades.html";
        foot.appendChild(link);
        card.appendChild(foot);

        grade.appendChild(card);
      });
    }

    desenhar();
    document.addEventListener("stadium:idioma", desenhar);
  }

  /* ---------- PARTIDA ---------- */

  document.addEventListener("DOMContentLoaded", function () {
    if (!i18n) return;
    iniciarBanners();
    iniciarDestaque();
    iniciarEquipe();
    iniciarDelivery();
    iniciarUnidades();
  });
})(window, document);
