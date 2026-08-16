// --- CONFIGURAÇÃO DE SEGURANÇA ---
const ADMIN_USER = "admin@anhanguera.com";
const ADMIN_PASS = "teste@2026"; // Em produção, isso viria do backend criptografado!

// --- 1. GERENCIAMENTO DE DADOS (Simulando Banco de Dados) ---

// Chave para salvar no navegador
const CHAVE_DB = 'sistema_agendamento_db';

// Função para ler eventos salvos
function lerEventos() {
    const dados = localStorage.getItem(CHAVE_DB);
    // Se tiver dados, converte de volta para Array. Se não, retorna array vazio.
    return dados ? JSON.parse(dados) : [];
}

// Função para salvar a lista atualizada
function salvarNoBanco(listaEventos) {
    localStorage.setItem(CHAVE_DB, JSON.stringify(listaEventos));
}

// --- 2. LÓGICA DE VALIDAÇÃO (Regras de Negócio) ---

function verificarConflito(novoEvento, eventosExistentes) {
    // Filtra apenas eventos APROVADOS ou PENDENTES (rejeitados não ocupam sala)
    const eventosAtivos = eventosExistentes.filter(e => e.status !== 'rejeitado');

    for (let evento of eventosAtivos) {
        // Regra 1: Mesma data e Mesmo local
        if (evento.data === novoEvento.data && evento.local === novoEvento.local) {

            // Regra 2: Colisão de Horário
            // (Novo Inicio < Evento Fim) E (Novo Fim > Evento Inicio)
            // Essa fórmula matemática cobre todos os casos de sobreposição
            if (novoEvento.inicio < evento.fim && novoEvento.fim > evento.inicio) {
                return true; // Conflito encontrado!
            }
        }
    }
    return false; // Sem conflitos
}

// --- 3. LÓGICA DO FORMULÁRIO ---

const formSolicitacao = document.getElementById('form-solicitacao');

// --- Lógica de Validação em Tempo Real ---
function checarDisponibilidadeEmTempoReal() {
    const data = document.getElementById('data').value;
    const inicio = document.getElementById('horaInicio').value;
    const fim = document.getElementById('horaFim').value;
    const local = document.getElementById('local').value;
    const aviso = document.getElementById('avisoConflito');
    const btnSubmit = document.getElementById('btnSubmitSolicitacao');

    // Só verifica se todos os campos de data, hora e local estiverem preenchidos
    if (data && inicio && fim && local) {
        // Validação básica de hora
        if (inicio >= fim) {
            aviso.classList.remove('d-none');
            aviso.innerHTML = '<i class="bi bi-exclamation-triangle-fill me-1"></i>O horário de fim deve ser posterior ao horário de início.';
            btnSubmit.disabled = true;
            return;
        }

        const eventoSimulado = { data, inicio, fim, local };
        const eventos = lerEventos();

        if (verificarConflito(eventoSimulado, eventos)) {
            aviso.classList.remove('d-none');
            aviso.innerHTML = '<i class="bi bi-exclamation-triangle-fill me-1"></i>O local selecionado está indisponível nesta data e horário.';
            btnSubmit.disabled = true;
        } else {
            aviso.classList.add('d-none');
            btnSubmit.disabled = false;
        }
    } else {
        // Oculta o aviso se faltar preencher algo e habilita o botão para a validação final agir caso o usuário clique
        if (aviso) aviso.classList.add('d-none');
        if (btnSubmit) btnSubmit.disabled = false;
    }
}

// Escuta as alterações nos campos chaves do formulário
document.getElementById('data').addEventListener('change', checarDisponibilidadeEmTempoReal);
document.getElementById('horaInicio').addEventListener('change', checarDisponibilidadeEmTempoReal);
document.getElementById('horaFim').addEventListener('change', checarDisponibilidadeEmTempoReal);
document.getElementById('local').addEventListener('change', checarDisponibilidadeEmTempoReal);

