document.addEventListener('DOMContentLoaded', () => {
    // --- Definições de Cartas --- (Permanece o mesmo)
    const cardDatabase = [
        { id: "k001", name: "Guarda Leal", type: "Seguidor", cost: { gold: 1 }, zone: "sword", influence: 1, text: "Básico e confiável.", allegianceEffect: null },
        { id: "k002", name: "Cavaleiro Veterano", type: "Seguidor", cost: { gold: 3 }, zone: "sword", influence: 3, text: "Sua experiência inspira lealdade.", allegianceEffect: { condition: (pos) => pos >= 1, bonusInfluence: 2, description: "Lealdade >= +1" } },
        { id: "m001", name: "Coletor de Impostos", type: "Seguidor", cost: { gold: 2 }, zone: "coin", influence: 2, text: "Aumenta a riqueza do reino.", allegianceEffect: null },
        { id: "m002", name: "Mestre Mercador", type: "Seguidor", cost: { gold: 4 }, zone: "coin", influence: 2, text: "Conexões valiosas trazem prosperidade.", onPlay: (player) => player.gold += 2, allegianceEffect: { condition: (pos) => pos === 2, onPlayBonus: (player) => player.gold +=2, description: "Lealdade == +2" } },
        { id: "s001", name: "Escriba Aprendiz", type: "Seguidor", cost: { gold: 1 }, zone: "scroll", influence: 1, text: "Registra os editos e saberes.", allegianceEffect: null },
        { id: "s002", name: "Arquivista Real", type: "Seguidor", cost: { gold: 3 }, zone: "scroll", influence: 2, text: "Acesso privilegiado ao conhecimento.", allegianceEffect: { condition: (pos) => pos >= 1, drawCard: 1, description: "Lealdade >= +1" } },
        { id: "c001", name: "Conselheiro Astuto", type: "Seguidor", cost: { gold: 4 }, zone: "crown", influence: 1, text: "Sussurra palavras de influência na corte.", onPlay: (player, game) => game.shiftAllegiance(player.id === 'player' ? 1 : -1) },
        { id: "c002", name: "Nobre Influente", type: "Seguidor", cost: { gold: 6 }, zone: "crown", influence: 3, text: "Seu prestígio é inegável.", allegianceEffect: { condition: (pos) => pos === 2, bonusInfluence: 2, description: "Lealdade == +2" } },
        { id: "a001", name: "Decreto de Mobilização", type: "Ação", cost: { gold: 2, might: 1 }, text: "Convoca forças para a zona da Espada.", effect: (player, game) => game.addZoneInfluence(player.id, 'sword', 3) },
        { 
            id: "a002", 
            name: "Investimento Real", 
            type: "Ação", 
            cost: { gold: 2 }, 
            text: "Invista 2 Ouros. O retorno é incerto, podendo variar de 2 a 5 Ouros.", 
            effect: (player, game) => { 
                const minReturn = 2;
                const maxReturn = 5;
                const goldEarned = Math.floor(Math.random() * (maxReturn - minReturn + 1)) + minReturn;
                player.gold += goldEarned;
                let profit = goldEarned - 2; 
                let message = `${player.name} investiu e recebeu ${goldEarned} Ouro. `;
                if (profit > 0) {
                    message += `Um lucro de ${profit} Ouro!`;
                } else if (profit === 0) {
                    message += `Recuperou o investimento, sem lucro.`;
                } 
                game.logMessage(message); 
            } 
        },
        { id: "a003", name: "Intriga na Corte", type: "Ação", cost: { gold: 3 }, text: "Manipula a lealdade e desestabiliza o oponente.", allegianceEffect: {condition: (pos) => pos >=1, description: "Lealdade >=+1"}, effect: (player, game) => {
            game.shiftAllegiance(player.id === 'player' ? 1 : -1);
            const allegianceCheck = player.id === 'player' ? game.allegianceTrackPosition : -game.allegianceTrackPosition;
            if (allegianceCheck >= 1) {
                const targetPlayer = player.id === 'player' ? game.opponent : game.player;
                if (targetPlayer.hand.length > 0) {
                    const discardedIndex = Math.floor(Math.random() * targetPlayer.hand.length);
                    const discarded = targetPlayer.hand.splice(discardedIndex, 1);
                    game.addToDiscard(targetPlayer, discarded[0]);
                    game.logMessage(`${targetPlayer.name} descartou ${discarded[0].name} devido à Intriga na Corte.`);
                }
            }
        }},
        { id: "a004", name: "Sabotagem Econômica", type: "Ação", cost: { gold: 3, might: 1 }, text: "Interfere nas finanças do adversário.", effect: (player, game) => game.addZoneInfluence(player.id === 'player' ? 'opponent' : 'player', 'coin', -3) },
        { 
            id: "a005", 
            name: "Recebimento dos Impostos", 
            type: "Ação", 
            cost: { gold: 0 }, 
            text: "Colete Ouro. Se estiver sem Ouro, o recebimento é de 3 Ouros, caso contrário, 2 Ouros.", 
            effect: (player, game) => {
                let goldEarned = 0;
                // Verifica o ouro do jogador ANTES de adicionar o ganho desta carta.
                // Como o custo é 0, player.gold aqui é o estado atual.
                if (player.gold === 0) { 
                    goldEarned = 3;
                    game.logMessage(`${player.name} estava sem ouro e recebeu um bônus nos impostos: +${goldEarned} Ouro!`);
                } else {
                    goldEarned = 2;
                    game.logMessage(`${player.name} recebeu ${goldEarned} Ouro dos impostos.`);
                }
                player.gold += goldEarned;
            }, 
            allegianceEffect: null 
        }
    ];

    // --- Resto do objeto game e suas funções (initialize, sounds, createDeck, etc.) ---
    // Nenhuma alteração necessária nessas outras partes para este ajuste específico da IA.
    // Cole o resto do seu script.js aqui, da versão anterior.
    // A única função que realmente precisa ser mostrada com a mudança é opponentPlayTurn.

    let game = {
        player: { id: 'player', name: "Jogador 1", gold: 10, might: 0, crownInfluence: 0, zoneInfluence: { sword: 0, coin: 0, scroll: 0 }, deck: [], hand: [], discard: [], playedCards: [] },
        opponent: { id: 'opponent', name: "Computador", gold: 10, might: 0, crownInfluence: 0, zoneInfluence: { sword: 0, coin: 0, scroll: 0 }, deck: [], hand: [], discard: [], playedCards: [] },
        allegianceTrackPosition: 0,
        currentPlayerId: 'player',
        turn: 1,
        maxCrownInfluence: 15,
        startingHandSize: 4,
        allegianceWinPendingPlayer: null,
        isGameOver: false,

        sounds: {
            colocar_carta: new Audio('sons/colocar_carta.mp3'),
            ganhar_carta: new Audio('sons/ganhar_carta.mp3'),
            passar_carta: new Audio('sons/passar_carta.mp3'),
            musica_fundo: document.getElementById('background-music'),
            vitoria: new Audio('sons/vitoria.mp3'),
            derrota: new Audio('sons/derrota.mp3'),
            play: function(soundName) {
                if (this[soundName]) {
                    this[soundName].currentTime = 0;
                    this[soundName].play().catch(e => console.warn("Erro ao tocar som:", soundName, e));
                }
            },
            startMusic: function() {
                this.musica_fundo.src = 'sons/musica.wav';
                this.musica_fundo.volume = 0.06;
                const playPromise = this.musica_fundo.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.warn("Música de fundo bloqueada. Clique na tela para tentar iniciar.", error);
                        document.body.addEventListener('click', () => {
                            if(this.musica_fundo.paused) this.musica_fundo.play();
                        }, { once: true });
                    });
                }
            }
        },

        initialize() {
            this.player.gold = 10; this.player.might = 0; this.player.crownInfluence = 0;
            this.player.zoneInfluence = { sword: 0, coin: 0, scroll: 0 };
            this.player.deck = this.createDeck(); this.player.hand = []; this.player.discard = []; this.player.playedCards = [];
            this.opponent.gold = 10; this.opponent.might = 0; this.opponent.crownInfluence = 0;
            this.opponent.zoneInfluence = { sword: 0, coin: 0, scroll: 0 };
            this.opponent.deck = this.createDeck(); this.opponent.hand = []; this.opponent.discard = []; this.opponent.playedCards = [];

            this.shuffleDeck(this.player.deck);
            this.shuffleDeck(this.opponent.deck);

            for (let i = 0; i < this.startingHandSize; i++) {
                this.drawCard(this.player, false);
                this.drawCard(this.opponent, false);
            }

            this.allegianceTrackPosition = 0;
            this.currentPlayerId = 'player';
            this.turn = 1;
            this.allegianceWinPendingPlayer = null;
            this.isGameOver = false;
            document.getElementById('end-turn-button').disabled = false;

            this.sounds.startMusic();
            this.showTutorial();
            this.updateDOM();
            this.logMessage("Jogo iniciado! É a vez do Jogador 1.");
        },

        showTutorial() {
            const tutorialModal = document.getElementById('tutorial-modal');
            const closeButton = document.getElementById('close-tutorial');
            tutorialModal.style.display = 'flex';
            tutorialModal.classList.add('visible');
            closeButton.onclick = () => {
                tutorialModal.classList.remove('visible');
                setTimeout(() => { tutorialModal.style.display = 'none'; }, 300);
            };
        },

        createDeck() {
            let deck = [];
            cardDatabase.forEach(cardDef => {
                if (cardDef.allegianceEffect && !cardDef.allegianceEffect.description) {
                    if (cardDef.allegianceEffect.condition) {
                        const conditionString = cardDef.allegianceEffect.condition.toString();
                        if (conditionString.includes("pos >= 1")) cardDef.allegianceEffect.description = "Lealdade >= +1";
                        else if (conditionString.includes("pos === 2")) cardDef.allegianceEffect.description = "Lealdade == +2";
                        else cardDef.allegianceEffect.description = "Condição Especial";
                    } else { cardDef.allegianceEffect.description = "Condição não definida"; }
                }
                deck.push({...cardDef, uniqueId: `${cardDef.id}-copy1-${Math.random().toString(16).slice(2)}`});
                deck.push({...cardDef, uniqueId: `${cardDef.id}-copy2-${Math.random().toString(16).slice(2)}`});
            });
            return deck;
        },
        shuffleDeck(deck) {
            for (let i = deck.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [deck[i], deck[j]] = [deck[j], deck[i]];
            }
        },

        drawCard(player, playSound = true) {
            if (player.deck.length === 0) {
                if (player.discard.length === 0) {
                    this.logMessage(`${player.name} não tem mais cartas para comprar!`);
                    return null;
                }
                player.deck = [...player.discard];
                player.discard = [];
                this.shuffleDeck(player.deck);
                this.logMessage(`${player.name} embaralhou o descarte para formar um novo deck.`);
            }
            const card = player.deck.pop();
            if (card) {
                 player.hand.push(card);
                 if (playSound && player.id === this.player.id) {
                    this.sounds.play('ganhar_carta');
                 }
            }
            return card;
        },
        addToDiscard(player, card) {
            const cleanCard = {...card};
            delete cleanCard.currentInfluence;
            delete cleanCard.assignedZone;
            player.discard.push(cleanCard);
        },

        playCard(playerId, cardUniqueId, targetZoneParam = null) {
            if (this.isGameOver) return false;
            const player = playerId === 'player' ? this.player : this.opponent;
            const cardIndex = player.hand.findIndex(c => c.uniqueId === cardUniqueId);
            if (cardIndex === -1) { this.logMessage("Carta não encontrada na mão."); return false; }
            const cardData = player.hand[cardIndex];

            // Guardar o ouro do jogador ANTES de pagar o custo, para a carta a005
            // const goldBeforePlayingCard = player.gold; // Não é mais estritamente necessário aqui com a lógica atual de a005

            if (cardData.cost.gold > player.gold || (cardData.cost.might && cardData.cost.might > player.might)) {
                this.logMessage(`${player.name} não pode pagar por ${cardData.name}.`); return false;
            }

            player.gold -= cardData.cost.gold;
            if (cardData.cost.might) player.might -= cardData.cost.might;

            this.logMessage(`${player.name} jogou ${cardData.name}.`);
            player.hand.splice(cardIndex, 1);
            this.sounds.play('colocar_carta');

            const currentAllegianceForPlayer = player.id === 'player' ? this.allegianceTrackPosition : -this.allegianceTrackPosition;
            if (cardData.onPlay) cardData.onPlay(player, this);

            if (cardData.type === "Ação") {
                if (cardData.effect) cardData.effect(player, this);
                this.addToDiscard(player, cardData);
            } else if (cardData.type === "Seguidor") {
                const actualZone = targetZoneParam || cardData.zone;
                if (!actualZone) {
                    this.logMessage(`Erro: Zona alvo não especificada para ${cardData.name}. Devolvendo carta.`);
                    player.hand.push(cardData); player.gold += cardData.cost.gold; if(cardData.cost.might) player.might += cardData.cost.might;
                    return false;
                }
                let currentInfluence = cardData.influence;
                if (cardData.allegianceEffect && cardData.allegianceEffect.bonusInfluence && cardData.allegianceEffect.condition(currentAllegianceForPlayer)) {
                    currentInfluence += cardData.allegianceEffect.bonusInfluence;
                    this.logMessage(`${cardData.name} recebeu +${cardData.allegianceEffect.bonusInfluence} Influência por Lealdade em ${actualZone}!`);
                }
                const playedCardInstance = {...cardData, currentInfluence: currentInfluence, assignedZone: actualZone };
                player.playedCards.push(playedCardInstance);
            }

            if (cardData.allegianceEffect && cardData.allegianceEffect.onPlayBonus && cardData.allegianceEffect.condition(currentAllegianceForPlayer)) {
                // A lógica original parecia ter onPlayBonus como algo distinto. Se for para executar após o efeito principal,
                // e não como parte do onPlay, essa é a posição.
                // Contudo, normalmente onPlayBonus de lealdade seria parte do cardData.onPlay ou chamado logo após.
                // Por ora, vou assumir que está ok se chamado aqui como um efeito adicional.
                 // cardData.allegianceEffect.onPlayBonus(player, this); // Se for um efeito SEPARADO de lealdade
            }
            if (cardData.allegianceEffect && cardData.allegianceEffect.drawCard && cardData.allegianceEffect.condition(currentAllegianceForPlayer)) {
                for(let i=0; i< cardData.allegianceEffect.drawCard; i++) this.drawCard(player);
                this.logMessage(`${player.name} comprou ${cardData.allegianceEffect.drawCard} carta(s) por Lealdade de ${cardData.name}!`);
            }

            this.recalculateAllPlayedCardInfluences();
            this.updateDOM();
            this.checkVictoryConditions();
            return true;
        },

        addZoneInfluence(playerId, zone, amount) {
            const targetPlayer = playerId === 'player' ? this.player : this.opponent;
            if (zone === 'crown') targetPlayer.crownInfluence = Math.max(0, targetPlayer.crownInfluence + amount);
            else if (targetPlayer.zoneInfluence.hasOwnProperty(zone)) targetPlayer.zoneInfluence[zone] = Math.max(0, targetPlayer.zoneInfluence[zone] + amount);
        },
        shiftAllegiance(amount) {
            this.allegianceTrackPosition = Math.max(-2, Math.min(2, this.allegianceTrackPosition + amount));
            this.logMessage(`Trilha da Lealdade movida para ${this.allegianceTrackPosition > 0 ? '+' : ''}${this.allegianceTrackPosition}.`);
            this.updateAllegianceMarker();
            this.recalculateAllPlayedCardInfluences();
            this.updateDOM();
        },
        recalculateAllPlayedCardInfluences() {
            [this.player, this.opponent].forEach(p => {
                p.zoneInfluence = { sword: 0, coin: 0, scroll: 0 };
                p.crownInfluence = 0;

                p.playedCards.forEach(card => {
                    if (card.type !== "Seguidor") return;
                    let currentInfluence = card.influence;
                    const currentAllegianceForPlayer = p.id === 'player' ? this.allegianceTrackPosition : -this.allegianceTrackPosition;
                    if (card.allegianceEffect && card.allegianceEffect.bonusInfluence && card.allegianceEffect.condition(currentAllegianceForPlayer)) {
                        currentInfluence += card.allegianceEffect.bonusInfluence;
                    }
                    card.currentInfluence = currentInfluence;
                    if (card.assignedZone === 'crown') p.crownInfluence += currentInfluence;
                    else if (p.zoneInfluence.hasOwnProperty(card.assignedZone)) p.zoneInfluence[card.assignedZone] += currentInfluence;
                });
            });
        },
        endTurn() {
            if (this.isGameOver) return;
            const currentPlayer = this.currentPlayerId === 'player' ? this.player : this.opponent;
            const nextPlayer = this.currentPlayerId === 'player' ? this.opponent : this.player;
            this.logMessage(`Fim do turno de ${currentPlayer.name}.`);
            this.recalculateAllPlayedCardInfluences();
            ['sword', 'coin', 'scroll'].forEach(zone => {
                let pInf = this.player.zoneInfluence[zone], oInf = this.opponent.zoneInfluence[zone];
                if (pInf > oInf) { if (zone === 'sword') this.player.might++; if (zone === 'coin') this.player.gold++; if (zone === 'scroll') this.drawCard(this.player); this.logMessage(`${this.player.name} controla ${zone}.`); }
                else if (oInf > pInf) { if (zone === 'sword') this.opponent.might++; if (zone === 'coin') this.opponent.gold++; if (zone === 'scroll') this.drawCard(this.opponent, false); this.logMessage(`${this.opponent.name} controla ${zone}.`); }
            });
            this.updateDOM();
            if(this.checkVictoryConditions()) return;
            if (this.allegianceTrackPosition === 2) {
                if (this.allegianceWinPendingPlayer === 'player' && currentPlayer.id === 'player') { this.announceWinner(this.player, "Lealdade Total Sustentada"); return; }
                this.allegianceWinPendingPlayer = 'player';
                this.logMessage(`${this.player.name} tem Apoio Total. Precisa manter.`);
            } else if (this.allegianceTrackPosition === -2) {
                if (this.allegianceWinPendingPlayer === 'opponent' && currentPlayer.id === 'opponent') { this.announceWinner(this.opponent, "Lealdade Total Sustentada"); return; }
                this.allegianceWinPendingPlayer = 'opponent';
                this.logMessage(`${this.opponent.name} tem Apoio Total. Precisa manter.`);
            } else { this.allegianceWinPendingPlayer = null; }
            this.currentPlayerId = nextPlayer.id;
            if (this.currentPlayerId === 'player') this.turn++;
            this.drawCard(nextPlayer);
            this.logMessage(`Turno ${this.turn}. Vez de ${nextPlayer.name}. Compra 1 carta.`);
            this.updateDOM();
            if (this.currentPlayerId === 'opponent' && !this.isGameOver) {
                document.getElementById('end-turn-button').disabled = true;
                setTimeout(() => this.opponentPlayTurn(), 1800 + Math.random() * 1000);
            } else if (!this.isGameOver) { document.getElementById('end-turn-button').disabled = false; }
        },
        checkVictoryConditions() {
            if (this.isGameOver) return true;
            if (this.player.crownInfluence >= this.maxCrownInfluence) { this.announceWinner(this.player, "Influência na Coroa"); return true; }
            if (this.opponent.crownInfluence >= this.maxCrownInfluence) { this.announceWinner(this.opponent, "Influência na Coroa"); return true; }
            return false;
        },

        opponentPlayTurn() {
            if (this.isGameOver) return;
            this.logMessage("Oponente está calculando sua jogada...");
            const playableCards = this.opponent.hand.filter(card =>
                card.cost.gold <= this.opponent.gold && (!card.cost.might || card.cost.might <= this.opponent.might)
            );

            if (playableCards.length === 0) {
                this.logMessage("Oponente não tem cartas jogáveis.");
                setTimeout(() => this.endTurn(), 1000); return;
            }

            // **Ajuste na IA: Checagem prioritária para a005 se ouro = 0**
            if (this.opponent.gold === 0) {
                const taxCard = playableCards.find(card => card.id === "a005");
                if (taxCard) {
                    this.logMessage(`Oponente está sem ouro e joga ${taxCard.name} como prioridade!`);
                    this.playCard('opponent', taxCard.uniqueId, null); // Ações não têm targetZone
                    this.updateDOM();
                    if (!this.isGameOver) setTimeout(() => this.endTurn(), 1000);
                    return; // Termina a função da IA aqui, pois já fez a jogada prioritária
                }
            }

            let bestPlay = { card: null, score: -Infinity, targetZone: null };

            playableCards.forEach(card => {
                let potentialTargetZones = [card.zone]; // Para ações, card.zone é undefined, então o loop de zona só roda uma vez.
                if (card.type === "Seguidor" && !card.zone) {
                    potentialTargetZones = ['sword', 'coin', 'scroll', 'crown'];
                }

                potentialTargetZones.forEach(zone => {
                    // Se é uma ação e estamos iterando zonas (o que não faz sentido para ações sem alvo de zona), pular.
                    // Mas como actions têm card.zone = undefined, este loop de zona só vai executar uma vez para elas.
                    if (card.type === "Ação" && zone && card.zone !== zone) { // Adicionado card.zone !== zone
                        //  Isso previne que uma ação que não tem card.zone seja avaliada múltiplas vezes com zonas aleatórias.
                        //  Para ações, zone será undefined na primeira (e única) iteração deste loop interno.
                        //  Se a ação tiver uma zona específica (raro, mas possível), ela será avaliada.
                        return;
                    }

                    let score = 0;
                    const currentAllegianceForOpponent = -this.allegianceTrackPosition;
                    let goldAfterCost = this.opponent.gold - card.cost.gold;

                    score -= card.cost.gold * 0.5; if (card.cost.might) score -= card.cost.might * 0.8;
                    if (card.type === "Seguidor") {
                        let inf = card.influence;
                        if (card.allegianceEffect && card.allegianceEffect.bonusInfluence && card.allegianceEffect.condition(currentAllegianceForOpponent)) inf += card.allegianceEffect.bonusInfluence;
                        if (zone === 'crown') score += inf * 2.5; else if (zone) score += inf * 1.5;
                        if (zone && this.opponent.zoneInfluence[zone] < this.player.zoneInfluence[zone]) score += inf * 0.5;
                        else if (zone && this.opponent.zoneInfluence[zone] > this.player.zoneInfluence[zone]) score += inf * 0.2;
                    }
                    if (card.allegianceEffect && card.allegianceEffect.condition(currentAllegianceForOpponent)) {
                        score += 2; if (card.allegianceEffect.drawCard) score += card.allegianceEffect.drawCard * 3;
                    }
                    if (card.onPlay) {
                        if (card.id==="m002") score += 2 * 0.8;
                        if (card.id==="c001") { if (this.allegianceTrackPosition > -2) score += 4; if (this.allegianceTrackPosition === 2) score += 6;}
                    }
                    if (card.allegianceEffect && card.allegianceEffect.onPlayBonus && card.allegianceEffect.condition(currentAllegianceForOpponent)) { if (card.id==="m002") score += 2 * 0.8; }
                    if (card.type === "Ação") {
                        if (card.id === "a001") score += 3 * 1.5;
                        if (card.id === "a002") {
                            const expectedReturn = (2+5)/2;
                            score += (expectedReturn - card.cost.gold) * 0.9;
                        }
                        if (card.id === "a005") {
                            let goldGain = (goldAfterCost === 0 && card.cost.gold === 0) ? 3 : 2; // Verifica se o ouro *seria* 0 após o custo 0
                            score += goldGain * 1.5; // Aumenta o peso de ganhar ouro com a005
                            if (goldAfterCost === 0 && card.cost.gold === 0) score += 10; // Grande bônus se estiver sem ouro
                        }
                        if (card.id === "a003") { if (this.allegianceTrackPosition > -2) score += 3; if (this.allegianceTrackPosition === 2) score += 5; if (currentAllegianceForOpponent >=1 && this.player.hand.length > 0) score += 3.5; }
                        if (card.id === "a004") score += 3 * 1.2;
                    }
                    if (zone === 'crown' && (this.opponent.crownInfluence + (card.influence || 0)) >= this.maxCrownInfluence) score += 1000;
                    if (card.id === "c001" && this.allegianceTrackPosition === -1 && this.allegianceWinPendingPlayer !== 'opponent') score += 500;
                    if (score > bestPlay.score) bestPlay = { card, score, targetZone: (card.type === "Ação" ? null : zone) }; // Ações não têm targetZone
                });
            });
            if (bestPlay.card) {
                this.logMessage(`Oponente escolheu jogar ${bestPlay.card.name}${bestPlay.targetZone ? ` na zona ${bestPlay.targetZone}` : ''}. (Score: ${bestPlay.score.toFixed(1)})`);
                this.playCard('opponent', bestPlay.card.uniqueId, bestPlay.targetZone);
            } else this.logMessage("Oponente não encontrou uma jogada vantajosa.");
            this.updateDOM();
            if (!this.isGameOver) setTimeout(() => this.endTurn(), 1000);
        },

        // --- Resto das funções (announceWinner, logMessage, updateDOM, updateAllegianceMarker, renderHands, renderPlayedCards, createCardElement) ---
        // Nenhuma alteração necessária nessas outras partes para este ajuste específico da IA.
        // Cole o resto do seu script.js aqui, da versão anterior.
        announceWinner(player, reason = "Condição de Vitória") {
            if (this.isGameOver) return;
            this.isGameOver = true;
            this.logMessage(`FIM DE JOGO! ${player.name} venceu por ${reason}!`, true);
            document.getElementById('end-turn-button').disabled = true;
            if (player.id === this.player.id) this.sounds.play('vitoria');
            else this.sounds.play('derrota');
            this.sounds.musica_fundo.pause();
        },

        logMessage(message, isVictory = false) {
            const messageEl = document.getElementById('game-message');
            messageEl.textContent = message;
            if(isVictory) { messageEl.style.color = 'green'; messageEl.style.fontWeight = 'bold'; }
            else { messageEl.style.color = '#c0392b'; messageEl.style.fontWeight = 'normal'; }
            console.log(message);
        },

        updateDOM() {
            document.getElementById('player-gold').textContent = this.player.gold;
            document.getElementById('player-might').textContent = this.player.might;
            document.getElementById('player-crown-influence-display').textContent = this.player.crownInfluence;
            document.getElementById('player-sword-influence').textContent = this.player.zoneInfluence.sword;
            document.getElementById('player-coin-influence').textContent = this.player.zoneInfluence.coin;
            document.getElementById('player-scroll-influence').textContent = this.player.zoneInfluence.scroll;
            document.getElementById('player-deck-count').textContent = this.player.deck.length;
            document.getElementById('player-discard-count').textContent = this.player.discard.length;
            document.getElementById('opponent-gold').textContent = this.opponent.gold;
            document.getElementById('opponent-might').textContent = this.opponent.might;
            document.getElementById('opponent-hand-count').textContent = this.opponent.hand.length;
            document.getElementById('opponent-crown-influence-display').textContent = this.opponent.crownInfluence;
            document.getElementById('opponent-sword-influence').textContent = this.opponent.zoneInfluence.sword;
            document.getElementById('opponent-coin-influence').textContent = this.opponent.zoneInfluence.coin;
            document.getElementById('opponent-scroll-influence').textContent = this.opponent.zoneInfluence.scroll;
            document.getElementById('turn-counter').textContent = this.turn;
            document.getElementById('current-player-turn').textContent = this.currentPlayerId === 'player' ? this.player.name : this.opponent.name;
            this.updateAllegianceMarker();
            this.renderHands();
            this.renderPlayedCards();
        },
        updateAllegianceMarker() {
            const marker = document.getElementById('allegiance-marker');
            const trackEl = document.getElementById('allegiance-track');
            if (!trackEl || !marker) return;
            const trackWidth = trackEl.offsetWidth;
            const markerWidth = marker.offsetWidth;
            const logicalPosition = this.allegianceTrackPosition + 2;
            const positionPercentage = logicalPosition / 4;
            let leftPosition = positionPercentage * (trackWidth - markerWidth);
            marker.style.left = `${leftPosition}px`;
            if (this.allegianceTrackPosition < 0) marker.style.backgroundColor = '#c0392b';
            else if (this.allegianceTrackPosition > 0) marker.style.backgroundColor = '#27ae60';
            else marker.style.backgroundColor = '#4a2c0a';
        },
        renderHands() {
            const playerHandEl = document.getElementById('player-hand');
            playerHandEl.innerHTML = '';
            this.player.hand.forEach(card => { playerHandEl.appendChild(this.createCardElement(card, 'player', false)); });
        },
        renderPlayedCards() {
            const playerPlayedEl = document.getElementById('player-played-cards');
            playerPlayedEl.innerHTML = '';
            this.player.playedCards.forEach(card => { playerPlayedEl.appendChild(this.createCardElement(card, 'player', true)); });
            const opponentPlayedEl = document.getElementById('opponent-played-cards');
            opponentPlayedEl.innerHTML = '';
            this.opponent.playedCards.forEach(card => { opponentPlayedEl.appendChild(this.createCardElement(card, 'opponent', true)); });
        },

        createCardElement(cardData, ownerId, isPlayedCard = false) {
            const cardEl = document.createElement('div');
            cardEl.classList.add('card');
            cardEl.dataset.cardId = cardData.uniqueId;
            cardEl.dataset.rawId = cardData.id;
            const imgPath = `cartas/${cardData.id}.png`;
            cardEl.innerHTML = `<img src="${imgPath}" alt="${cardData.name}" title="" onerror="this.parentElement.style.backgroundColor='#555'; this.style.display='none'; this.parentElement.innerHTML+='<span style="font-size:0.55em; color:white; text-align:center; display:block; padding: 40% 5px 0 5px; line-height:1.2;">Arte de ${cardData.name} não encontrada</span>'">`;

            const tooltip = document.getElementById('card-tooltip');

            if (ownerId === 'player' && !isPlayedCard && this.currentPlayerId === 'player' && !this.isGameOver) {
                cardEl.addEventListener('click', () => {
                    tooltip.style.display = 'none';
                    let chosenTargetZone = cardData.zone;
                    if (cardData.type === "Seguidor" && !cardData.zone) {
                        const zones = ['sword', 'coin', 'scroll', 'crown'];
                        let inputZone = prompt(`Em qual zona jogar ${cardData.name}? (${zones.join(', ')})`);
                        if (inputZone === null) { this.logMessage("Jogada cancelada."); return; }
                        inputZone = inputZone.toLowerCase().trim();
                        if (zones.includes(inputZone)) chosenTargetZone = inputZone;
                        else { this.logMessage("Zona inválida. Tente novamente."); return; }
                    }
                    this.playCard('player', cardData.uniqueId, chosenTargetZone);
                });
            }

            cardEl.addEventListener('mouseenter', (e) => {
                if ((ownerId === this.player.id && !isPlayedCard) || isPlayedCard) {
                     this.sounds.play('passar_carta');
                }
                const currentAllegianceForOwner = ownerId === 'player' ? this.allegianceTrackPosition : -this.allegianceTrackPosition;
                let allegianceStatusHTML = "";
                if (cardData.allegianceEffect && cardData.allegianceEffect.condition) {
                    const isActive = cardData.allegianceEffect.condition(currentAllegianceForOwner);
                    allegianceStatusHTML = `<span class="${isActive ? 'allegiance-active' : 'allegiance-inactive'}">(Lealdade: ${cardData.allegianceEffect.description || 'Condição'} - ${isActive ? 'ATIVA' : 'INATIVA'})</span>`;
                }
                let influenceDisplay = cardData.influence;
                if (isPlayedCard && typeof cardData.currentInfluence !== 'undefined') influenceDisplay = cardData.currentInfluence;
                let zoneText = "";
                if (cardData.type === 'Seguidor') {
                    const displayZone = isPlayedCard ? cardData.assignedZone : cardData.zone;
                    if (displayZone) zoneText = ` na Zona ${displayZone.charAt(0).toUpperCase() + displayZone.slice(1)}`;
                }
                let fullText = `<div class="card-name-tooltip">${cardData.name}</div>`;
                fullText += `<div class="card-type-tooltip">Tipo: ${cardData.type}</div>`;
                fullText += `<div class="card-cost-tooltip">Custo: ${cardData.cost.gold} Ouro${cardData.cost.might ? ` | ${cardData.cost.might} Poder` : ''}</div>`;
                if (cardData.type === 'Seguidor' && typeof influenceDisplay !== 'undefined') fullText += `<div class="card-influence-tooltip">Influência: ${influenceDisplay}${zoneText}</div>`;
                fullText += `<div class="card-text-tooltip">${cardData.text}</div>`;
                if (cardData.allegianceEffect) {
                    let allegianceDetails = "Efeito de Lealdade: ";
                    if(cardData.allegianceEffect.bonusInfluence) allegianceDetails += `+${cardData.allegianceEffect.bonusInfluence} Inf. `;
                    if(cardData.allegianceEffect.drawCard) allegianceDetails += `Compre ${cardData.allegianceEffect.drawCard} carta(s). `;
                    if(cardData.allegianceEffect.onPlayBonus) allegianceDetails += `Bônus ao jogar. `;
                    if(allegianceDetails === "Efeito de Lealdade: " && cardData.allegianceEffect.description) allegianceDetails = "";
                    fullText += `<div class="card-allegiance-tooltip">${allegianceDetails.trim()} ${allegianceStatusHTML}</div>`;
                }
                tooltip.innerHTML = fullText;
                tooltip.style.display = 'block';
                let x = e.clientX + 15, y = e.clientY + 15;
                if (x + tooltip.offsetWidth > window.innerWidth - 10) x = e.clientX - tooltip.offsetWidth - 15;
                if (x < 10) x = 10;
                if (y + tooltip.offsetHeight > window.innerHeight - 10) y = e.clientY - tooltip.offsetHeight - 15;
                if (y < 10) y = 10;
                tooltip.style.left = x + 'px';
                tooltip.style.top = y + 'px';
            });
            cardEl.addEventListener('mouseleave', () => { tooltip.style.display = 'none'; });
            return cardEl;
        }
    };

    document.getElementById('end-turn-button').addEventListener('click', () => game.endTurn());
    game.initialize();
    setTimeout(() => { game.updateAllegianceMarker(); }, 150);
    window.addEventListener('resize', () => game.updateAllegianceMarker());
});