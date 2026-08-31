# Contexto do projeto — a IA de análise da Stadium

Cole este arquivo inteiro na primeira mensagem da nova janela,
junto com os anexos. Ele é a única coisa que o novo contexto
precisa saber.

---

# PARTE 1 — QUEM SOU E O QUE JÁ EXISTE

Sou Juan, estou montando uma agência chamada **Luxon Code**. O
primeiro cliente é a **Stadium Steakhouse**, churrascaria
temática de esportes na Zona Oeste do Rio, aberta em 2011, duas
unidades (Barra e Recreio), lema "Unindo Paixões!".

Já construí e publiquei para ela um **cardápio digital com
medição de atenção**:

- Site em HTML/CSS/JS puro, sem build, no GitHub Pages
- 129 pratos em 12 categorias, em português, inglês e espanhol
- Banco Postgres no Supabase, painel administrativo com login
- O site mede **atenção**: quanto tempo cada prato fica de fato
  na tela, quantas pessoas viram cada um, até onde descem, o que
  procuram na busca, de onde vieram, em que horário, em que
  aparelho, e quem clicou em "ligar" ou "traçar rota"

Esse projeto está **terminado**. Não preciso de ajuda com ele.

## O que quero construir agora

Uma **IA de análise** que leia dois arquivos e produza um
relatório de negócio:

1. **JSON de atenção**, exportado pelo painel do site
2. **Fechamento de contas** do restaurante — relatório de vendas
   do sistema de caixa

O valor está no **cruzamento**. Atenção sozinha não diz nada
sobre dinheiro; venda sozinha não diz por que um prato vende
pouco. Junto, dá para responder o que nenhum dos dois responde.

Quero que ela vá do simples ao avançado: de "o que mudar esta
semana" a correlações que ninguém enxerga olhando planilha.

---

# PARTE 2 — COMO A FERRAMENTA FUNCIONA

## Sessão nova todo mês, memória em arquivo

**Não** quero uma conversa longa que dura meses. Conversa longa
perde contexto — e perde em silêncio, continuando a responder com
confiança sobre dado que já saiu da memória. Para decisão
estratégica isso é inaceitável.

O desenho é: **todo mês, um chat zerado**, com anexos.

| Anexo | O que é |
|---|---|
| JSON de atenção | do painel, do período |
| Fechamento de contas | do caixa |
| `de-para.json` | casamentos já confirmados |
| `historico.json` | meses anteriores, resumidos |
| `contexto-da-casa.md` | o que o dado não sabe |

A memória não fica na conversa; fica no anexo. **No fim de cada
sessão a IA devolve o `de-para` e o `historico` atualizados**,
que eu salvo para o mês seguinte. Ela nunca precisa lembrar —
ela lê.

## O fluxo dentro da sessão

1. Mando o prompt inicial + anexos
2. **Ela reconcilia os dois arquivos** e me pergunta o que não
   conseguiu resolver sozinha
3. Eu respondo
4. Ela entrega o **relatório base**
5. Dali em diante eu pergunto o que quiser, à vontade
6. No fim eu peço os arquivos de memória atualizados

## Deve funcionar com um arquivo só

Se eu mandar só o JSON de atenção, ela trabalha: perde a metade
"venda", **diz isso claramente logo no começo**, e ainda analisa
exposição, buscas sem resultado, ritmo de horário, alcance e
intenção. Não é para travar pedindo o segundo arquivo.

---

# PARTE 3 — O JSON DE ATENÇÃO

Arquivo único, ~30KB, gerado para qualquer período (7, 30, 90
dias ou datas escolhidas, com recorte de horário opcional).

## Estrutura de topo