formSolicitacao.addEventListener('submit', function (e) {
    e.preventDefault(); // Impede a página de recarregar

    // 1. Capturar valores
    const novoEvento = {
        id: Date.now(), // Gera um ID único baseado no tempo
        titulo: document.getElementById('titulo').value,
        data: document.getElementById('data').value,
        inicio: document.getElementById('horaInicio').value,
        fim: document.getElementById('horaFim').value,
        local: document.getElementById('local').value,
        solicitante: document.getElementById('solicitante').value,
        emailContato: document.getElementById('emailContato').value,
        observacoes: document.getElementById('observacoes').value,
        status: 'pendente' // Todo evento nasce pendente
    };

    if (novoEvento.inicio >= novoEvento.fim) {
        Swal.fire({
            title: 'Horário Inválido',
            text: 'O horário de fim deve ser posterior ao horário de início.',
            icon: 'error',
            confirmButtonText: 'Entendi'
        });
        return;
    }

    // 3. Validação de Conflito
    const eventos = lerEventos();

    if (verificarConflito(novoEvento, eventos)) {
        Swal.fire({
            title: 'Conflito de Agendamento',
            text: 'Já existe um evento agendado para este local e horário!',
            icon: 'warning',
            confirmButtonText: 'Escolher outro horário'
        });
        return;
    }

    // 4. Salvar
    eventos.push(novoEvento);
    salvarNoBanco(eventos);

    // 5. Feedback e Limpeza
    Swal.fire({
        title: 'Solicitação Enviada!',
        text: 'Aguarde aprovação do administrador.',
        icon: 'success',
        timer: 3000,
        showConfirmButton: false
    });
    formSolicitacao.reset();

    // Opcional: Voltar para a tela inicial
    // mostrarTela('dashboard'); 
});

// --- 4. NAVEGAÇÃO (Mantida da etapa anterior) ---
function mostrarTela(telaId) {
    // REGRA DE SEGURANÇA: Se tentar entrar no admin sem estar logado
    if (telaId === 'admin') {
        const isLogado = sessionStorage.getItem('usuarioLogado');
        if (!isLogado) {
            mostrarTela('login'); // Redireciona para o login
            return; // Para a execução aqui
        }
    }

    // Lógica padrão de troca de telas
    document.querySelectorAll('.tela').forEach(tela => {
        tela.classList.remove('ativa');
        tela.classList.add('oculta');
    });

    const telaAtiva = document.getElementById(telaId);
    if (telaAtiva) {
        telaAtiva.classList.remove('oculta');
        telaAtiva.classList.add('ativa');
    }

    // Carregamento de dados
    if (telaId === 'admin') renderizarAdmin();
    if (telaId === 'dashboard') renderizarDashboard();
}

// --- FUNÇÕES DE LOGIN/LOGOUT ---

// Escuta o submit do formulário de login
document.getElementById('form-login').addEventListener('submit', function (e) {
    e.preventDefault();

    const email = document.getElementById('login-email').value;
    const senha = document.getElementById('login-senha').value;

    if (email === ADMIN_USER && senha === ADMIN_PASS) {
        // Sucesso: Salva na sessão
        sessionStorage.setItem('usuarioLogado', 'true');

        Swal.fire({
            title: 'Acesso Liberado',
            text: 'Bem-vindo ao painel administrativo.',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
        }).then(() => {
            // Limpa os campos
            document.getElementById('form-login').reset();
            // Redireciona para o admin
            mostrarTela('admin');
        });
    } else {
        Swal.fire({
            title: 'Acesso Negado',
            text: 'E-mail ou senha incorretos!',
            icon: 'error',
            confirmButtonText: 'Tentar Novamente'
        });
    }
});

// Função para sair
window.fazerLogout = function () {
    sessionStorage.removeItem('usuarioLogado'); // Destrói a sessão

    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
    });

    Toast.fire({
        icon: 'info',
        title: 'Você saiu do sistema.'
    });

    mostrarTela('dashboard'); // Manda de volta para o início
}

// --- 5. FUNÇÕES AUXILIARES DE FORMATAÇÃO ---
function formatarData(dataISO) {
    // Transforma "2023-12-25" em "25/12/2023"
    if (!dataISO) return "";
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
}

