document.addEventListener("DOMContentLoaded", function () {
    if (document.getElementById("calendario")) {
        carregarCalendario();
    }

    carregarAgendamentos();

    const botaoAgendar = document.getElementById("botao-agendar");
    if (botaoAgendar) {
        botaoAgendar.addEventListener("click", agendar);
    }

    const mesInput = document.getElementById("mesLiberado");
    const anoInput = document.getElementById("anoLiberado");

    if (mesInput && anoInput) {
        function notificarSelecao() {
            const mesSelecionado = mesInput.value;
            const anoSelecionado = anoInput.value;

            if (mesSelecionado && anoSelecionado) {
                mostrarAlerta(`Você selecionou: ${mesSelecionado}/${anoSelecionado}`, "info");
            }
        }

        mesInput.addEventListener("change", notificarSelecao);
        anoInput.addEventListener("input", notificarSelecao);
    }
});

let agendamentoPendente = null;

function carregarCalendario() {
    const calendario = document.getElementById("calendario");
    const mesAtual = document.getElementById("mes-atual");

    let dataAtual = new Date();
    let ano = dataAtual.getFullYear();
    let mes = dataAtual.getMonth();
    let diaHoje = dataAtual.getDate();

    const meses = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    mesAtual.innerText = `${meses[mes]} ${ano}`;
    calendario.innerHTML = "";

    let primeiroDia = new Date(ano, mes, 1).getDay();
    let totalDias = new Date(ano, mes + 1, 0).getDate();

    for (let i = 0; i < primeiroDia; i++) {
        calendario.appendChild(document.createElement("div"));
    }

    for (let dia = 1; dia <= totalDias; dia++) {
        let data = new Date(ano, mes, dia);
        let diaSemana = data.getDay();

        let diaElemento = document.createElement("div");
        diaElemento.textContent = dia;

        if (dia < diaHoje) {
            diaElemento.classList.add("desativado"); // Adiciona a classe para indicar dia passado
        } else if (diaSemana === 3 || diaSemana === 5) {
            diaElemento.classList.add("ativo");
            diaElemento.onclick = function () {
                selecionarDia(dia, mes + 1, ano);
            };
        }

        calendario.appendChild(diaElemento);
    }
}


function selecionarDia(dia, mes, ano) {
    let diaFormatado = dia.toString().padStart(2, "0");
    let mesFormatado = mes.toString().padStart(2, "0");
    let dataFormatada = `${diaFormatado}/${mesFormatado}/${ano}`;

    localStorage.setItem("diaSelecionado", dataFormatada);
    atualizarHorariosDisponiveis(dataFormatada);

    mostrarAlerta(`Você selecionou o dia ${dataFormatada}`, "info");
}

function atualizarHorariosDisponiveis(diaSelecionado) {
    const horariosFixos = [
        "09:00", "09:20", "09:40", "10:00", "10:20", "10:40", "11:00", "11:20", "11:40", "12:00",
        "13:00", "13:20", "13:40", "14:00", "14:20", "14:40", "15:00", "15:20", "15:40", "16:00", "16:20"
    ];

    const agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || [];

    const horariosOcupados = agendamentos
        .filter(a => a.dia === diaSelecionado)
        .map(a => a.horario);

    const selectHorario = document.getElementById("horario");
    if (!selectHorario) return;

    selectHorario.innerHTML = '<option value="">Selecione o horário</option>';

    horariosFixos.forEach(horario => {
        if (!horariosOcupados.includes(horario)) {
            const option = document.createElement("option");
            option.value = horario;
            option.textContent = horario;
            selectHorario.appendChild(option);
        }
    });

    if (selectHorario.options.length === 1) {
        const option = document.createElement("option");
        option.textContent = "Nenhum horário disponível";
        option.disabled = true;
        selectHorario.appendChild(option);
    }
}