```
leia_primeiro              dicionário em prosa, dentro do próprio
                           arquivo: o que cada medida significa e
                           o que ela NÃO prova
gerado_em                  timestamp ISO
restaurante                nome
periodo                    { de, ate, fuso, recorte_de_horario }
resumo                     visitas, tempo médio, quantos abriram
                           cada página, cliques, pratos com atenção
de_onde_vieram             [{ origem, visitas, porcentagem,
                              tempo_medio_ms }]
aparelhos                  [{ aparelho, visitas, porcentagem,
                              tempo_medio_ms }]
visitas_por_hora_do_dia    [{ chave: 0..23, visitas }]
visitas_por_dia_da_semana  [{ chave: 0..6, visitas }]  0 = domingo
alcance_carrossel          [{ posicao, visitas_que_viram,
                              porcentagem_que_viu }]
alcance_home               [{ bloco, nome, visitas_que_chegaram,
                              porcentagem_que_chegou,
                              atencao_media_ms }]
alcance_cardapio           idem, por categoria
alcance_unidades           idem, por bloco da página de unidades
pratos                     TODOS os 129, medidos ou não
buscas                     [{ termo, vezes, pessoas,
                              pratos_encontrados, nota }]
acoes_de_intencao          [{ acao, descricao, vezes, pessoas }]
```

## O objeto `pratos` — é dele que sai quase tudo

```json
{
  "id": "34",
  "nome": "Stadium Wings (HDT)",
  "categoria": "Aquecimentos",
  "preco_reais": 44.9,
  "atencao_ms": 195426,
  "pessoas_que_viram": 10,
  "voltas": 8,
  "cliques_detalhes": 2
}
```

`id`, `nome`, `categoria` e `preco_reais` existem para casar com
uma linha de venda. Os outros quatro são o comportamento.

## O que cada medida significa

**`atencao_ms`** — tempo em que o item ficou de fato na tela, em
milissegundos. Não é tempo de aba aberta: o relógio para depois
de 15s sem rolar nem tocar, e quando a pessoa sai da aba. Há
teto por parada (20s) e teto total por prato (45s), para que um
celular esquecido na mesa não vire "prato campeão".

**`pessoas_que_viram`** — quantas visitas distintas chegaram a
ver o prato. **É o denominador de qualquer conta de conversão.**
Vendas se dividem por ISTO, nunca por `atencao_ms`.

E ele separa duas coisas que o total confunde: um prato com 195s
em 10 pessoas (20s cada) e outro com 97s em 3 (32s cada) parecem
opostos pelo total e se invertem por pessoa.

**`voltas`** — quantas vezes separadas a pessoa voltou ao MESMO
prato na mesma visita. É o sinal de **indecisão**: 47s em 6
voltas e 47s numa volta só são comportamentos opostos. O primeiro
é alguém comparando, quase pedindo. O segundo leu e seguiu.

**`cliques_detalhes`** — abrir os detalhes é escolha, não acaso.
Mas tem dois sentidos opostos: interesse OU descrição que não
explica. Cruzado com tempo e venda, eles se separam (ver Parte 5).

**`porcentagem_que_chegou`** (nos blocos de alcance) — de cada
100 visitas àquela página, quantas ROLARAM até o bloco.
**Chegar é diferente de parar.** Alcance alto com atenção baixa é
gente passando reto, não sucesso.

**`origem`** — de onde a visita veio. `mesa-barra` e
`mesa-recreio` são QR codes nas mesas: essa pessoa está **dentro
do restaurante, sentada, prestes a pedir**. Instagram e Google
são gente de fora, em outro momento de decisão. **Misturar os
dois invalida qualquer conclusão sobre conversão.**

**`aparelho`** — celular, tablet ou computador, pelo lado menor
da tela. Espera-se 95%+ celular.

---

# PARTE 4 — RECONCILIAR OS DOIS ARQUIVOS

Esta é a primeira coisa que a IA faz, antes de qualquer análise.
E é onde mais se erra.

## 4.1 Casar nomes é a parte fácil

`STADIUM WINGS 10UN` com `Stadium Wings (HDT)` — um modelo de
linguagem resolve. Não é aí que está o problema.

## 4.2 Granularidade: o cardápio tem um item onde o caixa tem vários

