/* =========================================================
   STADIUM STEAKHOUSE — PAINEL
   =========================================================

   Página interna. Mostra o que foi medido no cardápio e na
   home, por período.

   SEGURANÇA — o que faz isto ser seguro de verdade

   A conferência da senha NÃO acontece aqui. Este arquivo manda
   e-mail e senha para o Supabase e recebe um crachá temporário.
   Se a checagem fosse feita neste código, qualquer pessoa
   abriria o inspecionar, leria a senha e entraria — é por isso
   que "senha no JavaScript" não é segurança, é enfeite.

   E entrar não é o que protege o dado. Quem protege são as
   regras dentro do banco: mesmo com crachá válido, o servidor
   só devolve as linhas do restaurante ao qual aquele usuário
   tem acesso. Se alguém adulterar este arquivo para pedir o
   dado de outro restaurante, volta vazio. Isso foi testado.

   O crachá fica em sessionStorage, não em localStorage: morre
   quando a aba fecha. Num computador de balcão, é a diferença
   entre a sessão acabar e ficar aberta para o próximo que
   sentar.
   ========================================================= */

(function (window, document) {
  "use strict";

  var BANCO = "https://huhkbfbaqfuohwbqjzah.supabase.co";
  var CHAVE_PUBLICA = "sb_publishable_ohq_5GrfFdUywXCLpLNJMA_NATPEYBD";
  var GUARDA = "stadium.painel.cracha";

  /* A ordem da página, não a ordem de quem ficou mais tempo.
     Funil só faz sentido lido de cima para baixo: o que interessa
     é ver ONDE a queda acontece.

     A da home é curta e mora aqui; a do cardápio vem de
     cardapio.js, que é quem manda nela. */
  var ORDEM_HOME = ["banners", "destaque", "delivery", "equipe", "unidades"];

  /* A das unidades é curta e fixa: abertura, as duas casas, e o
     bloco de telefones no fim. */
  var ORDEM_UNIDADES = ["intro", "unidade-barra", "unidade-recreio", "reserva"];

  function ordemCardapio() {
    return (window.STADIUM && window.STADIUM.ordemCategorias) || null;
  }

  /* ---------- RÓTULOS ---------- */
  /* A origem chega como marcador curto e cru — é o que foi
     escrito no link ou o domínio de quem mandou. Aqui vira frase
     de gente. O que não estiver na lista aparece como veio: se
     começar a chegar visita de um portal de bairro, o endereço
     dele é justamente a informação. */
  var ORIGENS = {
    "mesa-barra": "QR da mesa · Barra",
    "mesa-recreio": "QR da mesa · Recreio",
    mesa: "QR da mesa",
    balcao: "QR do balcão",
    instagram: "Instagram",
    facebook: "Facebook",
    whatsapp: "WhatsApp",
    google: "Google",
    bing: "Bing",
    tiktok: "TikTok",
    youtube: "YouTube",
    linkedin: "LinkedIn",
    x: "X (Twitter)",
    ifood: "iFood",
    direto: "Direto ou digitado",
    "sem registro": "Antes desta medição"
  };

  /* Mesma ideia, para as seções das páginas.
     O nome que veio do banco é o texto que estava na tela na
     hora da medição, e por isso não serve de rótulo: quem navega
     em inglês grava "Starters", e a seção de banners grava o
     título da promoção da vez — que muda toda semana.

     A chave, essa nunca muda. Então o rótulo sai daqui, e o nome
     gravado vira só reserva para chave que este mapa não
     conhece (as unidades, cujo nome é próprio e vem dos dados). */
  var ROTULOS = {
    banners: "Banners do topo",
    destaque: "Craque da semana",
    delivery: "Delivery",
    equipe: "Nosso time",
    unidades: "Nossas unidades",
    intro: "Abertura da página",
    reserva: "Reserve a sua mesa"
  };

  function rotulo(chave, gravado) {
    var doCardapio = window.STADIUM && window.STADIUM.rotuloCategorias;
    if (doCardapio && doCardapio[chave]) return doCardapio[chave];
    return ROTULOS[chave] || gravado || chave;
  }

  var cracha = null;
  var restaurante = null;
  var periodo = null;

  function $(s) {
    return document.querySelector(s);
  }

  function cabecalhos(comCracha) {
    return {
      "Content-Type": "application/json",
      apikey: CHAVE_PUBLICA,
      Authorization: "Bearer " + (comCracha && cracha ? cracha : CHAVE_PUBLICA)
    };
  }

  function pedir(rota, corpo) {
    return window
      .fetch(BANCO + rota, {
        method: corpo ? "POST" : "GET",
        headers: cabecalhos(true),
        body: corpo ? JSON.stringify(corpo) : undefined
      })
      .then(function (r) {
        if (r.status === 401) throw new Error("sessao");
        return r.json();
      });
  }

  /* ---------- ENTRADA ---------- */

  function entrar(email, senha) {
    return window
      .fetch(BANCO + "/auth/v1/token?grant_type=password", {
        method: "POST",
        headers: cabecalhos(false),
        body: JSON.stringify({ email: email, password: senha })
      })
      .then(function (r) {
        return r.json().then(function (d) {
          if (!r.ok) throw new Error("credenciais");
          return d;
        });
      });
  }

  function guardarCracha(d) {
    cracha = d.access_token;
    try {
      window.sessionStorage.setItem(
        GUARDA,
        JSON.stringify({ t: cracha, email: d.user && d.user.email })
      );
    } catch (e) {}
  }

  function lerCracha() {
    try {
      var d = JSON.parse(window.sessionStorage.getItem(GUARDA) || "null");
      if (d && d.t) {
        cracha = d.t;
        return d;
      }
    } catch (e) {}
    return null;
  }

  function sair() {
    cracha = null;
    try {
      window.sessionStorage.removeItem(GUARDA);
    } catch (e) {}
    window.location.reload();
  }

  /* ---------- FORMATO ---------- */

  function duracao(ms) {
    var s = Math.round((ms || 0) / 1000);
    /* Meio segundo arredonda para zero, e "0s" ao lado de uma
       porcentagem parece medição quebrada. Houve tempo ali —
       só foi curto demais para caber na conta. */
    if (ms > 0 && s === 0) return "<1s";
    if (s < 90) return s + "s";
    var m = Math.floor(s / 60);
    return m + "min " + (s - m * 60) + "s";
  }

  function numero(n) {
    return Number(n || 0).toLocaleString("pt-BR");
  }

  /* ---------- DESENHO ---------- */

  function cartao(rotulo, valor, apoio) {
    return (
      '<div class="painel-cartao"><p class="painel-cartao__rotulo">' + rotulo +
      '</p><p class="painel-cartao__valor">' + valor + "</p>" +
      (apoio ? '<p class="painel-cartao__apoio">' + apoio + "</p>" : "") +
      "</div>"
    );
  }

  /* O total sai da mesma lista que monta o cardápio. Assim, o
     dia em que um prato entrar ou sair, o denominador acompanha
     sozinho — número escrito à mão aqui envelheceria calado. */
  function noCardapio() {
    var lista = (window.STADIUM && window.STADIUM.cardapio) || null;
    return lista ? "de " + lista.length + " no cardápio" : "";
  }

  function fatia(parte, total) {
    return total ? Math.round(parte * 100 / total) + "% das visitas" : "";
  }

  function mostrarGeral(g) {
    var visitas = Number(g.visitas || 0);
    $("[data-geral]").innerHTML =
      cartao("Visitas", numero(visitas), "no período") +
      cartao("Tempo médio por visita", duracao(g.tempo_medio_ms), "sem contar pausas") +
      cartao("Tempo total de atenção", duracao(g.tempo_total_ms)) +
      cartao("Cliques em detalhes", numero(g.cliques)) +
      /* Os três não somam 100%, e não deveriam: uma visita pode
         passar pelas três páginas. Cada um responde "de quem
         entrou no site, quantos chegaram AQUI". */
      cartao("Abriram a home", numero(g.visitas_home), fatia(g.visitas_home, visitas)) +
      cartao("Abriram o cardápio", numero(g.visitas_cardapio), fatia(g.visitas_cardapio, visitas)) +
      cartao("Abriram as unidades", numero(g.visitas_unidades), fatia(g.visitas_unidades, visitas)) +
      cartao("Pratos que receberam atenção", numero(g.pratos_olhados), noCardapio());
  }

  function tabela(seletor, linhas, coluna, limite) {
    var corpo = $(seletor);
    if (!linhas || !linhas.length) {
      corpo.innerHTML = '<tr><td class="painel-vazio">nada no período</td></tr>';
      return;
    }
    corpo.innerHTML = linhas
      .slice(0, limite || 15)
      .map(function (l, i) {
        var v = coluna === "cliques" ? numero(l.cliques) + "x" : duracao(l.tempo_ms);
        return (
          "<tr><td class='painel-pos'>" + (i + 1) + "</td><td>" +
          (l.nome || l.chave) + "</td><td class='painel-num'>" + v + "</td></tr>"
        );
      })
      .join("");
  }

  /* Barra proporcional: a queda entre um bloco e o seguinte é o
     que se quer enxergar, e número solto não mostra queda. */
  function mostrarFunil(seletor, linhas, ordem) {
    var corpo = $(seletor);
    if (!linhas || !linhas.length) {
      corpo.innerHTML = '<tr><td class="painel-vazio">nada no período</td></tr>';
      return;
    }
    var lista = linhas.slice();
    if (ordem) {
      lista.sort(function (a, b) {
        var ia = ordem.indexOf(a.chave);
        var ib = ordem.indexOf(b.chave);
        return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
      });
    }
    corpo.innerHTML = lista
      .map(function (l) {
        var pct = Number(l.porcentagem || 0);
        return (
          /* A barra é pintada ATRÁS do nome, e não numa coluna
             própria. Coluna separada obrigava a espremer o nome:
             num celular de 375px "Sem sair de casa" quebrava em
             três linhas e a tabela virava sopa. Assim a barra
             ocupa espaço zero e fica onde o olho já está. */
          '<tr><td class="painel-barra" style="--pct:' + pct + '%">' +
          rotulo(l.chave, l.nome) + "</td>" +
          "<td class='painel-num'>" + pct.toFixed(0) + "%</td>" +
          /* Traço, e não "0s": zero aqui não é tempo medido, é
             ninguém tendo parado. Escrito como número, pareceria
             falha de medição. */
          "<td class='painel-num painel-sec'>" +
          (l.tempo_medio_ms > 0 ? duracao(l.tempo_medio_ms) : "—") +
          "</td></tr>"
        );
      })
      .join("");
  }

  /* Mesma barra de fundo do funil, mas aqui o que se compara é
     quanta gente veio de cada porta. */
  function mostrarOrigens(linhas) {
    var corpo = $("[data-t-origem]");
    if (!linhas || !linhas.length) {
      corpo.innerHTML = '<tr><td class="painel-vazio">nada no período</td></tr>';
      return;
    }
    corpo.innerHTML = linhas
      .map(function (l) {
        var pct = Number(l.porcentagem || 0);
        return (
          '<tr><td class="painel-barra" style="--pct:' + pct + '%">' +
          (ORIGENS[l.origem] || l.origem) + "</td>" +
          "<td class='painel-num'>" + numero(l.sessoes) + "</td>" +
          "<td class='painel-num painel-sec'>" +
          (l.tempo_medio_ms > 0 ? duracao(l.tempo_medio_ms) : "—") +
          "</td></tr>"
        );
      })
      .join("");
  }

  /* A chave vem como "ligar-barra": ação e casa juntas, porque
     querer ligar para a Barra e para o Recreio são perguntas
     diferentes. Aqui volta a virar frase. */
  var ACOES = { ligar: "Ligar para", chegar: "Traçar rota até" };
  var CASAS = { barra: "a Barra", recreio: "o Recreio" };

  function rotuloAcao(chave, gravado) {
    var p = String(chave).split("-");
    var acao = ACOES[p[0]];
    if (!acao) return gravado || chave;
    var casa = p.length > 1 ? CASAS[p[1]] || p[1] : "";
    return casa ? acao + " " + casa : acao;
  }

  function mostrarAcoes(linhas) {
    var corpo = $("[data-t-acoes]");
    if (!linhas || !linhas.length) {
      corpo.innerHTML = '<tr><td class="painel-vazio">ninguém ainda</td></tr>';
      return;
    }
    corpo.innerHTML = linhas
      .map(function (l) {
        return (
          "<tr><td>" + rotuloAcao(l.chave, l.nome) + "</td>" +
          "<td class='painel-num'>" + numero(l.vezes) + "x</td>" +
          "<td class='painel-num painel-sec'>" + numero(l.sessoes) + "</td></tr>"
        );
      })
      .join("");
  }

  /* ---------- CARGA ---------- */

  function carregar(de, ate) {
    periodo = { de: de, ate: ate };
    $("[data-resumo]").textContent = "carregando…";

    var args = {
      p_restaurante: restaurante.id,
      p_de: de.toISOString(),
      p_ate: ate.toISOString()
    };

    Promise.all([
      pedir("/rest/v1/rpc/visao_geral", args),
      pedir("/rest/v1/rpc/resumo", args),
      pedir("/rest/v1/rpc/funil", Object.assign({}, args, { p_pagina: "index.html" })),
      pedir("/rest/v1/rpc/funil", Object.assign({}, args, { p_pagina: "cardapio.html" })),
      pedir("/rest/v1/rpc/funil", Object.assign({}, args, { p_pagina: "unidades.html" })),
      pedir("/rest/v1/rpc/origens", args),
      pedir("/rest/v1/rpc/acoes", args)
    ])
      .then(function (r) {
        var geral = (r[0] && r[0][0]) || {};
        var resumo = r[1] || [];
        mostrarGeral(geral);

        var porTipo = { prato: [], categoria: [], secao: [], clique: [] };
        resumo.forEach(function (l) {
          if (porTipo[l.tipo]) porTipo[l.tipo].push(l);
        });
        porTipo.clique.sort(function (a, b) {
          return b.cliques - a.cliques;
        });

        tabela("[data-t-prato]", porTipo.prato, "tempo", 20);
        tabela("[data-t-clique]", porTipo.clique, "cliques", 15);
        mostrarFunil("[data-t-home]", r[2], ORDEM_HOME);
        mostrarFunil("[data-t-categoria]", r[3], ordemCardapio());
        mostrarFunil("[data-t-unidades]", r[4], ORDEM_UNIDADES);
        mostrarOrigens(r[5]);
        mostrarAcoes(r[6]);

        $("[data-resumo]").textContent =
          de.toLocaleDateString("pt-BR") + " a " +
          new Date(ate.getTime() - 1).toLocaleDateString("pt-BR");
      })
      ["catch"](function (e) {
        if (e.message === "sessao") {
          $("[data-resumo]").textContent = "sessão expirada — entre de novo";
          setTimeout(sair, 1500);
          return;
        }
        $("[data-resumo]").textContent = "não consegui carregar";
      });
  }

  /* ---------- PERÍODO ---------- */

  function meiaNoite(d) {
    var x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  function ultimosDias(n) {
    var ate = meiaNoite(new Date());
    ate.setDate(ate.getDate() + 1); /* hoje entra inteiro */
    var de = new Date(ate);
    de.setDate(de.getDate() - n);
    return { de: de, ate: ate };
  }

  function marcarChip(alvo) {
    document.querySelectorAll("[data-dias]").forEach(function (b) {
      b.classList.toggle("ativo", b === alvo);
    });
  }

  function ligarPeriodo() {
    document.querySelectorAll("[data-dias]").forEach(function (b) {
      b.addEventListener("click", function () {
        var p = ultimosDias(Number(b.getAttribute("data-dias")));
        marcarChip(b);
        carregar(p.de, p.ate);
      });
    });

    $("[data-aplicar]").addEventListener("click", function () {
      var de = $("[data-de]").value;
      var ate = $("[data-ate]").value;
      if (!de || !ate) return;
      marcarChip(null);
      var fim = new Date(ate + "T00:00:00");
      fim.setDate(fim.getDate() + 1); /* o dia final entra inteiro */
      carregar(new Date(de + "T00:00:00"), fim);
    });

    $("[data-atualizar]").addEventListener("click", function () {
      if (periodo) carregar(periodo.de, periodo.ate);
    });
  }

  /* ---------- PARTIDA ---------- */

  function abrirPainel(email) {
    pedir("/rest/v1/restaurante?select=id,nome,slug")
      .then(function (lista) {
        if (!lista.length) {
          $("[data-erro]").textContent =
            "Este usuário não tem acesso a nenhum restaurante.";
          $("[data-erro]").hidden = false;
          return;
        }
        restaurante = lista[0];

        $("[data-entrada]").hidden = true;
        $("[data-dados]").hidden = false;
        $("[data-sair]").hidden = false;
        $("[data-quem]").hidden = false;
        $("[data-quem]").textContent = email || "";
        $("[data-restaurante]").textContent = restaurante.nome;

        ligarPeriodo();
        var p = ultimosDias(7);
        marcarChip(document.querySelector('[data-dias="7"]'));
        carregar(p.de, p.ate);
      })
      ["catch"](sair);
  }

  document.addEventListener("DOMContentLoaded", function () {
    $("[data-sair]").addEventListener("click", sair);

    $("[data-form]").addEventListener("submit", function (evento) {
      evento.preventDefault();
      var botao = $("[data-entrar]");
      var erro = $("[data-erro]");
      erro.hidden = true;
      botao.disabled = true;
      botao.textContent = "entrando…";

      entrar(this.email.value.trim(), this.senha.value)
        .then(function (d) {
          guardarCracha(d);
          abrirPainel(d.user && d.user.email);
        })
        ["catch"](function () {
          /* Mensagem genérica de propósito: dizer "e-mail não
             existe" entregaria quais contas existem. */
          erro.textContent = "E-mail ou senha incorretos.";
          erro.hidden = false;
        })
        .then(function () {
          botao.disabled = false;
          botao.textContent = "Entrar";
        });
    });

    var guardado = lerCracha();
    if (guardado) abrirPainel(guardado.email);
  });
})(window, document);
