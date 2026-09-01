/* ============================================================
   MONTADOR DE RELATÓRIO — Luxon Code

   Recebe o Markdown que a IA devolveu e despeja no template
   impresso. A IA não formata nada: ela entrega texto estruturado,
   e a formatação mora aqui. Assim o documento sai igual todo mês,
   e o que muda entre um mês e outro é só o conteúdo.

   Sem biblioteca. O interpretador de Markdown abaixo cobre
   exatamente o que o relatório usa — título, negrito, itálico,
   lista, tabela, citação e régua. Nada além disso, de propósito:
   o formato do relatório está definido no documento de contexto,
   e o que não está lá não deveria aparecer aqui.
   ============================================================ */

(function () {
  "use strict";

  var folha = document.querySelector("[data-folha]");
  var corpo = document.querySelector("[data-corpo]");
  var fonte = document.querySelector("[data-fonte]");
  var montar = document.querySelector("[data-montar]");

  /* ---------- ESCAPAR ANTES DE QUALQUER COISA ----------
     O texto vem de fora e vai para innerHTML. Mesmo sendo saída
     da IA e não de um estranho, escapar é barato e a alternativa
     é confiar — que é o erro que já custou caro no painel. */
  function escapar(t) {
    return String(t)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* ---------- MARCAÇÃO DENTRO DA LINHA ---------- */
  function inline(t) {
    return escapar(t)
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      /* O marcador de quebra forçada é posto antes do escapar()
         e sai dele já escapado — por isso é reconhecido aqui na
         forma escapada, e não como "<<br>>". */
      .replace(/&lt;&lt;br&gt;&gt;\s*/g, "<br>");
  }

  /* Célula é numérica quando o conteúdo é só número, moeda,
     percentual ou traço. O cabeçalho não diz isso — "Vendas"
     pode ser texto em outra tabela —, então quem decide é a
     coluna inteira do corpo. */
  function ehNumero(t) {
    var limpo = t.replace(/<[^>]+>/g, "").trim();
    if (!limpo || limpo === "—" || limpo === "-") return true;
    return /^[R$\s]*[-+]?[\d.,]+\s*%?$/.test(limpo);
  }

  function linhaTabela(linha) {
    return linha
      .replace(/^\s*\|/, "")
      .replace(/\|\s*$/, "")
      .split("|")
      .map(function (c) { return c.trim(); });
  }

  function ehSeparador(linha) {
    return /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(linha) && linha.indexOf("-") >= 0;
  }

  /* ---------- MARKDOWN -> HTML ---------- */
  function converter(md) {
    var linhas = String(md).split(/\r?\n/);
    var saida = [];
    var i = 0;

    function juntarParagrafo() {
      var buf = [];
      while (i < linhas.length && linhas[i].trim() !== "" &&
             !/^(#{1,6}\s|[-*]\s|\d+\.\s|>\s|\||---\s*$|===\s*$)/.test(linhas[i])) {
        /* Linha solta se junta à anterior: o Markdown do
           relatório vem quebrado em ~68 colunas para caber na
           tela de quem escreve, e tratar cada quebra dessas
           como fim de linha deixaria o parágrafo picado. Quem
           quer quebrar de verdade usa a forma padrão do
           Markdown — dois espaços no fim da linha. */
        buf.push(linhas[i].trim() + (/ {2,}$/.test(linhas[i]) ? "<<br>>" : ""));
        i++;
      }
      return buf.join(" ");
    }

    while (i < linhas.length) {
      var l = linhas[i];
      var t = l.trim();

      if (t === "") { i++; continue; }

      /* separador entre relatório e resumo executivo */
      if (t === "===") {
        saida.push('<hr class="quebra">');
        i++;
        continue;
      }

      if (t === "---" || t === "***" || t === "___") {
        saida.push("<hr>");
        i++;
        continue;
      }

      var cab = t.match(/^(#{1,4})\s+(.*)$/);
      if (cab) {
        var nivel = Math.min(cab[1].length, 3);
        saida.push("<h" + nivel + ">" + inline(cab[2]) + "</h" + nivel + ">");
        i++;
        continue;
      }

      /* tabela: precisa da linha separadora logo abaixo */
      if (t.indexOf("|") >= 0 && i + 1 < linhas.length && ehSeparador(linhas[i + 1])) {
        var cabecalho = linhaTabela(t);
        i += 2;
        var corpoLinhas = [];
        while (i < linhas.length && linhas[i].indexOf("|") >= 0 && linhas[i].trim() !== "") {
          corpoLinhas.push(linhaTabela(linhas[i]));
          i++;
        }

        /* uma coluna é numérica quando TODAS as células dela são */
        var numericas = cabecalho.map(function (_, col) {
          return corpoLinhas.length > 0 && corpoLinhas.every(function (linha) {
            return ehNumero(linha[col] || "");
          });
        });

        var html = "<table><thead><tr>";
        cabecalho.forEach(function (c, k) {
          html += '<th' + (numericas[k] ? ' class="num"' : "") + ">" + inline(c) + "</th>";
        });
        html += "</tr></thead><tbody>";
        corpoLinhas.forEach(function (linha) {
          html += "<tr>";
          cabecalho.forEach(function (_, k) {
            html += "<td" + (numericas[k] ? ' class="num"' : "") + ">" +
                    inline(linha[k] || "") + "</td>";
          });
          html += "</tr>";
        });
        html += "</tbody></table>";
        saida.push(html);
        continue;
      }

      if (/^>\s?/.test(t)) {
        var cita = [];
        while (i < linhas.length && /^>\s?/.test(linhas[i].trim())) {
          cita.push(linhas[i].trim().replace(/^>\s?/, ""));
          i++;
        }
        saida.push("<blockquote><p>" + inline(cita.join(" ")) + "</p></blockquote>");
        continue;
      }

      var ordenada = /^\d+\.\s/.test(t);
      if (ordenada || /^[-*]\s/.test(t)) {
        var tag = ordenada ? "ol" : "ul";
        var itens = [];
        while (i < linhas.length) {
          var li = linhas[i].trim();
          var abre = ordenada ? /^\d+\.\s+(.*)$/ : /^[-*]\s+(.*)$/;
          var m = li.match(abre);
          if (!m) break;
          i++;
          /* continuação indentada do mesmo item */
          var texto = m[1];
          while (i < linhas.length && /^\s{2,}\S/.test(linhas[i]) &&
                 !/^\s*([-*]|\d+\.)\s/.test(linhas[i])) {
            texto += " " + linhas[i].trim();
            i++;
          }
          itens.push("<li>" + inline(texto) + "</li>");
        }
        saida.push("<" + tag + ">" + itens.join("") + "</" + tag + ">");
        continue;
      }

      var p = juntarParagrafo();
      if (!p) { i++; continue; }

      /* Parágrafo inteiro em itálico é CANDIDATO a ressalva de
         rodapé — só isso. O relatório usa itálico no meio do
         texto também ("as outras dúvidas eu resolvi sozinho"), e
         marcar aquilo como rodapé pinta um traço de fim de
         documento no meio da página. Quem decide é o pós-passe
         marcarRodape(), que olha a posição. */
      var soItalico = /^\*[^*].*\*$/.test(p);
      /* Abre com negrito = achado, ganha a barra de destaque. */
      var abreNegrito = /^\*\*/.test(p);

      saida.push('<p class="' + (soItalico ? "italico-inteiro" : abreNegrito ? "achado" : "") +
                 '">' + inline(p) + "</p>");
    }

    return saida.join("\n");
  }

  /* ---------- QUAL ITÁLICO É RESSALVA DE FIM ----------
     Só o que fecha o documento. "Fim" aqui é o fim de cada um
     dos dois documentos, porque relatório e resumo vêm no mesmo
     Markdown separados pela quebra de página — cada um tem a sua
     linha de ressalva. Régua e quebra entre eles não contam:
     pulo por cima delas até achar conteúdo de verdade. */
  function marcarRodape(raiz) {
    var blocos = Array.prototype.slice.call(raiz.children);

    function ehSeparador(el) {
      return el && el.tagName === "HR";
    }

    blocos.forEach(function (el, k) {
      if (!el.classList.contains("italico-inteiro")) return;

      var proximo = null;
      for (var j = k + 1; j < blocos.length; j++) {
        if (ehSeparador(blocos[j])) continue;
        proximo = blocos[j];
        break;
      }

      /* Nada depois, ou só o começo do outro documento. */
      var fecha = !proximo || proximo.tagName === "H1";
      el.classList.remove("italico-inteiro");
      el.classList.add(fecha ? "rodape" : "nota");
    });
  }

  /* ---------- COLAR TÍTULO NO CONTEÚDO ----------
     "break-after: avoid" num h2 é preferência, não garantia: o
     navegador a ignora quando o que vem depois não cabe no resto
     da folha — que é justamente quando ela importaria. Embrulhar
     o título com o primeiro bloco seguinte num único elemento
     indivisível resolve de verdade, porque o par é pequeno.

     Só o PRIMEIRO bloco vai junto. Embrulhar a seção inteira
     traria de volta o desperdício de página. */
  function colarTitulos(raiz) {
    var titulos = raiz.querySelectorAll("h2, h3");
    /* Uma folha A4 tem 265mm úteis; a régua abaixo é a mesma
       proporção aplicada à largura que o documento tem na tela.
       Não precisa ser exata: serve só para separar "bloco que
       cabe folgado" de "bloco que sozinho enche a página". */
    var larguraUtil = raiz.getBoundingClientRect().width;
    var folhaAprox = larguraUtil * (265 / 180);
    var teto = folhaAprox * 0.55;

    Array.prototype.forEach.call(titulos, function (h) {
      var seguinte = h.nextElementSibling;
      if (!seguinte || /^H[123]$/.test(seguinte.tagName)) return;

      /* Bloco que não cabe folgado fica de fora: colado a um
         título, ele viraria um pedaço indivisível maior que a
         folha, e aí o navegador pula a página inteira para
         tentar encaixá-lo — que é exatamente o desperdício que
         essa função existe para evitar.

         Contar linhas era chute: uma tabela de 4 linhas com
         texto longo é mais alta que uma de 10 com números. */
      if (h.getBoundingClientRect().height +
          seguinte.getBoundingClientRect().height > teto) return;

      var caixa = document.createElement("div");
      caixa.className = "junto";
      h.parentNode.insertBefore(caixa, h);
      caixa.appendChild(h);
      caixa.appendChild(seguinte);
    });
  }

  /* ---------- MONTAR ---------- */
  var MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho",
               "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

  function valor(sel) {
    var el = document.querySelector(sel);
    return el ? el.value.trim() : "";
  }

  function gerar() {
    var md = fonte.value.trim();
    var aviso = montar.querySelector("[data-aviso]");
    if (aviso) aviso.remove();

    if (!md) {
      var p = document.createElement("p");
      p.className = "montar__aviso";
      p.setAttribute("data-aviso", "");
      p.textContent = "Cole o Markdown do relatório antes de gerar.";
      montar.querySelector(".montar__caixa").appendChild(p);
      folha.hidden = true;
      return;
    }

    var cliente = valor("[data-cliente]") || "Cliente";
    var unidade = valor("[data-unidade]");
    var periodo = valor("[data-periodo]");

    document.documentElement.style.setProperty("--destaque", valor("[data-cor]") || "#a8231f");

    document.querySelector("[data-capa-cliente]").textContent = cliente;
    document.querySelector("[data-capa-unidade]").textContent = unidade ? "Unidade " + unidade : "";
    document.querySelector("[data-capa-periodo]").textContent = periodo;

    var hoje = new Date();
    document.querySelector("[data-capa-emissao]").textContent =
      "Emitido em " + hoje.getDate() + " de " + MESES[hoje.getMonth()] +
      " de " + hoje.getFullYear();

    corpo.innerHTML = converter(md);
    marcarRodape(corpo);

    /* A folha aparece ANTES de colar os títulos: colarTitulos
       mede altura, e elemento escondido mede zero. */
    folha.hidden = false;
    colarTitulos(corpo);
    folha.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ---------- IMPRIMIR ----------
     O navegador usa o title da aba como nome sugerido do PDF.
     Troca antes, imprime, devolve depois — mesmo truque do
     painel, e é o que evita o cliente receber "index.pdf". */
  function semAcento(t) {
    return t.normalize("NFD").replace(/[̀-ͯ]/g, "")
            .replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-");
  }

  function imprimir() {
    if (folha.hidden) { gerar(); }
    if (folha.hidden) return;

    var antes = document.title;
    var partes = ["Relatorio", semAcento(valor("[data-cliente]") || "cliente")];
    var un = valor("[data-unidade]");
    if (un) partes.push(semAcento(un));
    var per = valor("[data-periodo]");
    if (per) partes.push(semAcento(per));

    document.title = partes.join("-");
    window.print();
    setTimeout(function () { document.title = antes; }, 400);
  }

  document.querySelector("[data-gerar]").addEventListener("click", gerar);
  document.querySelector("[data-imprimir]").addEventListener("click", imprimir);

  var botaoExemplo = document.querySelector("[data-exemplo]");
  if (botaoExemplo) {
    botaoExemplo.addEventListener("click", function () {
      fetch("exemplo.md")
        .then(function (r) { return r.text(); })
        .then(function (t) { fonte.value = t; gerar(); })
        .catch(function () {
          fonte.value = "Não achei o exemplo.md nesta pasta.";
        });
    });
  }
})();
