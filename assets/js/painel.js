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
  var APARELHOS = {
    celular: "Celular",
    tablet: "Tablet",
    computador: "Computador",
    desconhecido: "Não identificado",
    "sem registro": "Antes desta medição"
  };

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

  /* Cada carga leva um número. Resposta que chega depois de uma
     carga mais nova é descartada.

     Sem isto, clicar em "30 dias" enquanto os 7 ainda estão no ar
     deixa as duas respostas em voo, e quem pinta a tela é a que
     chegar por último — o chip mostra 30 e o gráfico mostra 7.
     Foi o que apareceu no uso real. */
  var carga = 0;

  /* Tudo que a última carga trouxe, guardado inteiro. O relatório
     sai daqui e não de uma nova ida ao servidor: assim o arquivo
     baixado é exatamente o que está na tela, sem chance de os dois
     discordarem por causa de uma visita que entrou no meio. */
  var ultimoPacote = null;

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

  function tabela(seletor, linhas, coluna, limite, comParadas) {
    var corpo = $(seletor);
    if (!linhas || !linhas.length) {
      corpo.innerHTML = '<tr><td class="painel-vazio">nada no período</td></tr>';
      return;
    }
    corpo.innerHTML = linhas
      .slice(0, limite || 15)
      .map(function (l, i) {
        var v = coluna === "cliques" ? numero(l.cliques) + "x" : duracao(l.tempo_ms);
        /* Uma volta só é o normal — quem viu uma vez e seguiu.
           Mostrar "1x" em toda linha encheria a coluna de ruído e
           esconderia justamente as que se repetem. */
        var voltas = comParadas
          ? "<td class='painel-num painel-sec'>" +
            (Number(l.paradas) > 1 ? numero(l.paradas) + "x" : "—") +
            "</td>"
          : "";
        return (
          "<tr><td class='painel-pos'>" + (i + 1) + "</td><td>" +
          escapar(l.nome || l.chave) + "</td><td class='painel-num'>" + v + "</td>" +
          voltas + "</tr>"
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
  /* Origem e aparelho respondem a mesma forma de pergunta —
     "de cada 10 visitas, quantas vieram assim" — então usam o
     mesmo desenho em vez de duas funções quase iguais. */
  function mostrarLista(seletor, linhas, rotulos, campo) {
    var corpo = $(seletor);
    if (!linhas || !linhas.length) {
      corpo.innerHTML = '<tr><td class="painel-vazio">nada no período</td></tr>';
      return;
    }
    corpo.innerHTML = linhas
      .map(function (l) {
        var pct = Number(l.porcentagem || 0);
        var chave = l[campo];
        return (
          '<tr><td class="painel-barra" style="--pct:' + pct + '%">' +
          escapar(rotulos[chave] || chave) + "</td>" +
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

    /* No papel o seletor não existe, então o nome da categoria
       precisa estar escrito. */
    var opc = $("[data-categoria-atencao]");
    $("[data-impresso-categoria]").textContent =
      "Categoria: " + (opc && opc.selectedOptions[0] ? opc.selectedOptions[0].textContent : categoriaAtencao);

    $("[data-categoria-nota]").textContent =
      media > 0
        ? "média entre os " + vistos + " pratos que apareceram: " +
          duracao(Math.round(media)) +
          (semAtencao
            ? " · " + semAtencao + " não apareceram para ninguém"
            : "")
        : "nenhum prato desta categoria recebeu atenção no período";
  }

  /* ---------- PRATOS NO TEMPO ----------
     Até cinco de uma vez, um gráfico por prato empilhado.

     Não é um gráfico com cinco linhas em cima da outra. Com
     movimento pequeno a maioria dos dias é zero, e cinco linhas
     sobrepostas viram um emaranhado; e no papel, impresso em
     preto e branco, elas ficariam indistinguíveis. Gráficos
     separados com a mesma régua comparam igual e sobrevivem à
     impressão — cada um com o seu próprio total e a sua própria
     variação em cima.

     Cinco é teto e não meta: cada prato custa duas idas ao
     servidor (o período atual e o anterior). */
  var MAX_SERIES = 5;

  /* Começa com um. O primeiro prato do cardápio é só um ponto de
     partida — quem abre o painel troca em seguida. */
  var pratosSerie = [];

  function listaDePratos() {
    return (window.STADIUM && window.STADIUM.cardapio) || [];
  }

  function opcoesDePrato(escolhido) {
    var lista = listaDePratos();
    var rot = (window.STADIUM && window.STADIUM.rotuloCategorias) || {};
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
        var sel = String(p.id) === String(escolhido) ? " selected" : "";
        html += '<option value="' + escapar(p.id) + '"' + sel + ">" +
                escapar(p.nome) + "</option>";
      });
      html += "</optgroup>";
    });
    return html;
  }

  function nomeDoPrato(id) {
    var achado = null;
    listaDePratos().forEach(function (p) {
      if (String(p.id) === String(id)) achado = p.nome;
    });
    return achado || String(id);
  }

  /* Redesenha os seletores e as caixas de gráfico. Só a moldura;
     os números chegam depois, quando as consultas voltarem. */
  function montarSeries() {
    var caixa = $("[data-series]");
    if (!caixa) return;
    if (!pratosSerie.length) {
      var lista = listaDePratos();
      if (!lista.length) return;
      pratosSerie = [String(lista[0].id)];
    }

    caixa.innerHTML = pratosSerie
      .map(function (id, i) {
        return (
          '<div class="painel-serie" data-serie="' + i + '">' +
          '<div class="painel-serie__topo">' +
          '<select class="painel-escolha" data-serie-prato="' + i + '">' +
          opcoesDePrato(id) +
          "</select>" +
          (pratosSerie.length > 1
            ? '<button class="painel-serie__remover" type="button" ' +
              'data-remover-serie="' + i + '" title="tirar do relatório">×</button>'
            : "") +
          "</div>" +
          '<p class="painel-so-impressao">' + escapar(nomeDoPrato(id)) + "</p>" +
          '<p class="painel-destaque" data-serie-resumo="' + i + '"></p>' +
          '<div class="painel-grafico" data-serie-grafico="' + i + '"></div>' +
          "</div>"
        );
      })
      .join("");

    caixa.querySelectorAll("[data-serie-prato]").forEach(function (sel) {
      sel.addEventListener("change", function () {
        pratosSerie[Number(sel.getAttribute("data-serie-prato"))] = sel.value;
        montarSeries();
        carregarSerie();
      });
    });

    caixa.querySelectorAll("[data-remover-serie]").forEach(function (b) {
      b.addEventListener("click", function () {
        pratosSerie.splice(Number(b.getAttribute("data-remover-serie")), 1);
        montarSeries();
        carregarSerie();
      });
    });

    var add = $("[data-add-serie]");
    if (add) add.hidden = pratosSerie.length >= MAX_SERIES;
  }

  function ligarAdicionarSerie() {
    var add = $("[data-add-serie]");
    if (!add) return;
    add.addEventListener("click", function () {
      if (pratosSerie.length >= MAX_SERIES) return;
      /* Entra um prato que ainda não está na lista, para o novo
         gráfico não nascer duplicado do anterior. */
      var lista = listaDePratos();
      var novo = null;
      lista.forEach(function (p) {
        if (novo === null && pratosSerie.indexOf(String(p.id)) === -1) {
          novo = String(p.id);
        }
      });
      if (novo === null) return;
      pratosSerie.push(novo);
      montarSeries();
      carregarSerie();
    });
  }

  /* Barras em HTML, não em SVG. SVG precisa de viewBox fixo e o
     texto encolhe junto com a tela; num celular os rótulos
     ficariam ilegíveis. Em HTML a barra é porcentagem de altura e
     texto continua texto. */
  function desenharSerie(indice, atual, anterior) {
    var caixa = $('[data-serie-grafico="' + indice + '"]');
    var resumo = $('[data-serie-resumo="' + indice + '"]');
    if (!caixa || !resumo) return;

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
       automaticamente bom. Um prato pode subir porque a foto
       melhorou ou porque o preço assustou e a pessoa ficou lendo.
       Quem interpreta é quem conhece a casa. */
    var texto = duracao(total) + " no período";
    if (antes > 0) {
      var var100 = Math.round(((total - antes) / antes) * 100);
      texto += " · " + (var100 >= 0 ? "+" : "") + var100 + "% vs o período anterior";
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
             Rio, calculado no banco. Ler como local voltaria um
             dia. */
          var data = new Date(d.dia + "T12:00:00Z");
          var titulo =
            DIAS_CURTOS[data.getUTCDay()] + " " +
            String(data.getUTCDate()).padStart(2, "0") + "/" +
            String(data.getUTCMonth() + 1).padStart(2, "0") +
            " · " + (v ? duracao(v) : "nada") +
            (d.pessoas ? " · " + numero(d.pessoas) + " pessoa(s)" : "");

          /* Rótulo só no maior, e só quando a barra o segura. Em
             90 dias a coluna tem menos de 2px e o texto
             transbordaria por cima das vizinhas. */
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

  /* Duas janelas do mesmo tamanho por prato: a atual e a de antes
     dela. É o que responde "mudou depois do reajuste". */
  function carregarSerie() {
    if (!pratosSerie.length || !periodo) return;
    var minhaCarga = carga;
    var largura = periodo.ate.getTime() - periodo.de.getTime();

    pratosSerie.forEach(function (id, i) {
      var base = {
        p_restaurante: restaurante.id,
        p_chave: id,
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
          desenharSerie(i, r[0] || [], r[1] || []);
        })
        ["catch"](function () {
          if (minhaCarga !== carga) return;
          var el = $('[data-serie-resumo="' + i + '"]');
          if (el) el.textContent = "não consegui carregar";
        });
    });
  }

  /* O carrossel é circular e a promoção de cada posição muda com
     o tempo, então o rótulo é a POSIÇÃO. "1º banner" continua
     querendo dizer a mesma coisa daqui a seis meses; o nome da
     promoção, não. */
  function mostrarBanners(linhas) {
    var corpo = $("[data-t-banners]");
    if (!linhas || !linhas.length) {
      corpo.innerHTML = '<tr><td class="painel-vazio">nada no período</td></tr>';
      return;
    }
    corpo.innerHTML = linhas
      .map(function (l) {
        var pct = Number(l.porcentagem || 0);
        return (
          '<tr><td class="painel-barra" style="--pct:' + pct + '%">' +
          numero(l.posicao) + "º banner</td>" +
          "<td class='painel-num painel-sec'>" + numero(l.sessoes) + "</td>" +
          "<td class='painel-num'>" + pct.toFixed(0) + "%</td></tr>"
        );
      })
      .join("");
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
      pedir("/rest/v1/rpc/por_hora", args),
      pedir("/rest/v1/rpc/aparelhos", args),
      pedir("/rest/v1/rpc/banners", args),
      /* Sem o recorte de hora de propósito: este bloco É a
         divisão por horário, e filtrá-lo pela hora escolhida
         devolveria só a faixa escolhida. */
      pedir("/rest/v1/rpc/pratos_por_faixa", {
        p_restaurante: restaurante.id,
        p_de: de.toISOString(),
        p_ate: ate.toISOString()
      })
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

        tabela("[data-t-prato]", porTipo.prato, "tempo", 20, true);
        tabela("[data-t-clique]", porTipo.clique, "cliques", 15);
        mostrarFunil("[data-t-home]", r[2], ORDEM_HOME);
        mostrarFunil("[data-t-categoria]", r[3], ordemCardapio());
        mostrarFunil("[data-t-unidades]", r[4], ORDEM_UNIDADES);
        mostrarLista("[data-t-origem]", r[5], ORIGENS, "origem");
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

        mostrarLista("[data-t-aparelho]", r[9], APARELHOS, "aparelho");
        mostrarBanners(r[10] || []);

        ultimoPacote = {
          de: de,
          ate: ate,
          horaDe: horaDe,
          horaAte: horaAte,
          geral: geral,
          resumo: resumo,
          funilHome: r[2] || [],
          funilCardapio: r[3] || [],
          funilUnidades: r[4] || [],
          origens: r[5] || [],
          acoes: r[6] || [],
          buscas: r[7] || [],
          distribuicao: dist,
          aparelhos: r[9] || [],
          banners: r[10] || [],
          porFaixa: r[11] || []
        };
        prepararCapa();
        $("[data-baixar-ia]").disabled = false;
        $("[data-baixar-pdf]").disabled = false;

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

  /* ---------- RELATÓRIO ----------
     Dois arquivos para dois leitores, e eles não são o mesmo
     arquivo com roupa diferente.

     PARA A IA: JSON, não PDF nem planilha.

     PDF é o pior formato possível para máquina — o texto sai
     embaralhado na extração, tabela vira sopa de palavras e boa
     parte do que se lê descreve layout, não dado. Planilha só
     serve para UMA tabela, e aqui são oito recortes do mesmo
     período; caberiam oito arquivos e a relação entre eles se
     perderia no caminho.

     E o que muda a qualidade da resposta não é o formato: é o
     DICIONÁRIO que vai junto. Número solto faz qualquer modelo
     inventar significado — vai ler tempo como intenção de
     compra, comparar prato do topo com prato do fim da página,
     tratar alcance e atenção como sinônimos. O bloco
     "leia_primeiro" existe para impedir cada um desses erros,
     inclusive dizendo o que o dado NÃO prova.

     PARA GENTE: PDF pela impressão do navegador.

     Sem biblioteca. Gerar PDF em JavaScript exigiria carregar
     centenas de KB para produzir tipografia pior que a do
     próprio navegador. A folha de impressão esconde o que é
     controle e deixa passar o que é conteúdo; "Salvar como PDF"
     na caixa de impressão faz o resto, com texto vetorial. */

  function baixarArquivo(nome, conteudo, tipo) {
    var url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
    var a = document.createElement("a");
    a.href = url;
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    a.remove();
    /* Sem isto o blob fica presa na memória até a aba fechar. */
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  /* Montada com os componentes locais, não com toISOString: o
     fim do período é 23h59 no Rio, que em UTC já é o dia
     seguinte. O arquivo dizia terminar um dia depois do que a
     tela mostrava. */
  function soData(d) {
    return (
      d.getFullYear() + "-" +
      String(d.getMonth() + 1).padStart(2, "0") + "-" +
      String(d.getDate()).padStart(2, "0")
    );
  }

  /* O catálogo vai junto do dado medido, e é ele que torna o
     cruzamento com o sistema de vendas possível: id, nome exato
     do cardápio, categoria e preço são as colunas por onde uma
     linha de venda pode ser casada com uma linha de atenção. Sem
     isso a IA recebe dois arquivos que não conversam. */
  function catalogo() {
    var lista = (window.STADIUM && window.STADIUM.cardapio) || [];
    var rot = (window.STADIUM && window.STADIUM.rotuloCategorias) || {};
    return lista.map(function (p) {
      return {
        id: String(p.id),
        nome: p.nome,
        categoria: rot["container-" + p.categoria] || p.categoria,
        preco_reais: precoDoPrato(p),
        /* Metade do cardápio não tem botão de detalhes. Sem esta
           marca, "zero cliques" é lido como desinteresse quando na
           verdade não havia o que clicar — e a separação de
           hipóteses desaba justamente nos pratos onde ela seria
           falsa. A regra vem de cardapio.js, que é quem desenha o
           botão; duplicá-la aqui criaria duas versões. */
        tem_botao_detalhes:
          window.STADIUM && window.STADIUM.temDetalhes
            ? window.STADIUM.temDetalhes(p)
            : null
      };
    });
  }

  function montarRelatorio() {
    var P = ultimoPacote;
    if (!P) return null;

    var porPrato = {};
    var porVoltas = {};
    var porPessoas = {};
    var porClique = {};
    P.resumo.forEach(function (l) {
      if (l.tipo === "prato") {
        porPrato[l.chave] = Number(l.tempo_ms || 0);
        porVoltas[l.chave] = Number(l.paradas || 0);
        porPessoas[l.chave] = Number(l.pessoas || 0);
      } else if (l.tipo === "clique") {
        porClique[l.chave] = Number(l.cliques || 0);
      }
    });

    var pratos = catalogo().map(function (c) {
      return {
        id: c.id,
        nome: c.nome,
        categoria: c.categoria,
        preco_reais: c.preco_reais,
        tem_botao_detalhes: c.tem_botao_detalhes,
        atencao_ms: porPrato[c.id] || 0,
        /* O denominador de qualquer conta de conversão. Sem ele,
           só existe tempo total — e tempo total confunde "muita
           gente olhando pouco" com "pouca gente olhando muito". */
        pessoas_que_viram: porPessoas[c.id] || 0,
        voltas: porVoltas[c.id] || 0,
        cliques_detalhes: porClique[c.id] || 0
      };
    });

    function funil(linhas) {
      return linhas.map(function (l) {
        return {
          bloco: l.chave,
          nome: rotulo(l.chave, l.nome),
          visitas_que_chegaram: Number(l.sessoes || 0),
          porcentagem_que_chegou: Number(l.porcentagem || 0),
          atencao_media_ms: Number(l.tempo_medio_ms || 0)
        };
      });
    }

    function eixo(nome) {
      return P.distribuicao
        .filter(function (l) { return l.eixo === nome; })
        .map(function (l) {
          return { chave: Number(l.chave), visitas: Number(l.visitas || 0) };
        });
    }

    return {
      leia_primeiro: {
        o_que_e_este_arquivo:
          "Medição de ATENÇÃO no cardápio digital do restaurante Stadium " +
          "Steakhouse. Não é dado de venda: ninguém compra por este site. " +
          "Descreve o que as pessoas olharam, por quanto tempo e até onde " +
          "desceram, antes de pedir.",

        para_que_serve:
          "Foi feito para ser cruzado com o relatório de vendas do " +
          "restaurante. O elo entre os dois é o prato: use id quando o " +
          "sistema de vendas tiver o mesmo identificador, e nome quando não " +
          "tiver. O campo nome é exatamente como está escrito no cardápio.",

        o_que_cada_medida_significa: {
          atencao_ms:
            "Tempo em que o item ficou de fato na tela, em milissegundos. Não " +
            "é tempo de aba aberta: o relógio para quando a pessoa fica 15s " +
            "sem rolar nem tocar, e quando ela sai da aba.",
          pessoas_que_viram:
            "Quantas visitas distintas chegaram a ver este prato. É o " +
            "denominador de qualquer conta de conversão: vendas divididas por " +
            "ISTO, nunca por atencao_ms. E é o que separa 'muita gente olhando " +
            "pouco' de 'pouca gente olhando muito' — 195s em 10 pessoas e 97s " +
            "em 3 parecem opostos pelo total e se invertem por pessoa.",
          voltas:
            "Quantas vezes separadas a pessoa voltou ao MESMO prato na mesma " +
            "visita. É sinal de indecisão. 47s em 6 voltas e 47s numa volta só " +
            "são comportamentos diferentes: o primeiro é alguém comparando.",
          tem_botao_detalhes:
            "Se este prato tem botão de detalhes no cardápio. Cerca de um terço " +
            "não tem — são pratos sem descrição extra, sem opções e sem aviso de " +
            "alergênico, e o botão some para não abrir uma gaveta vazia. LEIA " +
            "ISTO ANTES de interpretar cliques_detalhes: num prato com botão, " +
            "zero cliques quer dizer que ninguém se interessou o bastante para " +
            "abrir; num prato SEM botão, quer dizer que não havia o que abrir. " +
            "Nunca conclua desinteresse a partir de zero cliques num prato sem " +
            "botão, e nunca compare os dois grupos entre si.",
          cliques_detalhes:
            "Quantas vezes abriram os detalhes do prato. É escolha, não acaso, " +
            "mas tem dois sentidos opostos: interesse ou descrição ruim. " +
            "Cruzado com atencao_ms eles se separam — muito tempo e muito " +
            "clique é interesse; pouco tempo e muito clique é descrição que " +
            "não explica o prato.",
          porcentagem_que_chegou:
            "De cada 100 visitas àquela página, quantas ROLARAM até o bloco. " +
            "Chegar é diferente de parar: alcance alto com atenção baixa é " +
            "gente passando reto, não sucesso.",
          visita:
            "Uma aba aberta. A mesma pessoa voltando amanhã conta de novo; a " +
            "mesma pessoa indo da home ao cardápio conta uma vez só.",
          pratos_por_faixa_do_dia:
            "O mesmo prato, dividido pelo momento do dia em que foi olhado: " +
            "almoco (11h-14h), tarde (15h-17h), jantar (18h-22h), noite " +
            "(23h-2h) e fora do expediente. Serve para cruzar com a hora da " +
            "venda: se a atenção a um prato se concentra às 19h e a venda dele " +
            "acontece às 20h, o site está antecipando o pedido. Só aparecem " +
            "pratos que receberam alguma atenção.",
          origem:
            "De onde a visita veio. mesa-barra e mesa-recreio são QR codes nas " +
            "mesas: essa pessoa está DENTRO do restaurante, sentada, prestes a " +
            "pedir. Instagram, google e afins são gente de fora, em outro " +
            "momento de decisão. Tratar os dois como iguais invalida qualquer " +
            "conclusão."
        },

        cuidados_obrigatorios: [
          "ATENÇÃO NÃO É INTENÇÃO DE COMPRA. Um prato pode reter olhos por " +
            "curiosidade, por preço alto, por foto boa ou por nome estranho.",
          "POSIÇÃO CONTAMINA TUDO. Prato no começo da página é visto por " +
            "todos, independente de qualidade. Compare pratos da MESMA " +
            "categoria, que estão lado a lado na página. Comparar categorias " +
            "entre si mede posição, não prato.",
          "PREÇO EXPLICA POUCO NESTE CARDÁPIO. Dezessete hambúrgueres custam o " +
            "mesmo valor, e as cinco massas também. Onde o preço varia muito " +
            "dentro de uma categoria (Aquecimentos, de R$ 10 a R$ 220) é " +
            "porque ela mistura entrada com prato de dividir.",
          "atencao_ms IGUAL A ZERO não quer dizer prato ruim: pode ser prato " +
            "que ninguém chegou a ver. Separe não interessou de não apareceu " +
            "antes de recomendar tirar algo do cardápio.",
          "VOLUME PEQUENO NÃO CONCLUI NADA. Confira visitas no resumo antes de " +
            "afirmar qualquer coisa; com poucas dezenas, diferença é ruído.",
          "AS FOTOS DOS PRATOS AINDA SÃO PROVISÓRIAS nesta fase do projeto, " +
            "então diferença de atenção entre pratos pode vir da foto genérica " +
            "e não do prato."
        ],

        o_que_este_arquivo_nao_tem:
          "Não tem venda, não tem faturamento e não identifica ninguém. Sem " +
          "nome, e-mail, telefone ou rastro entre visitas — a contagem morre " +
          "quando a aba fecha."
      },

      gerado_em: new Date().toISOString(),
      restaurante: restaurante ? restaurante.nome : null,

      periodo: {
        de: soData(P.de),
        ate: soData(new Date(P.ate.getTime() - 1)),
        fuso: "America/Sao_Paulo",
        recorte_de_horario:
          P.horaDe === null ? null : { das: P.horaDe, ate: P.horaAte }
      },

      resumo: {
        visitas: Number(P.geral.visitas || 0),
        tempo_total_ms: Number(P.geral.tempo_total_ms || 0),
        tempo_medio_por_visita_ms: Number(P.geral.tempo_medio_ms || 0),
        visitas_home: Number(P.geral.visitas_home || 0),
        visitas_cardapio: Number(P.geral.visitas_cardapio || 0),
        visitas_unidades: Number(P.geral.visitas_unidades || 0),
        cliques_em_detalhes: Number(P.geral.cliques || 0),
        pratos_com_alguma_atencao: Number(P.geral.pratos_olhados || 0),
        pratos_no_cardapio: catalogo().length
      },

      de_onde_vieram: P.origens.map(function (l) {
        return {
          origem: l.origem,
          visitas: Number(l.sessoes || 0),
          porcentagem: Number(l.porcentagem || 0),
          tempo_medio_ms: Number(l.tempo_medio_ms || 0)
        };
      }),

      aparelhos: P.aparelhos.map(function (l) {
        return {
          aparelho: l.aparelho,
          visitas: Number(l.sessoes || 0),
          porcentagem: Number(l.porcentagem || 0),
          tempo_medio_ms: Number(l.tempo_medio_ms || 0)
        };
      }),

      visitas_por_hora_do_dia: eixo("hora"),
      visitas_por_dia_da_semana: eixo("dia"),

      alcance_carrossel: (P.banners || []).map(function (l) {
        return {
          posicao: Number(l.posicao),
          visitas_que_viram: Number(l.sessoes || 0),
          porcentagem_que_viu: Number(l.porcentagem || 0)
        };
      }),

      alcance_home: funil(P.funilHome),
      alcance_cardapio: funil(P.funilCardapio),
      alcance_unidades: funil(P.funilUnidades),

      pratos: pratos,

      /* Em que momento do dia cada prato é olhado. Responde
         perguntas do tipo "que horário olham mais a picanha", que
         a distribuição global de visitas por hora não responde:
         aquela é do site inteiro, esta é por prato. Cruzada com a
         hora da venda, mostra se a atenção antecede o pedido. */
      pratos_por_faixa_do_dia: (P.porFaixa || []).map(function (l) {
        return {
          id: l.chave,
          nome: nomeDoPrato(l.chave),
          faixa: l.faixa,
          pessoas_que_viram: Number(l.pessoas || 0),
          atencao_ms: Number(l.atencao_ms || 0)
        };
      }),

      buscas: P.buscas.map(function (l) {
        return {
          termo: l.termo,
          vezes: Number(l.vezes || 0),
          pessoas: Number(l.pessoas || 0),
          pratos_encontrados: Number(l.resultados || 0),
          nota:
            Number(l.resultados) === 0
              ? "Sem resultado: ou o prato não existe, ou existe com outro nome."
              : null
        };
      }),

      acoes_de_intencao: P.acoes.map(function (l) {
        return {
          acao: l.chave,
          descricao: rotuloAcao(l.chave, l.nome),
          vezes: Number(l.vezes || 0),
          pessoas: Number(l.sessoes || 0)
        };
      })
    };
  }

  /* Quantos dias o recorte cobre. É o que vira "Recorte de 30
     dias" na capa, e serve tanto para os botões prontos quanto
     para uma data escolhida à mão. */
  function diasDoPeriodo(P) {
    return Math.round((P.ate.getTime() - P.de.getTime()) / 86400000);
  }

  function frasePeriodo(P) {
    var n = diasDoPeriodo(P);
    var texto = "Recorte de " + n + (n === 1 ? " dia" : " dias");
    if (P.horaDe !== null) {
      texto += ", das " + P.horaDe + "h às " + P.horaAte + "h59";
    }
    return texto;
  }

  function datasPeriodo(P) {
    return (
      P.de.toLocaleDateString("pt-BR") + " a " +
      new Date(P.ate.getTime() - 1).toLocaleDateString("pt-BR")
    );
  }

  /* A capa só aparece no papel, mas é preenchida sempre: quem
     manda imprimir não passa por aqui de novo. */
  function prepararCapa() {
    var P = ultimoPacote;
    if (!P) return;
    $("[data-capa-casa]").textContent = restaurante ? restaurante.nome : "";
    $("[data-capa-recorte]").textContent = frasePeriodo(P);
    $("[data-capa-datas]").textContent = datasPeriodo(P);
  }

  /* O navegador usa o TÍTULO DA PÁGINA como nome do arquivo ao
     salvar em PDF. Sem mexer nele, todo relatório sai chamado
     "Painel — Stadium Steakhouse" e some na pasta de downloads
     junto com os anteriores. Trocado antes de imprimir e
     devolvido depois, para a aba não ficar com nome esquisito.

     Barra é proibida em nome de arquivo no Windows, então as
     datas vão com hífen. */
  var TITULO_ORIGINAL = document.title;

  function imprimir() {
    var P = ultimoPacote;
    if (P) {
      prepararCapa();
      document.title =
        "Stadium — " + frasePeriodo(P).replace("Recorte de ", "") +
        " — " + datasPeriodo(P).replace(/\//g, "-");
    }
    window.print();
  }

  window.addEventListener("afterprint", function () {
    document.title = TITULO_ORIGINAL;
  });

  function baixarParaIA() {
    var r = montarRelatorio();
    if (!r) return;
    baixarArquivo(
      "stadium-atencao-" + r.periodo.de + "-a-" + r.periodo.ate + ".json",
      JSON.stringify(r, null, 2),
      "application/json;charset=utf-8"
    );
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

    $("[data-baixar-ia]").addEventListener("click", baixarParaIA);
    /* A caixa de impressão do navegador tem "Salvar como PDF" em
       todos eles. Quem desenha o documento é a folha de impressão
       no CSS, não este clique. */
    $("[data-baixar-pdf]").addEventListener("click", imprimir);
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

  /* Duas portas levam aqui: o crachá guardado, na abertura da
     página, e o formulário. Se as duas passarem, cada ouvinte é
     ligado duas vezes e um clique em "adicionar prato" adiciona
     dois — que foi o que apareceu no teste. Chips de período
     teriam o mesmo problema, disparando duas cargas por clique. */
  var painelAberto = false;

  function abrirPainel(email) {
    if (painelAberto) return;
    painelAberto = true;

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

        montarSeries();
        ligarAdicionarSerie();
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
