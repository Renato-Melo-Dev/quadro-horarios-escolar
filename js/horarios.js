/* O professor consulta o quadro; a edição local continua exclusiva da interface da gestão. */
(() => {
    'use strict';
    const $ = id => document.getElementById(id);

    const normalizar = valor => String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    const escape = valor => String(valor ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const dias = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];

    const dados = structuredClone(window.QUADRO_HORARIOS);
    const hoje = new Date().getDay();
    const estado = {dia: hoje >= 1 && hoje <= 5 ? hoje - 1 : 0, ano:'6', turma:'', professor:'', disciplina:'', situacao:'', busca:'', editar:false};
    let sugestoes = [], selecionada = -1;
    const nomes = campo => [...new Set(Object.values(dados.horarios).map(a => a[campo]).filter(Boolean))].sort((a,b) => a.localeCompare(b,'pt-BR'));
    const anoDaTurma = turma => turma.id.split(':')[1][0];
    const filtros = ['turma','professor','disciplina','situacao'];
    const rotulos = {turma:'Turma',professor:'Professor',disciplina:'Disciplina',situacao:'Situação',busca:'Busca'};
    const situacoes = {aula:'Com aula',pendente:'A conferir','sem-aula':'Sem aula'};
    function corresponde(aula) {
        return (!estado.professor || aula.professor === estado.professor) &&
            (!estado.disciplina || aula.disciplina === estado.disciplina) &&
            (!estado.situacao || aula.estado === estado.situacao) &&
            (!estado.busca || normalizar(aula.professor + ' ' + aula.disciplina).includes(normalizar(estado.busca)));
    }
    function limpar() {
        for (const campo of [...filtros,'busca']) estado[campo] = '';
        $('busca').value = '';
        fecharSugestoes();
        renderizar();
    }
    function renderizar() {
        $('dias').innerHTML = dias.map((dia,i) => `<button type="button" data-dia="${i}" aria-pressed="${i === estado.dia}">${dia}</button>`).join('');
        $('anos').innerHTML = ['6','7','8','9','todos'].map(ano => `<button type="button" data-ano="${ano}" aria-pressed="${ano === estado.ano}">${ano === 'todos' ? 'Todos' : ano+'º ano'}</button>`).join('');
        $('hoje').textContent = hoje >= 1 && hoje <= 5 ? `Hoje · ${dias[hoje-1]}-feira` : 'Fim de semana · Consulte os dias letivos';
        $('titulo-quadro').textContent = dias[estado.dia]+'-feira';
        const ativos = [...filtros,'busca'].filter(c => estado[c]);
        $('filtros-total').textContent = filtros.filter(c => estado[c]).length || '';
        $('filtros-ativos').innerHTML = ativos.map(campo => {
            const valor = campo === 'turma' ? dados.turmas.find(t=>t.id===estado.turma)?.nome : campo === 'situacao' ? situacoes[estado.situacao] : estado[campo];
            return `<button class="qh-chip" data-remover="${campo}" aria-label="Remover filtro ${escape(rotulos[campo])}: ${escape(valor)}">${rotulos[campo]}: ${escape(valor)} ×</button>`;
        }).join('') + (ativos.length ? '<button class="qh-chip" data-limpar>Limpar filtros</button>' : '');
        const turmas = dados.turmas.filter(t=>(estado.ano === 'todos' || anoDaTurma(t) === estado.ano) && (!estado.turma || t.id === estado.turma));
        let total = 0, mostradas = 0, html = '';
        const filtrandoAulas = !!(estado.professor || estado.disciplina || estado.situacao || estado.busca);
        for (const ano of ['6','7','8','9']) {
            let colunas = '';
            for (const turma of turmas.filter(t=>anoDaTurma(t) === ano)) {
                const aulas = Array.from({length:10},(_,i)=>({chave:`${turma.id}|${estado.dia}|${i+1}`,periodo:i+1})).map(a=>({...a,...dados.horarios[a.chave]}));
                const visiveis = aulas.filter(a=>!filtrandoAulas || corresponde(a));
                if (!visiveis.length) continue;
                mostradas++;
                const quantidade = visiveis.filter(a=>a.estado !== 'sem-aula').length;
                total += quantidade;
                colunas += `<article class="qh-turma"><header><h3>${escape(turma.nome)}</h3><span>${quantidade} períodos com aula</span></header><ol class="qh-aulas">` + visiveis.map(a=>{
                    const conteudo = `<span class="qh-ordem">${a.periodo}ª</span><div class="qh-aula-info"><strong>${escape(a.estado === 'sem-aula' ? 'Sem aula' : a.disciplina || 'Disciplina a conferir')}</strong>${a.estado !== 'sem-aula' ? `<p>${escape(a.professor || 'Professor a conferir')}</p><span class="qh-sala">Sala ${escape(a.sala || '—')}</span>${a.estado === 'pendente' ? '<span class="qh-pendente">A conferir</span>' : ''}` : ''}</div>`;
                    return `<li class="qh-aula ${a.estado}">${estado.editar ? `<button data-editar="${a.chave}" aria-label="Editar ${escape(turma.nome)}, ${a.periodo}ª aula">${conteudo}</button>` : conteudo}</li>`;
                }).join('') + '</ol></article>';
            }
            if (colunas) html += `<section class="qh-grupo" aria-label="${ano}º ano">${estado.ano === 'todos' ? `<h3>${ano}º ano</h3>` : ''}<div class="qh-grade">${colunas}</div></section>`;
        }
        $('resumo').textContent = `${mostradas} turmas · ${total} períodos com aula${filtrandoAulas ? ' nesta consulta' : ''}`;
        $('quadros').innerHTML = html || '<div class="qh-vazio"><h3>Nenhuma aula encontrada</h3><p>Tente outro dia, ano escolar ou ajuste os filtros.</p><button class="qh-botao" data-limpar>Limpar filtros</button></div>';
    }
    function fecharSugestoes() {
        $('sugestoes').hidden = true;
        $('busca').setAttribute('aria-expanded','false');
        $('busca').removeAttribute('aria-activedescendant');
        selecionada = -1;
    }
    function sugerir() {
        const texto = normalizar($('busca').value);
        if (!texto) { fecharSugestoes(); return; }
        sugestoes = ['disciplina','professor'].flatMap(campo=>nomes(campo).filter(nome=>normalizar(nome).includes(texto)).map(nome=>({campo,nome})));
        // Prioriza nomes que começam com a busca, mantendo as duas categorias identificadas.
        sugestoes.sort((a,b)=>normalizar(a.nome).indexOf(texto)-normalizar(b.nome).indexOf(texto) || a.nome.localeCompare(b.nome,'pt-BR'));
        $('sugestoes').innerHTML = sugestoes.map((s,i)=>`<div role="option" id="sugestao-${i}" data-sugestao="${i}" aria-selected="false"><span>${escape(s.nome)}</span><small>${rotulos[s.campo]}</small></div>`).join('');
        $('sugestoes').hidden = !sugestoes.length;
        $('busca').setAttribute('aria-expanded',String(!!sugestoes.length));
        selecionada = -1;
    }
    function escolher(i) {
        const sugestao = sugestoes[i];
        if (!sugestao) return;
        estado[sugestao.campo] = sugestao.nome;
        estado.busca = '';
        $('busca').value = '';
        fecharSugestoes(); renderizar(); $('busca').focus();
    }
    $('busca').addEventListener('input',()=>{estado.busca=$('busca').value;renderizar();sugerir();});
    $('busca').addEventListener('focus',sugerir);
    $('busca').addEventListener('keydown',event=>{
        if (event.key === 'Escape') {fecharSugestoes();return;}
        if ($('sugestoes').hidden) return;
        if (['ArrowDown','ArrowUp'].includes(event.key)) {
            event.preventDefault();
            selecionada = (selecionada + (event.key === 'ArrowDown' ? 1 : -1) + sugestoes.length) % sugestoes.length;
            [...$('sugestoes').children].forEach((el,i)=>el.setAttribute('aria-selected',String(i===selecionada)));
            $('busca').setAttribute('aria-activedescendant',`sugestao-${selecionada}`);
            $(`sugestao-${selecionada}`).scrollIntoView({block:'nearest'});
        } else if (event.key === 'Enter' && selecionada >= 0) {event.preventDefault();escolher(selecionada);}
    });
    $('busca').addEventListener('blur',()=>setTimeout(fecharSugestoes,150));
    $('sugestoes').addEventListener('mousedown',e=>e.preventDefault());
    $('sugestoes').addEventListener('click',e=>{const el=e.target.closest('[data-sugestao]');if(el) escolher(Number(el.dataset.sugestao));});
    $('dias').addEventListener('click',e=>{const el=e.target.closest('[data-dia]');if(el){estado.dia=Number(el.dataset.dia);renderizar();$('dias').querySelector(`[data-dia="${estado.dia}"]`).focus();}});
    $('anos').addEventListener('click',e=>{const el=e.target.closest('[data-ano]');if(el){estado.ano=el.dataset.ano;estado.turma='';renderizar();$('anos').querySelector(`[data-ano="${estado.ano}"]`).focus();}});
    document.addEventListener('click',e=>{
        if(e.target.closest('[data-limpar]')) limpar();
        const remover=e.target.closest('[data-remover]');
        if(remover){estado[remover.dataset.remover]='';if(remover.dataset.remover==='busca') $('busca').value='';renderizar();$('busca').focus();}
        const fechar=e.target.closest('[data-fechar]');if(fechar) fechar.closest('dialog').close();
    });
    function preencherSelect(id,opcoes,valor) {
        $(id).innerHTML='<option value="">Todas as opções</option>'+opcoes.map(([v,n])=>`<option value="${escape(v)}">${escape(n)}</option>`).join('');
        $(id).value=valor;
    }
    $('abrir-filtros').addEventListener('click',()=>{
        preencherSelect('f-turma',dados.turmas.filter(t=>estado.ano==='todos'||anoDaTurma(t)===estado.ano).map(t=>[t.id,t.nome]),estado.turma);
        for(const campo of ['professor','disciplina']) preencherSelect('f-'+campo,nomes(campo).map(n=>[n,n]),estado[campo]);
        $('f-estado').value=estado.situacao;
        $('filtros-dialog').showModal();
    });
    $('form-filtros').addEventListener('submit',e=>{
        e.preventDefault();for(const campo of ['turma','professor','disciplina']) estado[campo]=$('f-'+campo).value;
        estado.situacao=$('f-estado').value;$('filtros-dialog').close();renderizar();
    });
    $('limpar-filtros').addEventListener('click',()=>{for(const id of ['f-turma','f-professor','f-disciplina','f-estado']) $(id).value='';});
    renderizar();
})();
