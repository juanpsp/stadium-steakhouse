# Stadium Steakhouse

Site da Stadium Steakhouse — casa de carnes com temática esportiva na Zona Oeste
do Rio de Janeiro, desde 2011. Duas unidades: Barra da Tijuca e Recreio.

HTML, CSS e JavaScript puros. Sem build, sem dependência a instalar: é só abrir
o `index.html` por um servidor HTTP.

## Páginas

| Arquivo | O que é |
|---|---|
| `index.html` | Home — carrossel de banners, destaque da semana, delivery, equipe e unidades |
| `cardapio.html` | Cardápio completo, 12 seções |
| `unidades.html` | As duas unidades, com horários, mapa e telefone |

## Como está organizado

```
assets/
  css/      tokens.css traz o design system inteiro em variáveis
  js/
    i18n.js              motor de tradução pt / en / es
    cardapio-dados.js    OS PRATOS — é aqui que se mexe no cardápio
    promocoes-dados.js   banners, destaque, delivery e unidades
    animacoes.js         GSAP, só na home
  img/
```

Quem for atualizar preço, prato ou promoção mexe só nos dois arquivos de dados.
O resto é estrutura.

## Trilíngue

Português, inglês e espanhol, com o idioma escolhido guardado no navegador.
Todo texto de prato tem os três sufixos: `descricao_pt`, `descricao_en`,
`descricao_es`.

## O que ainda é provisório

Este site está em construção. Hoje ainda são marcadores:

- **Fotos de produto** — as imagens `prod-test-*` são temporárias, não são os
  pratos da casa.
- **Telefones** — `(21) 99999-9999` nas duas unidades.
- **Links de delivery** — iFood e 99Food apontam para a home dos aplicativos,
  não para as lojas da Stadium.
- **Descrições de sete acompanhamentos** — receitas da casa, ainda em branco.
