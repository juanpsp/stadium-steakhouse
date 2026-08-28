/* =========================================================
   STADIUM STEAKHOUSE — CONTEÚDO EDITÁVEL DA HOME
   =========================================================

   ESTE É O ÚNICO ARQUIVO QUE PRECISA SER EDITADO PARA TROCAR
   O QUE APARECE NA PÁGINA INICIAL. Não é preciso mexer em
   HTML nem em CSS.

   São três blocos:
   1. unidades  — endereço e horário de cada loja
   2. banners   — o carrossel grande do topo (divulgação)
   3. destaque  — o prato que a casa quer empurrar na semana
   4. delivery  — os canais de pedido

   Regras de escrita (vêm do guia de design):
   - "titulo" pode ser teatral. A tela coloca em caixa alta sozinha.
   - "descricao" é informativa: frase factual, sem trocadilho.
   - "preco" no formato brasileiro: R$ 59,90 (vírgula no centavo).
   - "imagem" aceita o caminho de uma foto ou null (a tela mostra
     um fundo de reserva da marca até a foto existir).
   ========================================================= */

(function (window) {
  "use strict";

  /* ---------- 1. UNIDADES ---------- */
  var unidades = [
    {
      id: "barra",
      nome: { pt: "Barra", en: "Barra", es: "Barra" },
      endereco: "Av. das Américas, 10.700 — Barra da Tijuca, Rio de Janeiro",
      telefone: "+552199999999",
      telefoneExibicao: "(21) 99999-9999",
      whatsapp: "https://wa.me/5521999999999",
      descricao: {
        pt: "Salão amplo com telões em HD, camisas históricas nas paredes e espaço kids com monitor. Estacionamento no local.",
        en: "Large dining room with HD screens, historic shirts on the walls and a supervised kids area. On-site parking.",
        es: "Salón amplio con pantallas HD, camisetas históricas en las paredes y espacio infantil con monitor. Estacionamiento en el local."
      },
      /* Fotos da unidade. "foco" enquadra o corte quando a foto
         não tem a proporção do quadro (ver ENQUADRAMENTO acima). */
      fotos: [
        {
          src: "assets/img/unidades/std-unidade-barra01.jpg",
          alt: {
            pt: "Fachada da unidade Barra iluminada à noite",
            en: "The Barra venue lit up at night",
            es: "Fachada del local Barra iluminada de noche"
          }
        },
        {
          src: "assets/img/unidades/std-unidade-barra02.jpeg",
          /* enquadra a parte de baixo: o topo da foto traz uma
             chamada publicitária escrita na própria imagem */
          foco: "center bottom",
          alt: {
            pt: "Salão da unidade Barra com telões e bandeiras",
            en: "The Barra dining room with screens and flags",
            es: "Salón del local Barra con pantallas y banderas"
          }
        }
      ],
      mapaEmbed:
        "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3672.626874897465!2d-43.421169540979754!3d-23.000744358567374!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9bdd4a31ae941d%3A0xddd0be7dbb8833a6!2sStadium%20Steakhouse%20%7C%20Barra!5e0!3m2!1spt-BR!2sbr!4v1787358362275!5m2!1spt-BR!2sbr",
      mapaLink: "https://www.google.com/maps/search/?api=1&query=Stadium+Steakhouse+Barra",
      // 0 = domingo ... 6 = sábado. Formato 24h.
      horarios: {
        0: ["11:30", "00:00"],
        1: ["11:30", "00:00"],
        2: ["11:30", "00:00"],
        3: ["11:30", "00:00"],
        4: ["11:30", "00:00"],
        5: ["11:30", "01:00"],
        6: ["11:30", "01:00"]
      },
      destaques: {
        pt: ["Telões em HD", "Ambiente premium", "Espaço kids"],
        en: ["HD screens", "Premium setting", "Kids area"],
        es: ["Pantallas HD", "Ambiente premium", "Espacio infantil"]
      }
    },
    {
      id: "recreio",
      nome: {
        pt: "Recreio · Praia",
        en: "Recreio · Beach",
        es: "Recreio · Playa"
      },
      endereco: "Av. Lúcio Costa, 16.580 — Recreio dos Bandeirantes, Rio de Janeiro",
      telefone: "+552199999999",
      telefoneExibicao: "(21) 99999-9999",
      whatsapp: "https://wa.me/5521999999999",
      descricao: {
        pt: "De frente para a orla, com mesas na varanda e café da manhã aos fins de semana e feriados, a partir das 8h.",
        en: "Facing the seafront, with terrace tables and breakfast on weekends and holidays, from 8am.",
        es: "Frente al mar, con mesas en la terraza y desayuno los fines de semana y feriados, desde las 8h."
      },
      fotos: [
        {
          src: "assets/img/unidades/std-unidade-recreio01.jpeg",
          /* sobe o corte para o letreiro STADIUM não ficar de fora */
          foco: "center 24%",
          alt: {
            pt: "Fachada da unidade Recreio, de frente para a praia",
            en: "The Recreio venue facing the beach",
            es: "Fachada del local Recreio, frente a la playa"
          }
        },
        {
          /* recorte limpo de std-unidade-recreio02.png: a original
             é um story com o @ da autora e legenda por cima.
             PENDENTE: confirmar autorização de uso com ela. */
          src: "assets/img/unidades/std-unidade-recreio03.jpg",
          alt: {
            pt: "Vista da praia a partir da varanda da unidade Recreio",
            en: "Beach view from the Recreio terrace",
            es: "Vista de la playa desde la terraza del local Recreio"
          }
        }
      ],
      mapaEmbed:
        "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3671.968630629512!2d-43.46066838833955!3d-23.02492397908533!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9bc3260498fe71%3A0x2ad54c0098cbb42b!2sStadium%20Steakhouse%20Praia%20%7C%20Recreio!5e0!3m2!1spt-BR!2sbr!4v1787358483764!5m2!1spt-BR!2sbr",
      mapaLink: "https://www.google.com/maps/search/?api=1&query=Stadium+Steakhouse+Recreio",
      /* Sábado e domingo abrem às 8h por causa do café da manhã.
         Nos outros dias abre 11h. Feriado segue o horário de fim
         de semana — ver "feriado" abaixo. */
      horarios: {
        0: ["08:00", "00:00"],
        1: ["11:00", "00:00"],
        2: ["11:00", "00:00"],
        3: ["11:00", "00:00"],
        4: ["11:00", "00:00"],
        5: ["11:00", "01:00"],
        6: ["08:00", "01:00"]
      },
      feriado: {
        pt: "Feriados abrem às 8h, com café da manhã.",
        en: "On public holidays we open at 8am, with breakfast.",
        es: "Los feriados abrimos a las 8h, con desayuno."
      },
      destaques: {
        pt: ["Café da manhã", "Vista para a orla", "Varanda"],
        en: ["Breakfast", "Seafront view", "Terrace"],
        es: ["Desayuno", "Vista al mar", "Terraza"]
      }
    }
  ];

  /* ---------- 2. BANNERS DO TOPO ----------
     O carrossel grande da entrada. Cada bloco é um slide.
     Passa sozinho a cada 6 segundos e para quando a pessoa
     encosta nele.

     "tema" só serve enquanto a foto não existe: pinta um fundo
     da marca no lugar. Vale "noite", "manha" ou "festa".
     Assim que você preencher "imagem", o tema deixa de aparecer.

     "unidade" é opcional. Preencha com "barra" ou "recreio" se
     a promoção for só de uma loja — a tela mostra a etiqueta.

     ENQUADRAMENTO DA FOTO
     A foto sempre preenche o banner inteiro, sem borda. Como a
     tela muda de formato, alguma parte precisa ser cortada —
     "foco" decide qual parte NUNCA é cortada.

       foco:        "50% 50%"   no celular
       focoDesktop: "50% 70%"   na tela larga

     Primeiro número: esquerda (0%) -> direita (100%).
     Segundo número:  topo (0%)     -> base (100%).

     Regra prática: aponte para o assunto. Comida no meio-baixo
     da foto pede algo como "50% 70%". Rosto no terço de cima
     pede "50% 35%". Vá ajustando de 5 em 5 até enquadrar.

     "zoom" e "zoomDesktop" são opcionais (ex.: 1.2) e aproximam
     ainda mais que o necessário. Use com parcimônia: cada passo
     de zoom amplia a imagem e tira nitidez.                    */
  var banners = [
    {
      id: "happy-hour",
      tema: "noite",
      imagem: "assets/img/banners/std-banner-happy-hour.jpg",
      // as canecas ficam no meio-baixo da foto
      foco: "54% 50%",
      focoDesktop: "50% 75%",
      unidade: null,
      etiqueta: {
        pt: "Seg a qui · 17h às 20h",
        en: "Mon to Thu · 5pm to 8pm",
        es: "Lun a jue · 17h a 20h"
      },
      titulo: {
        pt: "Happy hour no Stadium",
        en: "Happy hour at Stadium",
        es: "Happy hour en Stadium"
      },
      descricao: {
        pt: "Chope gelado, caipirinha e porções para dividir com preço reduzido até as 20h.",
        en: "Cold draft beer, caipirinha and sharing plates at a reduced price until 8pm.",
        es: "Chopp helado, caipiriña y porciones para compartir con precio reducido hasta las 20h."
      },
      destaque: {
        pt: "Chope a partir de R$ 12,90",
        en: "Draft beer from R$ 12,90",
        es: "Chopp desde R$ 12,90"
      },
      acao: {
        rotulo: { pt: "Ver drinks", en: "See drinks", es: "Ver tragos" },
        href: "cardapio.html#container-drinks"
      }
    },
    {
      id: "cafe-da-manha",
      tema: "manha",
      imagem: "assets/img/banners/std-banner-cafe-da-manha.jpg",
      // no desktop desce para pegar as cestas de pão
      foco: "45% 55%",
      focoDesktop: "46% 84%",
      unidade: "recreio",
      etiqueta: {
        pt: "Fim de semana e feriados · 8h às 11h30",
        en: "Weekends and holidays · 8am to 11:30am",
        es: "Fin de semana y feriados · 8h a 11h30"
      },
      titulo: {
        pt: "Café da manhã na praia",
        en: "Breakfast by the beach",
        es: "Desayuno en la playa"
      },
      descricao: {
        pt: "Pães na chapa, ovos mexidos, frutas da estação e café coado na hora, de frente para a orla.",
        en: "Griddled bread, scrambled eggs, seasonal fruit and freshly brewed coffee, facing the seafront.",
        es: "Pan a la plancha, huevos revueltos, fruta de estación y café recién colado, con vista al mar."
      },
      destaque: {
        pt: "R$ 39,90 por pessoa",
        en: "R$ 39,90 per person",
        es: "R$ 39,90 por persona"
      },
      acao: {
        rotulo: { pt: "Ver a unidade", en: "See the venue", es: "Ver el local" },
        href: "unidades.html"
      }
    },
    {
      id: "familia",
      tema: "noite",
      imagem: "assets/img/banners/std-banner-familia.jpg",
      // protege os rostos, que ficam no terço de cima
      foco: "55% 42%",
      focoDesktop: "52% 32%",
      unidade: "barra",
      etiqueta: {
        pt: "Sáb e dom · 12h às 20h",
        en: "Sat and Sun · 12pm to 8pm",
        es: "Sáb y dom · 12h a 20h"
      },
      titulo: {
        pt: "Fim de semana é de família",
        en: "Weekends are for family",
        es: "El fin de semana es de familia"
      },
      descricao: {
        pt: "Espaço kids com mini campos de grama sintética e monitor no local. Os pratos do Dente de Leite saem com sobremesa inclusa.",
        en: "Kids area with synthetic-turf mini pitches and an on-site attendant. Dente de Leite plates include dessert.",
        es: "Espacio infantil con mini canchas de césped sintético y monitor. Los platos Dente de Leite incluyen postre."
      },
      destaque: {
        pt: "Dente de Leite a partir de R$ 34,90",
        en: "Kids menu from R$ 34,90",
        es: "Menú infantil desde R$ 34,90"
      },
      acao: {
        rotulo: { pt: "Ver o kids", en: "See kids menu", es: "Ver menú infantil" },
        href: "cardapio.html#container-kids"
      }
    },
    {
      id: "reveillon",
      tema: "festa",
      imagem: "assets/img/banners/std-banner-reveillon.jpg",
      // mantém o letreiro dourado inteiro no quadro
      foco: "50% 46%",
      focoDesktop: "50% 42%",
      unidade: null,
      etiqueta: {
        pt: "31 de dezembro · a partir das 20h",
        en: "31 December · from 8pm",
        es: "31 de diciembre · desde las 20h"
      },
      titulo: {
        pt: "Réveillon no Stadium",
        en: "New Year's Eve at Stadium",
        es: "Fin de año en Stadium"
      },
      descricao: {
        pt: "Ceia servida à mesa, telões com a queima de fogos e espumante liberado até a virada.",
        en: "Dinner served at the table, fireworks on the big screens and sparkling wine until midnight.",
        es: "Cena servida en la mesa, pantallas con los fuegos artificiales y espumante hasta la medianoche."
      },
      destaque: {
        pt: "Reservas abertas",
        en: "Bookings open",
        es: "Reservas abiertas"
      },
      acao: {
        rotulo: { pt: "Reservar mesa", en: "Book a table", es: "Reservar mesa" },
        href: "unidades.html"
      }
    }
  ];

  /* ---------- 3. O CRAQUE DA SEMANA ----------
     O prato que a casa quer vender primeiro. Só um por vez.
     Deixe "precoDe" como null se não for promoção.           */
  var destaque = {
    // provisória, só para ver o card montado — trocar pela foto real do prato
    imagem: "assets/img/produtos/prod-test-01.jpeg",
    selo: { pt: "Destaque", en: "Featured", es: "Destacado" },
    nome: { pt: "Patada Atômica", en: "Patada Atômica", es: "Patada Atômica" },
    descricao: {
      pt: "Picanha e filé mignon fatiados, batatas gratinadas, farofa da casa e vinagrete.",
      en: "Sliced picanha and filet mignon, gratin potatoes, house farofa and vinaigrette.",
      es: "Picaña y filete mignon fileteados, papas gratinadas, farofa de la casa y vinagreta."
    },
    meta: {
      pt: "600g · serve 2 pessoas",
      en: "600g · serves 2",
      es: "600g · para 2 personas"
    },
    precoDe: "R$ 219,90",
    preco: "R$ 189,90",
    acao: {
      rotulo: { pt: "Quero esse", en: "I want this", es: "Lo quiero" },
      href: "cardapio.html#container-carnes"
    }
  };

  /* ---------- 4. A EQUIPE ----------
     A pessoa que aparece na seção "aqui a gente joga com
     qualidade". Troque a foto, o nome e o cargo à vontade.
     A foto precisa ter fundo transparente (PNG recortado) e
     estar cortada no busto: ela assenta na base da seção.   */
  var equipe = {
    foto: "assets/img/diversos/std-profissional-edivandro.png",
    nome: "Edivandro",
    cargo: {
      pt: "Gerente de salão",
      en: "Floor manager",
      es: "Gerente de salón"
    }
  };

  /* ---------- 5. CANAIS DE DELIVERY ----------
     Troque o href pelo link real de cada loja. */
  var delivery = [
    {
      id: "ifood",
      nome: "iFood",
      logo: "assets/img/ui/logo-ifood-trim.png",
      icone: "bike",
      /* TROCAR pelos links reais de cada loja no iFood. Abra a
         página da unidade no iFood e copie o endereço da barra
         do navegador. */
      links: {
        barra: "https://www.ifood.com.br/",
        recreio: "https://www.ifood.com.br/"
      },
      hint: {
        pt: "Entrega e retirada",
        en: "Delivery and pickup",
        es: "Entrega y recogida"
      }
    },
    {
      id: "99food",
      nome: "99Food",
      logo: "assets/img/ui/logo-99food-trim.png",
      icone: "bike",
      /* TROCAR pelos links reais de cada loja no 99Food. */
      links: {
        barra: "https://99app.com/food/",
        recreio: "https://99app.com/food/"
      },
      hint: {
        pt: "Entrega e retirada",
        en: "Delivery and pickup",
        es: "Entrega y recogida"
      }
    }
  ];

  window.STADIUM = window.STADIUM || {};
  window.STADIUM.unidades = unidades;
  window.STADIUM.banners = banners;
  window.STADIUM.destaque = destaque;
  window.STADIUM.equipe = equipe;
  window.STADIUM.delivery = delivery;
})(window);
