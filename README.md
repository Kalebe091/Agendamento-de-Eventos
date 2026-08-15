# 📅 Sistema de Agendamento de Eventos (SPA)

Um sistema web leve e funcional para gerenciamento de solicitações de eventos e reservas de salas. Desenvolvido como uma Single Page Application (SPA) utilizando **Bootstrap 5**, JavaScript (Vanilla JS), com foco em lógica de validação, experiência do usuário e **Produtividade via IA**.

## 🚀 Funcionalidades

### 👤 Área Pública
* **Dashboard Visual:** Visualização dos eventos confirmados em formato de cards interativos, estilizados com Bootstrap.
* **Filtros Dinâmicos:** Capacidade de filtrar eventos por data específica.
* **Solicitação Inteligente:** Formulário para usuários solicitarem reservas de salas, com design limpo e responsivo.
* **Validação em Tempo Real:** O sistema monitora a digitação do formulário e emite um alerta em tempo real e bloqueia o envio caso a data e sala escolhidas já estejam ocupadas, garantindo que o usuário só solicite horários válidos.

### 🛡️ Lógica de Negócios (Core)
* **Verificação de Conflitos:** O sistema impede automaticamente que dois eventos sejam agendados para a mesma sala no mesmo horário.
* **Validação de Horários:** Garante consistência temporal (início vs. fim).

### 🔐 Área Administrativa
* **Autenticação:** Sistema de login simulado (com proteção de rotas via SessionStorage).
* **Gestão Total:** O administrador pode Aprovar, Rejeitar ou Excluir eventos.
* **Feedback Visual Avançado:** Utilização da biblioteca **SweetAlert2** para alertas interativos (Toasts e Modais de confirmação) e badges de status coloridos.

---

## 🛠️ Tecnologias Utilizadas

### Stack Principal
* **HTML5:** Estrutura semântica.
* **CSS3 & Bootstrap 5:** Design moderno e responsivo focado em utilitários e componentes prontos.
* **JavaScript (ES6+):** Manipulação do DOM, manipulação de estado local (LocalStorage).
* **SweetAlert2:** Para substituição de alertas nativos por janelas e modais mais dinâmicas e amigáveis.
* **Bootstrap Icons:** Para iconografia do sistema.

### 🤖 Ferramentas de Desenvolvimento & IA
Este projeto utilizou inteligência artificial para acelerar o ciclo de desenvolvimento:

* **Antigravity (Google DeepMind):** Agente atuando no ambiente de desenvolvimento integrado para refatoração visual, implementações de bibliotecas e correções de bugs.
* **Google Gemini:** Utilizado para Brainstorming de arquitetura, funcionalidades, criação da paleta de cores e documentação.

---

## 📂 Estrutura do Projeto

```text
/agenda-eventos
│
├── index.html        # Estrutura principal e componentes Bootstrap
├── css/style.css     # Estilização residual (animações de transição)
├── js/app.js         # Lógica de controle, validação em tempo real e persistência
└── README.md         # Documentação do projeto
```

---

## ⚙️ Como Executar

Este é um projeto estático (Client-side only), não requer instalação de servidores.

1. Clone este repositório ou baixe os arquivos.
2. Abra o arquivo `index.html` em qualquer navegador moderno.

### 🔑 Acesso ao Painel Administrativo

Para testar as funcionalidades de gerenciamento, utilize as credenciais simuladas:

* **E-mail:** `admin@escola.com`
* **Senha:** `123456`

---

Desenvolvido para fins de estudo sobre Lógica de Programação, Front-end Moderno e **AI-Powered Coding**.