// --- 6. LÓGICA DO PAINEL ADMIN (Renderização) ---

function renderizarAdmin() {
    const container = document.getElementById('lista-eventos-admin');
    let eventos = lerEventos();

    container.innerHTML = ''; // Limpa a lista antes de recriar

    if (eventos.length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--secondary); padding: 2rem;">📭 Nenhum evento registrado.</div>';
        return;
    }

    const ativos = [];
    const encerrados = [];
    
    eventos.forEach(e => {
        const dataFim = new Date(`${e.data}T${e.fim}`);
        if (dataFim < new Date()) {
            encerrados.push(e);
        } else {
            ativos.push(e);
        }
    });

    // Ordenar ativos: Pendentes primeiro, depois por data mais proxima (crescente)
    ativos.sort((a, b) => {
        if (a.status !== b.status) {
            if (a.status === 'pendente') return -1;
            if (b.status === 'pendente') return 1;
        }
        return new Date(`${a.data}T${a.inicio}`) - new Date(`${b.data}T${b.inicio}`);
    });

    // Ordenar encerrados: mais recentes primeiro (decrescente)
    encerrados.sort((a, b) => new Date(`${b.data}T${b.inicio}`) - new Date(`${a.data}T${a.inicio}`));

    const criarCard = (evento, isEncerrado) => {
        let classeStatus = '';
        let iconeStatus = '';
        if (evento.status === 'pendente') {
            classeStatus = 'text-bg-warning';
            iconeStatus = '<i class="bi bi-hourglass-split"></i>';
        } else if (evento.status === 'aprovado') {
            classeStatus = 'text-bg-success';
            iconeStatus = '<i class="bi bi-check-circle"></i>';
        } else {
            classeStatus = 'text-bg-danger';
            iconeStatus = '<i class="bi bi-x-circle"></i>';
        }

        let botoesAcao = '';
        if (evento.status === 'pendente') {
            botoesAcao = `
                <button class="btn btn-success btn-sm fw-semibold" onclick="alterarStatus(${evento.id}, 'aprovado')" title="Aprovar">
                    <i class="bi bi-check-lg me-1"></i>Aprovar
                </button>
                <button class="btn btn-warning btn-sm fw-semibold" onclick="alterarStatus(${evento.id}, 'rejeitado')" title="Rejeitar">
                    <i class="bi bi-x-lg me-1"></i>Rejeitar
                </button>
            `;
        } else if (evento.status === 'aprovado') {
            botoesAcao += `<button class="btn btn-primary btn-sm fw-semibold" onclick="abrirModalAdmin(${evento.id})" data-bs-toggle="modal" data-bs-target="#modalAdmin" title="Editar"><i class="bi bi-pencil me-1"></i>Editar</button>`;
        }
        
        botoesAcao += `<button class="btn btn-danger btn-sm fw-semibold" onclick="excluirEvento(${evento.id})" title="Excluir Definitivamente"><i class="bi bi-trash3 me-1"></i>Deletar</button>`;

        const card = document.createElement('div');
        card.className = 'col-md-6 col-lg-4';
        if (isEncerrado) card.style.opacity = '0.7';

        card.innerHTML = `
            <div class="card h-100 shadow-sm border-0">
                <div class="card-header bg-white border-bottom-0 pt-3 pb-0 d-flex justify-content-between align-items-start">
                    <h5 class="card-title mb-0 text-truncate pe-2" title="${evento.titulo}">${evento.titulo}</h5>
                    <span class="badge rounded-pill ${classeStatus}">${iconeStatus} ${evento.status.toUpperCase()}</span>
                </div>
                <div class="card-body pb-0">
                    <ul class="list-group list-group-flush mb-3">
                        <li class="list-group-item px-0 border-0 pb-1 pt-2">
                            <small class="text-uppercase fw-bold text-muted d-block" style="font-size: 0.75rem;"><i class="bi bi-calendar3 me-1"></i>Data</small>
                            <span class="fw-medium">${formatarData(evento.data)}</span>
                        </li>
                        <li class="list-group-item px-0 border-0 pb-1 pt-1">
                            <small class="text-uppercase fw-bold text-muted d-block" style="font-size: 0.75rem;"><i class="bi bi-clock me-1"></i>Horário</small>
                            <span class="fw-medium">${evento.inicio} - ${evento.fim}</span>
                        </li>
                        <li class="list-group-item px-0 border-0 pb-1 pt-1">
                            <small class="text-uppercase fw-bold text-muted d-block" style="font-size: 0.75rem;"><i class="bi bi-geo-alt me-1"></i>Local</small>
                            <span class="fw-medium">${traduzirLocal(evento.local)}</span>
                        </li>
                        <li class="list-group-item px-0 border-0 pb-1 pt-1">
                            <small class="text-uppercase fw-bold text-muted d-block" style="font-size: 0.75rem;"><i class="bi bi-person me-1"></i>Solicitante</small>
                            <span class="fw-medium d-block">${evento.solicitante}</span>
                            <small class="text-muted">${evento.emailContato}</small>
                        </li>
                    </ul>
                    ${evento.observacoes ? `
                    <div class="alert alert-light border mt-2 py-2 px-3">
                        <small class="fw-bold d-block text-muted mb-1"><i class="bi bi-journal-text me-1"></i>Observações</small>
                        <p class="mb-0 small text-break">${evento.observacoes}</p>
                    </div>` : ''}
                </div>
                <div class="card-footer bg-white border-top-0 d-flex gap-2 justify-content-end pb-3">
                    ${botoesAcao}
                </div>
            </div>
        `;
        return card;
    };

    if (ativos.length > 0) {
        const header = document.createElement('div');
        header.className = 'col-12 mb-2 mt-2';
        header.innerHTML = `<h5 class="fw-bold text-primary border-bottom border-2 border-primary pb-2"><i class="bi bi-clock-history me-2"></i>Eventos Ativos / Pendentes</h5>`;
        container.appendChild(header);
        ativos.forEach(evento => container.appendChild(criarCard(evento, false)));
    }

    if (encerrados.length > 0) {
        const header = document.createElement('div');
        header.className = 'col-12 mb-2 mt-4';
        header.innerHTML = `<h5 class="fw-bold text-secondary border-bottom border-2 border-secondary pb-2"><i class="bi bi-calendar-check me-2"></i>Eventos Encerrados</h5>`;
        container.appendChild(header);
        encerrados.forEach(evento => container.appendChild(criarCard(evento, true)));
    }
}

