/* =========================================================
   STADIUM STEAKHOUSE — CARDÁPIO
   Monta as categorias, os cards de prato, o acordeão de
   detalhes e a barra de categorias que acompanha a rolagem.

   Os dados vêm de assets/js/cardapio-dados.js, que já traz
   descrição, "serve" e "acompanhamentos" em pt, en e es.
   ========================================================= */

(function (window, document) {
  "use strict";

  var STADIUM = window.STADIUM || {};
  var i18n = STADIUM.i18n;
  var el = STADIUM.el;
  var icone = STADIUM.icone;
  var marcarPreco = STADIUM.marcarPreco;

  /* Taxonomia da casa. O nome da seção é patrimônio da marca e
     não se traduz (o guia é explícito: reutilizar, nunca
     renomear). O rótulo curto da pill, sim — ele é funcional. */
  var CATEGORIAS = [
    {
      id: "aquecimento",
      titulo: "Aquecimento e Primeiro Tempo",
      nav: { pt: "Aquecimentos", en: "Starters", es: "Entradas" }
    },
    {
      id: "bebidas",
      titulo: "Bebidas",
      nav: { pt: "Bebidas", en: "Drinks", es: "Bebidas" }
    },
    {
      id: "carnes",
      titulo: "As Lendas e Fenômenos",
      nav: { pt: "Carnes", en: "Steaks", es: "Carnes" }
    },
    /* No cardápio impresso os compartilhados vêm depois dos
       drinks, no fim de tudo. Aqui eles sobem para logo depois
       das carnes.

       Motivo: são os pratos mais caros da casa (R$ 229 a 259) e
       são carne. Quem está lendo "Picanha, R$ 119,90" é
       exatamente quem pode trocar por uma Patada Atômica de
       600g para a mesa — e no fim da lista, depois dos drinks,
       essa pessoa nunca chega. Ordem de leitura no celular é
       ordem de venda.

       Se preferir fiel ao papel, é só mover este bloco para
       depois de "drinks". */
    {
      id: "compartilhados",
      titulo: "Pratos Compartilhados",
      nav: { pt: "Compartilhados", en: "To share", es: "Para compartir" },
      nota: {
        pt: "Escolha dois acompanhamentos e um molho.",
        en: "Choose two sides and one sauce.",
        es: "Elija dos guarniciones y una salsa."
      }
    },
    {
      id: "frangosPeixes",
      titulo: "A Segurança dos Goleiros",
      nav: { pt: "Frango e peixes", en: "Chicken and fish", es: "Pollo y pescado" }
    },
    {
      id: "pastas",
      titulo: "Azzurra",
      nav: { pt: "Massas", en: "Pasta", es: "Pastas" }
    },
    {
      id: "kids",
      titulo: "Dente de Leite",
      nav: { pt: "Kids", en: "Kids", es: "Infantil" },
      /* Regra que vale para a seção inteira, não para um prato.
         Repetir isto em cada card seria ruído; some do card e
         vira uma linha só, embaixo do título da categoria. */
      nota: {
        pt: "Menu exclusivo para crianças de até 12 anos.",
        en: "Menu for children up to 12 years old only.",
        es: "Menú exclusivo para niños de hasta 12 años."
      }
    },
    {
      id: "hamburgueres",
      titulo: "Os Artilheiros Letais",
      nav: { pt: "Burgers", en: "Burgers", es: "Hamburguesas" }
    },
    {
      id: "saladas",
      titulo: "Saladas",
      nav: { pt: "Saladas", en: "Salads", es: "Ensaladas" }
    },
    {
      id: "prorrogacao",
      titulo: "Prorrogação",
      nav: { pt: "Sobremesas", en: "Desserts", es: "Postres" }
    },
    {
      id: "assistencias",
      titulo: "Assistências",
      nav: { pt: "Acompanhamentos", en: "Sides", es: "Guarniciones" },
      nota: {
        pt: "Escolha seus acompanhamentos.",
        en: "Choose your sides.",
        es: "Elija sus guarniciones."
      },
      /* Acompanhamento não tem foto e não precisa: a lista é
         longa e o que a pessoa faz aqui é varrer nomes, não
         admirar prato. Sem foto e sem descrição na cara, o card
         encolhe para uma linha e os vinte itens cabem na tela
         quase de uma vez. A descrição fica atrás do botão. */
      semFoto: true
    },
    {
      id: "drinks",
      titulo: "Drinks",
      nav: { pt: "Drinks", en: "Cocktails", es: "Tragos" }
    }
  ];

  /* =========================================================
     FOTOS PROVISÓRIAS — REMOVER QUANDO AS REAIS CHEGAREM
     =========================================================
     Só entram em pratos que ainda não têm "imagem" própria em
     cardapio-dados.js. Assim que um prato ganhar a foto dele,
     ela manda e este mapa é ignorado para aquele item.

     As fotos giram dentro da categoria, para dois pratos
     vizinhos não saírem iguais.

     Fora do mapa de propósito: a foto da feijoada (marca de
     outro restaurante visível no pote), a barca de sushi
     (não existe no cardápio) e três arquivos abaixo de 300px,
     que ficariam borrados no card grande.
     ========================================================= */
  var FOTOS_TESTE = {
    aquecimento: ["prod-test-10", "prod-test-05", "prod-test-01"],
    bebidas: ["prod-test-11", "prod-test-13", "prod-test-12"],
    carnes: ["prod-test-01", "prod-test-06", "prod-test-03"],
    frangosPeixes: ["prod-test-03", "prod-test-06", "prod-test-04"],
    pastas: ["prod-test-06", "prod-test-03", "prod-test-01"],
    kids: ["prod-test-05", "prod-test-04", "prod-test-03"],
    hamburgueres: ["prod-test-05", "prod-test-05", "prod-test-05"],
    saladas: ["prod-test-04", "prod-test-03", "prod-test-06"],
    prorrogacao: ["prod-test-10", "prod-test-01", "prod-test-05"],
    assistencias: ["prod-test-10", "prod-test-04", "prod-test-05"],
    drinks: ["prod-test-12", "prod-test-13", "prod-test-11"]
  };

  var EXTENSAO_TESTE = {
    "prod-test-11": "png",
    "prod-test-12": "png",
    "prod-test-13": "webp"
  };

  function fotoDeTeste(categoria, indice) {
    var lista = FOTOS_TESTE[categoria];
    if (!lista || !lista.length) return null;
    var nome = lista[indice % lista.length];
    return (
      "assets/img/produtos/" + nome + "." + (EXTENSAO_TESTE[nome] || "jpeg")
    );
  }

  /* Até quantos extras por prato o cardápio procura. Aumente
     se algum prato precisar de mais linhas de extra. */
  var LIMITE_EXTRAS = 6;

  /* Escolhe o campo do idioma atual num dado que usa sufixo
     (descricao_pt / descricao_en / descricao_es). */
  function porSufixo(prato, base) {
    var valor = prato[base + "_" + i18n.atual()];
    if (valor === undefined || valor === "") valor = prato[base + "_pt"];
    return valor || "";
  }

  /* ---------- PRATOS COM MAIS DE UM PREÇO ----------
     Alguns produtos não têm preço único: as wings saem em 5, 10
     ou 20 unidades, e o chope vai variar por marca e tamanho.
     Nesses casos o prato traz "precos" no lugar de "preco", e o
     card mostra o menor valor com "a partir de" — as opções
     inteiras aparecem ao abrir os detalhes.

     Card com três preços empilhados no rodapé perderia a
     leitura de relance, que é o que faz o cardápio funcionar. */

  /* "R$ 109,90" -> 109.9, para achar o menor da lista. */
  function valorNumerico(preco) {
    var limpo = String(preco)
      .replace(/[^\d.,]/g, "")
      .replace(/\.(?=\d{3}\b)/g, "")
      .replace(",", ".");
    var n = parseFloat(limpo);
    return isNaN(n) ? Infinity : n;
  }

  function temVariacoes(prato) {
    return !!(prato.precos && prato.precos.length);
  }

  function menorPreco(prato) {
    var barato = prato.precos[0];
    prato.precos.forEach(function (opcao) {
      if (valorNumerico(opcao.valor) < valorNumerico(barato.valor)) {
        barato = opcao;
      }
    });
    return barato.valor;
  }

  /* ---------- CARD DE PRATO ---------- */

  function montarCard(prato, indice, categoria) {
    /* Card enxuto: sem foto, sem descrição na cara, e sem preço
       quando o item não tem um. Sobra o nome e o botão. */
    var enxuto = !!(categoria && categoria.semFoto);

    /* Bebida alcoólica ganha o card bordô e o aviso legal.
       "on-dark" é a mesma classe que o resto do site usa para
       ilha escura, então texto, preço e etiquetas já vêm com a
       paleta certa sem regra nova. */
    var card = el(
      "article",
      "card-produto" +
        (enxuto ? " card-produto--enxuto" : "") +
        (prato.alcoolico ? " card-produto--alcool on-dark" : "")
    );
    var idPainel = "detalhes-" + prato.id;

    if (!enxuto) {
      /* Os dados ainda apontam todos para o mesmo "imagem-teste":
         nesse caso entra a foto provisória da categoria. Quando o
         prato ganhar a foto real, ela passa a mandar. */
      var caminho = String(prato.imagem || "").replace(/^\.\//, "");
      if (!caminho || caminho.indexOf("imagem-teste") !== -1) {
        caminho = fotoDeTeste(prato.categoria, indice) || caminho;
      }

      if (caminho) {
        var foto = el("div", "card-foto");
        var img = el("img");
        img.src = caminho;
        img.alt = prato.nome;
        img.loading = "lazy";
        foto.appendChild(img);
        card.appendChild(foto);
      }
    }

    var corpo = el("div", "card-corpo");

    if (enxuto) {
      /* Ícone colado no nome, não solto no card: os dois são a
         mesma informação, e juntos podem quebrar de linha sem o
         nome escorregar para debaixo do ícone. */
      var titulo = el("div", "card-enxuto__titulo");
      if (prato.icone) titulo.appendChild(icone(prato.icone));
      titulo.appendChild(el("h3", "card-nome", prato.nome));
      corpo.appendChild(titulo);
    } else {
      corpo.appendChild(el("h3", "card-nome", prato.nome));
    }

    /* Bebida quase nunca precisa de descrição — "Água tônica"
       já se explica. Sem texto, o parágrafo nem é criado, para
       não abrir um vão embaixo do nome.

       No card enxuto a descrição não aparece aqui de jeito
       nenhum: ela é justamente o que o botão vai revelar. */
    var texto = porSufixo(prato, "descricao");
    if (texto && !enxuto) corpo.appendChild(el("p", "card-descricao", texto));

    var rodape = el("div", "card-rodape");

    /* Acompanhamento da lista não tem preço próprio — ele entra
       com o prato. Sem preço, a caixa inteira não é criada, em
       vez de renderizar um "R$" vazio. */
    if (temVariacoes(prato) || prato.preco) {
      var caixaPreco = el("div", "card-preco-caixa");

      if (temVariacoes(prato)) {
        caixaPreco.appendChild(
          el("span", "card-preco-desde", i18n.t("cardapio.aPartirDe"))
        );
      }

      var preco = el("p", "card-preco");
      preco.innerHTML = marcarPreco(
        temVariacoes(prato) ? menorPreco(prato) : prato.preco
      );
      caixaPreco.appendChild(preco);
      rodape.appendChild(caixaPreco);
    }

    var botao = el("button", "btn-detalhes");
    botao.type = "button";
    botao.setAttribute("aria-expanded", "false");
    botao.setAttribute("aria-controls", idPainel);
    botao.appendChild(el("span", null, i18n.t("cardapio.detalhes")));
    botao.appendChild(icone("chevron-down", "ico--sm"));
    rodape.appendChild(botao);

    corpo.appendChild(rodape);

    /* Aviso legal em cada card de bebida alcoólica, e não uma
       vez no fim da página: cada produto carrega o próprio
       aviso, que é como a regra de publicidade trata o assunto. */
    if (prato.alcoolico) {
      corpo.appendChild(
        el("p", "card-aviso", i18n.t("cardapio.moderacao"))
      );
    }

    card.appendChild(corpo);

    /* Detalhes escondidos: o que serve e o que acompanha. */
    var detalhes = el("div", "card-detalhes");
    detalhes.id = idPainel;
    var caixa = el("div", "card-detalhes__caixa");

    /* ALERGÊNICO VEM PRIMEIRO.
       É a informação de maior consequência da gaveta: quem tem
       alergia a camarão precisa ver antes de qualquer preço.

       Só entram camarão, peixe e castanhas, e só quando estão na
       receita. Leite e glúten ficaram de fora de propósito: eles
       apareceriam em mais de um terço do cardápio e, ainda
       assim, subcontados — dá para detectar quando a descrição
       cita queijo, mas não a farinha do empanado nem o creme do
       molho. Meia lista é pior que lista nenhuma, porque quem
       lesse os pratos sem marca concluiria que são seguros.
       O aviso no rodapé do cardápio diz exatamente isso. */
    if (prato.alergenicos && prato.alergenicos.length) {
      var mapaAlerg = {
        camarao: "cardapio.alergCamarao",
        peixe: "cardapio.alergPeixe",
        castanhas: "cardapio.alergCastanhas"
      };
      var nomes = prato.alergenicos
        .map(function (chave) {
          return mapaAlerg[chave] ? i18n.t(mapaAlerg[chave]) : chave;
        })
        .join(", ");

      var alerta = el("p", "card-alergenico");
      alerta.appendChild(icone("alerta", "ico--sm"));
      alerta.appendChild(
        el("span", null, i18n.t("cardapio.contem") + " " + nomes)
      );
      caixa.appendChild(alerta);
    }

    /* No card enxuto a descrição é o conteúdo do botão: ela sai
       da cara do card e abre aqui dentro. Item sem descrição
       simplesmente não ganha botão — a regra lá embaixo cuida. */
    var descricaoEscondida = enxuto && texto;
    if (descricaoEscondida) {
      caixa.appendChild(el("p", "card-detalhes__texto", texto));
    }

    /* As opções de tamanho vêm primeiro: é a informação que a
       pessoa foi buscar ao abrir os detalhes de um produto com
       vários preços. */
    var tabela = null;
    if (temVariacoes(prato)) {
      tabela = el("ul", "card-opcoes");
      prato.precos.forEach(function (opcao) {
        var li = el("li");
        li.appendChild(
          el("span", "card-opcoes__rotulo", i18n.campo({
            pt: opcao.rotulo_pt,
            en: opcao.rotulo_en,
            es: opcao.rotulo_es
          }))
        );
        var v = el("span", "card-opcoes__valor");
        v.innerHTML = marcarPreco(opcao.valor);
        li.appendChild(v);
        tabela.appendChild(li);
      });
    }

    var lista = el("ul");

    var serve = porSufixo(prato, "serve");
    if (serve) {
      var li1 = el("li");
      li1.appendChild(icone("users", "ico--sm"));
      li1.appendChild(el("span", null, serve));
      lista.appendChild(li1);
    }

    /* EXTRAS — todos opcionais.
       O prato pode ter extra1, extra2, extra3... ou nenhum.
       Quem estiver em branco é simplesmente pulado, então dá
       para preencher só o extra2 sem o extra1 que nada quebra.
       Cada um vira uma linha com um sinal de mais na frente. */
    for (var n = 1; n <= LIMITE_EXTRAS; n++) {
      var extra = porSufixo(prato, "extra" + n);
      if (!extra) continue;
      var linhaExtra = el("li");
      linhaExtra.appendChild(icone("plus", "ico--sm"));
      linhaExtra.appendChild(el("span", null, extra));
      lista.appendChild(linhaExtra);
    }

    /* Prato sem opções, sem "serve", sem nenhum extra, sem aviso
       de alergênico e — no card enxuto — sem descrição escondida
       não tem o que mostrar: o botão de detalhes some em vez de
       abrir uma gaveta vazia. É o que acontece com os
       acompanhamentos cuja descrição ainda não foi escrita.

       O alergênico entra nesta conta: um prato que só tenha o
       aviso ainda precisa do botão, senão o aviso ficaria dentro
       de uma gaveta que ninguém consegue abrir. */
    var temAlerta = !!(prato.alergenicos && prato.alergenicos.length);
    if (!tabela && !lista.children.length && !descricaoEscondida && !temAlerta) {
      botao.remove();
      return card;
    }

    if (tabela) caixa.appendChild(tabela);
    if (lista.children.length) caixa.appendChild(lista);
    detalhes.appendChild(caixa);
    card.appendChild(detalhes);

    return card;
  }

  /* ---------- MONTAGEM DA PÁGINA ---------- */

  function desenhar() {
    var area = document.querySelector("[data-cardapio]");
    var nav = document.querySelector("[data-cat-nav]");
    if (!area || !nav) return;

    var pratos = STADIUM.cardapio || [];

    area.innerHTML = "";
    nav.innerHTML = "";

    CATEGORIAS.forEach(function (categoria) {
      var doGrupo = pratos.filter(function (p) {
        return p.categoria === categoria.id;
      });
      /* Categoria sem prato não vira seção nem pill vazia. */
      if (!doGrupo.length) return;

      var link = el("a", "cat-link", i18n.campo(categoria.nav));
      link.href = "#container-" + categoria.id;
      nav.appendChild(link);

      var secao = el("section", "categoria");
      secao.id = "container-" + categoria.id;

      var cabeca = el("div", "categoria__head");
      cabeca.appendChild(
        el("p", "t-eyebrow", i18n.campo(categoria.nav))
      );
      cabeca.appendChild(el("h2", "t-h2", categoria.titulo));
      /* Regra da seção inteira, quando existir. Opcional: a
         categoria que não define "nota" não ganha linha nenhuma. */
      if (categoria.nota) {
        cabeca.appendChild(
          el("p", "categoria__nota", i18n.campo(categoria.nota))
        );
      }
      secao.appendChild(cabeca);

      var grade = el("div", "container-produto");
      var fragmento = document.createDocumentFragment();

      /* Bloco dentro da categoria. "Molhos da Casa" e
         "Acompanhamentos Adicionais" moram dentro de
         Assistências no cardápio impresso, mas são listas de
         natureza diferente: sem um rótulo entre elas, vinagrete
         ficaria na mesma enfiada de arroz branco.

         Opcional: prato sem "grupo" não abre rótulo nenhum, que
         é o caso de todas as outras categorias. */
      var grupoAtual = null;
      doGrupo.forEach(function (prato, i) {
        var grupo = porSufixo(prato, "grupo");
        if (grupo && grupo !== grupoAtual) {
          fragmento.appendChild(el("h3", "categoria__grupo", grupo));
          grupoAtual = grupo;
        }
        fragmento.appendChild(montarCard(prato, i, categoria));
      });

      grade.appendChild(fragmento);
      secao.appendChild(grade);

      area.appendChild(secao);
    });

    /* A primeira categoria já nasce marcada: sem isto a barra
       fica sem nenhuma pill acesa até a pessoa rolar a página. */
    var primeira = nav.querySelector(".cat-link");
    if (primeira) primeira.classList.add("ativo");

    iniciarScrollspy();
  }

  /* ---------- ACORDEÃO ----------
     Um aberto por vez. Delegado no documento, então continua
     valendo depois de qualquer redesenho. */
  document.addEventListener("click", function (evento) {
    var botao = evento.target.closest(".btn-detalhes");
    if (!botao) return;

    var card = botao.closest(".card-produto");
    var jaAberto = card.classList.contains("ativo");

    document.querySelectorAll(".card-produto.ativo").forEach(function (outro) {
      outro.classList.remove("ativo");
      var b = outro.querySelector(".btn-detalhes");
      if (b) b.setAttribute("aria-expanded", "false");
    });

    if (!jaAberto) {
      card.classList.add("ativo");
      botao.setAttribute("aria-expanded", "true");
    }
  });

  /* ---------- ARRASTAR A BARRA DE CATEGORIAS ----------
     No celular a barra já arrasta sozinha, porque toque em área
     com rolagem é nativo. No computador, não: com mouse só dá
     para rolar na horizontal segurando Shift, o que ninguém
     descobre. Aqui a barra passa a ser pegável com o mouse.

     Isso importa mais do que parece: com o cardápio inteiro no
     ar são muitas categorias, e sem arrastar a pessoa só
     alcança as últimas rolando a página toda — que é justamente
     o que a barra existe para evitar. */
  function permitirArraste(trilha) {
    if (!trilha) return;

    var arrastando = false;
    var xInicial = 0;
    var scrollInicial = 0;
    var arrastouDeVerdade = false;

    /* ATENÇÃO: nada de setPointerCapture aqui.
       Capturar o ponteiro na barra faz o "mouseup" ser entregue
       à barra em vez da pill. Com o "mousedown" numa pill e o
       "mouseup" na barra, o navegador dispara o clique no
       ancestral comum — a barra — e a pill nunca é clicada: a
       categoria simplesmente não abre.

       Sem captura, o alvo do clique continua sendo a pill e o
       salto para a seção volta a funcionar sozinho. O preço é
       acompanhar o arraste pela janela, que é o que vem abaixo:
       assim o gesto sobrevive quando o cursor sai da barra. */
    function mover(evento) {
      if (!arrastando) return;
      var percorrido = evento.clientX - xInicial;
      trilha.scrollLeft = scrollInicial - percorrido;

      /* O que separa um clique de um arraste não é o mouse ter
         andado — é a barra ter saído do lugar.

         Medir só o movimento do cursor derruba clique legítimo:
         a mão treme, o trackpad escorrega, e a pessoa clica em
         "Carnes" sem nada acontecer. Pior, a trava disparava até
         quando a barra já estava no fim do trilho ou nem tinha
         pra onde rolar — arrastar não saía do lugar, mas o
         clique morria do mesmo jeito.

         Conferindo o scrollLeft, quem não moveu a barra clicou. */
      if (Math.abs(percorrido) > 8 && trilha.scrollLeft !== scrollInicial) {
        arrastouDeVerdade = true;
      }
    }

    function soltar() {
      if (!arrastando) return;
      arrastando = false;
      trilha.classList.remove("arrastando");
      document.body.classList.remove("arrastando-barra");
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
      window.removeEventListener("pointercancel", soltar);
    }

    trilha.addEventListener("pointerdown", function (evento) {
      /* Toque e caneta já rolam nativamente; mexer neles só
         atrapalharia o gesto do sistema. */
      if (evento.pointerType !== "mouse") return;
      arrastando = true;
      arrastouDeVerdade = false;
      xInicial = evento.clientX;
      scrollInicial = trilha.scrollLeft;
      trilha.classList.add("arrastando");
      /* Sem a captura, o arraste pode passar por fora da barra e
         começar a selecionar o texto da página. */
      document.body.classList.add("arrastando-barra");
      window.addEventListener("pointermove", mover);
      window.addEventListener("pointerup", soltar);
      window.addEventListener("pointercancel", soltar);
    });

    /* Quem arrastou queria mover a barra, não abrir a categoria
       que ficou debaixo do cursor na hora de soltar. */
    trilha.addEventListener(
      "click",
      function (evento) {
        if (!arrastouDeVerdade) return;
        evento.preventDefault();
        evento.stopPropagation();
        arrastouDeVerdade = false;
      },
      true
    );
  }

  /* ---------- BARRA DE CATEGORIAS ----------
     Acende a pill da seção que está sendo lida e desliza a
     barra até ela. */
  var observador = null;

  function iniciarScrollspy() {
    if (observador) observador.disconnect();

    var secoes = document.querySelectorAll(".categoria");
    var links = document.querySelectorAll(".cat-link");
    if (!secoes.length) return;

    observador = new IntersectionObserver(
      function (entradas) {
        entradas.forEach(function (entrada) {
          if (!entrada.isIntersecting) return;

          links.forEach(function (l) {
            l.classList.remove("ativo");
          });

          var ativo = document.querySelector(
            '.cat-link[href="#' + entrada.target.id + '"]'
          );
          if (!ativo) return;

          ativo.classList.add("ativo");
          /* Só a barra desliza — a página não se mexe. */
          var barra = ativo.parentElement;
          barra.scrollTo({
            left:
              ativo.offsetLeft -
              barra.clientWidth / 2 +
              ativo.clientWidth / 2,
            behavior: "smooth"
          });
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );

    secoes.forEach(function (s) {
      observador.observe(s);
    });
  }

  /* ---------- PARTIDA ---------- */

  document.addEventListener("DOMContentLoaded", function () {
    if (!i18n) return;
    desenhar();
    permitirArraste(document.querySelector("[data-cat-nav]"));
    document.addEventListener("stadium:idioma", desenhar);
  });
})(window, document);
