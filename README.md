# GastroLink

Mural de oportunidades que conecta micro e pequenos restaurantes a nano e microinfluenciadores gastronômicos. O match do MVP não acontece dentro de um chat: o criador confirma o interesse e o app abre o WhatsApp do estabelecimento com a mensagem já escrita (`https://wa.me/{telefone}?text={mensagem}`).

Projeto Integrador — ADS, Centro Universitário Senac. Grupo 17.

## Como executar

```bash
npm install
npm run dev
```

A aplicação sobe em `http://localhost:8080`. As fotos do mural são restauradas sozinhas a partir de `assets/` na primeira execução. Sem credenciais do Firebase, o **modo demonstração** grava tudo no `localStorage` do navegador, já com as três personas e um mural populado.

Para voltar aos dados iniciais, use **Restaurar dados** no rodapé de qualquer painel.

## Acesso rápido (1 clique)

| Persona | Perfil | E-mail | Senha |
| --- | --- | --- | --- |
| Roberto Alvarez | Restaurante Sabor Caseiro | roberto@saborcaseiro.com | sabor123 |
| Lucas Mendes (@gastrolucas, 4,8 mil) | Criador de conteúdo | lucas@gastrolucas.com | gastro123 |
| Marina Costa | Curadoria | marina@gastrolink.com | curadoria123 |

Chave para criar outra conta de curadoria: `GRUPO17`.

## O que cada perfil faz

- **Restaurante:** KPIs (ofertas ativas, cliques no WhatsApp, pausadas), CRUD completo, pausar/reativar e botão flutuante **+** para publicar em um modal curto.
- **Criador:** feed em cards, busca, filtros de categoria, faixa de seguidores e favoritos, selo de compatibilidade, denúncia e **Tenho Interesse (WhatsApp)** com modal de handoff (prévia editável, copiar e abrir).
- **Curadoria:** KPIs globais e fila para **Aprovar (Manter Ativa)** ou **Suspender Oferta**. Oferta suspensa some do feed na hora.

## Arquitetura

Clean Architecture no cliente, com o padrão Repository. A interface não conhece Firebase nem `localStorage`.

```text
src/
├── config/firebaseConfig.ts          # chaves; vazio = modo demonstração
├── domain/                           # tipos, seed, formatação
├── repositories/
│   ├── RepositoryInterface.ts        # contrato
│   ├── LocalStorageRepository.ts     # fallback automático
│   ├── FirebaseRepository.ts         # Auth + Firestore via REST
│   └── RepositoryFactory.ts
├── services/
│   ├── AuthService.ts
│   ├── OpportunityService.ts
│   └── WhatsAppService.ts
├── state/gastro-context.tsx          # sessão e ações
└── components/gastrolink/            # landing, painéis e modais
database/
├── schema.sql                        # DER relacional (6 entidades)
├── firestore.rules
└── firestore-seed.json
```

Correspondência com o desenho acadêmico em JavaScript puro: a UI está em React + Tailwind (em vez de `renderers.js` + `index.html`), e as mesmas três camadas — apresentação, serviços e repositórios — continuam separadas.

No Firestore os documentos de oferta guardam nome e telefone do restaurante junto da oferta, para o feed não precisar de junção. O `schema.sql` mantém o modelo normalizado.

## Firebase (opcional)

1. Crie um projeto com Authentication (e-mail/senha) e Cloud Firestore.
2. Publique `database/firestore.rules`.
3. Preencha `src/config/firebaseConfig.ts` (`apiKey` e `projectId` bastam para ligar o modo nuvem) ou defina `VITE_FIREBASE_API_KEY` e `VITE_FIREBASE_PROJECT_ID`.
4. Com as chaves presentes, o acesso de 1 clique é desligado. Cadastre restaurante e criador pela tela de entrada. A primeira curadoria usa a chave `GRUPO17`.

## Identidade

Fundo papel `#FFFBF7`, laranja queimado `#EA580C`, vermelho `#DC2626` e verde `#16A34A` só na chamada do WhatsApp. Mobile first, rótulos visíveis, foco no teclado e confirmação antes de excluir.
