# Habit OS — Web (v4)

App de hábitos 100% local: sem conta, sem backend, sem nuvem. Tudo fica salvo no
`localStorage` do navegador. Funciona offline como PWA (dá pra "instalar" pelo
navegador, no celular ou no computador).

## Como usar

Abra `index.html` num servidor local (não em `file://`, para o service worker
funcionar) — por exemplo:

```bash
npx serve .
# ou
python3 -m http.server 8080
```

Depois é só acessar `http://localhost:PORTA` no navegador. Para instalar como
app, use "Adicionar à tela inicial" (celular) ou o ícone de instalar da barra
de endereço (desktop, Chrome/Edge).

## O que tem nessa versão

- **Hábitos** — metas diárias ou em dias específicos da semana, com sequência
  (streak), XP e histórico.
- **Rotinas** — sequências de passos (ex: rotina da manhã). Podem ser
  marcadas por checklist ou seguidas no **modo guiado**, passo a passo.
  Cada rotina pode ser **exportada** como um arquivo `.json` (botão
  "Exportar" no card ou dentro do formulário de edição) e depois
  **importada** em outro aparelho (botão "Importar rotina" na aba
  Hábitos → Rotinas) — é assim que dá pra criar a rotina no computador
  e levar para o celular, ou vice-versa.
- **Tarefas** — com prioridade, data e uma visão dedicada (pendentes/concluídas)
  dentro da aba Hábitos.
- **Agenda** — calendário mensal com % de cumprimento por dia e compromissos.
- **Orações** — quatro orações padrão (editáveis), com horário e texto.
- **XP, níveis e conquistas** — todo item concluído dá XP; XP acumulado sobe
  de nível; conquistas são desbloqueadas automaticamente e avisadas por toast.
- **Evolução** — comparação semana atual x anterior, gráfico diário,
  desempenho por hábito e um calendário de consistência (estilo "heatmap"),
  com período ajustável (7/30/90 dias).
- **Relatórios para análise** — na aba Evolução, dá pra baixar:
  - **PDF** (abre o diálogo de impressão do navegador — escolha "Salvar como PDF");
  - **CSV**, pronto para abrir em Excel/Planilhas Google;
  - **Resumo em texto**, formatado para colar numa IA e pedir uma análise.
- **Configurações** (aba Perfil) — nome e emoji, tema (claro/escuro/automático),
  cor de destaque, meta diária de itens concluídos, início da semana
  (domingo/segunda), exportar/importar backup em JSON e apagar todos os dados.
- **Busca** de hábitos por nome/categoria.

## Estrutura dos arquivos

```
index.html    shell da página + fontes
styles.css    todo o visual (tokens de cor, tipografia, componentes)
app.js        toda a lógica e as telas (estado, render, formulários, relatório)
manifest.json metadados do PWA (nome, cor, ícone)
sw.js         cache offline (service worker)
icon.svg      ícone do app
```

## Backup e dados

Os dados vivem só neste navegador/dispositivo. Recomenda-se exportar um backup
(Perfil → Dados → Exportar backup) de vez em quando, especialmente antes de
limpar o cache do navegador ou trocar de aparelho. O mesmo botão de backup
serve para levar seus dados para outro navegador via "Importar backup".

## Compatibilidade com a versão anterior

Esta versão lê os dados salvos pela v3 automaticamente (mesma chave de
armazenamento) — nenhuma migração manual é necessária, seus hábitos e
histórico continuam de onde pararam.