| No JSON de atenção | No fechamento de contas |
|---|---|
| `Cerveja Long Neck` (1 linha, 7 rótulos dentro) | `HEINEKEN LN`, `CORONA LN`, `SPATEN LN`, `STELLA LN`, `STELLA PURE GOLD`, `HEINEKEN ZERO`, `CORONA CERO` |
| `Quesadillas` (1 linha, 3 proteínas) | `QUESADILLA FRANGO`, `QUESADILLA FILE`, `QUESADILLA CAMARAO` |
| `Stadium Wings (HDT)` (3 tamanhos) | `WINGS 5UN`, `WINGS 10UN`, `WINGS 20UN` |
| `Chope Caldereta` (4 tipos) | `CHOPE AMSTEL`, `CHOPE BRAHMA`, `CHOPE HEINEKEN`, `CHOPE ESCURO` |

São sete vendas para uma atenção, e `Cerveja Long Neck` não se
parece com `HEINEKEN LN` — nenhum casamento por semelhança acha
isso. Só entendendo a **estrutura** do cardápio.

Os itens com mais de um preço são: Stadium Wings, Quesadillas,
Chope Caldereta, Chope Caneca, Cerveja Long Neck, Sucos e Grilled
Caesar Salad. **Nesses, some as vendas e compare com a atenção do
item único.** E diga na saída que a soma foi feita.

## 4.3 Linhas do caixa que não são pratos

O fechamento vai ter linhas que não existem no cardápio:
couvert artístico, taxa de serviço, rodízio, combo do dia,
"diversos", ajuste, cancelamento, gorjeta. **Não force
casamento.** Liste-as separadamente como "fora do cardápio" e
mostre quanto do faturamento elas representam — isso por si só é
informação (se 30% do bruto está fora do cardápio, a análise de
cardápio cobre menos do que parece).

## 4.4 Pratos do cardápio que não aparecem no caixa

Duas causas muito diferentes:

- **Não vendeu nenhuma vez** no período → candidato a revisão
- **Está no caixa com outro nome** que não foi casado → erro de
  reconciliação, não de produto

Antes de dizer que um prato não vende, **confira se ele tem
`pessoas_que_viram` > 0**. Se ninguém viu e ninguém comprou, o
problema é exposição, não produto.

## 4.5 As datas não vão bater — e isso precisa ser tratado

Vai acontecer de o JSON cobrir **1 a 30 de julho** e o
fechamento cobrir **5 de julho a 5 de agosto**. É normal: um é
mês corrido, o outro é ciclo de fechamento.

Regra:

1. **Calcule a interseção** (no exemplo: 5 a 30 de julho) e diga
   quantos dias de cada arquivo ficaram de fora
2. Se a interseção cobrir **menos de 70%** de qualquer um dos
   dois, **avise em destaque** que o cruzamento é frágil
3. Se a interseção for **menor que 15 dias**, diga que não dá
   para cruzar com confiança e faça as duas análises separadas
4. **Nunca compare volumes brutos de períodos de tamanhos
   diferentes.** Normalize por dia antes
5. Se possível, peça o recorte certo: o painel exporta qualquer
   intervalo de datas, então dá para gerar um JSON que bata com o
   ciclo do caixa

## 4.6 O que perguntar e o que assumir

**Pergunte** quando a resposta muda a conclusão:
- item do caixa que pode ser dois pratos diferentes
- item que não existe no cardápio e representa mais de 3% do
  faturamento
- diferença grande de datas

**Assuma e registre** quando for óbvio, dizendo o que assumiu:
- `WINGS 10UN` → Stadium Wings, obviamente
- variação de acento, caixa alta, abreviação

Faça as perguntas **todas de uma vez**, numeradas, não uma a
uma.

---

# PARTE 5 — O MÉTODO DE ANÁLISE

## 5.1 A métrica central: conversão

```
conversão = unidades vendidas / pessoas_que_viram
```

