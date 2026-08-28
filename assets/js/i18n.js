/* =========================================================
   STADIUM STEAKHOUSE — TRADUÇÃO (PT / EN / ES)
   =========================================================

   Como funciona:
   1. No HTML, marque o elemento com data-i18n="chave".
      <h2 data-i18n="promos.title">O que está rolando</h2>
      O texto que fica no HTML é o português — ele é o padrão e
      o que aparece se o JavaScript falhar.

   2. Para traduzir um atributo (aria-label, placeholder, title):
      data-i18n-attr="aria-label:nav.home"
      Vários atributos separados por vírgula.

   3. O idioma escolhido fica salvo no navegador e é reaplicado
      na próxima visita.

   Registro: título e bordão podem ser teatrais. Descrição,
   rótulo e texto legal são informativos e sem trocadilho.
   ========================================================= */

(function (window, document) {
  "use strict";

  var IDIOMAS = ["pt", "en", "es"];
  var PADRAO = "pt";
  var CHAVE_STORAGE = "stadium:idioma";

  var dicionario = {
    pt: {
      "nav.home": "Home",
      "nav.menu": "Cardápio",
      "nav.units": "Unidades",
      "nav.skip": "Ir para o conteúdo",
      "nav.aria": "Navegação principal",

      "lang.label": "Escolher idioma",
      "lang.pt": "Português",
      "lang.en": "English",
      "lang.es": "Español",

      "status.open": "Aberto",
      "status.closed": "Fechado",
      "status.openUntil": "Aberto até {time}",
      "status.opensAt": "Abre às {time}",

      "banner.aria": "Novidades do Stadium",
      "banner.prev": "Banner anterior",
      "banner.next": "Próximo banner",
      "banner.pause": "Pausar a passagem automática",
      "banner.play": "Retomar a passagem automática",
      "banner.goto": "Ir para o banner {n}",
      "banner.photo": "Fotografia da novidade",

      "destaque.eyebrow": "A escalação da casa",
      "destaque.title": "O craque da semana",
      "destaque.lead":
        "Toda semana a casa escala um prato para entrar em campo primeiro. Este é o da vez.",
      "destaque.was": "de",
      "destaque.photo": "Fotografia do prato",
      "destaque.menuCta": "Ver cardápio completo",
      "destaque.menuHint":
        "Tem muito mais em campo: aquecimentos, carnes, hambúrgueres, massas, kids e sobremesas.",

      "cardapio.eyebrow": "Do aquecimento ao segundo tempo",
      "cardapio.title": "O cardápio, por posição em campo",
      "cardapio.lead":
        "Os pratos levam o nome de quem fez história. As descrições dizem exatamente o que vem no prato.",
      "cardapio.detalhes": "Detalhes",
      "cardapio.aPartirDe": "a partir de",
      "cardapio.moderacao": "Beba com moderação. Venda proibida para menores de 18 anos.",
      "cardapio.contem": "Contém",
      "cardapio.alergCamarao": "camarão",
      "cardapio.alergPeixe": "peixe",
      "cardapio.alergCastanhas": "amêndoas",
      "cardapio.avisoFotos": "As fotos são ilustrativas. A apresentação dos pratos pode variar.",
      "cardapio.avisoAlergia": "Sinalizamos camarão, peixe e castanhas quando entram na receita — não é uma declaração completa de alergênicos. Se você tem alergia ou restrição alimentar, avise a equipe antes de pedir.",
      "cardapio.navAria": "Categorias do cardápio",

      "delivery.eyebrow": "Sem sair de casa",
      "delivery.title": "Peça e receba",
      "delivery.lead":
        "Escolha a unidade e peça direto na loja dela. O cardápio completo também sai para entrega e retirada.",
      "delivery.newTab": "abre em nova aba",
      "delivery.switchAria": "Escolher unidade para o pedido",

      "equipe.eyebrow": "O nosso time",
      "equipe.title": "Aqui a gente joga com qualidade",
      "equipe.lead":
        "Time completo em campo desde 2011. Cozinha, salão e bar afinados para a sua mesa não esperar e não faltar nada nela.",
      "equipe.p1.title": "Time formado em casa",
      "equipe.p1.desc":
        "Cozinheiros, garçons e bartenders treinados aqui dentro. Quem atende a sua mesa sabe o cardápio de cor.",
      "equipe.p2.title": "Vibração de arquibancada",
      "equipe.p2.desc":
        "Futebol e UFC nos telões em HD, com camisas históricas nas paredes. Aqui o jogo tem torcida.",
      "equipe.p3.title": "Acolhimento de casa cheia",
      "equipe.p3.desc":
        "Espaço kids com monitor, cardápio infantil e mesas que cabem a família inteira.",

      "units.eyebrow": "Onde a gente está",
      "units.title": "Duas casas, dois climas",
      "units.lead":
        "A Barra recebe a resenha e o almoço da semana. O Recreio abre cedo, de frente para a orla.",
      "units.cta": "Ver detalhes e mapa",
      "units.all": "Ver todas as unidades",

      "unidades.eyebrow": "Onde a gente está",
      "unidades.title": "Nossas unidades",
      "unidades.lead":
        "Duas casas na Zona Oeste do Rio. Confira o horário, veja o mapa e fale direto com a loja.",
      "unidades.horarios": "Horário de funcionamento",
      "unidades.comoChegar": "Como chegar",
      "unidades.ligar": "Ligar",
      "unidades.mapaDe": "Mapa da unidade",
      "unidades.entre": "às",
      "unidades.ate": "a",
      "unidades.e": "e",
      "unidades.reserva": "Contato para reserva",
      "unidades.reservaTitulo": "Reserve a sua mesa",
      "unidades.reservaLead": "Fale direto com a casa e garanta o lugar antes do apito inicial.",

      "dia.dom": "Dom",
      "dia.seg": "Seg",
      "dia.ter": "Ter",
      "dia.qua": "Qua",
      "dia.qui": "Qui",
      "dia.sex": "Sex",
      "dia.sab": "Sáb",

      "footer.tagline": "Unindo paixões desde 2011.",
      "footer.nav": "Navegação",
      "footer.contact": "Contato",
      "footer.social": "Redes sociais",
      "footer.work": "Trabalhe conosco",
      "footer.privacy": "Política de privacidade",
      "footer.rights": "Todos os direitos reservados.",
      "footer.by": "Desenvolvido por"
    },

    en: {
      "nav.home": "Home",
      "nav.menu": "Menu",
      "nav.units": "Venues",
      "nav.skip": "Skip to content",
      "nav.aria": "Main navigation",

      "lang.label": "Choose language",
      "lang.pt": "Português",
      "lang.en": "English",
      "lang.es": "Español",

      "status.open": "Open",
      "status.closed": "Closed",
      "status.openUntil": "Open until {time}",
      "status.opensAt": "Opens at {time}",

      "banner.aria": "What is new at Stadium",
      "banner.prev": "Previous banner",
      "banner.next": "Next banner",
      "banner.pause": "Pause automatic rotation",
      "banner.play": "Resume automatic rotation",
      "banner.goto": "Go to banner {n}",
      "banner.photo": "Feature photograph",

      "destaque.eyebrow": "The house line-up",
      "destaque.title": "Player of the week",
      "destaque.lead":
        "Every week the house picks one dish to take the field first. This is the one.",
      "destaque.was": "was",
      "destaque.photo": "Dish photograph",
      "destaque.menuCta": "See the full menu",
      "destaque.menuHint":
        "There is plenty more on the pitch: starters, steaks, burgers, pasta, kids and desserts.",

      "cardapio.eyebrow": "From warm-up to second half",
      "cardapio.title": "The menu, by position on the pitch",
      "cardapio.lead":
        "Dishes are named after the players who made history. The descriptions say exactly what is on the plate.",
      "cardapio.detalhes": "Details",
      "cardapio.aPartirDe": "from",
      "cardapio.moderacao": "Drink responsibly. Sale prohibited to under-18s.",
      "cardapio.contem": "Contains",
      "cardapio.alergCamarao": "shrimp",
      "cardapio.alergPeixe": "fish",
      "cardapio.alergCastanhas": "almonds",
      "cardapio.avisoFotos": "Photos are for illustration. Plating may vary.",
      "cardapio.avisoAlergia": "We flag shrimp, fish and nuts when they are part of the recipe — this is not a complete allergen declaration. If you have an allergy or dietary restriction, please tell our team before ordering.",
      "cardapio.navAria": "Menu categories",

      "delivery.eyebrow": "Without leaving home",
      "delivery.title": "Order and receive",
      "delivery.lead":
        "Pick the venue and order straight from that store. The full menu is available for delivery and pickup.",
      "delivery.newTab": "opens in a new tab",
      "delivery.switchAria": "Choose the venue to order from",

      "equipe.eyebrow": "Our team",
      "equipe.title": "We play this one to win",
      "equipe.lead":
        "A full squad on the pitch since 2011. Kitchen, floor and bar in sync so your table never waits and never runs short.",
      "equipe.p1.title": "Trained in house",
      "equipe.p1.desc":
        "Cooks, waiters and bartenders trained right here. Whoever takes your order knows the menu by heart.",
      "equipe.p2.title": "Terrace atmosphere",
      "equipe.p2.desc":
        "Football and UFC on HD screens, with historic shirts on the walls. Here the match has a crowd.",
      "equipe.p3.title": "A full house welcome",
      "equipe.p3.desc":
        "Kids area with an attendant, a children's menu and tables that fit the whole family.",

      "units.eyebrow": "Where we are",
      "units.title": "Two houses, two moods",
      "units.lead":
        "Barra hosts the late table and the weekday lunch. Recreio opens early, facing the seafront.",
      "units.cta": "See details and map",
      "units.all": "See all venues",

      "unidades.eyebrow": "Where we are",
      "unidades.title": "Our venues",
      "unidades.lead":
        "Two houses in west Rio. Check the opening hours, see the map and talk straight to the venue.",
      "unidades.horarios": "Opening hours",
      "unidades.comoChegar": "Directions",
      "unidades.ligar": "Call",
      "unidades.mapaDe": "Map of",
      "unidades.entre": "to",
      "unidades.ate": "to",
      "unidades.e": "and",
      "unidades.reserva": "Bookings",
      "unidades.reservaTitulo": "Book your table",
      "unidades.reservaLead": "Talk straight to the venue and secure your place before kick-off.",

      "dia.dom": "Sun",
      "dia.seg": "Mon",
      "dia.ter": "Tue",
      "dia.qua": "Wed",
      "dia.qui": "Thu",
      "dia.sex": "Fri",
      "dia.sab": "Sat",

      "footer.tagline": "Uniting passions since 2011.",
      "footer.nav": "Navigation",
      "footer.contact": "Contact",
      "footer.social": "Social",
      "footer.work": "Work with us",
      "footer.privacy": "Privacy policy",
      "footer.rights": "All rights reserved.",
      "footer.by": "Built by"
    },

    es: {
      "nav.home": "Inicio",
      "nav.menu": "Menú",
      "nav.units": "Locales",
      "nav.skip": "Ir al contenido",
      "nav.aria": "Navegación principal",

      "lang.label": "Elegir idioma",
      "lang.pt": "Português",
      "lang.en": "English",
      "lang.es": "Español",

      "status.open": "Abierto",
      "status.closed": "Cerrado",
      "status.openUntil": "Abierto hasta las {time}",
      "status.opensAt": "Abre a las {time}",

      "banner.aria": "Novedades de Stadium",
      "banner.prev": "Banner anterior",
      "banner.next": "Siguiente banner",
      "banner.pause": "Pausar el paso automático",
      "banner.play": "Reanudar el paso automático",
      "banner.goto": "Ir al banner {n}",
      "banner.photo": "Fotografía de la novedad",

      "destaque.eyebrow": "La alineación de la casa",
      "destaque.title": "El crack de la semana",
      "destaque.lead":
        "Cada semana la casa alinea un plato para entrar primero en la cancha. Este es el de turno.",
      "destaque.was": "antes",
      "destaque.photo": "Fotografía del plato",
      "destaque.menuCta": "Ver el menú completo",
      "destaque.menuHint":
        "Hay mucho más en la cancha: entradas, carnes, hamburguesas, pastas, infantil y postres.",

      "cardapio.eyebrow": "Del calentamiento al segundo tiempo",
      "cardapio.title": "El menú, por posición en la cancha",
      "cardapio.lead":
        "Los platos llevan el nombre de quienes hicieron historia. Las descripciones dicen exactamente lo que viene en el plato.",
      "cardapio.detalhes": "Detalles",
      "cardapio.aPartirDe": "desde",
      "cardapio.moderacao": "Beba con moderación. Venta prohibida a menores de 18 años.",
      "cardapio.contem": "Contiene",
      "cardapio.alergCamarao": "camarón",
      "cardapio.alergPeixe": "pescado",
      "cardapio.alergCastanhas": "almendras",
      "cardapio.avisoFotos": "Las fotos son ilustrativas. La presentación de los platos puede variar.",
      "cardapio.avisoAlergia": "Señalamos camarón, pescado y frutos secos cuando forman parte de la receta — no es una declaración completa de alérgenos. Si tiene alergia o restricción alimentaria, avise al equipo antes de pedir.",
      "cardapio.navAria": "Categorías del menú",

      "delivery.eyebrow": "Sin salir de casa",
      "delivery.title": "Pida y reciba",
      "delivery.lead":
        "Elija el local y pida directo en esa tienda. El menú completo sale para entrega y recogida.",
      "delivery.newTab": "abre en una pestaña nueva",
      "delivery.switchAria": "Elegir el local para el pedido",

      "equipe.eyebrow": "Nuestro equipo",
      "equipe.title": "Aquí jugamos con calidad",
      "equipe.lead":
        "Equipo completo en la cancha desde 2011. Cocina, salón y barra afinados para que su mesa no espere ni le falte nada.",
      "equipe.p1.title": "Equipo formado en casa",
      "equipe.p1.desc":
        "Cocineros, camareros y bartenders formados aquí dentro. Quien atiende su mesa se sabe el menú de memoria.",
      "equipe.p2.title": "Ambiente de tribuna",
      "equipe.p2.desc":
        "Fútbol y UFC en pantallas HD, con camisetas históricas en las paredes. Aquí el partido tiene hinchada.",
      "equipe.p3.title": "Acogida de casa llena",
      "equipe.p3.desc":
        "Espacio infantil con monitor, menú para niños y mesas donde cabe toda la familia.",

      "units.eyebrow": "Dónde estamos",
      "units.title": "Dos casas, dos climas",
      "units.lead":
        "Barra recibe la mesa de la noche y el almuerzo de la semana. Recreio abre temprano, frente al mar.",
      "units.cta": "Ver detalles y mapa",
      "units.all": "Ver todos los locales",

      "unidades.eyebrow": "Dónde estamos",
      "unidades.title": "Nuestros locales",
      "unidades.lead":
        "Dos casas en la Zona Oeste de Río. Consulte el horario, vea el mapa y hable directo con el local.",
      "unidades.horarios": "Horario de atención",
      "unidades.comoChegar": "Cómo llegar",
      "unidades.ligar": "Llamar",
      "unidades.mapaDe": "Mapa del local",
      "unidades.entre": "a",
      "unidades.ate": "a",
      "unidades.e": "y",
      "unidades.reserva": "Contacto para reservas",
      "unidades.reservaTitulo": "Reserve su mesa",
      "unidades.reservaLead": "Hable directo con la casa y garantice su lugar antes del pitido inicial.",

      "dia.dom": "Dom",
      "dia.seg": "Lun",
      "dia.ter": "Mar",
      "dia.qua": "Mié",
      "dia.qui": "Jue",
      "dia.sex": "Vie",
      "dia.sab": "Sáb",

      "footer.tagline": "Uniendo pasiones desde 2011.",
      "footer.nav": "Navegación",
      "footer.contact": "Contacto",
      "footer.social": "Redes sociales",
      "footer.work": "Trabaje con nosotros",
      "footer.privacy": "Política de privacidad",
      "footer.rights": "Todos los derechos reservados.",
      "footer.by": "Desarrollado por"
    }
  };

  var atual = PADRAO;

  function ler() {
    try {
      var salvo = window.localStorage.getItem(CHAVE_STORAGE);
      if (salvo && IDIOMAS.indexOf(salvo) !== -1) return salvo;
    } catch (e) {
      /* navegação privada ou storage bloqueado — segue no padrão */
    }
    var doNavegador = (window.navigator.language || "").slice(0, 2).toLowerCase();
    return IDIOMAS.indexOf(doNavegador) !== -1 ? doNavegador : PADRAO;
  }

  function gravar(lang) {
    try {
      window.localStorage.setItem(CHAVE_STORAGE, lang);
    } catch (e) {
      /* ignorado de propósito: a tela funciona sem persistir */
    }
  }

  /* Devolve o texto da chave. Se faltar tradução, cai no
     português em vez de mostrar a chave crua na tela. */
  function t(chave, vars) {
    var tabela = dicionario[atual] || dicionario[PADRAO];
    var texto = tabela[chave];
    if (texto === undefined) texto = dicionario[PADRAO][chave];
    if (texto === undefined) return "";
    if (vars) {
      Object.keys(vars).forEach(function (k) {
        texto = texto.replace("{" + k + "}", vars[k]);
      });
    }
    return texto;
  }

  /* Escolhe o campo do idioma atual em um objeto de conteúdo
     ({ pt: "...", en: "...", es: "..." }) ou devolve a string
     direto, se o campo não for traduzido. */
  function campo(valor) {
    if (valor === null || valor === undefined) return "";
    if (typeof valor === "string") return valor;
    return valor[atual] || valor[PADRAO] || "";
  }

  function aplicar(raiz) {
    var escopo = raiz || document;

    escopo.querySelectorAll("[data-i18n]").forEach(function (el) {
      var texto = t(el.getAttribute("data-i18n"));
      if (texto) el.textContent = texto;
    });

    escopo.querySelectorAll("[data-i18n-attr]").forEach(function (el) {
      el.getAttribute("data-i18n-attr")
        .split(",")
        .forEach(function (par) {
          var partes = par.split(":");
          if (partes.length !== 2) return;
          var texto = t(partes[1].trim());
          if (texto) el.setAttribute(partes[0].trim(), texto);
        });
    });
  }

  function definir(lang) {
    if (IDIOMAS.indexOf(lang) === -1) return;
    atual = lang;
    gravar(lang);
    document.documentElement.lang = lang === "pt" ? "pt-BR" : lang;
    aplicar(document);
    document.dispatchEvent(
      new CustomEvent("stadium:idioma", { detail: { idioma: lang } })
    );
  }

  function iniciar() {
    atual = ler();
    document.documentElement.lang = atual === "pt" ? "pt-BR" : atual;
    aplicar(document);
  }

  window.STADIUM = window.STADIUM || {};
  window.STADIUM.i18n = {
    idiomas: IDIOMAS,
    atual: function () {
      return atual;
    },
    t: t,
    campo: campo,
    aplicar: aplicar,
    definir: definir,
    iniciar: iniciar
  };
})(window, document);
