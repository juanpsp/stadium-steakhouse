/* =========================================================
   STADIUM STEAKHOUSE — ATENÇÃO POR PRATO E POR CATEGORIA
   =========================================================

   Mede quanto tempo cada prato — e cada seção — passa na frente
   da pessoa.

   POR QUE TEMPO, E NÃO CLIQUE

   O clique em "detalhes" é o sinal mais limpo que existe, mas é
   raro: a maioria rola o cardápio inteiro sem apertar nada. Se a
   medição dependesse só dele, sobraria dado de meia dúzia de
   pratos.

   E resolver isso escondendo informação para forçar o clique
   seria pior que não medir: o clique passaria a significar "o
   card estava incompleto", não "me interessei". Mediria o nosso
   próprio buraco, não o interesse do cliente.

   DUAS MEDIDAS, DUAS RÉGUAS

   Prato e categoria não podem usar a mesma regra, e a diferença
   não é de gosto:

   - Um card cabe na tela. Vale "metade dele visível".
   - Uma seção NÃO cabe: Aquecimentos tem 20 pratos e nunca
     chegaria a 50% visível. Para ela vale "está no centro da
     tela" — a mesma régua que já acende a pill da categoria.

   De quebra, a régua da categoria tem uma qualidade que a do
   prato não tem: só UMA categoria ocupa o centro por vez, então
   não há diluição nenhuma.

   O QUE NÃO É MEDIDO, E POR QUÊ

   Só medimos prato quando a grade está em UMA coluna.

   Em duas colunas os pratos ficam emparelhados — dois vizinhos
   entram e saem da tela exatamente juntos e registram tempos
   idênticos em toda sessão. Não é ruído que o volume dilui: é
   incapacidade estrutural de distinguir um do outro, e nenhuma
   ponderação conserta. Como 95 a 98% do público entra pelo
   celular, descartar essas sessões custa pouco e protege o resto.

   O layout fica gravado junto com o dado, então dá para
   revisitar a decisão depois sem ter perdido a informação.

   Categoria não sofre disso — a régua do centro vale igual em
   qualquer largura — então ela continua sendo medida sempre.

   O QUE ISTO NÃO É

   Não é rastreamento ocular. Mede "ficou na frente da pessoa",
   não "o olho foi lá". Ninguém mede o segundo sem câmera. Para
   comparar 129 pratos nas mesmas condições, o primeiro basta.

   E não identifica ninguém: sem cookie, sem login, sem nada que
   diga quem é. Conta interação, não gente.

   ONDE O DADO PARA

   Hoje, no navegador da própria pessoa (localStorage). É a fase
   de prova. Quando houver servidor, só o destino muda — o gancho
   já está no lugar certo, no "pagehide".

   PAINEL

   Abra com ?metricas=1 na URL. Sem isso nada aparece.
   ========================================================= */

