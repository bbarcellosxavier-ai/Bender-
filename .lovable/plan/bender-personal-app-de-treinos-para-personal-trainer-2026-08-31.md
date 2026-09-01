# Bender Personal — App de treinos para personal trainer

Projeto novo e independente. Sem reaproveitar código, schema ou configuração de qualquer outro projeto.

## Arquitetura do backend (confirmada)

O app será conectado a um **projeto Supabase novo, criado na sua própria conta** — Project ID próprio, banco, autenticação, storage e credenciais exclusivos do Bender Personal. Nada é compartilhado com o projeto `zqfowieidipwnbirfayy`.

Você mantém acesso direto ao dashboard do supabase.com: SQL Editor, Table Editor, Authentication, Storage, RLS/Policies, configurações e credenciais. Todo o schema deste plano é aplicado como migrations nesse projeto.

**Passo zero, por sua conta:** criar o projeto novo em supabase.com e conectá-lo ao Bender Personal pelo botão de integração do Supabase no topo do editor Lovable. A implementação começa assim que a conexão estiver ativa.

## Decisões confirmadas

- **Imagens dos exercícios**: ilustrações estilo boneco de linha geradas por IA para os ~35 exercícios semente, com upload manual pelo personal como fallback e substituição a qualquer momento. O banco guarda apenas URL + tipo de mídia, então trocar por GIF ou animação depois não exige remodelagem.
- **PWA agora, Capacitor depois**: app instalável pelo navegador (manifest, ícones, tela offline básica), com o código organizado para migrar a Play Store/App Store no futuro sem reescrita.
- **Contas dos alunos**: criadas pelo personal com senha temporária; o aluno é obrigado a definir uma nova senha no primeiro acesso, e o personal nunca precisa conhecer a senha definitiva.
- **Bloqueio por inadimplência**: 0 dias de tolerância — bloqueia no dia seguinte ao vencimento. O valor fica configurável, caso queira afrouxar depois.


## Identidade visual

Tema escuro: preto e cinza grafite como base, vermelho como destaque (botões primários, ícones ativos, barras de progresso). Mobile-first: botões grandes, tipografia legível a distância, o treino do dia abre já mostrando o primeiro exercício.

## Estrutura de entrega

### 1. Banco de dados e segurança
Tabelas: `profiles`, `user_roles`, `students`, `payments`, `muscle_groups`, `exercises`, `workouts`, `workout_exercises`, `student_workouts`.

RLS ativa em todas desde a criação, com grants explícitos:
- O aluno lê apenas o próprio `students`, seus `payments`, seus `student_workouts` e — exclusivamente — os `workouts`, `workout_exercises` e `exercises` que fazem parte dos treinos atribuídos a ele. Sem acesso à biblioteca geral de exercícios, a treinos não atribuídos ou a qualquer dado de outros alunos.
- Personal lê e escreve tudo dentro do próprio escopo de alunos; super_admin tem acesso total.
- Telefone e valores de mensalidade sem qualquer leitura anônima.

### 2. Autenticação e papéis
Login por e-mail/senha. Três papéis: `super_admin` (você), `personal`, `aluno`. Roteamento por papel: admin cai no dashboard, aluno cai na tela de treinos.

Primeiro acesso do aluno: a conta é criada pelo personal com senha temporária e a flag `must_change_password`. Enquanto ela estiver ativa, o aluno é levado direto para a tela de definição de nova senha e não consegue navegar no app; ao concluir, a flag é limpa e ele segue para os treinos.


### 3. Área administrativa
- Dashboard: alunos ativos, mensalidades em atraso, próximos vencimentos.
- Alunos: cadastro com nome, telefone, e-mail, data de início, observações, status; criação da conta de acesso do aluno.
- Mensalidades: valor, dia de vencimento, marcar como pago, histórico.
- Biblioteca de exercícios: nome, grupo muscular, instruções, mídia, dificuldade, equipamento; upload de imagem/GIF.
- Montagem de treinos: nome, foco, exercícios com séries/repetições/descanso e ordem.
- Atribuição de treinos por aluno, com parâmetros que podem variar entre alunos.

### 4. Área do aluno
- Tela inicial com os treinos liberados, treino do dia em destaque.
- Execução do treino: ilustração, instruções, séries/repetições/descanso, navegação entre exercícios.
- Tela de bloqueio quando há mensalidade vencida, sem expor valores.

### 5. Conteúdo semente
9 grupos musculares e os ~35 exercícios listados, cada um com instrução curta em português, mais os treinos A–E sugeridos — tudo já inserido na criação do banco.

### 6. Ilustrações
Geração das ilustrações estilo boneco de linha (fundo grafite, traço vermelho/branco) e vínculo a cada exercício semente.

### 7. Teste ponta a ponta
Aluno de teste, treino atribuído, visualização como aluno, mensalidade atrasada simulada bloqueando o acesso.

## Notas técnicas

- Todas as telas com dados remotos terão estado de carregando, erro com "tentar novamente" e estado vazio.
- Papéis em tabela `user_roles` separada (nunca em `profiles`), com função `has_role` `SECURITY DEFINER` e `search_path` fixado — evita escalonamento de privilégio.
- Fonte única de verdade: status do aluno só em `students`, status financeiro derivado de `payments`.
- `exercises.media_url` + `media_type` ('image' | 'gif' | 'lottie') mantêm a porta aberta para trocar as mídias depois.
- Bloqueio calculado no servidor a partir de `payments` (respeitando `grace_days`), não no cliente.
- PWA: manifest, ícones e service worker; a lógica de dados fica isolada de APIs de navegador para facilitar o Capacitor mais tarde.

## Sobre a migração para app nativo

Faz sentido migrar para Capacitor quando precisar de notificações push confiáveis no iOS, integração com apps de saúde/wearables, ou presença nas lojas como argumento comercial. O mesmo código React é reaproveitado; é uma camada adicional, não uma reescrita.
