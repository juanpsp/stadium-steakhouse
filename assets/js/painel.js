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
  /* null nos dois = dia inteiro. Guardado aqui porque toda
     consulta carrega o recorte junto. */
  var horaDe = null;
  var horaAte = null;
  var pratoSerie = null;

  /* Cada carga leva um número. Resposta que chega depois de uma
     carga mais nova é descartada.

     Sem isto, clicar em "30 dias" enquanto os 7 ainda estão no ar
     deixa as duas respostas em voo, e quem pinta a tela é a que
     chegar por último — o chip mostra 30 e o gráfico mostra 7.
     Foi o que apareceu no uso real. */
  var carga = 0;

  var DIAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  /* O Postgres devolve 0 para domingo. Semana de restaurante se
     lê de segunda a domingo, então a ordem de exibição é outra. */
  var ORDEM_DIAS = [1, 2, 3, 4, 5, 6, 0];

  function $(s) {
    return document.querySelector(s);
  }

  /* ---------- ESCAPE ----------
     Obrigatório em TODO texto que vira HTML aqui, e não só no que
     parece perigoso.

     O termo de busca é escrito por qualquer visitante anônimo do
     cardápio e fica guardado no banco. Sem escapar, alguém digita
     uma tag na busca e ela EXECUTA quando a equipe abre o painel
     — dentro da sessão autenticada, com acesso ao crachá que está
     no sessionStorage. Roubo de acesso completo, disparado por um
     campo de busca de cardápio. Testado: executa mesmo.

     Os outros campos hoje vêm de dados nossos, mas são escapados
     igual: a regra "escapa tudo" sobrevive a quem mexer nisto
     depois; "escapa o que é perigoso" depende de lembrar qual é. */
  function escapar(t) {
    return String(t === null || t === undefined ? "" : t)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
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
      '<div class="painel-cartao"><p class="painel-cartao__rotulo">' + escapar(rotulo) +
      '</p><p class="painel-cartao__valor">' + escapar(valor) + "</p>" +
      (apoio ? '<p class="painel-cartao__apoio">' + escapar(apoio) + "</p>" : "") +
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
          escapar(l.nome || l.chave) + "</td><td class='painel-num'>" + v + "</td></tr>"
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
          escapar(rotulo(l.chave, l.nome)) + "</td>" +
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
          escapar(ORIGENS[l.origem] || l.origem) + "</td>" +
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
          "<tr><td>" + escapar(rotuloAcao(l.chave, l.nome)) + "</td>" +
          "<td class='painel-num'>" + numero(l.vezes) + "x</td>" +
          "<td class='painel-num painel-sec'>" + numero(l.sessoes) + "</td></tr>"
        );
      })
      .join("");
  }

  /* Zero resultados não é "achou 0": é a pessoa dizendo que
     procurou algo que este cardápio não entregou. Escrito como
     número, some no meio da coluna; escrito como palavra, salta. */
  function mostrarBuscas(linhas) {
    var corpo = $("[data-t-buscas]");
    if (!linhas || !linhas.length) {
      corpo.innerHTML = '<tr><td class="painel-vazio">ninguém usou a busca</td></tr>';
      return;
    }
    corpo.innerHTML = linhas
      .slice(0, 20)
      .map(function (l) {
        var vazia = Number(l.resultados) === 0;
        return (
          "<tr" + (vazia ? ' class="painel-alerta"' : "") + "><td>" +
          escapar(l.termo) + "</td>" +
          "<td class='painel-num'>" + numero(l.vezes) + "x</td>" +
          "<td class='painel-num painel-sec'>" +
          (vazia ? "nada" : numero(l.resultados) + " pratos") +
          "</td></tr>"
        );
      })
      .join("");
  }

  /* Só as horas com movimento. Mostrar as 24 encheria metade da
     tela de zero para dizer que de madrugada não tem ninguém. */
  function mostrarDistribuicao(seletor, linhas, rotuloDe, ordem) {
    var corpo = $(seletor);
    if (!linhas || !linhas.length) {
      corpo.innerHTML = '<tr><td class="painel-vazio">nada no período</td></tr>';
      return;
    }
    var porChave = {};
    var maior = 0;
    linhas.forEach(function (l) {
      porChave[l.chave] = Number(l.visitas || 0);
      if (porChave[l.chave] > maior) maior = porChave[l.chave];
    });

    var chaves = ordem
      ? ordem
      : Object.keys(porChave)
          .map(Number)
          .sort(function (a, b) { return a - b; });

    corpo.innerHTML = chaves
      .map(function (c) {
        var v = porChave[c] || 0;
        /* Barra proporcional ao MAIOR, não ao total: o que se quer
           ver aqui é qual horário ganha dos outros. */
        var pct = maior ? Math.round(v * 100 / maior) : 0;
        return (
          '<tr' + (v ? "" : ' class="painel-apagado"') + '>' +
          '<td class="painel-barra" style="--pct:' + pct + '%">' +
          escapar(rotuloDe(c)) + "</td>" +
          "<td class='painel-num'>" + numero(v) + "</td></tr>"
        );
      })
      .join("");
  }

  /* Só "22h". A faixa inteira ("22h às 22h59") é mais precisa e
     come metade da linha para dizer o óbvio numa lista de horas. */
  function rotuloHora(h) {
    return h + "h";
  }

  /* ---------- ATENÇÃO DENTRO DA CATEGORIA ----------
     A primeira versão disto cruzava faixa de preço com atenção no
     cardápio inteiro, e não sobrevivia a este cardápio: 17
     hambúrgueres custam exatamente R$ 59,90, as cinco massas
     custam exatamente R$ 79,90 — sem variação de preço não há o
     que explicar. E onde há variação (Aquecimento, de R$ 10,50 a
     R$ 219,90) ela vem de a categoria misturar pão de alho com
     prato de dividir, não de política de preço.

     Comparar vizinhos resolve o que a faixa de preço não
     resolvia. Pratos da mesma categoria estão lado a lado na
     página, disputam o mesmo momento do pedido e têm a mesma
     proposta — então a posição para de ser desculpa e o que
     sobra é o prato: foto, nome, descrição, ordem dentro da
     lista.

     O preço fica como coluna. Se os ignorados forem os caros,
     quem conclui é quem conhece a casa; a tela não afirma isso. */

  /* Bebida ninguém precisa ser convencido a pedir: quem senta já
     sabe se quer chope, suco ou refrigerante. Medir esforço de
     convencimento onde não há convencimento a fazer só sujaria a
     leitura das que importam. */
  var FORA_DA_COMPARACAO = ["bebidas", "drinks"];

  var categoriaAtencao = null;

  function paraNumero(t) {
    if (!t) return null;
    var n = parseFloat(String(t).replace(/[^0-9,]/g, "").replace(",", "."));
    return isNaN(n) ? null : n;
  }

  /* Prato com vários tamanhos entra pelo MENOR: é o preço que a
     pessoa vê primeiro e o que forma a impressão de caro. */
  function precoDoPrato(p) {
    if (p.preco) return paraNumero(p.preco);
    if (p.precos && p.precos.length) {
      var menor = null;
      p.precos.forEach(function (o) {
        var n = paraNumero(o.valor);
        if (n !== null && (menor === null || n < menor)) menor = n;
      });
      return menor;
    }
    return null;
  }

  function dinheiro(v) {
    return v === null ? "—" : "R$ " + v.toFixed(2).replace(".", ",");
  }

  function montarSeletorCategoria() {
    var sel = $("[data-categoria-atencao]");
    var ordem = (window.STADIUM && window.STADIUM.ordemCategorias) || [];
    var rot = (window.STADIUM && window.STADIUM.rotuloCategorias) || {};
    if (!ordem.length) return;

    var html = "";
    ordem.forEach(function (chave) {
      var id = chave.replace(/^container-/, "");
      if (FORA_DA_COMPARACAO.indexOf(id) !== -1) return;
      html += '<option value="' + escapar(id) + '">' +
              escapar(rot[chave] || id) + "</option>";
      if (!categoriaAtencao) categoriaAtencao = id;
    });
    sel.innerHTML = html;
    sel.value = categoriaAtencao;

    sel.addEventListener("change", function () {
      categoriaAtencao = sel.value;
      if (ultimoPorPrato) mostrarCategoria(ultimoPorPrato);
    });
  }

  /* Guardado para o seletor poder redesenhar sem ir ao servidor:
     a comparação é toda entre dados que já estão na tela. */
  var ultimoPorPrato = null;

  function mostrarCategoria(porPrato) {
    ultimoPorPrato = porPrato;
    var corpo = $("[data-t-categoria-pratos]");
    var lista = (window.STADIUM && window.STADIUM.cardapio) || [];
    if (!lista.length || !categoriaAtencao) {
      corpo.innerHTML = '<tr><td class="painel-vazio">cardápio não carregado</td></tr>';
      return;
    }

    var doGrupo = lista.filter(function (p) {
      return p.categoria === categoriaAtencao;
    });
    if (!doGrupo.length) {
      corpo.innerHTML = '<tr><td class="painel-vazio">categoria vazia</td></tr>';
      return;
    }

    var linhas = doGrupo.map(function (p) {
      return {
        nome: p.nome,
        preco: precoDoPrato(p),
        ms: porPrato[String(p.id)] || 0
      };
    });

    /* A média é entre os pratos que RECEBERAM atenção, não entre
       todos. A primeira versão dividia por todos, e com 14 de 20
       pratos zerados a média despencava e o primeiro colocado
       aparecia com "+739%" — número que não descreve nada, só a
       falta de dado. Visto na tela, não no código.

       Prato zerado sai da conta e ganha rótulo próprio. Ele não
       perdeu a comparação: ele não entrou nela. São problemas
       diferentes — um é "não interessou", o outro é "ninguém
       chegou lá" — e a contagem de quantos ficaram fora vai
       escrita embaixo da tabela. */
    var soma = 0;
    var vistos = 0;
    linhas.forEach(function (l) {
      if (l.ms > 0) { soma += l.ms; vistos += 1; }
    });
    var media = vistos ? soma / vistos : 0;
    var semAtencao = linhas.length - vistos;

    linhas.sort(function (a, b) { return b.ms - a.ms; });

    corpo.innerHTML = linhas
      .map(function (l) {
        /* "nada" na coluna de tempo já diz que o prato não
           apareceu; repetir na coluna ao lado é dizer duas vezes.
           Quantos ficaram de fora vai na nota embaixo. */
        var vs = "—";
        var classe = "";
        if (l.ms > 0 && media > 0) {
          var pct = Math.round(((l.ms - media) / media) * 100);
          vs = (pct >= 0 ? "+" : "") + pct + "%";
          /* Só o que está bem abaixo dos vizinhos ganha destaque.
             Marcar tudo abaixo da média marcaria metade da lista
             por definição e não apontaria nada. */
          if (pct <= -50) classe = ' class="painel-alerta"';
        }
        return (
          "<tr" + classe + "><td>" + escapar(l.nome) + "</td>" +
          "<td class='painel-num'>" + escapar(dinheiro(l.preco)) + "</td>" +
          "<td class='painel-num'>" + (l.ms ? duracao(l.ms) : "nada") + "</td>" +
          "<td class='painel-num painel-sec'>" + vs + "</td></tr>"
        );
      })
      .join("");

    $("[data-categoria-nota]").textContent =
      media > 0
        ? "média entre os " + vistos + " pratos que apareceram: " +
          duracao(Math.round(media)) +
          (semAtencao
            ? " · " + semAtencao + " não apareceram para ninguém"
            : "")
        : "nenhum prato desta categoria recebeu atenção no período";
  }

  /* ---------- UM PRATO NO TEMPO ---------- */

  /* A lista sai do próprio cardápio, e não do que já tem medição:
     querer olhar um prato JUSTAMENTE porque ele não aparece em
     lugar nenhum é uma pergunta legítima, e uma lista só com quem
     tem dado não deixaria fazer. */
  function montarSeletor() {
    var sel = $("[data-prato-serie]");
    var lista = (window.STADIUM && window.STADIUM.cardapio) || [];
    var rot = (window.STADIUM && window.STADIUM.rotuloCategorias) || {};
    if (!lista.length) return;

    var porCat = {};
    var ordem = [];
    lista.forEach(function (p) {
      if (!porCat[p.categoria]) {
        porCat[p.categoria] = [];
        ordem.push(p.categoria);
      }
      porCat[p.categoria].push(p);
    });

    var html = "";
    ordem.forEach(function (cat) {
      html += '<optgroup label="' + escapar(rot["container-" + cat] || cat) + '">';
      porCat[cat].forEach(function (p) {
        html += '<option value="' + escapar(p.id) + '">' + escapar(p.nome) + "</option>";
      });
      html += "</optgroup>";
    });
    sel.innerHTML = html;

    pratoSerie = String(lista[0].id);
    sel.value = pratoSerie;
    sel.addEventListener("change", function () {
      pratoSerie = sel.value;
      if (periodo) carregarSerie();
    });
  }

  /* Barras em HTML, não em SVG. Um gráfico em SVG precisa de
     viewBox fixo, e aí o texto encolhe junto com a tela: num
     celular os rótulos ficariam ilegíveis. Em HTML a barra é
     porcentagem de altura e o texto continua texto. */
  function desenharSerie(atual, anterior) {
    var caixa = $("[data-serie-grafico]");
    var resumo = $("[data-serie-resumo]");

    var total = 0;
    var maior = 0;
    atual.forEach(function (d) {
      var v = Number(d.tempo_ms || 0);
      total += v;
      if (v > maior) maior = v;
    });

    var antes = 0;
    (anterior || []).forEach(function (d) {
      antes += Number(d.tempo_ms || 0);
    });

    if (!total && !antes) {
      resumo.textContent = "sem atenção registrada neste período";
      caixa.innerHTML = "";
      return;
    }

    /* Variação sem cor de status de propósito: mais atenção não é
       automaticamente bom nem ruim. Um prato pode subir porque a
       foto melhorou ou porque o preço assustou e a pessoa ficou
       lendo. Quem interpreta é quem conhece a casa. */
    var texto = duracao(total) + " no período";
    if (antes > 0) {
      var var100 = Math.round(((total - antes) / antes) * 100);
      texto +=
        " · " + (var100 >= 0 ? "+" : "") + var100 + "% vs o período anterior";
    } else if (total > 0) {
      texto += " · não tinha nada no período anterior";
    }
    resumo.textContent = texto;

    var DIAS_CURTOS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

    /* A folga entre barras não pode ser fixa. Em 90 dias, 89
       folgas de 3px comem a largura inteira e as barras ficam com
       ZERO de espessura — o gráfico some. Medido, não suposto. */
    var folga = atual.length > 45 ? 1 : atual.length > 20 ? 2 : 3;
    var cabeRotulo = atual.length <= 20;

    caixa.innerHTML =
      '<div class="painel-grafico__barras" style="--folga:' + folga + 'px">' +
      atual
        .map(function (d) {
          var v = Number(d.tempo_ms || 0);
          var alt = maior ? Math.round((v / maior) * 100) : 0;
          /* Data em UTC de propósito: "2026-08-29" já é o dia do
             Rio, calculado no banco. Ler como local deslocaria um
             dia para trás. */
          var data = new Date(d.dia + "T12:00:00Z");
          var titulo =
            DIAS_CURTOS[data.getUTCDay()] + " " +
            String(data.getUTCDate()).padStart(2, "0") + "/" +
            String(data.getUTCMonth() + 1).padStart(2, "0") +
            " · " + (v ? duracao(v) : "nada") +
            (d.pessoas ? " · " + numero(d.pessoas) + " pessoa(s)" : "");

          /* Rótulo só no maior, e só quando a barra é larga o
             bastante para segurá-lo. Em 90 dias a coluna tem menos
             de 2px: o texto transborda por cima das vizinhas e
             atravessa o pico. Nesse caso o total já está no
             título e o detalhe fica na dica do mouse. */
          /* O rótulo sai do fluxo e é ancorado no TOPO da barra
             (mesma altura em "bottom"). Dentro do fluxo ele
             ocupava ~20px da coluna e encurtava justamente a
             barra que estava marcando: a maior desenhava MENOR
             que as vizinhas e o gráfico dizia o contrário do
             dado. */
          var rotulo =
            cabeRotulo && v && v === maior
              ? '<span class="painel-grafico__valor" style="bottom:' + alt + '%">' +
                duracao(v) + "</span>"
              : "";

          return (
            '<div class="painel-grafico__col" title="' + escapar(titulo) + '">' +
            rotulo +
            '<span class="painel-grafico__barra" style="height:' + alt + '%"></span>' +
            "</div>"
          );
        })
        .join("") +
      "</div>" +
      '<div class="painel-grafico__eixo"><span>' +
      rotuloDia(atual[0]) + "</span><span>" +
      rotuloDia(atual[atual.length - 1]) + "</span></div>";
  }

  function rotuloDia(d) {
    if (!d) return "";
    var p = String(d.dia).split("-");
    return p[2] + "/" + p[1];
  }

  /* Duas janelas do mesmo tamanho, coladas: a atual e a de antes
     dela. É o que responde "mudou depois do reajuste". */
  function carregarSerie() {
    if (!pratoSerie || !periodo) return;
    var minhaCarga = carga;
    var largura = periodo.ate.getTime() - periodo.de.getTime();
    var base = {
      p_restaurante: restaurante.id,
      p_chave: pratoSerie,
      p_hora_de: horaDe,
      p_hora_ate: horaAte
    };

    Promise.all([
      pedir("/rest/v1/rpc/serie", Object.assign({}, base, {
        p_de: periodo.de.toISOString(),
        p_ate: periodo.ate.toISOString()
      })),
      pedir("/rest/v1/rpc/serie", Object.assign({}, base, {
        p_de: new Date(periodo.de.getTime() - largura).toISOString(),
        p_ate: periodo.de.toISOString()
      }))
    ])
      .then(function (r) {
        if (minhaCarga !== carga) return;
        desenharSerie(r[0] || [], r[1] || []);
      })
      ["catch"](function () {
        if (minhaCarga !== carga) return;
        $("[data-serie-resumo]").textContent = "não consegui carregar";
      });
  }

  /* ---------- CARGA ---------- */

  function carregar(de, ate) {
    periodo = { de: de, ate: ate };
    var minhaCarga = ++carga;
    $("[data-resumo]").textContent = "carregando…";

    var args = {
      p_restaurante: restaurante.id,
      p_de: de.toISOString(),
      p_ate: ate.toISOString(),
      p_hora_de: horaDe,
      p_hora_ate: horaAte
    };

    /* Fora do Promise.all das outras oito de propósito: se
       qualquer uma delas falhar, o "catch" comum engoliria o
       gráfico junto e ele ficaria mostrando o período anterior
       sem avisar ninguém. */
    carregarSerie();

    Promise.all([
      pedir("/rest/v1/rpc/visao_geral", args),
      pedir("/rest/v1/rpc/resumo", args),
      pedir("/rest/v1/rpc/funil", Object.assign({}, args, { p_pagina: "index.html" })),
      pedir("/rest/v1/rpc/funil", Object.assign({}, args, { p_pagina: "cardapio.html" })),
      pedir("/rest/v1/rpc/funil", Object.assign({}, args, { p_pagina: "unidades.html" })),
      pedir("/rest/v1/rpc/origens", args),
      pedir("/rest/v1/rpc/acoes", args),
      pedir("/rest/v1/rpc/buscas", args),
      pedir("/rest/v1/rpc/por_hora", args)
    ])
      .then(function (r) {
        if (minhaCarga !== carga) return; /* já tem pedido mais novo */
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

        var msPorPrato = {};
        porTipo.prato.forEach(function (l) {
          msPorPrato[l.chave] = Number(l.tempo_ms || 0);
        });
        mostrarCategoria(msPorPrato);

        tabela("[data-t-prato]", porTipo.prato, "tempo", 20);
        tabela("[data-t-clique]", porTipo.clique, "cliques", 15);
        mostrarFunil("[data-t-home]", r[2], ORDEM_HOME);
        mostrarFunil("[data-t-categoria]", r[3], ordemCardapio());
        mostrarFunil("[data-t-unidades]", r[4], ORDEM_UNIDADES);
        mostrarOrigens(r[5]);
        mostrarAcoes(r[6]);
        mostrarBuscas(r[7]);

        var dist = r[8] || [];
        mostrarDistribuicao(
          "[data-t-hora]",
          dist.filter(function (l) { return l.eixo === "hora"; }),
          rotuloHora,
          null
        );
        mostrarDistribuicao(
          "[data-t-dia]",
          dist.filter(function (l) { return l.eixo === "dia"; }),
          function (d) { return DIAS[d]; },
          ORDEM_DIAS
        );

        $("[data-resumo]").textContent =
          de.toLocaleDateString("pt-BR") + " a " +
          new Date(ate.getTime() - 1).toLocaleDateString("pt-BR") +
          (horaDe === null
            ? ""
            : " · das " + horaDe + "h às " + horaAte + "h59");
      })
      ["catch"](function (e) {
        if (minhaCarga !== carga) return;
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

  function ligarHoras() {
    var de = $("[data-hora-de]");
    var ate = $("[data-hora-ate]");

    [de, ate].forEach(function (sel) {
      var html = '<option value="">qualquer</option>';
      for (var h = 0; h < 24; h++) {
        html += '<option value="' + h + '">' + h + "h</option>";
      }
      sel.innerHTML = html;
      sel.addEventListener("change", function () {
        /* Meia faixa não é faixa: escolher só uma ponta não muda
           nada até a outra existir. */
        var a = de.value === "" ? null : Number(de.value);
        var b = ate.value === "" ? null : Number(ate.value);
        if (a === null || b === null) {
          horaDe = null;
          horaAte = null;
        } else {
          horaDe = a;
          horaAte = b;
        }
        if (periodo) carregar(periodo.de, periodo.ate);
      });
    });
  }

  function ligarPeriodo() {
    ligarHoras();
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

        montarSeletor();
        montarSeletorCategoria();
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