// --- 7. AÇÕES DO ADMINISTRADOR (Aprovar/Excluir) ---

// Precisamos anexar ao objeto window para o HTML poder "enxergar" essas funções dentro do onclick
window.alterarStatus = function (id, novoStatus) {
    let eventos = lerEventos();
    const index = eventos.findIndex(e => e.id === id);

    if (index !== -1) {
        // Se for aprovar, fazemos uma dupla checagem de conflito (segurança)
        if (novoStatus === 'aprovado') {
            const eventoAlvo = eventos[index];
            // Remove ele mesmo da lista para comparar com os outros
            const outrosEventos = eventos.filter(e => e.id !== id);

            if (verificarConflito(eventoAlvo, outrosEventos)) {
                Swal.fire({
                    title: 'Ação Bloqueada',
                    text: 'Ao aprovar este evento, ele entrará em conflito com outro já aprovado!',
                    icon: 'error',
                    confirmButtonText: 'Entendi'
                });
                return;
            }
        }

        eventos[index].status = novoStatus;
        salvarNoBanco(eventos);
        renderizarAdmin(); // Atualiza a tela instantaneamente

        // Dispara notificação por E-mail automaticamente
        enviarEmailNotificacao(eventos[index]);
    }
};

function enviarEmailNotificacao(evento) {
    // Exibe o modal de carregamento
    Swal.fire({
        title: 'Enviando e-mail automático...',
        html: `Disparando notificação para <b>${evento.emailContato}</b>`,
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    // Parâmetros que serão enviados para o template do EmailJS
    const dataAtual = new Date().toLocaleString('pt-BR');

    const templateParams = {
        to_email: evento.emailContato, // Coloque {{to_email}} no campo "To Email" no painel do EmailJS
        name: "Administração (Sistema de Agendamento)",
        time: dataAtual,
        message: `Olá ${evento.solicitante}, informamos que o seu evento "${evento.titulo}" foi ${evento.status === 'aprovado' ? 'APROVADO' : 'REJEITADO'}.`
    };

    // Parâmetros: 'SERVICE_ID', 'TEMPLATE_ID', templateParams
    emailjs.send('seuiddesservico', 'seutemplate', templateParams)
        .then((response) => {
            console.log('E-mail enviado com sucesso!', response.status, response.text);

            // Feedback de Sucesso
            Swal.fire({
                icon: 'success',
                title: 'Enviado com sucesso!',
                text: 'O usuário foi notificado da sua decisão.',
                timer: 2500,
                showConfirmButton: false
            });
        }, (error) => {
            console.log('Falha ao enviar e-mail...', error);
            Swal.fire({
                icon: 'error',
                title: 'Erro no envio',
                text: `O EmailJS retornou um erro: ${error.text || error.message || 'Verifique o console (F12)'}`,
            });
        });
}

window.excluirEvento = function (id) {
    Swal.fire({
        title: 'Tem certeza?',
        text: "Você não poderá reverter a exclusão deste evento!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sim, excluir!',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            let eventos = lerEventos();
            // Filtra mantendo apenas os que NÃO são o ID clicado
            eventos = eventos.filter(e => e.id !== id);
            salvarNoBanco(eventos);
            renderizarAdmin();
            
            Swal.fire(
                'Excluído!',
                'O evento foi removido permanentemente.',
                'success'
            );
        }
    });
};

// --- FUNÇÕES DO MODAL ADMIN (Adicionar / Editar) ---

window.abrirModalAdmin = function(id = null) {
    try {
        const form = document.getElementById('form-admin-evento');
        if (form) form.reset();
        
        const idField = document.getElementById('admin-id');
        if (idField) idField.value = '';
        
        // Em navegadores antigos ou cliques estranhos, 'id' pode vir como Event
        if (id && typeof id === 'object') {
            id = null;
        }
        
        if (id) {
            document.getElementById('modalAdminTitle').innerText = 'Editar Evento';
            const eventos = lerEventos();
            const evento = eventos.find(e => String(e.id) === String(id));
            
            if (evento) {
                document.getElementById('admin-id').value = evento.id;
                document.getElementById('admin-titulo').value = evento.titulo || '';
                document.getElementById('admin-data').value = evento.data || '';
                document.getElementById('admin-horaInicio').value = evento.inicio || '';
                document.getElementById('admin-horaFim').value = evento.fim || '';
                document.getElementById('admin-local').value = evento.local || '';
                document.getElementById('admin-solicitante').value = evento.solicitante || '';
                document.getElementById('admin-emailContato').value = evento.emailContato || '';
                document.getElementById('admin-observacoes').value = evento.observacoes || '';
            }
        } else {
            document.getElementById('modalAdminTitle').innerText = 'Adicionar Novo Evento';
        }
        // Deixa a exibição real do modal para o data-bs-toggle do HTML!
    } catch (erro) {
        alert("Ops, ocorreu um erro ao abrir: " + erro.message);
        console.error("Erro abrirModalAdmin:", erro);
    }
};

document.getElementById('form-admin-evento').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const idField = document.getElementById('admin-id').value;
    const isEdicao = idField !== '';
    
    const eventoSubmit = {
        id: isEdicao ? parseInt(idField) : Date.now(),
        titulo: document.getElementById('admin-titulo').value,
        data: document.getElementById('admin-data').value,
        inicio: document.getElementById('admin-horaInicio').value,
        fim: document.getElementById('admin-horaFim').value,
        local: document.getElementById('admin-local').value,
        solicitante: document.getElementById('admin-solicitante').value,
        emailContato: document.getElementById('admin-emailContato').value,
        observacoes: document.getElementById('admin-observacoes').value,
        status: 'aprovado' // Admin cria/edita sempre aprovado
    };

    if (eventoSubmit.inicio >= eventoSubmit.fim) {
        Swal.fire('Horário Inválido', 'O horário de fim deve ser posterior ao horário de início.', 'error');
        return;
    }

    let eventos = lerEventos();
    
    // Verifica conflito excluindo o próprio evento se for edição
    const outrosEventos = isEdicao ? eventos.filter(e => e.id !== eventoSubmit.id) : eventos;
    
    if (verificarConflito(eventoSubmit, outrosEventos)) {
        Swal.fire('Conflito', 'Já existe um evento aprovado para este local e horário!', 'warning');
        return;
    }

    if (isEdicao) {
        const index = eventos.findIndex(e => e.id === eventoSubmit.id);
        if(index !== -1) {
            // Preserva o status original caso tenha sido modificado no futuro (embora a regra atual force aprovado)
            eventoSubmit.status = eventos[index].status; 
            eventos[index] = eventoSubmit;
        }
    } else {
        eventos.push(eventoSubmit);
    }

    salvarNoBanco(eventos);
    renderizarAdmin();
    
    const modalEl = document.getElementById('modalAdmin');
    const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
    modalInstance.hide();
    
    Swal.fire({
        icon: 'success',
        title: isEdicao ? 'Evento Atualizado!' : 'Evento Criado!',
        showConfirmButton: false,
        timer: 1500
    });
});