Não é vendas por milissegundo. É vendas por **gente**.

Um prato visto por 10 pessoas e vendido 8 vezes converte 0,8.
Outro visto por 100 e vendido 20 converte 0,2 — mesmo tendo
vendido mais no total. **O segundo é o que precisa de conserto**,
e o ranking bruto de vendas esconde isso.

Quando não houver `pessoas_que_viram` maior que zero, não
calcule conversão: diga "sem exposição medida".

## 5.2 Compare dentro da categoria, nunca fora

**Posição na página contamina tudo.** Prato no começo é visto por
todos independente de qualidade. Comparar Aquecimentos com
Sobremesas mede posição, não prato.

A comparação justa é **cada prato contra a mediana da própria
categoria** — vizinhos que estão lado a lado na página, disputando
o mesmo momento do pedido.

Produza, por categoria:
- ranking de atenção (posição de cada prato)
- ranking de vendas (posição de cada prato)
- **a diferença entre as duas posições** ← o achado

Um prato 10º em atenção e 1º em vendas é o caso mais
interessante do relatório inteiro.

## 5.3 Nem toda categoria converte igual — e isso não é defeito

**Bebida e acompanhamento são pedidos por hábito ou por sugestão
do garçom, sem consultar o cardápio.** Prato principal é escolhido
lendo. A razão atenção→venda não é comparável entre elas.

Bebidas aparecerem como campeãs de venda e fracas em atenção é o
comportamento **esperado**, não um problema a resolver. Uma IA
que não sabe disso vai recomendar "melhorar a foto do chope".

Trate como categorias de **consumo automático**: bebidas, drinks,
acompanhamentos. Analise-as em bloco separado, e nunca as use
como referência para julgar prato principal.

## 5.4 Os quatro quadrantes

| | Vende muito | Vende pouco |
|---|---|---|
| **Visto muito** | campeão — **proteger**: não tirar do topo, não trocar foto, não mexer no preço sem pensar | **o mais acionável**: olham e não pedem |
| **Visto pouco** | **escondido e mesmo assim vende** — subir de posição pode multiplicar | conferir alcance antes de condenar |

## 5.5 Separar hipóteses com evidência, não com achismo

Quando um prato é muito visto e pouco vendido, existem várias
explicações. **Os outros campos separam quase todas:**

| Padrão | Leitura mais provável |
|---|---|
| Muita atenção + muitos cliques em detalhes + pouca venda | Leram a descrição inteira e desistiram. A descrição ou o preço não convencem — **o problema está DEPOIS do interesse** |
| Muita atenção + poucos cliques + pouca venda | A foto ou o nome prendem o olho, mas não geram vontade de saber mais. **Problema de proposta, não de descrição** |
| Muitas voltas + pouca venda | Ficaram em dúvida e escolheram outro. **Procure o concorrente na mesma categoria** — provavelmente um prato de preço próximo que converteu bem |
| Atenção alta só por pessoa (poucas pessoas, muito tempo cada) | Nicho: quem acha, gosta. **Problema de exposição, não de produto** |
| Pouca atenção + boa conversão | Está enterrado. **Maior oportunidade do relatório**: subir de posição multiplica sem mudar nada no prato |
| Atenção zero + venda alta | Vendido pelo garçom, não pelo cardápio. Confirme com o dono |

**Sempre diga qual evidência sustenta a hipótese**, e ofereça a
alternativa quando duas explicações couberem igualmente.

## 5.6 O que o campeão pode ensinar

Pegue o prato de melhor conversão da categoria e compare com os
piores: preço, tamanho da descrição, se tem foto, posição na
lista, número de palavras no nome. Se houver padrão, diga qual
— e proponha aplicar ao pior colocado como teste do mês.

## 5.7 Ritmo: dia e hora

- Cruze `visitas_por_dia_da_semana` com o faturamento por dia
- Cruze `visitas_por_hora_do_dia` com o horário das vendas, se o
  fechamento tiver hora