function agendar() {
    let nome = document.getElementById("nome").value;
    let email = document.getElementById("email").value;
    let horario = document.getElementById("horario").value;
    let dia = localStorage.getItem("diaSelecionado");

    if (!nome || !email || !horario || !dia) {
        mostrarAlerta("Preencha todos os campos e selecione um dia!", "erro");
        return;
    }

    let agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || [];

    let horarioOcupado = agendamentos.some(ag => ag.dia === dia && ag.horario === horario);
    if (horarioOcupado) {
        mostrarAlerta("Este horário já está agendado. Por favor, escolha outro.", "erro");
        return;
    }

    let agendamentoMesmoDia = agendamentos.some(ag => ag.dia === dia && ag.email === email);
    if (agendamentoMesmoDia) {
        mostrarAlerta("Você já possui um agendamento neste dia.", "erro");
        return;
    }

    const [_, mesNum, anoNum] = dia.split("/");
    const agendamentosMes = agendamentos.filter(ag =>
        ag.email === email && ag.dia.split("/")[1] === mesNum && ag.dia.split("/")[2] === anoNum
    );

    if (agendamentosMes.length >= 2) {
        mostrarAlerta("Você já fez 2 agendamentos neste mês.", "erro");
        return;
    }

    agendamentoPendente = { nome, email, horario, dia };
    document.getElementById("textoConfirmacao").innerText =
        `Nome: ${nome}\nEmail: ${email}\nData: ${dia}\nHorário: ${horario}`;
    document.getElementById("popupConfirmacao").style.display = "flex";
}

function fecharPopup() {
    document.getElementById("popupConfirmacao").style.display = "none";
}

function carregarAgendamentos() {
    let listaAtivos = document.getElementById("lista-agendamentos");
    let listaCancelados = document.getElementById("lista-cancelados");

    if (!listaAtivos || !listaCancelados) return;

    listaAtivos.innerHTML = "";
    listaCancelados.innerHTML = "";

    const agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || [];

    agendamentos.forEach((agendamento, index) => {
        let item = document.createElement("div");
        item.classList.add("agendamento-item");

        item.innerHTML = `
            <p><strong>Nome:</strong> ${agendamento.nome}</p>
            <p><strong>Email:</strong> ${agendamento.email}</p>
            <p><strong>Data:</strong> ${agendamento.dia}</p>
            <p><strong>Horário:</strong> ${agendamento.horario}</p>
        `;

        if (agendamento.cancelado) {
            // Mostra nos cancelados (com botão de reativar)
            item.innerHTML += `
                <button onclick="reativarAgendamento(${index})">Reativar Agendamento</button>
            `;
            listaCancelados.appendChild(item);
        } else {
            // Mostra nos ativos (com botões)
            item.innerHTML += `
                <button onclick="editarAgendamento(${index})">Editar</button>
                <button onclick="cancelarAgendamento(${index})">Cancelar</button>
            `;
            listaAtivos.appendChild(item);
        }
    });
}


function cancelarAgendamento(index) {
    document.getElementById("popupConfirmacaoCancelamento").style.display = "flex";
    window.indiceCancelamento = index;
}

function confirmarCancelamento() {
    const agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || [];

    agendamentos[window.indiceCancelamento].cancelado = true;

    localStorage.setItem("agendamentos", JSON.stringify(agendamentos));
    carregarAgendamentos();
    fecharPopupCancelamento();
    mostrarAlerta("Você cancelou o agendamento.", "erro");
}



function fecharPopupCancelamento() {
    document.getElementById("popupConfirmacaoCancelamento").style.display = "none";
}

let indiceEditando = null;

function editarAgendamento(index) {
    const agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || [];
    const ag = agendamentos[index];

    document.getElementById("editarNome").value = ag.nome;
    document.getElementById("editarEmail").value = ag.email;
    document.getElementById("editarData").value = ag.dia;
    document.getElementById("editarHorario").value = ag.horario;

    indiceEditando = index;
    document.getElementById("editarPopup").style.display = "flex";
}

function fecharEdicao() {
    document.getElementById("editarPopup").style.display = "none";
    document.body.classList.remove("admin-edicao-ativa");
}

function salvarEdicao() {
    const agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || [];

    agendamentos[indiceEditando] = {
        nome: document.getElementById("editarNome").value,
        email: document.getElementById("editarEmail").value,
        dia: document.getElementById("editarData").value,
        horario: document.getElementById("editarHorario").value
    };

    localStorage.setItem("agendamentos", JSON.stringify(agendamentos));
    fecharEdicao();
    carregarAgendamentos();
    mostrarAlerta("Agendamento editado com sucesso!", "sucesso");
}

