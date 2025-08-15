// IIFE para encapsular o código e evitar poluição do escopo global
(function () {
  'use strict';

  // --- INICIALIZAÇÃO DO SUPABASE ---
  const SUPABASE_URL = 'https://nvyqxwvrqnavdbicecfx.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52eXF4d3ZycW5hdmRiaWNlY2Z4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4Mjg2MDUsImV4cCI6MjA2OTQwNDYwNX0.aAEqYH0sEwPbaNJ4Dlq6WgC7AN8FuHlwo-3RuRMjBKA';
  const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


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
  const salvarTimesEditadosBtn = document.getElementById('btn-salvar-times-editados');
  const finalizarPartidaBtn = document.getElementById('btn-finalizar-partida');

  // --- ESTADO DA APLICAÇÃO ---
  let jogadores = [];
  let times = [];
  let reservas = [];
  let sortableInstances = [];
  let cronometroInterval = null;
  let tempoRestanteSegundos = 0;
  let jogoEmAndamento = false;
  let golsDaRodada = {};
  let rodada = {
    partidas: [],
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
      case 'jogadores':
        renderizarListaCompletaJogadores();
        break;
      case 'dashboard':
        renderizarDashboard();
        break;
      case 'sorteio':
        renderizarTimes();
        break;
      case 'jogo':
        renderizarControleGols();
        break;
      case 'avaliacao':
        renderizarAvaliacoes();
        break;
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
    if (!cardTemplate) return null;
    const cardNode = cardTemplate.content.cloneNode(true);
    const card = cardNode.firstElementChild;
    if (!card) return null;
    
    card.dataset.id = player.id;
    card.classList.toggle('is-absent', !player.presente);

    const toggleInput = card.querySelector('.toggle-presenca');
    if (toggleInput) {
        toggleInput.checked = player.presente;
    }

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
    jogadoresOrdenados.forEach(jog => {
      const cardElement = criarCardJogador(jog);
      if (cardElement) {
        listaCompletaJogadoresContainer.appendChild(cardElement);
      }
    });
  };
  const renderizarDashboard = () => {
    const artilheiros = [...jogadores].sort((a, b) => (b.gols || 0) - (a.gols || 0));
    artilheirosContainer.innerHTML = artilheiros.length === 0 ? '<li>Nenhum gol marcado.</li>' : '';
    artilheiros.forEach((jog, index) => {
      const li = document.createElement('li');
      li.innerHTML = `<span class="rank rank-${index + 1}">${index + 1}</span>
                      <span class="player-name">${jog.nome}</span>
                      <span class="player-stat">${jog.gols || 0} Gols</span>`;
      artilheirosContainer.appendChild(li);
    });
    const melhores = [...jogadores].sort((a, b) => (b.estrelas || 0) - (a.estrelas || 0));
    melhoresJogadoresContainer.innerHTML = melhores.length === 0 ? '<li>Nenhum jogador avaliado.</li>' : '';
    melhores.forEach((jog, index) => {
      const li = document.createElement('li');
      li.innerHTML = `<span class="rank rank-${index + 1}">${index + 1}</span>
                      <span class="player-name">${jog.nome}</span>
                      <span class="player-stat">${renderizarEstrelasDecimais(jog.estrelas)}</span>`;
      melhoresJogadoresContainer.appendChild(li);
    });
  };
  const renderizarControleGols = () => {
    controleGolsContainer.innerHTML = '';
    const jogadoresPresentes = jogadores.filter(j => j.presente);
    if (jogadoresPresentes.length === 0) {
      controleGolsContainer.innerHTML = '<p>Nenhum jogador marcado como presente.</p>';
      return;
    }

    const jogadoresEmPartidaIds = new Set(partidaAtual.jogadores.map(j => j.id));

    jogadoresPresentes.forEach(jog => {
      const cardTemplate = document.getElementById('template-card-gol');
      const cardNode = cardTemplate.content.cloneNode(true);
      const card = cardNode.querySelector('.card');
      card.dataset.id = jog.id;
      card.querySelector('h3').textContent = jog.nome;
      card.querySelector('span').textContent = golsDaRodada[jog.id] || 0;

      const isPlaying = jogadoresEmPartidaIds.has(jog.id);
      if (!isPlaying) {
        card.querySelectorAll('.btn-gol').forEach(btn => btn.disabled = true);
      }
      
      controleGolsContainer.appendChild(cardNode);
    });
  };
  const renderizarAvaliacoes = () => {
    if (partidaAtual.finalizada) {
      avaliacaoBloqueada.style.display = 'none';
      avaliacaoLiberada.style.display = 'block';
      voterSelect.innerHTML = '<option value="">Selecione seu nome</option>';
      const jogadoresOrdenados = [...jogadores].sort((a, b) => a.nome.localeCompare(b.nome));
      jogadoresOrdenados.forEach(j => {
        const option = document.createElement('option');
        option.value = j.id;
        option.textContent = j.nome;
        if (partidaAtual.votos[j.id]) {
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
    const isEditing = sortableInstances.length > 0;
    if (times.length === 0) {
      document.getElementById('save-teams-controls').style.display = 'none';
      formSorteio.style.display = 'flex';
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
      let timeHTML = `<h3>Time ${String.fromCharCode(65 + idx)}</h3>`;
      timeHTML += `<div class="team-player-list">`;
      time.forEach(jog => {
        const isGoleiro = jog.setor.toUpperCase() === 'GOLEIRO';
        timeHTML += `
          <div class="player-item-draggable" data-player-id="${jog.id}">
            ${isGoleiro ? '<i class="fas fa-mitten"></i> ' : ''}
            ${jog.nome} 
            <span class="player-item-stars">(${(jog.estrelas || 1).toFixed(1)})</span>
          </div>
        `;
      });
      timeHTML += `</div>`;
      timeHTML += `<p class="total-stars">Total de Estrelas: ${totalStars.toFixed(1)}</p>`;
      div.innerHTML = timeHTML;
      div.querySelector('h3').style.borderImage = `linear-gradient(90deg, ${colors[idx % colors.length]}, ${colors[(idx + 1) % colors.length]}) 1`;
      teamsGrid.appendChild(div);
    });
    
    reservesList.innerHTML = '';
    if (reservas.length > 0) {
      reservesContainer.style.display = 'block';
      reservas.forEach(jog => {
        const isGoleiro = jog.setor.toUpperCase() === 'GOLEIRO';
        const li = document.createElement('li');
        li.className = 'player-item-draggable';
        li.dataset.playerId = jog.id;
        li.innerHTML = `
            ${isGoleiro ? '<i class="fas fa-mitten"></i> ' : ''}
            ${jog.nome} 
            <span class="player-item-stars">(${(jog.estrelas || 1).toFixed(1)})</span>
        `;
        reservesList.appendChild(li);
      });
    } else {
      reservesContainer.style.display = 'none';
    }

    const proximasPartidas = rodada.partidas.slice(rodada.partidaAtualIndex + 1);
    if (!isEditing && proximasPartidas.length > 0) {
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
  const renderizarCronometro = () => {
    const minutos = Math.floor(tempoRestanteSegundos / 60).toString().padStart(2, '0');
    const segundos = (tempoRestanteSegundos % 60).toString().padStart(2, '0');
    cronometroDisplay.textContent = `${minutos}:${segundos}`;
  };

  // --- LÓGICA PRINCIPAL E DE JOGO ---
  const handleTogglePresenca = async (playerId) => {
    const jogador = jogadores.find(j => j.id === playerId);
    if (!jogador) return;

    const novaPresenca = !jogador.presente;
    const { error } = await supabaseClient
        .from('jogadores')
        .update({ presente: novaPresenca })
        .eq('id', playerId);

    if (error) {
        showToast(`Erro ao atualizar presença de ${jogador.nome}`);
        console.error(error);
    } else {
        jogador.presente = novaPresenca; // Atualiza o estado local para UI imediata
        renderizarListaCompletaJogadores(); // Re-renderiza a lista
    }
  };

  const handleCadastro = async (e) => {
    e.preventDefault();
    const nome = e.target.elements.nome.value.trim();
    const setor = e.target.elements.setor.value;
    if (!nome || !setor) return showToast('Preencha todos os campos!');
    if (jogadores.some(j => j.nome.toLowerCase() === nome.toLowerCase())) return showToast('Jogador já cadastrado!');
    const novoJogador = { nome, setor, presente: true };
    const { error } = await supabaseClient.from('jogadores').insert(novoJogador);
    if (error) {
      console.error('Erro ao adicionar jogador:', error);
      return showToast('Erro ao adicionar jogador.');
    }
    showToast(`${nome} foi adicionado!`);
    e.target.reset();
  };
  const handleDeletarJogador = async (id) => {
    const { error } = await supabaseClient.from('jogadores').delete().eq('id', id);
    if (error) {
      console.error('Erro ao deletar jogador:', error);
      return showToast('Erro ao excluir jogador.');
    }
    showToast('Jogador excluído.');
  };
  const handleSortearTimes = (e) => {
    e.preventDefault();
    golsDaRodada = {};
    
    const jogadoresPresentes = jogadores.filter(j => j.presente);
    const jogadoresPorTime = parseInt(document.getElementById('jogadores-por-time').value, 10);
    const numTimes = parseInt(document.getElementById('numero-de-times').value, 10);

    if (jogadoresPresentes.length < jogadoresPorTime * numTimes) {
      return showToast('Não há jogadores presentes suficientes para preencher os times.');
    }
    const goleiros = jogadoresPresentes.filter(j => j.setor.toUpperCase() === 'GOLEIRO');
    const jogadoresDeLinha = jogadoresPresentes.filter(j => j.setor.toUpperCase() !== 'GOLEIRO');
    if (goleiros.length < numTimes) {
      showToast(`Atenção: Não há goleiros suficientes! ${goleiros.length} de ${numTimes} necessários.`);
    }
    const goleirosOrdenados = [...goleiros].sort((a, b) => (b.estrelas || 1) - (a.estrelas || 1));
    const linhaOrdenados = [...jogadoresDeLinha].sort((a, b) => (b.estrelas || 1) - (a.estrelas || 1));
    times = Array.from({ length: numTimes }, () => []);
    for (let i = 0; i < numTimes; i++) {
      if (goleirosOrdenados.length > 0) {
        times[i].push(goleirosOrdenados.shift());
      }
    }
    let totalLinhaNecessarios = 0;
    times.forEach(time => {
      totalLinhaNecessarios += (jogadoresPorTime - time.length);
    });
    const jogadoresParaSorteio = linhaOrdenados.slice(0, totalLinhaNecessarios);
    let direcao = 1;
    let timeIndex = 0;
    while (jogadoresParaSorteio.length > 0) {
      if (timeIndex < 0 || timeIndex >= numTimes) {
        direcao *= -1;
        timeIndex += direcao;
        continue;
      }
      if (times[timeIndex].length < jogadoresPorTime) {
        times[timeIndex].push(jogadoresParaSorteio.shift());
      }
      timeIndex += direcao;
    }
    const jogadoresSorteadosIds = times.flat().map(j => j.id);
    reservas = jogadoresPresentes.filter(j => !jogadoresSorteadosIds.includes(j.id));
    renderizarTimes();
    habilitarEdicaoTimes(true);
  };
  const handleSalvarTimesEditados = () => {
    const novosTimes = [];
    const teamElements = document.querySelectorAll('.team .team-player-list');
    teamElements.forEach(teamEl => {
      const time = [];
      const playerElements = teamEl.querySelectorAll('.player-item-draggable');
      playerElements.forEach(playerEl => {
        const playerId = playerEl.dataset.playerId;
        const jogador = jogadores.find(j => j.id === playerId);
        if (jogador) {
          time.push(jogador);
        }
      });
      novosTimes.push(time);
    });
    const novosReservas = [];
    const reserveElements = reservesList.querySelectorAll('.player-item-draggable');
    reserveElements.forEach(playerEl => {
        const playerId = playerEl.dataset.playerId;
        const jogador = jogadores.find(j => j.id === playerId);
        if (jogador) {
            novosReservas.push(jogador);
        }
    });

    times = novosTimes;
    reservas = novosReservas;

    habilitarEdicaoTimes(false);
    gerarPartidasDaRodada();
    renderizarTimes();
    mudarTela('jogo');
    showToast("Times salvos e rodada iniciada!");
  };
  const habilitarEdicaoTimes = (ativar) => {
    document.getElementById('save-teams-controls').style.display = ativar ? 'block' : 'none';
    formSorteio.style.display = ativar ? 'none' : 'flex';
    if (ativar) {
      const lists = document.querySelectorAll('.team-player-list');
      lists.forEach(list => {
        const sortable = new Sortable(list, {
          group: 'shared-teams',
          animation: 150,
          ghostClass: 'player-ghost'
        });
        sortableInstances.push(sortable);
      });
    } else {
      sortableInstances.forEach(sortable => sortable.destroy());
      sortableInstances = [];
    }
  };
  const gerarPartidasDaRodada = () => {
    rodada.partidas = [];
    for (let i = 0; i < times.length; i += 2) {
      if (times[i + 1]) {
        rodada.partidas.push([times[i], times[i + 1]]);
      }
    }
    rodada.finalizada = false;
    rodada.partidaAtualIndex = -1;
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
    handleReset(false);
    partidaAtual.jogadores = jogadoresDaPartida;
    renderizarTimes();
    renderizarControleGols();
    roundControls.style.display = 'none';
    showToast("Partida pronta no Modo Jogo!");
  };
  const finalizarPartida = async () => {
    if (partidaAtual.finalizada) return showToast("Esta partida já foi finalizada.");
    
    clearInterval(cronometroInterval);
    cronometroInterval = null;
    jogoEmAndamento = false;
    partidaAtual.finalizada = true;
    startPauseBtn.textContent = 'Iniciar Timer';
    cronometroDisplay.classList.remove('finished');
    showToast("Partida Finalizada! Votação liberada.");
    
    const jogadoresDestaPartida = partidaAtual.jogadores.map(j => j.id);
    const updates = jogadoresDestaPartida.map(jogadorId => {
      const jogadorOriginal = jogadores.find(j => j.id === jogadorId);
      if (jogadorOriginal) {
        const golsNestaPartida = partidaAtual.gols[jogadorId] || 0;
        const novosGols = (jogadorOriginal.gols || 0) + golsNestaPartida;
        const novasPartidas = (jogadorOriginal.partidas || 0) + 1;
        return supabaseClient.from('jogadores').update({
          gols: novosGols,
          partidas: novasPartidas
        }).eq('id', jogadorId);
      }
      return Promise.resolve();
    });

    const results = await Promise.all(updates);
    const errorResult = results.find(res => res.error);
    if (errorResult) {
      console.error("Erro ao atualizar estatísticas da partida:", errorResult.error);
      showToast("Erro ao salvar dados da partida.");
    }
    
    renderizarAvaliacoes();
    if (rodada.partidaAtualIndex < rodada.partidas.length - 1) {
      roundControls.style.display = 'block';
    } else {
      showToast("Última partida da rodada concluída!");
      roundControls.style.display = 'none';
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
      golsDaRodada = {};
      rodada = {
        partidas: [],
        partidaAtualIndex: -1,
        finalizada: true
      };
      habilitarEdicaoTimes(false);
      renderizarTimes();
    }
    partidaAtual = {
      id: null,
      jogadores: [],
      votos: {},
      gols: {},
      finalizada: false
    };
    renderizarCronometro();
    renderizarControleGols();
    renderizarAvaliacoes();
    startPauseBtn.textContent = 'Iniciar Timer';
    cronometroDisplay.classList.remove('finished');
    if (resetCompleto) showToast("Rodada resetada.");
  };
  const handleSalvarAvaliacoes = async () => {
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
    const updates = Object.keys(ratings).map(jogadorId => {
      const jogador = jogadores.find(j => j.id === jogadorId);
      if (!jogador) return Promise.resolve();
      const novoTotalNotas = (jogador.totalNotas || 0) + ratings[jogadorId];
      const novoNumVotos = (jogador.numVotos || 0) + 1;
      const novasEstrelas = novoTotalNotas / novoNumVotos;
      return supabaseClient.from('jogadores').update({
        totalNotas: novoTotalNotas,
        numVotos: novoNumVotos,
        estrelas: novasEstrelas
      }).eq('id', jogadorId);
    });
    const results = await Promise.all(updates);
    const errorResult = results.find(res => res.error);
    if (errorResult) {
      console.error("Erro ao salvar avaliações:", errorResult.error);
      return showToast("Erro ao salvar avaliações.");
    }
    showToast("Obrigado pelo seu voto!");
    renderizarAvaliacoes();
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
  const parseAndAddPlayers = async (textContent) => {
    let importedCount = 0;
    let skippedCount = 0;
    const lines = textContent.split('\n').map(line => line.trim());
    if (lines[0] && lines[0].toLowerCase().includes('nome,setor')) {
      lines.shift();
    }
    const novosJogadores = [];
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
      novosJogadores.push({
        nome,
        setor,
        presente: true
      });
      importedCount++;
    });
    if (novosJogadores.length > 0) {
      const { error } = await supabaseClient.from('jogadores').insert(novosJogadores);
      if (error) {
        console.error("Erro na importação em massa:", error);
        return showToast("Erro ao importar jogadores.");
      }
    }
    showToast(`${importedCount} jogadores importados. ${skippedCount} duplicados ignorados.`);
    importFileInput.value = '';
  };
  const handleEditPlayer = async (e) => {
    e.preventDefault();
    const playerId = e.target.dataset.editingId;
    const novoNome = editNomeInput.value.trim();
    const novoSetor = editSetorSelect.value;
    if (!novoNome || !novoSetor) {
      showToast("Nome e setor não podem estar vazios.");
      return;
    }
    const { error } = await supabaseClient.from('jogadores').update({
      nome: novoNome,
      setor: novoSetor
    }).eq('id', playerId);
    if (error) {
      console.error('Erro ao editar jogador:', error);
      return showToast("Erro ao atualizar jogador.");
    }
    closeEditModal();
    showToast("Jogador atualizado com sucesso!");
  };

  // --- FUNÇÕES DE DADOS (SUPABASE) ---
  const carregarJogadores = async () => {
    const { data, error } = await supabaseClient.from('jogadores').select('*').order('nome', { ascending: true });
    if (error) {
      console.error('Erro ao carregar jogadores:', error);
      showToast('Erro ao carregar jogadores.');
    } else {
      jogadores = data;
      const activeSectionId = document.querySelector('.section.active')?.id;
      if (activeSectionId === 'jogadores') renderizarListaCompletaJogadores();
      if (activeSectionId === 'dashboard') renderizarDashboard();
      if (activeSectionId === 'avaliacao') renderizarAvaliacoes();
    }
  };
  const escutarMudancasJogadores = () => {
    supabaseClient.channel('jogadores_changes').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'jogadores'
    }, async (payload) => {
      console.log('Mudança em tempo real recebida!', payload);
      await carregarJogadores();

      if (!rodada.finalizada) {
        const jogadoresSorteadosIds = times.flat().map(j => j.id);
        const jogadoresPresentes = jogadores.filter(j => j.presente);
        reservas = jogadoresPresentes.filter(j => !jogadoresSorteadosIds.includes(j.id));
        
        renderizarTimes();
        renderizarControleGols();
      }

    }).subscribe();
  };

  // --- INICIALIZAÇÃO E EVENTOS ---
  const init = async () => {
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
    salvarTimesEditadosBtn.addEventListener('click', handleSalvarTimesEditados);
    finalizarPartidaBtn.addEventListener('click', finalizarPartida);

    listaCompletaJogadoresContainer.addEventListener('click', (e) => {
      const targetButton = e.target.closest('.btn-card-action');
      if (targetButton) {
          const card = targetButton.closest('.card');
          const playerId = card.dataset.id;
          if (targetButton.classList.contains('btn-edit-player')) {
              openEditModal(playerId);
          } else if (targetButton.classList.contains('btn-delete-player')) {
              const jogador = jogadores.find(j => j.id === playerId);
              openConfirmModal(`Tem certeza que deseja excluir ${jogador.nome}?`, () => {
                  handleDeletarJogador(playerId);
              });
          }
          return;
      }
      
      const toggle = e.target.closest('.toggle-presenca');
      if (toggle) {
          const card = toggle.closest('.card');
          const playerId = card.dataset.id;
          handleTogglePresenca(playerId);
      }
    });

    controleGolsContainer.addEventListener('click', (e) => {
      if (partidaAtual.finalizada) {
        showToast("A partida já terminou. Inicie uma nova para adicionar gols.");
        return;
      }
      if (e.target.classList.contains('btn-gol')) {
        const card = e.target.closest('.card');
        const id = card.dataset.id;
        const action = e.target.dataset.action;
        partidaAtual.gols[id] = partidaAtual.gols[id] || 0;
        golsDaRodada[id] = golsDaRodada[id] || 0;
        if (action === 'add') {
          partidaAtual.gols[id]++;
          golsDaRodada[id]++;
        } else if (action === 'remove' && golsDaRodada[id] > 0) {
          if (partidaAtual.gols[id] > 0) {
            partidaAtual.gols[id]--;
            golsDaRodada[id]--;
          } else {
            showToast("Não é possível remover gols de partidas anteriores.");
          }
        }
        card.querySelector('span').textContent = golsDaRodada[id];
      }
    });

    avaliacaoListaContainer.addEventListener('input', (e) => {
      if (e.target.classList.contains('rating-slider')) {
        const valueSpan = e.target.nextElementSibling;
        valueSpan.textContent = parseFloat(e.target.value).toFixed(1);
      }
    });
    
    await carregarJogadores();
    escutarMudancasJogadores();
    mudarTela('cadastro');
    renderizarCronometro();
  };
  
  init();
})();
