# Quadro de horários — Padre Nicolau Pimentel

Projeto estático independente, somente para consulta, com o layout do Núcleo Escolar. Não precisa de backend, login, instalação de dependências ou build.

## Visualizar

Abra `index.html` no navegador. A busca, os dias, os anos escolares e os filtros funcionam com os dados de `js/horarios-dados.js`. Os ícones Bootstrap são carregados por CDN e precisam de internet.

## Publicar na Vercel

1. Envie o conteúdo desta pasta para um repositório no GitHub, mantendo `index.html` na raiz.
2. Na Vercel, crie um projeto e importe esse repositório.
3. Use Framework Preset **Other**, sem comando de build e Output Directory **.**. O `vercel.json` já registra essa configuração.
4. Publique e compartilhe o endereço de produção com os professores.

Documentação: https://vercel.com/docs/builds/configure-a-build

## Atualizar os horários

Edite `js/horarios-dados.js` e publique novamente. É possível substituir esse arquivo pela versão atualizada do projeto escolar original. Alterações feitas no armazenamento local do navegador do projeto original não são incluídas automaticamente.

As chaves seguem `2026:6a|0|1`: turma, dia (0 = segunda e 4 = sexta) e período (1 a 10). Preserve a estrutura `window.QUADRO_HORARIOS`.

Foram preservados os dados existentes, inclusive os estados “A conferir” e “Sem aula”. As salas ainda não informadas aparecem como “—”. O quadro informa a ordem das aulas; os horários de início e término não constam na fonte original.

## Verificação realizada

Conferidas as referências locais de HTML, os elementos usados pelo JavaScript e os 800 registros de períodos das 16 turmas. Teste visual e interativo em navegador não realizado neste ambiente.