function mostrarMensagem(mensagem) {
    let msgBox = document.getElementById("mensagem-confirmacao");
    msgBox.textContent = mensagem;
    msgBox.classList.add("mensagem-visivel");

    setTimeout(() => {
        msgBox.classList.remove("mensagem-visivel");
    }, 3000);
}

function confirmarAgendamento() {
    if (!agendamentoPendente) return;

    let agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || [];
    agendamentos.push(agendamentoPendente);
    localStorage.setItem("agendamentos", JSON.stringify(agendamentos));

    mostrarAlerta(`Agendamento confirmado para ${agendamentoPendente.nome} em ${agendamentoPendente.dia} às ${agendamentoPendente.horario}`, "sucesso");

    document.getElementById("nome").value = "";
    document.getElementById("email").value = "";
    document.getElementById("horario").value = "";
    localStorage.removeItem("diaSelecionado");

    agendamentoPendente = null;
    fecharPopup();
}

// Abrir o popup de login
function abrirLogin() {
    document.getElementById("popupLogin").style.display = "block";
}

// Função chamada ao clicar no botão "Entrar"
function entrarComoAdmin() {
    const usuario = document.getElementById("usuario").value.trim();
    const senha = document.getElementById("senha").value.trim();

    if (usuario === "admin" && senha === "admin123") {
        window.open("administrador.html", "_blank"); // Abre a página em uma nova aba
        document.getElementById("popupLogin").style.display = "none"; // Fecha o popup de login
        document.getElementById("usuario").value = "";
        document.getElementById("senha").value = "";
    } else {
        alert("Usuário ou senha incorretos.");
    }
}


// Cancelar login e fechar popup
function cancelarLogin() {
    document.getElementById("popupLogin").style.display = "none";
    document.getElementById("usuario").value = "";
    document.getElementById("senha").value = "";
}


function fecharLogin() {
    document.getElementById("popupLogin").style.display = "none";
}

document.getElementById("botao-login").addEventListener("click", function () {
    verificarLogin();
});

function verificarLogin() {
    const usuario = document.getElementById("usuario").value.trim();
    const senha = document.getElementById("senha").value.trim();

    const usuarioCorreto = "Getho";
    const senhaCorreta = "Massagem@123";

    if (usuario === usuarioCorreto && senha === senhaCorreta) {
        // Abre a página do administrador diretamente dentro do evento de clique
        let novaAba = window.open("administrador.html", "_blank");

        if (!novaAba) {
            alert("O navegador bloqueou a abertura da nova aba. Permita pop-ups e tente novamente.");
        }
    } else {
        mostrarAlerta("Usuário ou senha incorretos!", "erro");
    }
}


function mostrarAlerta(mensagem, tipo = 'info') {
    const alerta = document.getElementById('alerta-personalizado');
    alerta.textContent = mensagem;
    alerta.className = `alerta ${tipo}`;
    alerta.style.display = 'block';
    setTimeout(() => {
        alerta.style.opacity = '1';
    }, 10);

    setTimeout(() => {
        alerta.style.opacity = '0';
        setTimeout(() => {
            alerta.style.display = 'none';
        }, 300);
    }, 3000);
}

function confirmarCancelarAgendamento(index) {
    window.indiceCancelamento = index;
    document.getElementById("popupConfirmacaoCancelamento").style.display = "flex";
}

function liberarMes() {
    const mes = document.getElementById("mesLiberado").value;
    const ano = document.getElementById("anoLiberado").value;

    if (!mes || !ano) {
        mostrarAlerta("Por favor, selecione um mês e um ano válidos.", "erro");
        return;
    }

    // Salva no localStorage para a outra página usar
    localStorage.setItem("mesLiberado", mes);
    localStorage.setItem("anoLiberado", ano);

    const nomeMes = document.getElementById("mesLiberado").options[document.getElementById("mesLiberado").selectedIndex].text;
    document.getElementById("statusLiberacao").innerText = `Agendamentos liberados para: ${nomeMes} de ${ano}`;
    mostrarAlerta("Agendamento liberado com sucesso!", "sucesso");
}


function atualizarCalendario(mes, ano) {
    // Substitua esse trecho com sua lógica de renderização do calendário
    const calendario = document.getElementById("calendario");
    if (!calendario) return;

    // Exemplo genérico para exibir a data liberada
    calendario.innerText = `Agendamentos disponíveis para: ${mes.toString().padStart(2, '0')}/${ano}`;

    // Aqui você também pode filtrar os dias da semana (quarta e sexta), se quiser
}