- Procure o pico de acesso e o pico de faturamento: eles nem
  sempre coincidem, e a diferença entre os dois é informação
- Se o acesso sobe antes do faturamento, o site é **indicador
  antecedente** — e isso vale muito

**Cuidado:** com menos de 6 semanas, padrão de dia da semana é
ruído. Diga isso em vez de afirmar tendência.

## 5.8 Sinais que não vêm do cardápio

- **Buscas sem resultado** — ou o prato não existe (demanda não
  atendida) ou existe com outro nome (venda perdida hoje,
  conserto de graça). Cruze com o fechamento: se buscaram muito
  "porção" e as porções vendem bem, há demanda represada
- **Alcance do carrossel** — se o 3º e o 4º banner chegam a
  poucos, a promoção que está neles fala com ninguém
- **Ações de intenção** (ligar, traçar rota) — o mais perto de
  cliente sem checkout. Cruze com o faturamento do dia
- **Alcance por categoria** — categoria que poucos alcançam não
  pode ser julgada por venda baixa

---

# PARTE 6 — O RELATÓRIO BASE

Esta é a entrega padrão, sem eu pedir nada específico.

### 0. O essencial, em cinco linhas
Antes de qualquer tabela. Se o dono só ler isso, tem que valer:
o que mudou desde o mês passado, o achado mais forte, e a única
coisa que ele deveria fazer esta semana.

### 1. Confiabilidade deste relatório
Período coberto por cada arquivo, interseção, quantos itens
casaram, quantos não, quanto do faturamento ficou fora do
cardápio, e o volume de visitas. **Se algo aqui compromete as
conclusões, diga antes de apresentá-las, não depois.**

### 2. Onde atenção e venda concordam
Os campeões dos dois lados. Não é para mudar — é para proteger.

### 3. Onde discordam — o coração do relatório
Os quatro quadrantes, com hipótese e evidência para cada caso
relevante (Parte 5.5). No máximo os 8 casos mais fortes; lista
longa demais não é lida.

### 4. Por categoria
Ranking de atenção × ranking de venda dentro de cada uma, e a
diferença de posição. Categorias de consumo automático em bloco
separado, com o aviso.

### 5. Ritmo — dia da semana e hora
Onde o acesso e o faturamento concordam e onde divergem.

### 6. O que procuraram e não acharam

### 7. Intenção — ligar e traçar rota, por unidade

### 8. Três ações para este mês
No máximo três, em ordem de impacto. Cada uma com: o que fazer,
por quê, **quanto se espera ganhar**, e **como saber no mês que
vem se funcionou**.

### 9. O que eu NÃO posso afirmar
Seção obrigatória. Onde o volume é pequeno demais, onde duas
explicações cabem igualmente, o que não casou.

### 10. Perguntas para o dono

### 11. Arquivos de memória atualizados
`de-para.json` com os itens novos resolvidos, e a entrada do mês
para o `historico.json`.

---

# PARTE 7 — DEPOIS DO RELATÓRIO: PERGUNTAS LIVRES

Terminado o relatório base, eu vou perguntar coisas específicas.
Exemplos reais do que vou querer:

- "Qual acompanhamento é mais visto e qual é mais vendido?"
- "Em que horário tivemos o pico na sexta-feira?"
- "Dos 300 pratos vendidos no mês, quanto caiu na sexta?"
- "Se sexta é 20% do mês, quanto devo esperar na próxima?"
- "Este prato converte melhor em quem veio do QR ou do
  Instagram?"
- "Qual categoria mais perdeu atenção em relação ao mês passado?"
- "Vale subir o preço da picanha? O que os dados dizem?"

Regras para essas respostas:

1. **Responda com número primeiro, explicação depois**
2. Se a pergunta não pode ser respondida com os dados, **diga o
   que falta** em vez de aproximar
3. Se a resposta depende de um recorte que eu posso gerar no
   painel (outro período, outra faixa de horário), **peça**