// --- 8. VISUALIZAÇÃO PÚBLICA (Dashboard) ---

function renderizarDashboard() {
    const container = document.getElementById('lista-eventos-publica');
    const filtroData = document.getElementById('filtroData').value;
    let eventos = lerEventos();

    // FILTRO 1: Segurança - Apenas Aprovados
    eventos = eventos.filter(e => e.status === 'aprovado');

    // FILTRO 2: Data (se o usuário selecionou alguma)
    if (filtroData) {
        eventos = eventos.filter(e => e.data === filtroData);
    }

    const ativos = [];
    const encerrados = [];
    
    eventos.forEach(e => {
        const dataFim = new Date(`${e.data}T${e.fim}`);
        if (dataFim < new Date()) {
            encerrados.push(e);
        } else {
            ativos.push(e);
        }
    });

    // Ordenar ativos: mais próximos primeiro (crescente)
    ativos.sort((a, b) => new Date(`${a.data}T${a.inicio}`) - new Date(`${b.data}T${b.inicio}`));
    
    // Ordenar encerrados: mais recentes primeiro (decrescente)
    encerrados.sort((a, b) => new Date(`${b.data}T${b.inicio}`) - new Date(`${a.data}T${a.inicio}`));

    container.innerHTML = ''; // Limpa a tela

    if (ativos.length === 0 && encerrados.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: gray;">Nenhum evento confirmado para este período.</p>';
        return;
    }

    const criarCard = (evento, isEncerrado) => {
        const card = document.createElement('div');
        card.className = 'col-md-6 col-lg-4';
        if (isEncerrado) card.style.opacity = '0.7';

        card.innerHTML = `
            <div class="card h-100 shadow-sm border-0 border-start ${isEncerrado ? 'border-secondary' : 'border-primary'} border-4">
                <div class="card-body">
                    <h5 class="card-title fw-bold mb-3 ${isEncerrado ? 'text-muted' : ''}">${evento.titulo}</h5>
                    <div class="d-flex align-items-center text-muted small mb-2">
                        <i class="bi bi-calendar3 me-2 fs-6"></i>
                        <span>${formatarData(evento.data)}</span>
                    </div>
                    <div class="d-flex align-items-center text-muted small mb-3">
                        <i class="bi bi-clock me-2 fs-6"></i>
                        <span>${evento.inicio} às ${evento.fim}</span>
                    </div>
                    <div class="bg-light p-2 rounded-2 small fw-medium mb-3 d-flex align-items-center">
                        <i class="bi bi-geo-alt-fill ${isEncerrado ? 'text-secondary' : 'text-primary'} me-2"></i>
                        ${traduzirLocal(evento.local)}
                    </div>
                    <hr class="text-secondary opacity-25">
                    <div class="d-flex align-items-center small text-muted">
                        <i class="bi bi-person-circle me-2 fs-5"></i>
                        <span>Solicitado por: <strong class="text-dark">${evento.solicitante}</strong></span>
                    </div>
                </div>
            </div>
        `;
        return card;
    };

    if (ativos.length > 0) {
        const header = document.createElement('div');
        header.className = 'col-12 mb-2 mt-2';
        header.innerHTML = `<h5 class="fw-bold text-primary border-bottom border-2 border-primary pb-2"><i class="bi bi-calendar-event me-2"></i>Próximos Eventos</h5>`;
        container.appendChild(header);
        ativos.forEach(evento => container.appendChild(criarCard(evento, false)));
    }

    if (encerrados.length > 0) {
        const header = document.createElement('div');
        header.className = 'col-12 mb-2 mt-4';
        header.innerHTML = `<h5 class="fw-bold text-secondary border-bottom border-2 border-secondary pb-2"><i class="bi bi-calendar-check me-2"></i>Eventos Encerrados</h5>`;
        container.appendChild(header);
        encerrados.forEach(evento => container.appendChild(criarCard(evento, true)));
    }
}