function exibirCalendario(mes, ano) {
    const calendario = document.getElementById("calendario");
    if (!calendario) return;

    const nomeMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

    calendario.innerHTML = `<h3>${nomeMeses[mes - 1]} de ${ano}</h3>`;

    // Aqui você pode recriar os dias válidos (quartas e sextas, por exemplo)
    // Dica: use new Date(ano, mes - 1, dia).getDay() para ver se é quarta (3) ou sexta (5)
}

document.addEventListener("DOMContentLoaded", () => {
    atualizarTituloCalendario();
});

function atualizarTituloCalendario() {
    const mes = localStorage.getItem("mesLiberado");
    const ano = localStorage.getItem("anoLiberado");

    if (!mes || !ano) return;

    const nomeMeses = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    const titulo = document.getElementById("titulo-calendario");
    if (titulo) {
        titulo.textContent = `${nomeMeses[parseInt(mes) - 1]} de ${ano}`;
    }
}

function salvarMesLiberado() {
    const mes = document.getElementById("mesLiberado").value;
    const ano = document.getElementById("anoLiberado").value;

    localStorage.setItem("mesLiberado", mes);
    localStorage.setItem("anoLiberado", ano);

    alert("Mês de agendamento atualizado!");
}

document.getElementById("adminBtn").addEventListener("click", function () {
    document.getElementById("adminLoginBackground").style.display = "block";
    document.getElementById("loginContainer").style.display = "block";
});


document.body.classList.add("admin-edicao-ativa");

function abrirEdicao(nome, email, data, horario) {
    document.getElementById("editarNome").value = nome;
    document.getElementById("editarEmail").value = email;
    document.getElementById("editarData").value = data;
    document.getElementById("editarHorario").value = horario;

    document.getElementById("editarPopup").style.display = "block";
    document.body.classList.add("admin-edicao-ativa");
}

function fecharEdicao() {
    document.getElementById("editarPopup").style.display = "none";
    document.body.classList.remove("admin-edicao-ativa");
}

// ==== LOGIN DO ADMINISTRADOR ====

const abrirLoginBtn = document.getElementById("adminBtn");
const popupLogin = document.getElementById("popupLogin");
const entrarBtn = document.getElementById("entrarBtn");
const cancelarBtn = document.getElementById("cancelarBtn");
const senhaInput = document.getElementById("senhaAdmin");

// Abre o popup de login
if (abrirLoginBtn) {
    abrirLoginBtn.addEventListener("click", () => {
        popupLogin.style.display = "block";
    });
}

// Botão de Cancelar
if (cancelarBtn) {
    cancelarBtn.addEventListener("click", () => {
        popupLogin.style.display = "none";
        senhaInput.value = "";
    });
}

// Botão de Entrar
if (entrarBtn) {
    entrarBtn.addEventListener("click", () => {
        const senha = senhaInput.value.trim();
        if (senha === "Massagem@123") {
            document.body.classList.add("admin-edicao-ativa");
            popupLogin.style.display = "none";
            senhaInput.value = "";
        } else {
            alert("Senha incorreta.");
        }
    });
}

// Função chamada ao clicar no botão "Entrar"
function entrarComoAdmin() {
    const usuario = document.getElementById("usuario").value.trim();
    const senha = document.getElementById("senha").value.trim();

    if (usuario === "Getho" && senha === "Massagem@123") {
        window.open("administrador.html", "_blank"); // Abre a página do admin em uma nova aba
        document.getElementById("popupLogin").style.display = "none";
        document.getElementById("usuario").value = "";
        document.getElementById("senha").value = "";
    } else {
        Swal.fire({
            icon: "error",
            title: "Acesso negado",
            text: "Usuário ou senha incorretos.",
            confirmButtonColor: "#d33",
            confirmButtonText: "OK"
        });
    }
}



// Função chamada ao clicar no botão "Cancelar"
function cancelarLogin() {
    document.getElementById("popupLogin").style.display = "none";
    document.getElementById("usuario").value = "";
    document.getElementById("senha").value = "";
}