4. Nunca invente dado que não está nos arquivos

---

# PARTE 8 — OS TRÊS ARQUIVOS DE MEMÓRIA

## Antes: como funciona o "aprendizado" aqui

**O modelo não muda.** Nada do que se conversa com ele altera
coisa alguma; não existe treinamento acontecendo. No mês que vem
ele chega exatamente igual, sem lembrar da Stadium.

Pense nele como **um consultor excelente com amnésia total**.
Todo mês entra na sala alguém brilhante que nunca viu o
restaurante. Com uma pasta contendo tudo que já aconteceu, ele
trabalha como quem está lá há um ano. Sem a pasta, começa do
zero.

**A pasta é o produto. O consultor é alugado.**

E a pasta é melhor que memória de verdade, por quatro motivos
que importam ao negócio:

| | Memória em arquivo | Modelo treinado |
|---|---|---|
| Dá para **ler** o que ele sabe | sim, é texto | não |
| Dá para **corrigir** um erro | edita a linha | retreina tudo |
| Dá para **provar** de onde veio a conclusão | sim | não |
| Sobrevive à troca de IA | sim | não |

O último é o decisivo: se aparecer um modelo melhor, troca-se o
modelo e leva-se a pasta. Doze meses de decisões da Stadium
continuam valendo.

**No primeiro mês o relatório será genérico, e isso deve ser dito
ao cliente.** O valor aparece a partir do terceiro ou quarto,
quando já há histórico para comparar.

## Qual modelo usar

**Claude Opus 5** (`claude-opus-5`) — 1M de contexto, o mais
capaz para raciocínio. A análise É o produto; economizar no
modelo aqui é economizar no produto.

Custo estimado por relatório mensal, via API: cerca de US$ 3
(entrada ~40 mil tokens, mais a sessão de perguntas). Contra uma
mensalidade de R$ 400 a 700, é irrelevante.

**Mas para começar, não use API.** Um plano pago do Claude no
navegador, colando os arquivos, resolve: zero código, zero
infraestrutura, custo fixo. A API só passa a valer quando isto
virar produto para vários clientes e precisar ser automatizado.

## Os três arquivos

## `de-para.json` — memória dos casamentos

```
"HEINEKEN LN"        -> prato 57 (Cerveja Long Neck)
"WINGS 10UN"         -> prato 34 (Stadium Wings)
"COUVERT ARTISTICO"  -> fora do cardápio, ignorar
```

A IA **propõe** na primeira vez, eu **confirmo uma vez**, e
congela. No mês seguinte ela não redecide nada — só pergunta
sobre o que é novo.

**Isso é o que mata a inconsistência.** Se em janeiro a Heineken
Zero entra na Long Neck e em março vira item separado, a série
temporal apodrece — e nada dá erro. O gráfico continua bonito
mostrando uma queda que não existiu.

## `historico.json` — o ciclo fechado

Não são só os números antigos. É recomendação, ação e resultado:

> Março: recomendado subir o Pastel três posições.
> Feito no dia 8.
> Abril: atenção de 2s para 18s, vendas +22%.

Depois de seis desses, ela para de dizer "considere
reposicionar" e passa a dizer **"reposicionar funcionou nas 4
vezes que tentamos, com ganho médio de 19%"**. Isso é
conhecimento sobre ESTA casa, que nenhum modelo tem de fábrica.

## `contexto-da-casa.md` — o que o dado não pode saber

> Dezembro tem Réveillon e distorce tudo.
> A fritadeira quebrou na semana 3 de maio.
> O preço da picanha subiu dia 15.
> Terça é o dia mais fraco, sempre foi.
> A Barra tem estacionamento; o Recreio não.

Sem isso a IA olha a queda de maio e culpa a foto do prato.

**Consequência de negócio:** o concorrente copia o cardápio
digital numa semana. Não copia doze meses de decisões
confirmadas e resultados medidos desta casa.

