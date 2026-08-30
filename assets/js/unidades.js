/* =========================================================
   STADIUM STEAKHOUSE — UNIDADES
   Monta um card por loja a partir de assets/js/promocoes-dados.js:
   descrição, mapa, endereço, horário da semana e contatos.
   O estado (aberto/fechado) é calculado na hora.
   ========================================================= */

(function (window, document) {
  "use strict";

  var STADIUM = window.STADIUM || {};
  var i18n = STADIUM.i18n;
  var el = STADIUM.el;
  var icone = STADIUM.icone;

  var CHAVES_DIA = [
    "dia.dom",
    "dia.seg",
    "dia.ter",
    "dia.qua",
    "dia.qui",
    "dia.sex",
    "dia.sab"
  ];

  /* Semana começando na segunda, que é como se lê um horário
     de loja. O domingo entra no fim. */
  var ORDEM_SEMANA = [1, 2, 3, 4, 5, 6, 0];

  /* "11:30" -> "11h30" · "00:00" -> "00h" · "01:00" -> "1h" */
  function hora(hhmm) {
    var p = hhmm.split(":");
    var h = parseInt(p[0], 10);
    var min = p[1] === "00" ? "" : p[1];
    return (h === 0 ? "00" : String(h)) + "h" + min;
  }

  /* Junta dias seguidos que têm o mesmo horário, para a tabela
     virar três linhas em vez de sete. */
  function agruparSemana(horarios) {
    var grupos = [];
    ORDEM_SEMANA.forEach(function (dia) {
      var faixa = horarios[dia];
      var chave = faixa ? faixa[0] + "|" + faixa[1] : "fechado";
      var ultimo = grupos[grupos.length - 1];
      if (ultimo && ultimo.chave === chave) {
        ultimo.dias.push(dia);
      } else {
        grupos.push({ chave: chave, dias: [dia], faixa: faixa });
      }
    });
    return grupos;
  }

  function nomeDia(dia, minusculo) {
    var nome = i18n.t(CHAVES_DIA[dia]);
    /* Em inglês o dia da semana é nome próprio e não perde a
       maiúscula no meio da frase; em português e espanhol, sim. */
    if (minusculo && i18n.atual() !== "en") return nome.toLowerCase();
    return nome;
  }

  function rotuloDoGrupo(dias) {
    if (dias.length === 1) return nomeDia(dias[0]);
    var ligacao =
      dias.length === 2 ? i18n.t("unidades.e") : i18n.t("unidades.ate");
    return (
      nomeDia(dias[0]) +
      " " +
      ligacao +
      " " +
      nomeDia(dias[dias.length - 1], true)
    );
  }

  function faixaDoGrupo(grupo) {
    if (!grupo.faixa) return i18n.t("status.closed");
    return hora(grupo.faixa[0]) + " – " + hora(grupo.faixa[1]);
  }

  function montarUnidade(unidade) {
    var card = el("article", "unidade");
    card.id = unidade.id;
    /* Marca a casa para a medição de atenção. Cada unidade é um
       bloco próprio, e não um pedaço de "unidades": as duas casas
       competem pela mesma visita, e saber qual delas prende mais
       é uma pergunta de negócio, não de layout. O nome que
       aparece no painel sai do <h2> logo abaixo. */
    card.setAttribute("data-secao", "unidade-" + unidade.id);

    /* --- cabeçalho: nome + estado agora --- */
    var head = el("div", "unidade__head");
    head.appendChild(el("h2", "t-h2", i18n.campo(unidade.nome)));

    var estado = STADIUM.calcularStatus(unidade.horarios, new Date());
    var chip = el("p", "unidade__status");
    chip.setAttribute("data-open", String(estado.aberto));
    if (estado.minuto === null) {
      chip.appendChild(document.createTextNode(i18n.t("status.closed")));
    } else {
      chip.appendChild(
        document.createTextNode(
          i18n.t(estado.aberto ? "status.openUntil" : "status.opensAt", {
            time: STADIUM.formatarHora(estado.minuto)
          })
        )
      );
    }
    head.appendChild(chip);
    card.appendChild(head);

    /* --- fotos do local, logo abaixo do nome --- */
    if (unidade.fotos && unidade.fotos.length) {
      var galeria = el("div", "unidade__galeria");
      /* Uma foto ocupa a faixa toda; duas ou mais dividem. */
      galeria.setAttribute("data-quantas", String(unidade.fotos.length));

      unidade.fotos.forEach(function (foto) {
        var quadro = el("div", "unidade__quadro");
        var img = el("img");
        img.src = foto.src;
        img.alt = i18n.campo(foto.alt);
        img.loading = "lazy";
        if (foto.foco) img.style.objectPosition = foto.foco;
        /* Sem a foto o quadro vazio não fica ocupando espaço. */
        img.addEventListener("error", function () {
          quadro.remove();
        });
        quadro.appendChild(img);
        galeria.appendChild(quadro);
      });

      card.appendChild(galeria);
    }

    card.appendChild(
      el("p", "t-body unidade__desc", i18n.campo(unidade.descricao))
    );

    /* --- mapa --- */
    if (unidade.mapaEmbed) {
      var caixaMapa = el("div", "unidade__mapa");
      var iframe = document.createElement("iframe");
      iframe.src = unidade.mapaEmbed;
      iframe.title =
        i18n.t("unidades.mapaDe") + " " + i18n.campo(unidade.nome);
      iframe.loading = "lazy";
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      iframe.setAttribute("allowfullscreen", "");
      caixaMapa.appendChild(iframe);
      card.appendChild(caixaMapa);
    }

    var corpo = el("div", "unidade__corpo");

    /* --- endereço --- */
    var endereco = el("p", "unidade__endereco");
    endereco.appendChild(icone("pin", "ico--sm"));
    endereco.appendChild(el("span", null, unidade.endereco));
    corpo.appendChild(endereco);

    /* --- o que tem nesta unidade --- */
    var tags = el("ul", "unidade__tags");
    (unidade.destaques[i18n.atual()] || unidade.destaques.pt).forEach(
      function (d) {
        tags.appendChild(el("li", "tag", d));
      }
    );
    corpo.appendChild(tags);

    /* --- horários da semana --- */
    var bloco = el("div", "unidade__horarios");
    bloco.appendChild(el("h3", null, i18n.t("unidades.horarios")));
    var dl = el("dl");
    var hoje = new Date().getDay();
    /* o CSS usa a contagem para equilibrar a grade */
    dl.setAttribute("data-blocos", String(agruparSemana(unidade.horarios).length));

    /* Cada faixa vira um bloco próprio, e eles ficam lado a lado.
       O <div> agrupando dt+dd dentro de <dl> é HTML válido e é o
       que deixa o par virar uma célula só do grid. */
    agruparSemana(unidade.horarios).forEach(function (grupo) {
      var ehHoje = grupo.dias.indexOf(hoje) !== -1;
      var caixa = el("div", "horario" + (ehHoje ? " hoje" : ""));
      caixa.appendChild(el("dt", null, rotuloDoGrupo(grupo.dias)));
      caixa.appendChild(el("dd", null, faixaDoGrupo(grupo)));
      dl.appendChild(caixa);
    });
    bloco.appendChild(dl);

    if (unidade.feriado) {
      bloco.appendChild(
        el("p", "unidade__feriado", i18n.campo(unidade.feriado))
      );
    }

    corpo.appendChild(bloco);

    /* --- contatos --- */
    var acoes = el("div", "unidade__acoes");

    if (unidade.mapaLink) {
      var comoChegar = el("a", "btn btn--sm btn--burgundy");
      comoChegar.href = unidade.mapaLink;
      comoChegar.target = "_blank";
      comoChegar.rel = "noopener noreferrer";
      comoChegar.appendChild(icone("pin", "ico--sm"));
      comoChegar.appendChild(
        el("span", null, i18n.t("unidades.comoChegar"))
      );
      acoes.appendChild(comoChegar);
    }

    if (unidade.telefone) {
      var ligar = el("a", "btn btn--sm btn--outline");
      ligar.href = "tel:" + unidade.telefone;
      ligar.appendChild(icone("phone", "ico--sm"));
      ligar.appendChild(el("span", null, i18n.t("unidades.ligar")));
      acoes.appendChild(ligar);
    }

    corpo.appendChild(acoes);
    card.appendChild(corpo);
    return card;
  }

  /* Card de fecho: junta os telefones das duas casas para quem
     rolou até o fim ainda decidindo onde reservar. */
  function montarReserva() {
    var caixa = document.querySelector("[data-reserva]");
    if (!caixa || !STADIUM.unidades) return;

    caixa.innerHTML = "";

    var topo = el("div", "reserva__topo");
    topo.appendChild(icone("phone", "ico--lg"));
    var texto = el("div");
    texto.appendChild(el("h2", "t-h3", i18n.t("unidades.reservaTitulo")));
    texto.appendChild(
      el("p", "t-small", i18n.t("unidades.reservaLead"))
    );
    topo.appendChild(texto);
    caixa.appendChild(topo);

    var linhas = el("ul", "reserva__linhas");
    STADIUM.unidades.forEach(function (unidade) {
      if (!unidade.telefone) return;
      var li = el("li");
      var a = el("a", "reserva__item");
      a.href = "tel:" + unidade.telefone;
      a.appendChild(el("span", "reserva__unidade", i18n.campo(unidade.nome)));
      a.appendChild(
        el(
          "span",
          "reserva__fone",
          unidade.telefoneExibicao || unidade.telefone
        )
      );
      li.appendChild(a);
      linhas.appendChild(li);
    });
    caixa.appendChild(linhas);
  }

  function desenhar() {
    var lista = document.querySelector("[data-unidades]");
    if (!lista || !STADIUM.unidades) return;

    lista.innerHTML = "";
    STADIUM.unidades.forEach(function (unidade) {
      lista.appendChild(montarUnidade(unidade));
    });

    montarReserva();
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!i18n) return;
    desenhar();
    document.addEventListener("stadium:idioma", desenhar);
    /* O estado de "aberto agora" envelhece: refaz de minuto em minuto. */
    window.setInterval(desenhar, 60000);
  });
})(window, document);