// Aplica o fundo especial ao entrar em modo de edição
function aplicarFundoEdicao() {
    document.body.classList.add("admin-edicao-ativa");
}

// Altera a função existente para incluir o fundo especial
function editarAgendamento(index) {
    const agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || [];
    const ag = agendamentos[index];

    document.getElementById("editarNome").value = ag.nome;
    document.getElementById("editarEmail").value = ag.email;
    document.getElementById("editarData").value = ag.dia;
    document.getElementById("editarHorario").value = ag.horario;

    indiceEditando = index;
    document.getElementById("editarPopup").style.display = "flex";

    aplicarFundoEdicao(); // Aplica o fundo
}

function reativarAgendamento(index) {
    const agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || [];

    agendamentos[index].cancelado = false;

    localStorage.setItem("agendamentos", JSON.stringify(agendamentos));
    carregarAgendamentos();
    mostrarAlerta("Agendamento reativado com sucesso!", "sucesso");
}

document.querySelector('.login-popup').style.display = 'flex';

function apagarTodosAgendamentos() {
    Swal.fire({
        title: "Confirmação",
        text: "Tem certeza que deseja apagar todos os agendamentos?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc3545",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "Sim, apagar!",
        cancelButtonText: "Cancelar"
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem("agendamentos"); // Remove todos os agendamentos
            carregarAgendamentos(); // Atualiza a tela para refletir a mudança
            Swal.fire("Pronto!", "Todos os agendamentos foram apagados.", "success");
        }
    });
}

document.addEventListener("DOMContentLoaded", function () {
    const mesAtual = new Date().getMonth() + 1; // Obtém o mês atual (1-12)
    document.getElementById("mesRelatorio").value = mesAtual;
});

function exportarRelatorioExcel() {
    const ano = document.getElementById("anoRelatorio").value;
    const mes = document.getElementById("mesRelatorio").value;

    const mesesNome = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    const nomeMes = mesesNome[parseInt(mes) - 1];

    const agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || [];

    const dados = agendamentos.filter(ag => {
        const [dia, mesAgendamento, anoAgendamento] = ag.dia.split("/");
        return parseInt(mesAgendamento) === parseInt(mes) && anoAgendamento === ano;
    });

    if (dados.length === 0) {
        if (dados.length === 0) {
            Swal.fire({
                icon: "info",
                title: "Nenhum agendamento encontrado",
                text: `Não há agendamentos registrados para ${nomeMes} de ${ano}.`,
                confirmButtonColor: "#007bff",
                confirmButtonText: "OK"
            });
            return;
        }        
    }

    const worksheet = XLSX.utils.json_to_sheet(dados);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Relatorio_Agendamentos");

    XLSX.writeFile(workbook, `Relatorio_${nomeMes}_${ano}.xlsx`);
}

function abrirPopupConsulta() {
    document.getElementById("popupConsultaAgendamento").style.display = "flex";
}

function fecharConsulta() {
    document.getElementById("popupConsultaAgendamento").style.display = "none";
}

function consultarAgendamento() {
    const nome = document.getElementById("consultaNome").value.trim();
    const email = document.getElementById("consultaEmail").value.trim();

    if (!nome || !email) {
        Swal.fire("Atenção!", "Preencha o nome e o e-mail para consultar.", "warning");
        return;
    }

    const agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || [];
    const resultados = agendamentos.filter(ag => ag.nome === nome && ag.email === email);

    const resultadoDiv = document.getElementById("resultadoConsulta");
    resultadoDiv.innerHTML = "";

    if (resultados.length === 0) {
        resultadoDiv.innerHTML = `<p style="color: red;">Nenhum agendamento encontrado.</p>`;
        document.getElementById("botaoComprovanteContainer").style.display = "none";
    } else {
        resultados.forEach(ag => {
            resultadoDiv.innerHTML += `
                <p><strong>Data:</strong> ${ag.dia}</p>
                <p><strong>Horário:</strong> ${ag.horario}</p>
                <hr>
            `;
        });

        document.getElementById("botaoComprovanteContainer").style.display = "flex";
    }

    resultadoDiv.style.display = "block";
}