// Helper para mostrar nome bonito do local
function traduzirLocal(codigo) {
    const locais = {
        'auditorio': 'Auditório',
        'lab_avancado': 'Laboratório de Informática Avançado',
        'lab_basico': 'Laboratório de Informática Básico',
        'sala_aula': 'Sala de Aula'
    };
    return locais[codigo] || codigo;
}

// Função chamada pelo botão "Filtrar" no HTML
window.filtrarEventos = function () {
    renderizarDashboard();
}

// --- 9. EXPORTAÇÃO PARA EXCEL ---
window.exportarExcel = function() {
    const eventos = lerEventos();
    
    if (eventos.length === 0) {
        Swal.fire({
            icon: 'info',
            title: 'Lista Vazia',
            text: 'Não há eventos cadastrados para exportar.'
        });
        return;
    }

    // Prepara os dados formatados
    const dadosExcel = eventos.map(evento => ({
        "ID": evento.id,
        "Título": evento.titulo,
        "Data": formatarData(evento.data),
        "Início": evento.inicio,
        "Fim": evento.fim,
        "Local": traduzirLocal(evento.local),
        "Solicitante": evento.solicitante,
        "E-mail de Contato": evento.emailContato,
        "Status": evento.status.toUpperCase(),
        "Observações": evento.observacoes || "Nenhuma"
    }));

    // Cria a planilha a partir dos dados
    const worksheet = XLSX.utils.json_to_sheet(dadosExcel);

    // Configura a largura das colunas
    const colWidths = [
        { wch: 15 }, // ID
        { wch: 30 }, // Título
        { wch: 12 }, // Data
        { wch: 10 }, // Início
        { wch: 10 }, // Fim
        { wch: 35 }, // Local
        { wch: 25 }, // Solicitante
        { wch: 30 }, // E-mail
        { wch: 15 }, // Status
        { wch: 40 }  // Observações
    ];
    worksheet['!cols'] = colWidths;

    // Cria o arquivo Excel
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Eventos");

    // Formata a data atual para o nome do arquivo
    const hoje = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    const nomeArquivo = `Relatorio_Eventos_${hoje}.xlsx`;

    // Dispara o download
    XLSX.writeFile(workbook, nomeArquivo);
    
    // Feedback opcional
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
    });
    Toast.fire({
        icon: 'success',
        title: 'Planilha exportada com sucesso!'
    });
};

// Inicialização automática ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    // Como o dashboard é a tela inicial ativa no HTML,
    // precisamos garantir que os cards sejam renderizados imediatamente
    renderizarDashboard();
});
