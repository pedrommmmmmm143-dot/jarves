(() => {
  const topics = [
    ['html', 'HTML', 'estrutura e semântica da página'],
    ['css', 'CSS', 'estilos, layout e responsividade'],
    ['javascript', 'JavaScript', 'comportamento e compatibilidade'],
    ['typescript', 'TypeScript', 'tipos, interfaces e compilação'],
    ['python', 'Python', 'código, ambiente e dependências'],
    ['java', 'Java', 'código, JVM e dependências'],
    ['cpp', 'C e C++', 'código, compilação e memória'],
    ['php', 'PHP', 'código, servidor e dependências'],
    ['json-xml', 'JSON e XML', 'estrutura, formato e validação'],
    ['projetos-web', 'projetos web', 'objetivo, usuários e tecnologias'],
    ['apis', 'APIs', 'contrato, validação e integração'],
    ['bancos-dados', 'bancos de dados', 'modelo, consultas e integridade'],
    ['android', 'Android', 'versão, dispositivo e ferramentas instaladas'],
    ['linux', 'Linux', 'distribuição, comandos e ambiente'],
    ['windows', 'Windows', 'versão, aplicativo e ambiente'],
    ['seguranca-defensiva', 'segurança digital defensiva', 'sistema próprio, risco e medidas de proteção'],
    ['testes', 'testes de software', 'comportamento esperado e casos de teste'],
    ['documentacao', 'documentação técnica', 'público, finalidade e formato'],
    ['estudos', 'estudos', 'assunto, nível e objetivo de aprendizagem'],
    ['matematica', 'matemática', 'problema, dados e nível de ensino'],
    ['ciencias', 'ciências', 'tema, evidências e nível de ensino'],
    ['idiomas', 'idiomas', 'idioma de origem, destino e contexto'],
    ['escrita', 'escrita', 'público, tom e finalidade do texto'],
    ['pesquisa', 'pesquisa', 'pergunta, fontes e período de interesse'],
    ['negocios', 'negócios', 'objetivo, público e recursos disponíveis'],
    ['produtividade', 'produtividade pessoal', 'prioridades, prazo e restrições'],
    ['planilhas', 'planilhas', 'colunas, fórmulas e resultado esperado'],
    ['apresentacoes', 'apresentações', 'público, duração e mensagem central'],
    ['design-acessibilidade', 'design e acessibilidade', 'pessoas usuárias, plataforma e necessidades'],
    ['jogos-roblox', 'jogos e Roblox', 'mecânica, plataforma e segurança do projeto'],
  ].map(([id, label, context]) => ({ id, label, context }));

  const actions = [
    ['explicar', 'Explicar', 'Explique os conceitos com clareza e um exemplo adequado.'],
    ['criar', 'Criar', 'Proponha uma solução inicial e identifique as decisões necessárias.'],
    ['planejar', 'Planejar', 'Divida o trabalho em etapas, dependências e critérios de conclusão.'],
    ['analisar', 'Analisar', 'Analise os dados fornecidos, separando fatos, hipóteses e dúvidas.'],
    ['revisar', 'Revisar', 'Revise o material e aponte problemas concretos com justificativas.'],
    ['depurar', 'Depurar', 'Investigue o erro informado e sugira verificações reproduzíveis.'],
    ['melhorar', 'Melhorar', 'Sugira melhorias priorizadas sem perder os requisitos existentes.'],
    ['refatorar', 'Refatorar', 'Proponha uma refatoração incremental e preserve o comportamento.'],
    ['testar', 'Testar', 'Defina casos de teste e resultados esperados, sem afirmar que os executou.'],
    ['documentar', 'Documentar', 'Escreva documentação concisa para o público indicado.'],
    ['resumir', 'Resumir', 'Resuma os pontos principais sem omitir ressalvas importantes.'],
    ['traduzir', 'Traduzir', 'Traduza preservando sentido, termos técnicos e contexto.'],
    ['comparar', 'Comparar', 'Compare alternativas pelos critérios relevantes e explicite incertezas.'],
    ['ideias', 'Gerar ideias', 'Apresente opções variadas e indique vantagens e limitações.'],
    ['organizar', 'Organizar', 'Estruture as informações em uma sequência fácil de acompanhar.'],
    ['checklist', 'Criar checklist', 'Crie uma lista verificável e ordenada por prioridade.'],
    ['diagnosticar', 'Diagnosticar', 'Liste causas prováveis, evidências necessárias e próximos passos seguros.'],
    ['otimizar', 'Otimizar', 'Identifique gargalos possíveis e proponha medições antes de otimizar.'],
    ['proteger', 'Proteger', 'Priorize medidas defensivas, validação e redução de exposição.'],
    ['validar', 'Validar', 'Verifique consistência, requisitos e casos extremos com os dados fornecidos.'],
    ['converter', 'Converter', 'Converta para o formato pedido e informe perdas ou incompatibilidades.'],
    ['exemplos', 'Criar exemplos', 'Forneça exemplos pequenos, seguros e explicados passo a passo.'],
    ['tutorial', 'Criar tutorial', 'Crie um tutorial progressivo com pré-requisitos e verificações.'],
    ['requisitos', 'Definir requisitos', 'Separe requisitos funcionais, restrições e critérios de aceitação.'],
    ['arquitetura', 'Desenhar arquitetura', 'Descreva componentes, responsabilidades e fluxos de dados.'],
    ['gerar', 'Gerar conteúdo', 'Produza um rascunho utilizável e destaque o que precisa ser confirmado.'],
    ['simplificar', 'Simplificar', 'Simplifique a explicação sem remover precisão ou contexto essencial.'],
    ['adaptar', 'Adaptar', 'Adapte a solução ao nível, plataforma e restrições informados.'],
    ['estimar', 'Estimar esforço', 'Dê uma estimativa em intervalos e declare as premissas.'],
    ['avaliar-riscos', 'Avaliar riscos', 'Identifique riscos, impacto, sinais de alerta e mitigação.'],
  ].map(([id, label, instruction]) => ({ id, label, instruction }));

  const commands = Object.freeze(topics.flatMap(topic => actions.map(action => Object.freeze({
    command: `/${topic.id}-${action.id}`,
    name: `${action.label}: ${topic.label}`,
    topic: topic.label,
    action: action.label,
    prompt: `Ajude-me com ${action.label.toLowerCase()} em ${topic.label}. ${action.instruction} Contexto a considerar: ${topic.context}. Pergunte se faltarem informações essenciais; não invente fatos, fontes ou resultados. Não afirme que executou, testou, alterou arquivos ou publicou algo sem confirmação.`,
  }))));
  const byCommand = new Map(commands.map(entry => [entry.command, entry]));

  globalThis.jarvesCommandCatalog = Object.freeze({
    count: commands.length,
    list() {
      return commands;
    },
    get(command) {
      return byCommand.get(String(command || '').trim().split(/\s+/)[0].toLowerCase()) || null;
    },
    countMatches(query = '') {
      const normalized = String(query).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
      if (!normalized) return commands.length;
      return commands.filter(entry => `${entry.command} ${entry.name} ${entry.topic} ${entry.action}`
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(normalized)).length;
    },
    search(query = '', limit = 30) {
      const normalized = String(query).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
      const max = Number.isFinite(limit) ? Math.min(100, Math.max(1, Math.floor(limit))) : 30;
      const matches = normalized
        ? commands.filter(entry => `${entry.command} ${entry.name} ${entry.topic} ${entry.action}`
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(normalized))
        : commands;
      return matches.slice(0, max);
    },
  });
})();