function gerarComprovante() {
    const nome = document.getElementById("consultaNome").value.trim();
    const email = document.getElementById("consultaEmail").value.trim();
    const resultadoDiv = document.getElementById("resultadoConsulta");

    if (!nome || !email || resultadoDiv.innerHTML.trim() === "") {
        Swal.fire("Erro!", "Nenhum agendamento encontrado para gerar comprovante.", "error");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFont("helvetica");
    doc.setFontSize(14);
    doc.text("Comprovante de Agendamento", 20, 20);
    doc.setFontSize(12);
    doc.text(`Nome: ${nome}`, 20, 40);
    doc.text(`Email: ${email}`, 20, 50);
    doc.text("Detalhes:", 20, 60);
    
    let y = 70;
    resultadoDiv.querySelectorAll("p").forEach(p => {
        doc.text(p.innerText, 20, y);
        y += 10;
    });

    doc.save(`Comprovante_${nome}.pdf`);
}

function abrirPopupTerceiros() {
    document.getElementById("popupTerceiros").style.display = "flex";
}

function fecharPopupTerceiros() {
    document.getElementById("popupTerceiros").style.display = "none";
}



function agendarTerceiro() {
    let nome = document.getElementById("terceiroNome").value.trim();
    let email = document.getElementById("terceiroEmail").value.trim();
    let horario = document.getElementById("horarioTerceiro").value;
    let dia = localStorage.getItem("diaSelecionadoTerceiro");

    if (!nome || !email || !horario || !dia) {
        Swal.fire("Erro!", "Preencha todos os campos e selecione um dia!", "error");
        return;
    }

    let agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || [];

    let horarioOcupado = agendamentos.some(ag => ag.dia === dia && ag.horario === horario);
    if (horarioOcupado) {
        Swal.fire("Erro!", "Este horário já está reservado. Escolha outro.", "error");
        return;
    }

    agendamentos.push({ nome, email, horario, dia });
    localStorage.setItem("agendamentos", JSON.stringify(agendamentos));

    Swal.fire("Sucesso!", `Agendamento confirmado para ${nome} em ${dia} às ${horario}`, "success");

    document.getElementById("popupTerceiros").style.display = "none";
}

function carregarCalendarioTerceiros() {
    const calendario = document.getElementById("calendarioTerceiros");
    const mesAtual = document.getElementById("mes-atual-terceiros");

    let dataAtual = new Date();
    let ano = dataAtual.getFullYear();
    let mes = dataAtual.getMonth();
    let diaHoje = dataAtual.getDate();

    const meses = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    mesAtual.innerText = `${meses[mes]} ${ano}`;
    calendario.innerHTML = "";

    let primeiroDia = new Date(ano, mes, 1).getDay();
    let totalDias = new Date(ano, mes + 1, 0).getDate();

    for (let i = 0; i < primeiroDia; i++) {
        let espaco = document.createElement("div");
        espaco.classList.add("dia-vazio");
        calendario.appendChild(espaco);
    }

    for (let dia = 1; dia <= totalDias; dia++) {
        let data = new Date(ano, mes, dia);
        let diaSemana = data.getDay();

        let diaElemento = document.createElement("div");
        diaElemento.textContent = dia;
        diaElemento.classList.add("dia-calendario");

        if (dia < diaHoje) {
            diaElemento.classList.add("desativado"); // Dias passados ficam apagados
        } else {
            diaElemento.classList.add("destacado"); // Dias futuros ficam amarelos

            if (diaSemana === 3 || diaSemana === 5) {  
                diaElemento.classList.add("clicavel"); // Apenas quartas e sextas podem ser clicadas
                diaElemento.onclick = function () {
                    selecionarDiaTerceiro(dia, mes + 1, ano);
                };
            }
        }

        calendario.appendChild(diaElemento);
    }
}

function selecionarDiaTerceiro(dia, mes, ano) {
    let dataSelecionada = `${dia}/${mes}/${ano}`;
    localStorage.setItem("diaSelecionadoTerceiro", dataSelecionada);
    
    Swal.fire("Dia Selecionado!", `Você escolheu ${dataSelecionada} para o agendamento do terceiro.`, "success");

    // Remover destaque anterior
    document.querySelectorAll(".dia-calendario").forEach(d => d.classList.remove("selecionado"));

    // Adicionar destaque ao dia clicado
    event.target.classList.add("selecionado");
}

document.getElementById("terceirosForm").classList.add("mostrar");