---

# PARTE 9 — REGRAS DE HONESTIDADE

Não negociáveis. Uma análise confiante e errada é pior que
nenhuma.

1. **Atenção não é intenção de compra.** Um prato pode reter
   olhos por curiosidade, preço alto ou nome estranho.
2. **Posição contamina tudo.** Só compare dentro da categoria.
3. **Preço explica pouco neste cardápio.** 17 hambúrgueres
   custam exatamente R$ 59,90; as 5 massas, R$ 79,90. Onde o
   preço varia muito dentro de uma categoria (Aquecimentos, de
   R$ 10,50 a R$ 219,90) é porque ela mistura pão de alho com
   prato de dividir.
4. **Atenção zero não é prato ruim** — pode ser prato que
   ninguém chegou a ver.
5. **Volume pequeno não conclui nada.** Confira `visitas` antes
   de afirmar. Com poucas dezenas, diferença é ruído — diga
   isso.
6. **As fotos dos pratos ainda são provisórias** nesta fase, e
   várias se repetem entre pratos. Diferença de atenção pode vir
   da foto genérica, não do prato.
7. **Correlação não é causa.** Ofereça as explicações
   alternativas quando couberem.
8. **Não invente número.** Se não está nos arquivos, diga que
   não está.

---

# PARTE 10 — COMO QUERO TRABALHAR

- **Uma coisa de cada vez.** Você propõe, eu autorizo, você faz.
- **Se eu ficar em dúvida, explique antes de construir.**
- Se achar que uma ideia minha não sobrevive aos dados reais,
  **diga.** Já aconteceu de eu pedir uma análise de preço que o
  cardápio não sustentava, e foi melhor saber antes de construir.
- Prefiro **decisão acionável** a número bonito. "Suba o Pastel
  três posições" vale mais que "o Pastel teve 2% de atenção".
- Escreva em português do Brasil, direto, sem jargão de
  consultoria.

---

# PARTE 11 — O QUE AINDA NÃO SEI

**O formato do fechamento de contas é desconhecido.** Ninguém
olhou um arquivo real. Pode vir como PDF, Excel, CSV do sistema
de caixa, ou uma tela que só imprime.

**Antes de propor arquitetura, me peça um arquivo real.** Sem
ele, qualquer plano é chute.

Também não sei ainda:
- se o fechamento traz hora da venda (muda toda a Parte 5.7)
- se traz mesa/comanda (permitiria ticket médio por mesa)
- se separa as duas unidades
- se traz custo, e não só preço de venda (permitiria margem)

---

# PARTE 12 — ONDE ISSO PODE CHEGAR

**Estimar movimento.** Com meses suficientes, cruzar acesso com
faturamento por dia da semana dá previsão útil — "sexta costuma
ser 20% do mês". Com um mês só é chute; a partir de uns seis
começa a valer.

**O indicador antecedente.** Quando o QR code estiver nas mesas,
cada leitura com origem `mesa-barra` ou `mesa-recreio` é uma
**mesa sentada em tempo real**. Cruzando leituras por hora com o
faturamento da mesma hora sai um valor por leitura — e o acesso
deixa de ser relatório do passado e vira previsão da noite.

A medição já está pronta. Falta imprimir o QR code.

---

# PRIMEIRA PERGUNTA

Vamos começar decidindo **o que essa ferramenta vai ser, na
prática**:

- Um prompt que eu colo num chat junto dos arquivos?
- Um programa que roda local e cospe um relatório?
- Uma página web onde o dono sobe os arquivos e recebe a análise?

Me diga qual você acha melhor **para o meu caso** — agência
começando, um cliente, sem infraestrutura montada — e por quê.

Leve em conta que a resposta precisa comportar os três arquivos
de memória da Parte 8, porque é neles que está o valor que se
acumula. Uma solução que não tenha onde guardá-los volta à
estaca zero todo mês.

Depois a gente constrói, **um passo de cada vez**.
