# 🍽️ GastroLink

> Plataforma web que conecta **restaurantes** e **influenciadores** para parcerias de marketing gastronômico.

Desenvolvido como Projeto Integrador (2ª Entrega) — SENAC EAD TADS/TSI

---

## 📋 Sobre o Projeto

GastroLink é um sistema web funcional que permite:

- **Restaurantes** buscarem e selecionarem influenciadores para parcerias
- **Influenciadores** descobrirem restaurantes e solicitarem colaborações
- Gerenciamento do fluxo completo: solicitação → proposta → acordo

## 🗺️ Funcionalidades Implementadas

Baseado no mapa mental do projeto:

| Módulo | Funcionalidades |
|---|---|
| **Login** | Seleção de tipo (restaurante/influencer), cadastro, login |
| **Pesquisa Restaurante** | Home com cards de influencers, navbar com searchbox, sidebar com filtragem, ícone de perfil |
| **Pesquisa Influenciador** | Catálogo de restaurantes com foto e bio |
| **Parceria (Restaurante)** | Notificação, acesso ao formulário, decide aceitar ou não |
| **Parceria (Influenciador)** | Escolhe restaurante, botão solicitar, formulário com contato, proposta + faixa de preço |
| **Acordo** | Notificação pro influencer, entrar em contato para marcar parceria, resposta de ambos |

## 🚀 Como Executar

### Opção 1 — Direto no navegador (mais simples)
```
Abra o arquivo index.html no seu navegador
```

### Opção 2 — Com servidor local
```bash
# Python 3
python -m http.server 8000

# Node.js (npx)
npx serve .
```
Depois acesse: `http://localhost:8000`

## 📁 Estrutura do Projeto

```
gastrolink/
│
└── index.html        # Aplicação completa (HTML + CSS + JS em um arquivo)
│
└── README.md         # Este arquivo
```

> O projeto é uma SPA (Single Page Application) em um único arquivo HTML, facilitando a entrega e demonstração.

## 🧭 Fluxo de Uso

### Como Restaurante:
1. Acesse a landing page → clique em "Sou Restaurante"
2. Faça login ou cadastro
3. Navegue pelos cards de influenciadores
4. Use a busca e filtros para encontrar o perfil ideal
5. Clique em "Solicitar parceria" e preencha o formulário
6. Acompanhe em Notificações o status das suas propostas

### Como Influenciador:
1. Acesse a landing page → clique em "Sou Influenciador"
2. Faça login ou cadastro
3. Navegue pelo catálogo de restaurantes
4. Solicite parceria com o restaurante desejado
5. Receba propostas e responda em Notificações

## 🛠️ Tecnologias

- HTML5 semântico
- CSS3 (variáveis CSS, Grid, Flexbox, animações)
- JavaScript vanilla (sem frameworks, sem dependências)
- Google Fonts (Playfair Display + DM Sans)

## 📸 Telas do Sistema

| Tela | Descrição |
|---|---|
| Landing Page | Apresentação, estatísticas, escolha de perfil |
| Login / Cadastro | Autenticação com seleção de tipo de usuário |
| Dashboard Restaurante | Grid de influencers com busca e filtros sidebar |
| Dashboard Influenciador | Catálogo de restaurantes |
| Notificações | Acompanhamento de propostas e acordos |
| Perfil | Edição de dados, histórico de parcerias |
| Modais de Parceria | Formulários de proposta e resposta |

## 👥 Equipe — Grupo 11

Projeto Integrador — SENAC EAD TADS/TSI  
Prof. Me. Anderson Clayton

---

## 📌 Como disponibilizar no GitHub

```bash
# 1. Inicialize o repositório
git init
git add .
git commit -m "feat: implementação inicial do GastroLink"

# 2. Crie o repositório no GitHub (github.com/new)
# Nome sugerido: gastrolink

# 3. Conecte e envie
git remote add origin https://github.com/SEU_USUARIO/gastrolink.git
git branch -M main
git push -u origin main
```

Para deixar o site **online via GitHub Pages**:
- Vá em `Settings > Pages`
- Source: `Deploy from a branch → main → / (root)`
- Aguarde ~1 minuto e acesse: `https://SEU_USUARIO.github.io/gastrolink`
