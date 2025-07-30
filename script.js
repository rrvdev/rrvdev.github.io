// IIFE para encapsular o código e evitar poluição do escopo global
(function () {
  'use strict';

  // --- SELEÇÃO DE ELEMENTOS DO DOM ---
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const sectionTitle = document.getElementById('section-title');
  const navButtons = document.querySelectorAll('.nav-button');
  const sections = document.querySelectorAll('.section');
  
  const formCadastro = document.getElementById('form-cadastro');
  const formSorteio = document.getElementById('form-sorteio');
  
  const listaCompletaJogadoresContainer = document.getElementById('lista-completa-jogadores');
  const teamsGrid = document.getElementById('teams-grid');
  const reservesContainer = document.getElementById('reserves-container');
  const reservesList = document.getElementById('reserves-list');
  const nextMatchesContainer = document.getElementById('next-matches-container');
  const nextMatchesList = document.getElementById('next-matches-list');
  const roundControls = document.getElementById('round-controls');
  const nextMatchBtn = document.getElementById('btn-next-match');
  const controleGolsContainer = document.getElementById('controle-gols');
  
  const cronometroDisplay = document.getElementById('cronometro');
  const startPauseBtn = document.getElementById('btn-start-pause');
  const resetBtn = document.getElementById('btn-reset');
  const gameDurationInput = document.getElementById('game-duration');
  
  const avaliacaoBloqueada = document.getElementById('avaliacao-bloqueada');
  const avaliacaoLiberada = document.getElementById('avaliacao-liberada');
  const voterSelect = document.getElementById('voter-select');
  const avaliacaoListaContainer = document.getElementById('avaliacao-lista');
  const salvarAvaliacaoBtn = document.getElementById('btn-salvar-avaliacao');

  const artilheirosContainer = document.getElementById('artilheiros-container');
  const melhoresJogadoresContainer = document.getElementById('melhores-jogadores-container');

  const confirmModal = document.getElementById('confirm-modal');
  const modalText = document.getElementById('modal-text');
  const modalCancelBtn = document.getElementById('modal-cancel-btn');
  
  const editModal = document.getElementById('edit-modal');
  const editForm = document.getElementById('form-edit');
  const editNomeInput = document.getElementById('edit-nome');
  const editSetorSelect = document.getElementById('edit-setor');
  const editCancelBtn = document.getElementById('edit-cancel-btn');

  const importFileInput = document.getElementById('import-file-input');
  const importBtn = document.getElementById('btn-import');

  // --- ESTADO DA APLICAÇÃO ---
  let jogadores = JSON.parse(localStorage.getItem('jogadores')) || [];
  let times = [];
  let reservas = [];
  
  let cronometroInterval = null;
  let tempoRestanteSegundos = 0;
  let jogoEmAndamento = false;

  let rodada = {
    partidas: [], // Fila de partidas, ex: [[timeA, timeB], [timeC, timeD]]
    partidaAtualIndex: -1,
    finalizada: true,
  };

  let partidaAtual = {
    id: null,
    jogadores: [],
    votos: {}, 
    gols: {},
    finalizada: false
  };

  // --- UTILITÁRIOS ---
  const salvarNoLocalStorage = () => localStorage.setItem('jogadores', JSON.stringify(jogadores));
  const gerarId = () => '_' + Math.random().toString(36).substr(2, 9);
  
  const showToast = (message) => {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };
  
  const openConfirmModal = (text, onConfirm) => {
    modalText.textContent = text;
    confirmModal.classList.add('visible');
    const newConfirmBtn = document.getElementById('modal-confirm-btn').cloneNode(true);
    document.getElementById('modal-confirm-btn').parentNode.replaceChild(newConfirmBtn, document.getElementById('modal-confirm-btn'));
    
    newConfirmBtn.addEventListener('click', () => {
      onConfirm();
      closeConfirmModal();
    });
  };
  const closeConfirmModal = () => confirmModal.classList.remove('visible');

  const openEditModal = (playerId) => {
    const jogador = jogadores.find(j => j.id === playerId);
    if (!jogador) return;
    
    editForm.dataset.editingId = playerId;
    editNomeInput.value = jogador.nome;
    editSetorSelect.value = jogador.setor;
    editModal.classList.add('visible');
  };
  const closeEditModal = () => editModal.classList.remove('visible');

  // --- NAVEGAÇÃO E UI ---
  const mudarTela = (targetId) => {
    const targetSection = document.getElementById(targetId);
    if (!targetSection) return;

    sections.forEach(sec => sec.classList.remove('active'));
    targetSection.classList.add('active');
    
    navButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.target === targetId);
      if (btn.dataset.target === targetId) sectionTitle.textContent = btn.querySelector('span').textContent;
    });

    switch (targetId) {
      case 'jogadores': renderizarListaCompletaJogadores(); break;
      case 'dashboard': renderizarDashboard(); break;
      case 'sorteio': renderizarTimes(); break;
      case 'jogo': renderizarControleGols(); break;
      case 'avaliacao': renderizarAvaliacoes(); break;
    }

    if (window.innerWidth <= 768) {
      sidebar.classList.remove('open');
      overlay.classList.remove('visible');
    }
  };

  const toggleSidebar = () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('visible');
  };

  // --- RENDERIZAÇÃO ---
  const renderizarEstrelasDecimais = (nota) => {
    const notaNum = parseFloat(nota) || 0;
    let html = '';
    for (let i = 1; i <= 5; i++) {
        if (notaNum >= i) {
            html += '<i class="fas fa-star"></i>';
        } else if (notaNum > i - 1 && notaNum < i) {
            const percentage = (notaNum - (i - 1)) * 100;
            html += `<span class="fa-stack" style="width: 1em;">
                       <i class="far fa-star fa-stack-1x"></i>
                       <i class="fas fa-star fa-stack-1x" style="width: ${percentage}%; overflow: hidden;"></i>
                     </span>`;
        } else {
            html += '<i class="far fa-star"></i>';
        }
    }
    return html + ` (${notaNum.toFixed(1)})`;
  };

  const criarCardJogador = (player) => {
    const cardTemplate = document.getElementById('template-card-jogador');
    const cardNode = cardTemplate.content.cloneNode(true);
    const card = cardNode.querySelector('.card');
    
    card.dataset.id = player.id;
    card.querySelector('h3').textContent = player.nome;
    card.querySelector('.decimal-stars').innerHTML = renderizarEstrelasDecimais(player.estrelas);
    card.querySelector('.setor span').textContent = player.setor;
    card.querySelector('.partidas span').textContent = player.partidas || 0;
    card.querySelector('.gols span').textContent = player.gols || 0;
    
    return card;
  };

  const renderizarListaCompletaJogadores = () => {
    listaCompletaJogadoresContainer.innerHTML = '';
    if (jogadores.length === 0) {
      listaCompletaJogadoresContainer.innerHTML = '<p>Nenhum jogador cadastrado.</p>';
      return;
    }
    const jogadoresOrdenados = [...jogadores].sort((a, b) => a.nome.localeCompare(b.nome));
    jogadoresOrdenados.forEach(jog => listaCompletaJogadoresContainer.appendChild(criarCardJogador(jog)));
  };

  const renderizarDashboard = () => {
    const artilheiros = [...jogadores].sort((a,b) => (b.gols || 0) - (a.gols || 0)).slice(0, 10);
    artilheirosContainer.innerHTML = artilheiros.length === 0 ? '<li>Nenhum gol marcado.</li>' : '';
    artilheiros.forEach((jog, index) => {
        const li = document.createElement('li');
        li.innerHTML = `<span class="rank rank-${index+1}">${index+1}</span>
                      <span class="player-name">${jog.nome}</span>
                      <span class="player-stat">${jog.gols || 0} Gols</span>`;
        artilheirosContainer.appendChild(li);
    });

    const melhores = [...jogadores].sort((a,b) => (b.estrelas || 0) - (a.estrelas || 0)).slice(0, 10);
    melhoresJogadoresContainer.innerHTML = melhores.length === 0 ? '<li>Nenhum jogador avaliado.</li>' : '';
    melhores.forEach((jog, index) => {
        const li = document.createElement('li');
        li.innerHTML = `<span class="rank rank-${index+1}">${index+1}</span>
                      <span class="player-name">${jog.nome}</span>
                      <span class="player-stat">${renderizarEstrelasDecimais(jog.estrelas)}</span>`;
        melhoresJogadoresContainer.appendChild(li);
    });
  };

  const renderizarControleGols = () => {
    controleGolsContainer.innerHTML = '';
    const jogadoresEmJogo = partidaAtual.jogadores;
    if (jogadoresEmJogo.length === 0) {
      controleGolsContainer.innerHTML = '<p>Sorteie os times para iniciar uma partida.</p>';
      return;
    }
    jogadoresEmJogo.forEach(jog => {
      const cardTemplate = document.getElementById('template-card-gol');
      const cardNode = cardTemplate.content.cloneNode(true);
      const card = cardNode.querySelector('.card');
      card.dataset.id = jog.id;
      card.querySelector('h3').textContent = jog.nome;
      card.querySelector('span').textContent = partidaAtual.gols[jog.id] || 0;
      controleGolsContainer.appendChild(cardNode);
    });
  };

  const renderizarAvaliacoes = () => {
    if (partidaAtual.finalizada) {
      avaliacaoBloqueada.style.display = 'none';
      avaliacaoLiberada.style.display = 'block';
      
      voterSelect.innerHTML = '<option value="">Selecione seu nome</option>';
      jogadores.forEach(j => {
        const option = document.createElement('option');
        option.value = j.id;
        option.textContent = j.nome;
        if(partidaAtual.votos[j.id]) {
            option.disabled = true;
            option.textContent += " (Já votou)";
        }
        voterSelect.appendChild(option);
      });

      avaliacaoListaContainer.innerHTML = '';
      partidaAtual.jogadores.forEach(jog => {
        const cardTemplate = document.getElementById('template-card-avaliacao');
        const cardNode = cardTemplate.content.cloneNode(true);
        const card = cardNode.querySelector('.card');
        card.dataset.id = jog.id;
        card.querySelector('h3').textContent = jog.nome;
        avaliacaoListaContainer.appendChild(cardNode);
      });
    } else {
      avaliacaoBloqueada.style.display = 'block';
      avaliacaoLiberada.style.display = 'none';
    }
  };

  const renderizarTimes = () => {
    teamsGrid.innerHTML = '';
    if (rodada.finalizada) {
        reservesContainer.style.display = 'none';
        nextMatchesContainer.style.display = 'none';
        roundControls.style.display = 'none';
        return;
    }
    
    const colors = ['#4f46e5', '#be123c', '#047857', '#f59e0b', '#5b21b6', '#155e75'];
    times.forEach((time, idx) => {
        const div = document.createElement('div');
        div.className = 'team';
        const totalStars = time.reduce((acc, j) => acc + (j.estrelas || 1), 0);
        div.innerHTML = `<h3>Time ${String.fromCharCode(65 + idx)}</h3>`;
        div.querySelector('h3').style.borderImage = `linear-gradient(90deg, ${colors[idx % colors.length]}, ${colors[(idx + 1) % colors.length]}) 1`;

        time.forEach(jog => {
            const p = document.createElement('p');
            p.textContent = `${jog.nome} (${(jog.estrelas || 1).toFixed(1)})`;
            div.appendChild(p);
        });
        const pStars = document.createElement('p');
        pStars.className = 'total-stars';
        pStars.textContent = `Total de Estrelas: ${totalStars.toFixed(1)}`;
        teamsGrid.appendChild(div);
    });

    if (reservas.length > 0) {
        reservesContainer.style.display = 'block';
        reservesList.innerHTML = '';
        reservas.forEach(jog => {
            const li = document.createElement('li');
            li.textContent = `${jog.nome} (${(jog.estrelas || 1).toFixed(1)})`;
            reservesList.appendChild(li);
        });
    } else {
        reservesContainer.style.display = 'none';
    }

    const proximasPartidas = rodada.partidas.slice(rodada.partidaAtualIndex + 1);
    if (proximasPartidas.length > 0) {
        nextMatchesContainer.style.display = 'block';
        nextMatchesList.innerHTML = '';
        proximasPartidas.forEach(partida => {
            const time1Index = times.indexOf(partida[0]);
            const time2Index = times.indexOf(partida[1]);
            const li = document.createElement('li');
            li.textContent = `Time ${String.fromCharCode(65 + time1Index)} vs Time ${String.fromCharCode(65 + time2Index)}`;
            nextMatchesList.appendChild(li);
        });
    } else {
        nextMatchesContainer.style.display = 'none';
    }
  };

  // --- LÓGICA PRINCIPAL ---
  const handleCadastro = (e) => {
    e.preventDefault();
    const nome = e.target.elements.nome.value.trim();
    const setor = e.target.elements.setor.value;
    if (!nome || !setor) return showToast('Preencha todos os campos!');
    if (jogadores.some(j => j.nome.toLowerCase() === nome.toLowerCase())) return showToast('Jogador já cadastrado!');
    jogadores.push({ id: gerarId(), nome, setor, estrelas: 1.0, partidas: 0, gols: 0, totalNotas: 1, numVotos: 1 });
    salvarNoLocalStorage();
    showToast(`${nome} foi adicionado!`);
    e.target.reset();
  };

  const handleDeletarJogador = (id) => {
    jogadores = jogadores.filter(j => j.id !== id);
    salvarNoLocalStorage();
    showToast('Jogador excluído.');
    const activeSectionId = document.querySelector('.section.active').id;
    if (activeSectionId === 'jogadores' || activeSectionId === 'dashboard') {
        mudarTela(activeSectionId);
    }
  };
  
  const handleSortearTimes = (e) => {
    e.preventDefault();
    const jogadoresPorTime = parseInt(document.getElementById('jogadores-por-time').value, 10);
    const numTimes = parseInt(document.getElementById('numero-de-times').value, 10);
    
    if (jogadores.length < jogadoresPorTime * 2 || numTimes < 2) {
        return showToast('É necessário ter jogadores suficientes para formar pelo menos 2 times.');
    }

    const jogadoresEmbaralhados = [...jogadores].sort(() => Math.random() - 0.5);
    const jogadoresOrdenados = jogadoresEmbaralhados.sort((a, b) => (b.estrelas || 1) - (a.estrelas || 1));
    
    const totalJogadoresNecessarios = jogadoresPorTime * numTimes;
    const jogadoresParaSorteio = jogadoresOrdenados.slice(0, totalJogadoresNecessarios);
    reservas = jogadoresOrdenados.slice(totalJogadoresNecessarios);
    
    times = Array.from({ length: numTimes }, () => []);
    
    let direcao = 1; 
    let timeIndex = 0;
    jogadoresParaSorteio.forEach(jogador => {
        times[timeIndex].push(jogador);
        timeIndex += direcao;
        if (timeIndex >= numTimes || timeIndex < 0) {
            direcao *= -1;
            timeIndex += direcao;
        }
    });
    
    rodada.partidas = [];
    for (let i = 0; i < times.length; i += 2) {
        if (times[i+1]) {
            rodada.partidas.push([times[i], times[i+1]]);
        }
    }
    rodada.finalizada = false;

    iniciarProximaPartida();
  };

  const iniciarProximaPartida = () => {
    rodada.partidaAtualIndex++;
    if (rodada.partidaAtualIndex >= rodada.partidas.length) {
        showToast("Rodada de jogos finalizada!");
        rodada.finalizada = true;
        roundControls.style.display = 'none';
        renderizarTimes();
        return;
    }

    const partida = rodada.partidas[rodada.partidaAtualIndex];
    const jogadoresDaPartida = [...partida[0], ...partida[1]];

    handleReset(false); // Reset parcial, não limpa os times
    partidaAtual.jogadores = jogadoresDaPartida;
    
    renderizarTimes();
    renderizarControleGols();
    roundControls.style.display = 'none';
    showToast("Próxima partida pronta no Modo Jogo!");
  };

  const finalizarPartida = () => {
    clearInterval(cronometroInterval);
    cronometroInterval = null;
    jogoEmAndamento = false;
    partidaAtual.finalizada = true;
    startPauseBtn.textContent = 'Iniciar';
    cronometroDisplay.classList.add('finished');
    showToast("Partida Finalizada! Votação liberada.");
    
    partidaAtual.jogadores.forEach(jogadorDaPartida => {
      const jogadorOriginal = jogadores.find(j => j.id === jogadorDaPartida.id);
      if(jogadorOriginal) {
        jogadorOriginal.partidas = (jogadorOriginal.partidas || 0) + 1;
        jogadorOriginal.gols = (jogadorOriginal.gols || 0) + (partidaAtual.gols[jogadorDaPartida.id] || 0);
      }
    });
    salvarNoLocalStorage();
    renderizarAvaliacoes();

    if (rodada.partidaAtualIndex < rodada.partidas.length - 1) {
        roundControls.style.display = 'block';
    } else {
        showToast("Última partida da rodada concluída!");
    }
  };

  const handleStartPause = () => {
    if (partidaAtual.finalizada) return showToast("A partida já terminou. Resete para começar uma nova.");
    if (jogoEmAndamento) {
      jogoEmAndamento = false;
      clearInterval(cronometroInterval);
      startPauseBtn.textContent = 'Continuar';
      showToast("Jogo pausado.");
    } else {
      if (partidaAtual.jogadores.length === 0) return showToast("Sorteie os times antes de iniciar.");
      if (tempoRestanteSegundos <= 0) {
          const duracaoMinutos = parseInt(gameDurationInput.value, 10);
          tempoRestanteSegundos = duracaoMinutos * 60;
      }
      jogoEmAndamento = true;
      startPauseBtn.textContent = 'Pausar';
      cronometroDisplay.classList.remove('finished');
      cronometroInterval = setInterval(() => {
        tempoRestanteSegundos--;
        renderizarCronometro();
        if (tempoRestanteSegundos <= 0) finalizarPartida();
      }, 1000);
    }
  };

  const handleReset = (resetCompleto = true) => {
    clearInterval(cronometroInterval);
    cronometroInterval = null;
    jogoEmAndamento = false;
    tempoRestanteSegundos = 0;
    
    if (resetCompleto) {
        times = [];
        reservas = [];
        rodada = { partidas: [], partidaAtualIndex: -1, finalizada: true };
        renderizarTimes();
    }

    partidaAtual = { id: gerarId(), jogadores: [], votos: {}, gols: {}, finalizada: false };
    renderizarCronometro();
    renderizarControleGols();
    renderizarAvaliacoes();
    startPauseBtn.textContent = 'Iniciar';
    cronometroDisplay.classList.remove('finished');
    if(resetCompleto) showToast("Rodada resetada.");
  };

  const handleSalvarAvaliacoes = () => {
    const eleitorId = voterSelect.value;
    if (!eleitorId) return showToast("Por favor, selecione seu nome para votar.");

    const ratings = {};
    const cards = avaliacaoListaContainer.querySelectorAll('.card');
    cards.forEach(card => {
      const jogadorId = card.dataset.id;
      const slider = card.querySelector('.rating-slider');
      ratings[jogadorId] = parseFloat(slider.value);
    });

    partidaAtual.votos[eleitorId] = ratings;
    
    Object.keys(ratings).forEach(jogadorId => {
        const jogador = jogadores.find(j => j.id === jogadorId);
        if(!jogador) return;
        
        jogador.totalNotas = (jogador.totalNotas || 0) + ratings[jogadorId];
        jogador.numVotos = (jogador.numVotos || 0) + 1;
        jogador.estrelas = jogador.totalNotas / jogador.numVotos;
    });

    salvarNoLocalStorage();
    showToast("Obrigado pelo seu voto!");
    renderizarAvaliacoes();
  };
  
  const renderizarCronometro = () => {
    const minutos = Math.floor(tempoRestanteSegundos / 60).toString().padStart(2, '0');
    const segundos = (tempoRestanteSegundos % 60).toString().padStart(2, '0');
    cronometroDisplay.textContent = `${minutos}:${segundos}`;
  };

  const handleImportPlayers = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const content = event.target.result;
        parseAndAddPlayers(content);
    };
    reader.readAsText(file);
  };

  const parseAndAddPlayers = (textContent) => {
    let importedCount = 0;
    let skippedCount = 0;
    const lines = textContent.split('\n').map(line => line.trim());

    if (lines[0] && lines[0].toLowerCase().includes('nome,setor')) {
        lines.shift();
    }

    lines.forEach(line => {
        if (!line) return;
        const parts = line.split(',');
        const nome = parts[0] ? parts[0].trim() : '';
        if (!nome) return;

        if (jogadores.some(j => j.nome.toLowerCase() === nome.toLowerCase())) {
            skippedCount++;
            return;
        }

        const setor = parts[1] ? parts[1].trim().toUpperCase() : 'AMIGOS';
        jogadores.push({
            id: gerarId(), nome, setor, estrelas: 1.0, partidas: 0, gols: 0, totalNotas: 1, numVotos: 1
        });
        importedCount++;
    });

    salvarNoLocalStorage();
    renderizarListaCompletaJogadores();
    showToast(`${importedCount} jogadores importados. ${skippedCount} duplicados ignorados.`);
    importFileInput.value = '';
  };

  const handleEditPlayer = (e) => {
    e.preventDefault();
    const playerId = e.target.dataset.editingId;
    const jogador = jogadores.find(j => j.id === playerId);
    if (!jogador) return;

    const novoNome = editNomeInput.value.trim();
    const novoSetor = editSetorSelect.value;

    if (!novoNome || !novoSetor) {
        showToast("Nome e setor não podem estar vazios.");
        return;
    }

    jogador.nome = novoNome;
    jogador.setor = novoSetor;

    salvarNoLocalStorage();
    closeEditModal();
    showToast("Jogador atualizado com sucesso!");
    renderizarListaCompletaJogadores();
  };

  // --- INICIALIZAÇÃO E EVENTOS ---
  const init = () => {
    modalCancelBtn.addEventListener('click', closeConfirmModal);
    editCancelBtn.addEventListener('click', closeEditModal);

    navButtons.forEach(btn => btn.addEventListener('click', () => mudarTela(btn.dataset.target)));
    document.getElementById('btn-toggle-sidebar').addEventListener('click', toggleSidebar);
    document.getElementById('btn-close-sidebar').addEventListener('click', toggleSidebar);
    overlay.addEventListener('click', toggleSidebar);
    
    formCadastro.addEventListener('submit', handleCadastro);
    formSorteio.addEventListener('submit', handleSortearTimes);
    importBtn.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', handleImportPlayers);
    editForm.addEventListener('submit', handleEditPlayer);
    
    startPauseBtn.addEventListener('click', handleStartPause);
    resetBtn.addEventListener('click', () => handleReset(true));
    nextMatchBtn.addEventListener('click', iniciarProximaPartida);
    
    salvarAvaliacaoBtn.addEventListener('click', handleSalvarAvaliacoes);

    listaCompletaJogadoresContainer.addEventListener('click', (e) => {
        const targetButton = e.target.closest('.btn-card-action');
        if (!targetButton) return;
        const card = targetButton.closest('.card');
        const playerId = card.dataset.id;
        if (targetButton.classList.contains('btn-edit-player')) {
            openEditModal(playerId);
        }
    });

    controleGolsContainer.addEventListener('click', (e) => {
      if(jogoEmAndamento && e.target.classList.contains('btn-gol')) {
        const card = e.target.closest('.card');
        const id = card.dataset.id;
        const action = e.target.dataset.action;
        partidaAtual.gols[id] = partidaAtual.gols[id] || 0;
        if (action === 'add') partidaAtual.gols[id]++;
        else if (action === 'remove' && partidaAtual.gols[id] > 0) partidaAtual.gols[id]--;
        card.querySelector('span').textContent = partidaAtual.gols[id];
      }
    });

    avaliacaoListaContainer.addEventListener('input', (e) => {
      if (e.target.classList.contains('rating-slider')) {
        const valueSpan = e.target.nextElementSibling;
        valueSpan.textContent = parseFloat(e.target.value).toFixed(1);
      }
    });

    mudarTela('cadastro');
    renderizarCronometro();
  };

  init();
})();