(function (window, document) {
  "use strict";

  /* ---------- TRAVAS ----------
     Valores de partida calibrados pelo comportamento humano — não
     são lei. Depois de um mês de dado real, olhe a distribuição e
     ajuste. É para isso que o tempo BRUTO é guardado junto do
     travado: sem ele não dá para saber se o corte foi certo. */

  var TETO_PARADA_PRATO = 20000;   /* ler um card leva 3 a 5s */
  var TETO_TOTAL_PRATO = 45000;    /* impede o vai-e-volta acumular */

  /* Categoria segura atenção legitimamente por mais tempo: são
     até 20 pratos numa seção só. */
  var TETO_PARADA_CAT = 60000;
  var TETO_TOTAL_CAT = 240000;

  /* Sem rolar e sem tocar por este tempo, o celular está na mesa.
     É a trava mais importante de todas, e mais precisa que um
     teto seco: quem está lendo, rola. */
  var INATIVIDADE = 15000;

  var SESSAO_MAX = 15 * 60 * 1000;

  /* Metade do card visível. Não é chute: é o limiar que o mercado
     de publicidade usa para dizer que um anúncio foi visto. */
  var VISIVEL = 0.5;

  /* Faixa central da tela, para categoria. Mesma do scrollspy. */
  var FAIXA_CENTRO = "-40% 0px -55% 0px";

  var CHAVE = "stadium.metricas.v2";

  /* ---------- PARA ONDE O DADO VAI ----------
     Estas três linhas são a única coisa que muda quando este
     site for usado por outro restaurante: o identificador
     abaixo troca, e mais nada.

     A chave é PÚBLICA de propósito e fica visível no código da
     página. Não é descuido: sozinha ela só permite GRAVAR
     medição. Quem impede leitura, alteração e remoção são as
     regras de acesso configuradas no banco, e elas foram
     testadas uma a uma.

     A chave que ignora as regras — a "service_role" — não está
     aqui e nunca pode estar. */
  var BANCO = "https://huhkbfbaqfuohwbqjzah.supabase.co";
  var CHAVE_PUBLICA = "sb_publishable_ohq_5GrfFdUywXCLpLNJMA_NATPEYBD";
  var RESTAURANTE = "856812dd-462b-461a-9295-c7c3aebb7ab4";

  /* ---------- ESTADO GLOBAL ---------- */

  var pausado = false;
  var encerrada = false;
  var inicioSessao = performance.now();

  /* ---------- SESSÃO ANÔNIMA ----------
     Um número aleatório por visita, para agrupar os registros
     de uma mesma rolada. Não identifica ninguém: nasce ao abrir
     a aba, morre ao fechar, não fica guardado no aparelho.

     É o que permite contar visitas, medir a duração típica e
     montar o funil da home — nada disso sai do dado solto.

     Fica em sessionStorage e não em localStorage justamente
     para NÃO sobreviver: se ficasse, viraria identificador
     permanente do aparelho, que é outra coisa e a gente não
     quer. */
  var SESSAO = (function () {
    var CH = "stadium.sessao";
    try {
      var g = window.sessionStorage.getItem(CH);
      if (g) return g;
    } catch (e) {}
    var novo =
      window.crypto && window.crypto.randomUUID
        ? window.crypto.randomUUID()
        : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
            var r = (Math.random() * 16) | 0;
            return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
          });
    try {
      window.sessionStorage.setItem(CH, novo);
    } catch (e) {}
    return novo;
  })();

  /* ---------- DE ONDE A PESSOA VEIO ----------
     Muda o significado de tudo o que vem depois. Quem escaneou o
     QR da mesa está sentado no salão, com fome, prestes a pedir.
     Quem veio do Instagram está no sofá. São dois comportamentos
     diferentes, e sem esta linha eles caem no mesmo balde.

     Duas fontes, porque uma só não cobre:

     O navegador entrega o site anterior, e isso resolve
     Instagram, Google e afins sozinho. Mas o QR code NÃO tem
     site anterior — a câmera abre o endereço direto, e para o
     navegador isso é idêntico a digitar na mão. Por isso o QR
     precisa do marcador "?de=" no próprio link; é a única forma
     de distinguir salão de acesso digitado.

     Vale por VISITA, não por página: quem entra pelo Instagram e
     depois clica para o cardápio passa a ter o nosso próprio
     site como referência. Sem guardar a origem da primeira
     página, a segunda apagaria a resposta. */
  var ORIGEM = (function () {
    var CH = "stadium.origem";
    try {
      var g = window.sessionStorage.getItem(CH);
      if (g) return g;
    } catch (e) {}

    var valor = detectarOrigem();
    try {
      window.sessionStorage.setItem(CH, valor);
    } catch (e) {}
    return valor;
  })();

  function detectarOrigem() {
    /* 1. Marcador no link. Mandado por nós, então tem prioridade
          sobre qualquer palpite. Limpo antes de guardar: o que
          vem na URL é digitável por qualquer um. */
    var marca = /[?&]de=([^&#]+)/.exec(window.location.search);
    if (marca) {
      var limpo = decodeURIComponent(marca[1])
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "")
        .slice(0, 24);
      if (limpo) return limpo;
    }

    /* 2. Site anterior. */
    var de = document.referrer || "";
    if (!de) return "direto";

    var casa;
    try {
      casa = new URL(de).hostname.replace(/^www\./, "").toLowerCase();
    } catch (e) {
      return "direto";
    }

    /* Navegação dentro do próprio site não é origem nova. Na
       prática o sessionStorage já barra isso; fica como rede de
       segurança para aba aberta em janela nova. */
    if (casa === window.location.hostname) return "direto";

    var CONHECIDOS = [
      [/(^|\.)instagram\.com$|^l\.instagram\.com$/, "instagram"],
      [/(^|\.)facebook\.com$|^l\.facebook\.com$|^lm\.facebook\.com$/, "facebook"],
      [/(^|\.)google\./, "google"],
      [/(^|\.)bing\.com$/, "bing"],
      [/(^|\.)tiktok\.com$/, "tiktok"],
      [/(^|\.)youtube\.com$|^youtu\.be$/, "youtube"],
      [/(^|\.)whatsapp\.com$|^wa\.me$/, "whatsapp"],
      [/(^|\.)linkedin\.com$/, "linkedin"],
      [/^t\.co$|(^|\.)x\.com$|(^|\.)twitter\.com$/, "x"],
      [/(^|\.)ifood\.com\.br$/, "ifood"]
    ];

    for (var i = 0; i < CONHECIDOS.length; i++) {
      if (CONHECIDOS[i][0].test(casa)) return CONHECIDOS[i][1];
    }

    /* Site que não conhecemos: guarda o endereço dele. Descobrir
       que chega gente de um portal de bairro é informação, e
       jogar tudo em "outros" apagaria justamente essa. */
    return casa.slice(0, 40);
  }

  /* ---------- EM QUE APARELHO ----------
     Classificado pelo LADO MENOR da tela, não pela largura. A
     largura muda quando a pessoa vira o celular de lado: um
     telefone deitado tem 844px e seria contado como computador.
     O lado menor não muda com a rotação.

     Não é o campo "layout" que já existe — aquele diz se a grade
     de pratos está em uma ou duas colunas, serve para decidir se
     a medição de prato vale, e nem faz sentido na home ou nas
     unidades, que não têm grade.

     Fica guardado na visita: ninguém troca de aparelho no meio. */
  var APARELHO = (function () {
    var CH = "stadium.aparelho";
    try {
      var g = window.sessionStorage.getItem(CH);
      if (g) return g;
    } catch (e) {}

    var menor = Math.min(
      window.innerWidth || 0,
      window.innerHeight || 0
    );
    var toque = (navigator.maxTouchPoints || 0) > 0;
    var valor;
    if (!menor) valor = "desconhecido";
    else if (menor < 600) valor = "celular";
    else if (menor < 1024 && toque) valor = "tablet";
    else valor = "computador";

    try {
      window.sessionStorage.setItem(CH, valor);
    } catch (e) {}
    return valor;
  })();

  /* Tempo ATIVO acumulado desde a última descarga. Pausa não
     conta — o relógio de inatividade já o interrompe, então a
     duração que chega ao banco é tempo de leitura de verdade,
     não tempo de aba aberta. */
  var ativoDesde = performance.now();
  var ativoAcumulado = 0;

  function fecharAtivo() {
    if (pausado || encerrada) return;
    ativoAcumulado += performance.now() - ativoDesde;
    ativoDesde = performance.now();
  }
  var relogioInatividade = null;
  var painel = null;
  var umaColuna = true;

  function agora() {
    return performance.now();
  }

  /* ---------- MEDIDOR ----------
     Um cronômetro genérico. Existem dois: pratos e categorias.
     Só mudam as travas e de onde vem o nome. */

  function Medidor(tetoParada, tetoTotal, buscarNome) {
    this.tempos = {};
    this.relogio = {};
    this.naTela = {};
    /* Quantas vezes a pessoa VOLTOU a este item nesta visita.
       Fica fora de "tempos" de propósito: aquele mapa é zerado a
       cada descarga, e a contagem de voltas precisa sobreviver a
       ela. Segue a mesma regra dos cliques — acumula, é enviada,
       e só então zera. */
    this.paradas = {};
    this.tetoParada = tetoParada;
    this.tetoTotal = tetoTotal;
    this.buscarNome = buscarNome;
    this.ligado = true;
  }

  Medidor.prototype.registro = function (id, nome) {
    if (!this.tempos[id]) {
      this.tempos[id] = {
        nome: nome || this.buscarNome(id),
        travado: 0,
        bruto: 0
      };
    } else if (this.tempos[id].nome === String(id)) {
      /* nasceu sem nome: conserta assim que alguém souber */
      this.tempos[id].nome = nome || this.buscarNome(id);
    }
    return this.tempos[id];
  };

  /* "continuacao" existe por causa da descarga. A cada 10s os
     cronômetros fecham e reabrem para não mandar tempo repetido —
     mas quem está lendo não saiu do prato. Sem esta distinção,
     alguém parado 30 segundos no mesmo card contaria três voltas
     e o número diria indecisão onde houve leitura calma. */
  Medidor.prototype.abrir = function (id, continuacao) {
    if (pausado || encerrada || !this.ligado) return;
    if (this.relogio[id]) return;
    if (!continuacao) this.paradas[id] = (this.paradas[id] || 0) + 1;
    /* Registro e cronômetro nascem juntos, sempre. O ranking
       percorre os REGISTROS: cronômetro sem registro conta em
       silêncio e não aparece em lugar nenhum. */
    this.registro(id);
    this.relogio[id] = agora();
  };

  Medidor.prototype.fechar = function (id) {
    if (!this.relogio[id]) return;
    var duracao = agora() - this.relogio[id];
    delete this.relogio[id];
    if (duracao <= 0) return;

    var r = this.registro(id);
    r.bruto += duracao;
    r.travado = Math.min(
      r.travado + Math.min(duracao, this.tetoParada),
      this.tetoTotal
    );
  };

  Medidor.prototype.fecharTudo = function () {
    var self = this;
    Object.keys(this.relogio).forEach(function (id) {
      self.fechar(id);
    });
  };

  Medidor.prototype.reabrirVisiveis = function () {
    var self = this;
    Object.keys(this.naTela).forEach(function (id) {
      if (self.naTela[id]) self.abrir(id, true);
    });
  };

  Medidor.prototype.zerar = function () {
    this.tempos = {};
    this.relogio = {};
    if (!pausado && !encerrada) this.reabrirVisiveis();
  };

  /* Soma a parada ainda aberta, para o painel andar ao vivo. Entra
     nas duas colunas: mostrar bruto zerado ao lado de contado
     correndo faz parecer que uma das contas quebrou. */
  Medidor.prototype.instantaneo = function () {
    var self = this;
    var saida = {};
    Object.keys(this.tempos).forEach(function (id) {
      var t = self.tempos[id];
      saida[id] = {
        nome: t.nome,
        travado: t.travado,
        bruto: t.bruto,
        paradas: self.paradas[id] || 0
      };
      if (self.relogio[id] && !pausado) {
        var aberta = agora() - self.relogio[id];
        saida[id].travado = Math.min(
          saida[id].travado + Math.min(aberta, self.tetoParada),
          self.tetoTotal
        );
        saida[id].bruto += aberta;
      }
    });
    return saida;
  };

  /* ---------- AS DUAS INSTÂNCIAS ---------- */

  function nomeDoPrato(id) {
    var card = document.querySelector('[data-prato="' + id + '"]');
    return (card && card.getAttribute("data-prato-nome")) || String(id);
  }

  function nomeDaCategoria(id) {
    var secao = document.getElementById(id);
    var titulo = secao && secao.querySelector(".t-eyebrow");
    return (titulo && titulo.textContent.trim()) || String(id);
  }

  function nomeDaSecao(id) {
    var el = document.querySelector('[data-secao="' + id + '"]');
    var titulo = el && el.querySelector(".t-eyebrow, h2");
    return (titulo && titulo.textContent.trim()) || String(id);
  }

  var pratos = new Medidor(TETO_PARADA_PRATO, TETO_TOTAL_PRATO, nomeDoPrato);
  var categorias = new Medidor(TETO_PARADA_CAT, TETO_TOTAL_CAT, nomeDaCategoria);
  /* Seções da home. Mesma régua da categoria — são blocos altos,
     e o que vale é qual deles ocupa o centro da tela. */
  var secoes = new Medidor(TETO_PARADA_CAT, TETO_TOTAL_CAT, nomeDaSecao);
  var medidores = [pratos, categorias, secoes];

  /* ---------- ALCANCE ----------
     "Quanto tempo olharam" e "até onde desceram" são perguntas
     diferentes, e uma medida só não responde as duas.

     O cronômetro acima é exigente de propósito: a seção só conta
     enquanto está parada na faixa central da tela. Um deslize
     rápido de dedo atravessa um bloco inteiro sem somar um
     milissegundo — e está certo, ninguém leu nada ali.

     Só que para o funil isso mente. Quem passou voando pela
     seção de delivery CHEGOU nela, apenas não parou. Medindo o
     funil pelo cronômetro, um bloco do meio aparece com menos
     alcance que o bloco seguinte — impossível na vida real, e
     quem lesse o painel ia achar que a conta está quebrada. Foi
     exatamente o que apareceu no teste: rolagem em saltos pulou
     "delivery" e a seção seguinte veio com mais gente.

     Então o alcance é medido separado e de um jeito que não tem
     como escapar: assim que o topo da seção entra por baixo da
     tela, está alcançada — e alcançada não volta atrás. Como a
     marca é permanente e vale para tudo que ficou acima, conferir
     de dois em dois segundos basta: qualquer posição mais funda
     já garante todas as anteriores, por mais rápido que se role.

     As duas colunas juntas é que contam a história. Alcance alto
     com tempo baixo não é sucesso: é gente passando reto. */
  var alcancadas = {};

  function marcarAlcance() {
    if (encerrada) return;
    var H = window.innerHeight;

    function varrer(seletor, chaveDe, nomeDe) {
      [].forEach.call(document.querySelectorAll(seletor), function (el) {
        var id = chaveDe(el);
        if (!id || alcancadas[id]) return;
        if (el.getBoundingClientRect().top < H) {
          alcancadas[id] = { nome: nomeDe(id) };
        }
      });
    }

    varrer("[data-secao]", function (el) {
      return el.getAttribute("data-secao");
    }, nomeDaSecao);

    varrer(".categoria", function (el) {
      return el.id;
    }, nomeDaCategoria);
  }

  /* ---------- CLIQUES EM "DETALHES" ----------
     Contagem, não duração: é um ato pontual.

     E é o sinal mais limpo que existe aqui — rolar por cima é
     acidente, apertar "detalhes" é escolha. Só que ele tem dois
     significados opostos e o dado sozinho não separa: pode ser
     "esse prato me interessou" ou "não entendi o que vem nele".

     Cruzado com o tempo de permanência os dois se separam: muito
     tempo e muito clique é interesse; pouco tempo e muito clique
     é descrição ruim. */
  var cliques = {};

  /* Devolve as alcançadas ainda não enviadas e já as marca como
     enviadas. Marcar aqui, e não depois da resposta, é a mesma
     escolha do resto do arquivo: o envio falha calado, e insistir
     custaria mais do que perder uma marca vale. */
  function novasAlcancadas() {
    var saida = {};
    Object.keys(alcancadas).forEach(function (id) {
      if (alcancadas[id].enviado) return;
      saida[id] = { nome: alcancadas[id].nome };
      alcancadas[id].enviado = true;
    });
    return saida;
  }

  function contarClique(id, nome) {
    if (encerrada) return;
    if (!cliques[id]) cliques[id] = { nome: nome || nomeDoPrato(id), n: 0 };
    cliques[id].n += 1;
  }

  /* ---------- AÇÕES DE INTENÇÃO ----------
     Pedir rota e ligar para a loja. É o sinal mais forte que este
     site consegue produzir sem checkout: rolagem e tempo dizem
     interesse, isto aqui diz intenção. Ninguém liga para um
     restaurante sem querer alguma coisa.

     Ficam separadas do clique em "detalhes" e não somadas a ele.
     Misturar as duas estragaria os dois números: "cliques em
     detalhes" viraria um total sem significado, e a intenção
     sumiria dentro de um balde de curiosidade.

     A chave carrega ação e casa juntas ("ligar-barra"), porque
     querer ligar para a Barra e querer ligar para o Recreio são
     perguntas diferentes — e as duas casas competem pela mesma
     visita. */
  var acoes = {};

  var NOME_DA_ACAO = { ligar: "Ligar", chegar: "Como chegar" };

  function contarAcao(acao, onde) {
    if (encerrada) return;
    var id = onde ? acao + "-" + onde : acao;
    if (!acoes[id]) {
      acoes[id] = {
        nome: (NOME_DA_ACAO[acao] || acao) + (onde ? " · " + onde : ""),
        n: 0
      };
    }
    acoes[id].n += 1;
  }

  /* ---------- O QUE PROCURARAM ----------
     O único dado deste site que é QUALITATIVO. Todo o resto é
     contagem; aqui a pessoa escreve, com as palavras dela, o que
     veio buscar.

     E o achado não é "procuraram batata" — batata existe, a
     pessoa achou, sinal zero. O que vale é a busca que voltou
     VAZIA, e ela tem dois significados, os dois acionáveis:

     1. O prato não existe. "Sem glúten", "vegetariano", "porção
        individual". É demanda que a casa não atende.

     2. O prato existe com outro nome — e este cardápio é cheio
        deles. Quem procura "camarão" não acha "Milla Shrimp";
        quem procura "onion rings" não acha "Jabulonion". O prato
        está lá e o cliente conclui que não tem. É venda perdida
        agora, e conserta de graça.

     QUANDO REGISTRAR

     O cardápio avisa a cada 140ms de digitação. Guardar tudo
     encheria o banco de "b", "ba", "bat", "bata". Duas travas
     resolvem: espera a pessoa parar de digitar, e depois colapsa
     termo que é começo do seguinte — quem pausa no meio de
     "batata" gera "bata" e "batata", que são uma busca só. */
  var buscas = {};
  var relogioBusca = null;
  var ultimaBusca = null;

  /* Tira acento, caixa e espaço sobrando, para "Camarão",
     "camarao" e "CAMARÃO " caírem na mesma chave. */
  function normalizarBusca(t) {
    return String(t || "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 60);
  }

  /* Campo de texto livre aceita qualquer coisa, inclusive o que
     ninguém quis mandar. E-mail ou telefone digitado por engano
     no lugar errado não tem por que virar registro. */
  function pareceDadoPessoal(t) {
    return t.indexOf("@") !== -1 || /d{8,}/.test(t.replace(/D/g, ""));
  }

  function registrarBusca(termo, resultados) {
    if (encerrada) return;
    var chave = normalizarBusca(termo);
    if (chave.length < 3) return;
    if (pareceDadoPessoal(chave)) return;

    /* "bata" seguido de "batata" é uma busca só: desfaz a
       anterior antes de contar esta. */
    if (
      ultimaBusca &&
      chave !== ultimaBusca &&
      chave.indexOf(ultimaBusca) === 0 &&
      buscas[ultimaBusca]
    ) {
      buscas[ultimaBusca].n -= 1;
      if (buscas[ultimaBusca].n <= 0) delete buscas[ultimaBusca];
    }

    if (!buscas[chave]) {
      buscas[chave] = { termo: String(termo).slice(0, 60), n: 0, resultados: 0 };
    }
    buscas[chave].n += 1;
    buscas[chave].resultados = resultados;
    ultimaBusca = chave;
  }

  /* ---------- ÁREA QUE CONTA ----------
     O navegador mede "quanto do card está visível" contra a
     janela inteira — e ele NÃO sabe que existem barras fixas por
     cima. O header e a barra de categorias tapam o topo; a
     navegação inferior tapa a base.

     Sem esta correção, um card podia estar 60% "dentro da janela"
     e ao mesmo tempo escondido inteiro atrás do header. Contava
     como lido sem a pessoa ter visto nada.

     rootMargin negativo encolhe a área de referência para só a
     faixa realmente descoberta. Medido em tempo de execução, e
     não com número fixo, porque a barra de categorias muda de
     altura quando a busca abre e a navegação inferior muda com a
     área segura do aparelho. */
  /* Os dois limites, em pixels, da faixa que a pessoa enxerga. */
  function faixa() {
    var topo = 0;
    var base = 0;

    [".topbar", ".menu-categorias"].forEach(function (sel) {
      var el = document.querySelector(sel);
      if (el) topo += el.getBoundingClientRect().height;
    });

    var nav = document.querySelector(".bottomnav");
    if (nav) base += nav.getBoundingClientRect().height;

    /* O painel de prova também tapa. Só existe no modo de teste,
       mas descontá-lo faz o que você vê contando bater com o que
       está de fato descoberto — senão o próprio painel mente. */
    if (painel) base += painel.getBoundingClientRect().height;

    return { topo: topo, base: window.innerHeight - base };
  }

  function margemDaRaiz() {
    var f = faixa();
    return (
      "-" + Math.round(f.topo) + "px 0px -" +
      Math.round(window.innerHeight - f.base) + "px 0px"
    );
  }

  /* Quanto de um card está dentro da faixa descoberta, de 0 a 1. */
  function fracaoVisivel(el) {
    var f = faixa();
    var r = el.getBoundingClientRect();
    if (!r.height) return 0;
    var dentro = Math.max(0, Math.min(r.bottom, f.base) - Math.max(r.top, f.topo));
    return dentro / r.height;
  }

  /* Uma seção conta quando cruza a faixa central da tela — mesma
     régua do scrollspy, e a única que serve para um bloco mais
     alto que a janela. */
  function noCentro(el) {
    var H = window.innerHeight;
    var r = el.getBoundingClientRect();
    return r.top < H * 0.45 && r.bottom > H * 0.4;
  }

  /* ---------- CONFERÊNCIA ----------
     Rede de segurança, e não redundância: o cronômetro só fecha
     quando o navegador AVISA que o elemento saiu. Se o aviso não
     chega — rolagem muito rápida, aba estrangulada pelo sistema,
     página que parou de gerar quadros — o cronômetro fica aberto
     e o prato conta escondido, fora da tela.

     Foi exatamente isso que apareceu no teste: um prato com 0% de
     área descoberta continuava somando. Aqui a verdade é medida
     na régua, não recebida de aviso. */
  function conferir(medidor, elementos, chave, merece) {
    [].forEach.call(elementos, function (el) {
      var id = chave(el);
      var devia = merece(el);
      var esta = !!medidor.relogio[id];
      if (devia === esta) return;

      /* Corrige nos DOIS sentidos, e o segundo é tão necessário
         quanto o primeiro: só fechar deixaria o cronômetro morto
         para sempre, porque o navegador não reavisa um elemento
         que continua parado na mesma posição. */
      medidor.naTela[id] = devia;
      if (devia) medidor.abrir(id);
      else medidor.fechar(id);
    });
  }

  function conferirAbertos() {
    if (pausado || encerrada) return;

    marcarAlcance();

    if (pratos.ligado) {
      conferir(
        pratos,
        document.querySelectorAll("[data-prato]"),
        function (el) {
          return el.getAttribute("data-prato");
        },
        function (el) {
          return fracaoVisivel(el) >= VISIVEL;
        }
      );
    }

    conferir(
      categorias,
      document.querySelectorAll(".categoria"),
      function (el) {
        return el.id;
      },
      noCentro
    );

    conferir(
      secoes,
      document.querySelectorAll("[data-secao]"),
      function (el) {
        return el.getAttribute("data-secao");
      },
      noCentro
    );
  }

  /* ---------- LAYOUT ----------
     Lê a grade de verdade, não a largura da tela: se um dia o
     ponto de quebra mudar no CSS, esta conta continua certa. */
  function medirLayout() {
    var grade = document.querySelector(".container-produto");
    if (!grade) return true;
    var colunas = window.getComputedStyle(grade).gridTemplateColumns;
    return String(colunas).trim().split(/\s+/).length <= 1;
  }

  function aplicarLayout() {
    umaColuna = medirLayout();
    pratos.ligado = umaColuna;
    if (!umaColuna) {
      pratos.fecharTudo();
      pratos.tempos = {};
    }
  }

  /* ---------- PAUSA E RETOMADA ---------- */

  function pausarTudo() {
    if (pausado) return;
    fecharAtivo();
    pausado = true;
    medidores.forEach(function (m) {
      m.fecharTudo();
    });
    desenharPainel();
  }

  function retomarTudo() {
    if (!pausado || encerrada) return;
    pausado = false;
    ativoDesde = agora();
    medidores.forEach(function (m) {
      m.reabrirVisiveis();
    });
    desenharPainel();
  }

  function encerrarSessao() {
    if (encerrada) return;
    fecharAtivo();
    medidores.forEach(function (m) {
      m.fecharTudo();
    });
    encerrada = true;
    pausado = true;
    salvar();
    desenharPainel();
  }

  function marcarAtividade() {
    if (encerrada) return;
    if (agora() - inicioSessao > SESSAO_MAX) {
      encerrarSessao();
      return;
    }
    if (pausado) retomarTudo();
    clearTimeout(relogioInatividade);
    relogioInatividade = setTimeout(pausarTudo, INATIVIDADE);
  }

  /* ---------- OBSERVADORES ----------
     O cardápio é redesenhado inteiro a cada busca e a cada troca
     de idioma, então os elementos de antes deixam de existir. Por
     isso os observadores são refeitos, não criados uma vez só. */

  var obsPratos = null;
  var obsCategorias = null;

  function observarTudo() {
    aplicarLayout();

    if (obsPratos) obsPratos.disconnect();
    if (obsCategorias) obsCategorias.disconnect();
    medidores.forEach(function (m) {
      m.fecharTudo();
      m.naTela = {};
    });

    /* ----- PRATOS -----
       CUIDADO: NÃO use "isIntersecting". Ele é verdadeiro assim
       que o elemento aparece nem que seja por 1 pixel — o
       "threshold" só decide QUANDO o navegador avisa, não a
       partir de quanto conta. Com isIntersecting, card espiando
       na borda acumulava tempo como se estivesse sendo lido. */
    var cards = document.querySelectorAll("[data-prato]");
    if (cards.length && pratos.ligado) {
      obsPratos = new IntersectionObserver(
        function (entradas) {
          entradas.forEach(function (e) {
            var id = e.target.getAttribute("data-prato");
            pratos.registro(id, e.target.getAttribute("data-prato-nome"));
            if (e.intersectionRatio >= VISIVEL) {
              pratos.naTela[id] = true;
              pratos.abrir(id);
            } else {
              pratos.naTela[id] = false;
              pratos.fechar(id);
            }
          });
          desenharPainel();
        },
        /* O 0.5 é a regra; o 0 garante o aviso de saída quando o
           card deixa a tela de uma vez, sem passar pelo meio.
           E a margem tira as barras fixas da conta: 50% do card
           tem de estar na faixa DESCOBERTA, não na janela crua. */
        { threshold: [0, VISIVEL], rootMargin: margemDaRaiz() }
      );
      cards.forEach(function (c) {
        obsPratos.observe(c);
      });
    }

    /* ----- CATEGORIAS E SEÇÕES DA HOME -----
       Régua diferente, e por necessidade: um bloco desses é mais
       alto que a tela e nunca chegaria a 50% visível. Aqui vale
       quem ocupa a faixa central — só um por vez, zero diluição.

       A home usa exatamente a mesma régua: as seções dela são
       blocos altos como as categorias do cardápio. */
    var blocos = [];
    document.querySelectorAll(".categoria").forEach(function (el) {
      blocos.push({ el: el, medidor: categorias, id: el.id });
    });
    document.querySelectorAll("[data-secao]").forEach(function (el) {
      blocos.push({ el: el, medidor: secoes, id: el.getAttribute("data-secao") });
    });

    if (blocos.length) {
      var porElemento = new Map();
      blocos.forEach(function (b) {
        porElemento.set(b.el, b);
      });

      obsCategorias = new IntersectionObserver(
        function (entradas) {
          entradas.forEach(function (e) {
            var b = porElemento.get(e.target);
            if (!b) return;
            b.medidor.registro(b.id);
            if (e.isIntersecting) {
              b.medidor.naTela[b.id] = true;
              b.medidor.abrir(b.id);
            } else {
              b.medidor.naTela[b.id] = false;
              b.medidor.fechar(b.id);
            }
          });
          desenharPainel();
        },
        { rootMargin: FAIXA_CENTRO, threshold: 0 }
      );
      blocos.forEach(function (b) {
        obsCategorias.observe(b.el);
      });
    }
  }

  /* ---------- GUARDA ---------- */

  function ler() {
    try {
      var cru = window.localStorage.getItem(CHAVE);
      if (cru) {
        var d = JSON.parse(cru);
        if (d && d.pratos && d.categorias) return d;
      }
    } catch (e) {
      /* ignora e começa do zero */
    }
    return { pratos: {}, categorias: {}, secoes: {}, sessoes: 0, layout: {} };
  }

  function somar(destino, medidor) {
    var atual = medidor.instantaneo();
    Object.keys(atual).forEach(function (id) {
      var a = destino[id] || { travado: 0, bruto: 0 };
      destino[id] = {
        nome: atual[id].nome,
        travado: a.travado + atual[id].travado,
        bruto: a.bruto + atual[id].bruto
      };
    });
  }

  /* ---------- ENVIO ----------
     Manda o acumulado desde o último envio — um DELTA, não o
     total. É o que permite o servidor apenas somar o que chega,
     sem precisar saber nada sobre sessões nem correr risco de
     contar duas vezes.

     sendBeacon e não fetch: quando a pessoa fecha a aba, uma
     requisição comum morre no meio. O beacon é entregue pelo
     navegador mesmo com a página já fechando.

     Falha em silêncio de propósito: sem servidor, o site
     continua funcionando igual e a medição segue no aparelho. */
  /* Achata o pacote em uma linha por item medido, que é o
     formato da tabela. Item sem tempo nenhum é descartado aqui,
     e não no banco: numa visita típica só uns cinco pratos
     acumulam algo, então mandar os 129 seria 25x mais tráfego
     para guardar zero. */
  function linhas(pacote) {
    var saida = [];

    /* TODAS as linhas do lote precisam ter EXATAMENTE as mesmas
       chaves. Não é capricho de estilo: o PostgREST recusa o
       lote inteiro com "All object keys must match" se uma linha
       tiver um campo que a outra não tem.

       Como prato leva tempo e clique leva contagem, sem esta
       função em comum o lote misto vinha com formatos
       diferentes e ia inteiro para o lixo — em silêncio, porque
       o envio falha calado de propósito. */
    function linha(tipo, chave, nome, travado, bruto, cliques, resultados, paradas) {
      return {
        restaurante_id: RESTAURANTE,
        sessao: SESSAO,
        /* Repetida em toda linha de propósito. Poderia viver só
           na linha de sessão e ser cruzada depois, mas o destino
           deste dado é virar planilha achatada para análise — e
           planilha quer a dimensão em cada linha, senão não dá
           para filtrar "o que quem veio da mesa olhou". */
        origem: ORIGEM,
        aparelho: APARELHO,
        quando: pacote.quando,
        pagina: pacote.pagina,
        layout: pacote.layout,
        tipo: tipo,
        chave: String(chave),
        nome: nome || String(chave),
        travado_ms: Math.round(travado || 0),
        bruto_ms: Math.round(bruto || 0),
        cliques: cliques || 0,
        /* Só a busca preenche. Vai em toda linha mesmo assim
           porque o PostgREST recusa o lote inteiro se uma linha
           tiver campo que a outra não tem. */
        resultados: resultados === undefined ? null : resultados,
        paradas: paradas === undefined ? null : paradas
      };
    }

    /* Item sem tempo é descartado aqui, e não no banco: numa
       visita típica só uns cinco pratos acumulam algo, então
       mandar os 129 seria 25x mais tráfego para guardar zero. */
    function juntar(mapa, tipo) {
      Object.keys(mapa || {}).forEach(function (chave) {
        var r = mapa[chave];
        if (!r.travado || r.travado < 100) return;
        saida.push(linha(tipo, chave, r.nome, r.travado, r.bruto, 0, undefined, r.paradas || 0));
      });
    }

    juntar(pacote.pratos, "prato");
    juntar(pacote.categorias, "categoria");
    juntar(pacote.secoes, "secao");

    /* Alcance é marca, não duração: os tempos vão zerados de
       propósito. Quem conta é a existência da linha. */
    Object.keys(pacote.alcance || {}).forEach(function (chave) {
      saida.push(linha("alcance", chave, pacote.alcance[chave].nome, 0, 0, 0));
    });

    /* Quantas vezes o termo foi procurado, e quantos pratos
       apareceram. Zero resultados é o achado; o resto é contexto. */
    Object.keys(pacote.buscas || {}).forEach(function (chave) {
      var b = pacote.buscas[chave];
      if (!b.n) return;
      saida.push(linha("busca", chave, b.termo, 0, 0, b.n, b.resultados));
    });

    /* Uma linha por descarga com o tempo ativo. E a base de
       "quantas visitas" e "quanto dura uma visita". */
    if (pacote.ativo_ms > 500) {
      saida.push(linha("sessao", "total", pacote.pagina, pacote.ativo_ms, pacote.ativo_ms, 0));
    }

    Object.keys(pacote.cliques || {}).forEach(function (chave) {
      var c = pacote.cliques[chave];
      if (!c.n) return;
      saida.push(linha("clique", chave, c.nome, 0, 0, c.n));
    });

    /* Contagem, como o clique em detalhes: pedir rota é ato
       pontual, não tem duração. */
    Object.keys(pacote.acoes || {}).forEach(function (chave) {
      var a = pacote.acoes[chave];
      if (!a.n) return;
      saida.push(linha("acao", chave, a.nome, 0, 0, a.n));
    });

    return saida;
  }

  /* "keepalive" no lugar de sendBeacon, e a diferença importa.
     Os dois sobrevivem ao fechamento da aba — que é o motivo de
     existirem, porque uma requisição comum morre no meio e o
     dado da última tela se perderia.

     Mas o sendBeacon envia SEMPRE em modo "com credenciais", e
     o navegador proíbe esse modo quando o servidor libera
     qualquer origem, que é o caso aqui. Dava erro de CORS e
     nenhum dado saía. O fetch deixa escolher, e de quebra
     aceita cabeçalhos: a chave vai no cabeçalho em vez da URL,
     onde ficaria registrada em log de servidor.

     Falha em silêncio de propósito: sem rede, sem banco ou com
     o projeto pausado, o site funciona igual e a medição
     continua guardada no aparelho. */
  function enviar(pacote) {
    if (!BANCO || !window.fetch) return;
    var corpo = linhas(pacote);
    if (!corpo.length) return;

    try {
      window.fetch(BANCO + "/rest/v1/evento", {
        method: "POST",
        mode: "cors",
        credentials: "omit",
        keepalive: true,
        headers: {
          "Content-Type": "application/json",
          apikey: CHAVE_PUBLICA,
          Authorization: "Bearer " + CHAVE_PUBLICA,
          Prefer: "return=minimal"
        },
        body: JSON.stringify(corpo)
      })["catch"](function () {
        /* sem coleta: segue a vida */
      });
    } catch (e) {
      /* idem */
    }
  }

  function salvar() {
    /* Antes de fotografar, atualiza o alcance: uma visita curta
       pode acabar entre duas conferências, e sem esta linha ela
       sairia sem ter alcançado nada. */
    marcarAlcance();

    /* O carimbo de hora não é enfeite: sem ele o histórico nasce
       sem eixo de tempo e "últimos 7 dias" ou "de tal data a tal
       data" viram impossíveis — e não dá para recuperar depois.
       Vai em UTC; quem exibe converte para o fuso de quem lê.

       A página também vai junto, senão home e cardápio caem no
       mesmo balaio e não dá para separar o que é de cada uma. */
    var delta = {
      quando: new Date().toISOString(),
      pagina: window.location.pathname.split("/").pop() || "index.html",
      pratos: pratos.instantaneo(),
      categorias: categorias.instantaneo(),
      secoes: secoes.instantaneo(),
      cliques: cliques,
      acoes: acoes,
      buscas: buscas,
      /* Só o que ainda não foi mandado. A marca é permanente na
         sessão; reenviar a cada descarga encheria o banco de
         linha repetida para não mudar conta nenhuma. */
      alcance: novasAlcancadas(),
      /* Tempo ativo desde a ultima descarga. Somando as linhas de
         uma sessao tem-se a duracao real da visita — ja sem as
         pausas, porque o tempo parado nunca entrou na conta. */
      ativo_ms: ativoAcumulado + (pausado || encerrada ? 0 : agora() - ativoDesde),
      layout: umaColuna ? "umaColuna" : "multiColuna"
    };
    enviar(delta);
    cliques = {};
    acoes = {};
    buscas = {};
    ultimaBusca = null;
    ativoAcumulado = 0;

    var guardado = ler();
    somar(guardado.pratos, pratos);
    somar(guardado.categorias, categorias);
    guardado.secoes = guardado.secoes || {};
    somar(guardado.secoes, secoes);

    guardado.sessoes = (guardado.sessoes || 0) + 1;
    guardado.layout = guardado.layout || {};
    var chave = umaColuna ? "umaColuna" : "multiColuna";
    guardado.layout[chave] = (guardado.layout[chave] || 0) + 1;

    try {
      window.localStorage.setItem(CHAVE, JSON.stringify(guardado));
    } catch (e) {
      /* aba anônima ou armazenamento cheio: perde o acúmulo, mas
         a medição da sessão segue funcionando */
    }

    /* zera o acumulado da sessão para não somar duas vezes */
    medidores.forEach(function (m) {
      m.fecharTudo();
      m.tempos = {};
      m.paradas = {};
      if (!pausado && !encerrada) m.reabrirVisiveis();
    });
  }

  /* Fecha a aba: requisição normal morreria no meio. Hoje é só
     localStorage, mas o gancho já é o certo — navigator.sendBeacon()
     entra exatamente aqui quando houver servidor, e é o único jeito
     confiável de entregar com a página fechando. */
  function aoSair() {
    medidores.forEach(function (m) {
      m.fecharTudo();
    });
    salvar();
  }

  /* ---------- PAINEL DE PROVA ---------- */

  function segundos(ms) {
    return (ms / 1000).toFixed(1) + "s";
  }

  function ranking(medidor, guardadas) {
    var junto = {};
    Object.keys(guardadas).forEach(function (id) {
      junto[id] = {
        nome: guardadas[id].nome,
        travado: guardadas[id].travado,
        bruto: guardadas[id].bruto
      };
    });
    var atual = medidor.instantaneo();
    Object.keys(atual).forEach(function (id) {
      if (!junto[id]) junto[id] = { nome: atual[id].nome, travado: 0, bruto: 0 };
      junto[id].nome = atual[id].nome;
      junto[id].travado += atual[id].travado;
      junto[id].bruto += atual[id].bruto;
    });

    return Object.keys(junto)
      .map(function (id) {
        return junto[id];
      })
      .filter(function (p) {
        return p.travado > 0;
      })
      .sort(function (a, b) {
        return b.travado - a.travado;
      });
  }

  function tabela(lista, limite) {
    if (!lista.length) return '<tr><td colspan="4">rolando…</td></tr>';
    return lista
      .slice(0, limite)
      .map(function (p, i) {
        return (
          "<tr><td>" + (i + 1) + "</td><td>" + p.nome +
          "</td><td>" + segundos(p.travado) +
          '</td><td class="cru">' + segundos(p.bruto) + "</td></tr>"
        );
      })
      .join("");
  }

  function desenharPainel() {
    if (!painel) return;
    var guardado = ler();
    var estado = encerrada ? "encerrada" : pausado ? "PAUSADO" : "medindo";

    painel.querySelector("[data-estado]").textContent = estado;
    painel.querySelector("[data-layout]").textContent = umaColuna
      ? "1 coluna — medindo pratos"
      : "2 colunas — PRATOS FORA";
    painel.querySelector("[data-cat]").innerHTML = tabela(
      ranking(categorias, guardado.categorias),
      6
    );
    painel.querySelector("[data-pra]").innerHTML = umaColuna
      ? tabela(ranking(pratos, guardado.pratos), 8)
      : '<tr><td colspan="4">descartado nesta largura</td></tr>';

    painel.querySelector("[data-sec]").innerHTML = tabela(
      ranking(secoes, guardado.secoes || {}),
      6
    );

    /* Cliques são contagem, não tempo: tabela própria. */
    var listaCli = Object.keys(cliques)
      .map(function (id) {
        return cliques[id];
      })
      .sort(function (a, b) {
        return b.n - a.n;
      })
      .slice(0, 6);
    painel.querySelector("[data-cli]").innerHTML = listaCli.length
      ? listaCli
          .map(function (c, i) {
            return (
              "<tr><td>" + (i + 1) + "</td><td>" + c.nome +
              "</td><td>" + c.n + "x</td><td></td></tr>"
            );
          })
          .join("")
      : '<tr><td colspan="4">nenhum ainda</td></tr>';
  }

  function montarPainel() {
    painel = document.createElement("div");
    painel.className = "metricas-painel";
    painel.innerHTML =
      '<div class="metricas-painel__topo">' +
      "<strong>Atenção</strong>" +
      "<span data-estado>medindo</span>" +
      '<button type="button" data-zerar>zerar</button>' +
      "</div>" +
      '<p class="metricas-painel__layout" data-layout></p>' +
      '<table><thead><tr><th colspan="4">por seção</th></tr></thead>' +
      "<tbody data-sec></tbody>" +
      '<thead><tr><th colspan="4">por categoria</th></tr></thead>' +
      "<tbody data-cat></tbody>" +
      '<thead><tr><th colspan="4">por prato</th></tr></thead>' +
      "<tbody data-pra></tbody>" +
      '<thead><tr><th colspan="4">cliques em detalhes</th></tr></thead>' +
      "<tbody data-cli></tbody></table>";

    painel.querySelector("[data-zerar]").addEventListener("click", function () {
      try {
        window.localStorage.removeItem(CHAVE);
      } catch (e) {}
      medidores.forEach(function (m) {
        m.zerar();
      });
      desenharPainel();
    });

    document.body.appendChild(painel);
    setInterval(desenharPainel, 500);
  }

  /* ---------- PARTIDA ---------- */

  function iniciar() {
    if (!window.IntersectionObserver) return;
    var area = document.querySelector("[data-cardapio]");
    /* Roda no cardápio e também na home. Página sem nenhum dos
       dois não tem o que medir. */
    if (!area && !document.querySelector("[data-secao]")) return;

    observarTudo();

    /* Duas listas nascem depois do HTML e são refeitas na troca
       de idioma: os pratos do cardápio e os cards das unidades.
       A home não muda, então não entra aqui.

       Sem isto o observador nasceria apontando para blocos que
       ainda não existem. A conferência de dois em dois segundos
       até salvaria a medição sozinha, mas com atraso — e o
       alcance de quem só passa os olhos e sai se perderia. */
    if (window.MutationObserver) {
      [area, document.querySelector("[data-unidades]")].forEach(function (lista) {
        if (lista) {
          new MutationObserver(observarTudo).observe(lista, { childList: true });
        }
      });
    }

    /* O cardápio avisa a cada 140ms de digitação. Esta folga
       maior é o que separa a palavra terminada do caminho até
       ela: sem ela, "batata" chegaria como seis registros. */
    document.addEventListener("stadium:busca", function (evento) {
      var d = evento.detail || {};
      clearTimeout(relogioBusca);
      relogioBusca = setTimeout(function () {
        registrarBusca(d.termo, d.resultados);
      }, 1200);
    });

    /* Ligar e pedir rota. Delegado no documento porque os cards
       das unidades são refeitos na troca de idioma — ouvinte preso
       ao botão morreria no primeiro redesenho.

       Vem antes do de "detalhes" e não interfere: são seletores
       diferentes e nenhum dos dois cancela o evento, então o link
       segue abrindo normalmente. */
    document.addEventListener("click", function (evento) {
      var alvo = evento.target.closest && evento.target.closest("[data-acao]");
      if (!alvo) return;
      contarAcao(
        alvo.getAttribute("data-acao"),
        alvo.getAttribute("data-acao-onde")
      );
      /* "tel:" e o mapa saem da página na hora. Descarrega já,
         senão a contagem morre esperando os 10 segundos. */
      salvar();
    });

    /* Clique em "detalhes", delegado no documento para continuar
       valendo depois de qualquer redesenho. */
    document.addEventListener("click", function (evento) {
      var botao = evento.target.closest && evento.target.closest(".btn-detalhes");
      if (!botao) return;
      var card = botao.closest("[data-prato]");
      if (!card) return;
      contarClique(
        card.getAttribute("data-prato"),
        card.getAttribute("data-prato-nome")
      );
    });

    /* Girar o celular ou redimensionar a janela muda o número de
       colunas — e com ele, se prato entra ou não na conta. */
    window.addEventListener("resize", function () {
      var antes = umaColuna;
      aplicarLayout();
      if (antes !== umaColuna) observarTudo();
    });

    ["scroll", "touchstart", "pointerdown", "keydown"].forEach(function (evt) {
      window.addEventListener(evt, marcarAtividade, { passive: true });
    });
    marcarAtividade();

    /* Trocou de aplicativo: o navegador continuaria achando que o
       card está visível. Sem isto, dez minutos no WhatsApp viram
       dez minutos de atenção num prato. */
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        pausarTudo();
        salvar();
      } else {
        marcarAtividade();
      }
    });

    window.addEventListener("pagehide", aoSair);

    /* A cada 2s, confere se quem está com cronômetro aberto ainda
       merece. Barato: percorre só os abertos, que são meia dúzia. */
    setInterval(conferirAbertos, 2000);

    /* Descarrega o acumulado de tempos em tempos, e não só ao
       fechar a aba. Sem isto, quem estivesse acompanhando de outro
       aparelho só veria o dado depois que a pessoa saísse — e uma
       visita longa não apareceria em lugar nenhum. */
    setInterval(function () {
      if (!encerrada) salvar();
    }, 10000);

    if (/[?&]metricas=1/.test(window.location.search)) {
      montarPainel();
      /* O painel nasce depois dos observadores, e ele tapa a base
         da tela. Refaz a conta da área agora que ele existe. */
      observarTudo();
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    setTimeout(iniciar, 0);
  });
})(window, document);
