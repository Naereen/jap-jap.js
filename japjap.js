
// Tell the library which element to use for the table
cards.init({ table: '#card-table' });

// Create a new deck of cards
deck = new cards.Deck();
// By default it's in the middle of the container, put it slightly to the side
deck.x -= 50;

// cards.all contains all cards, put them all in the deck
deck.addCards(cards.all);
// No animation here, just get the deck onto the table.
deck.render({ immediate: true });

// Now lets create hands for opponents and player
// We'll create up to 3 opponent hands, but only use what's needed based on player count
opponentHands = [
    new cards.Hand({ faceUp: false, y: 60 }),
    new cards.Hand({ faceUp: false, y: 60 }),
    new cards.Hand({ faceUp: false, y: 60 })
];

// Start with probability 1/numPlayers for who goes first
yourTurn = Math.random() <= 0.5;
lowerHand = new cards.Hand({ faceUp: true, y: 340 });

// Lets add a discard pile
discardPile = new cards.Deck({ faceUp: true });
discardPile.x += 50;

// Game state
var gameState = {
    playerScore: 0,
    opponentScores: [0, 0, 0], // Scores for up to 3 opponents
    selectedCards: [],
    lastDiscarded: [],
    gameStarted: false,
    roundInProgress: false,
    numPlayers: 2, // Default to 2 players (1 opponent)
    currentPlayerIndex: -1 // -1 = human player, 0-2 = opponents
};

// Compute the score of a hand (sum of rank of card)
function scoreOfHand(hand) {
    var score = 0;
    hand.forEach(card => {
        score += card.rank;
    });
    return score;
}

// Check if cards form a valid play (same rank or consecutive sequence of same suit)
function isValidPlay(cards) {
    if (cards.length === 0) return false;
    if (cards.length === 1) return true;
    
    // Check if all cards have the same rank
    var firstRank = cards[0].rank;
    var sameRank = cards.every(card => card.rank === firstRank);
    if (sameRank) return true;
    
    // Check if cards form a consecutive sequence of the same suit
    var firstSuit = cards[0].suit;
    var sameSuit = cards.every(card => card.suit === firstSuit);
    if (!sameSuit) return false;
    
    // Sort by rank and check if consecutive
    var sortedCards = cards.slice().sort((a, b) => a.rank - b.rank);
    for (var i = 1; i < sortedCards.length; i++) {
        if (sortedCards[i].rank !== sortedCards[i - 1].rank + 1) {
            return false;
        }
    }
    return true;
}

// Function to reshuffle discard pile into deck when deck is empty
function reshuffleDiscardPile() {
    if (deck.length === 0 && discardPile.length > 1) {
        // Keep the top card in discard pile
        var cardsToReshuffle = [];
        
        // Remove all cards except the top one
        while (discardPile.length > 1) {
            cardsToReshuffle.push(discardPile[discardPile.length - 2]);
            discardPile.splice(discardPile.length - 2, 1);
        }
        
        // Shuffle and add to deck
        cards.shuffle(cardsToReshuffle);
        deck.addCards(cardsToReshuffle);
        deck.render({ immediate: true });
        discardPile.render({ immediate: true });
        
        console.log("Reshuffled " + cardsToReshuffle.length + " cards from discard pile to deck");
    }
}

// Wait for some time
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

var defaultSleepBetweenOperations = 300;

// Update game status display
function updateStatus(message) {
    $('#status-message').text(message);
}

// Update score display
function updateScores() {
    var scoresText = 'You: ' + gameState.playerScore;
    for (var i = 0; i < gameState.numPlayers - 1; i++) {
        scoresText += ' | Opponent ' + (i + 1) + ': ' + gameState.opponentScores[i];
    }
    $('#scores-display').text(scoresText);
}

// Position opponent hands based on number of players
function positionOpponentHands() {
    var numOpponents = gameState.numPlayers - 1;
    
    if (numOpponents === 1) {
        // Single opponent at top center
        opponentHands[0].x = 0;
        opponentHands[0].y = 60;
    } else if (numOpponents === 2) {
        // Two opponents: left and right quadrants at top
        opponentHands[0].x = -200;
        opponentHands[0].y = 60;
        opponentHands[1].x = 200;
        opponentHands[1].y = 60;
    } else if (numOpponents === 3) {
        // Three opponents: left, center, right at top
        opponentHands[0].x = -240;
        opponentHands[0].y = 60;
        opponentHands[1].x = 0;
        opponentHands[1].y = 60;
        opponentHands[2].x = 240;
        opponentHands[2].y = 60;
    }
}

// Function "artificial intelligence" to let the opponent play
async function playOpponentTurn(opponentIndex) {
    console.log("playOpponentTurn for opponent " + (opponentIndex + 1));
    await sleep(defaultSleepBetweenOperations);
    
    var opponentHand = opponentHands[opponentIndex];
    
    // Simple AI: Try to play the lowest value card(s)
    if (opponentHand.length === 0) return;
    
    // Sort hand by rank
    var sortedHand = opponentHand.slice().sort((a, b) => a.rank - b.rank);
    
    // Try to find valid plays (pairs, triplets, or sequences)
    var cardsToPlay = [sortedHand[0]]; // Play at least the lowest card
    
    // Check for pairs/triplets/quadruplets of the same rank
    for (var i = 1; i < sortedHand.length; i++) {
        if (sortedHand[i].rank === sortedHand[0].rank) {
            cardsToPlay.push(sortedHand[i]);
        }
    }
    
    // If only one card, check for a sequence
    if (cardsToPlay.length === 1) {
        var sequences = [];
        // Group cards by suit
        var cardsBySuit = {};
        for (var i = 0; i < sortedHand.length; i++) {
            var suit = sortedHand[i].suit;
            if (!cardsBySuit[suit]) {
                cardsBySuit[suit] = [];
            }
            cardsBySuit[suit].push(sortedHand[i]);
        }
        
        // Find sequences within each suit
        for (var suit in cardsBySuit) {
            var suitCards = cardsBySuit[suit].sort((a, b) => a.rank - b.rank);
            for (var i = 0; i < suitCards.length; i++) {
                var sequence = [suitCards[i]];
                for (var j = i + 1; j < suitCards.length; j++) {
                    if (suitCards[j].rank === sequence[sequence.length - 1].rank + 1) {
                        sequence.push(suitCards[j]);
                    } else {
                        break;
                    }
                }
                if (sequence.length > 1) {
                    sequences.push(sequence);
                }
            }
        }
        
        // Use the longest sequence found
        if (sequences.length > 0) {
            cardsToPlay = sequences.sort((a, b) => b.length - a.length)[0];
        }
    }
    
    // Play the selected cards
    gameState.lastDiscarded = [];
    for (var i = 0; i < cardsToPlay.length; i++) {
        var card = cardsToPlay[i];
        opponentHand.removeCard(card);
        discardPile.addCard(card);
        gameState.lastDiscarded.push(card);
    }
    opponentHand.render();
    discardPile.render();
    await sleep(defaultSleepBetweenOperations);
    
    // Pick a new card from the deck
    if (deck.length === 0) {
        reshuffleDiscardPile();
    }
    if (deck.length > 0) {
        opponentHand.addCard(deck.topCard());
        opponentHand.render();
    }
    await sleep(defaultSleepBetweenOperations);
    
    // Check if opponent should call "Jap Jap!"
    var opponentScore = scoreOfHand(opponentHand);
    console.log("Opponent " + (opponentIndex + 1) + " hand value:", opponentScore);
    if (opponentScore <= 5) {
        await sleep(defaultSleepBetweenOperations);
        updateStatus("Opponent " + (opponentIndex + 1) + " calls JAP JAP! Score: " + opponentScore);
        await endRound(false, opponentIndex); // Opponent wins
        return true; // Round ended
    }
    return false; // Round continues
}

// End the round and calculate scores
async function endRound(playerWins, winningOpponentIndex) {
    gameState.roundInProgress = false;
    
    var playerHandScore = scoreOfHand(lowerHand);
    
    if (playerWins) {
        // All opponents gain their hand value
        for (var i = 0; i < gameState.numPlayers - 1; i++) {
            var opponentHandScore = scoreOfHand(opponentHands[i]);
            gameState.opponentScores[i] += opponentHandScore;
        }
        updateStatus("You win this round!");
    } else {
        // Player and other opponents gain their hand values
        gameState.playerScore += playerHandScore;
        for (var i = 0; i < gameState.numPlayers - 1; i++) {
            if (i !== winningOpponentIndex) {
                var opponentHandScore = scoreOfHand(opponentHands[i]);
                gameState.opponentScores[i] += opponentHandScore;
            }
        }
        updateStatus("Opponent " + (winningOpponentIndex + 1) + " wins!");
    }
    
    updateScores();
    
    // Force discard current hands immediately when Jap Jap is realized
    while (lowerHand.length > 0) {
        var card = lowerHand.pop();
        discardPile.addCard(card);
    }
    for (var i = 0; i < gameState.numPlayers - 1; i++) {
        while (opponentHands[i].length > 0) {
            var card = opponentHands[i].pop();
            discardPile.addCard(card);
        }
    }
    lowerHand.render({ immediate: true });
    for (var i = 0; i < gameState.numPlayers - 1; i++) {
        opponentHands[i].render({ immediate: true });
    }
    discardPile.render({ immediate: true });
    
    await sleep(2000);
    
    // Check if game is over (someone reached 90 points)
    var gameOver = false;
    if (gameState.playerScore >= 90) {
        updateStatus("GAME OVER! You lose the game!");
        gameOver = true;
    } else {
        for (var i = 0; i < gameState.numPlayers - 1; i++) {
            if (gameState.opponentScores[i] >= 90) {
                updateStatus("GAME OVER! Opponent " + (i + 1) + " loses, you win!");
                gameOver = true;
                break;
            }
        }
    }
    
    if (gameOver) {
        $('#deal').text('NEW GAME').show();
        gameState.gameStarted = false;
    } else {
        // Start a new round
        updateStatus("Starting new round...");
        await sleep(1000);
        startNewRound();
    }
}

// Start a new round
async function startNewRound() {
    // Clear hands
    while (lowerHand.length > 0) {
        lowerHand.pop();
    }
    for (var i = 0; i < gameState.numPlayers - 1; i++) {
        while (opponentHands[i].length > 0) {
            opponentHands[i].pop();
        }
    }
    
    // Render the empty hands to remove cards from display
    lowerHand.render({ immediate: true });
    for (var i = 0; i < gameState.numPlayers - 1; i++) {
        opponentHands[i].render({ immediate: true });
    }
    
    // Check if we have enough cards to deal, reshuffle discard pile if needed
    var cardsNeeded = 5 * gameState.numPlayers + 1; // 5 per player + 1 for discard
    if (deck.length < cardsNeeded) {
        var cardsToReshuffle = [];
        // Keep the top card in discard pile if we want to, or reshuffle all
        // If we need all cards, reshuffle everything
        var keepTopCard = discardPile.length > 1 && deck.length + discardPile.length - 1 >= cardsNeeded;
        
        if (keepTopCard) {
            // Keep the top card in discard pile, reshuffle the rest
            while (discardPile.length > 1) {
                cardsToReshuffle.push(discardPile[discardPile.length - 2]);
                discardPile.splice(discardPile.length - 2, 1);
            }
        } else {
            // Need to reshuffle all cards including top card
            while (discardPile.length > 0) {
                cardsToReshuffle.push(discardPile.topCard());
                discardPile.splice(discardPile.length - 1, 1);
            }
        }
        
        if (cardsToReshuffle.length > 0) {
            cards.shuffle(cardsToReshuffle);
            deck.addCards(cardsToReshuffle);
            deck.render({ immediate: true });
            discardPile.render({ immediate: true });
        }
    }
    
    gameState.selectedCards = [];
    gameState.lastDiscarded = [];
    gameState.roundInProgress = true;
    
    // Position opponent hands based on player count
    positionOpponentHands();
    
    // Create array of all hands for dealing
    var allHands = [lowerHand];
    for (var i = 0; i < gameState.numPlayers - 1; i++) {
        allHands.push(opponentHands[i]);
    }
    
    // Deal cards
    deck.deal(5, allHands, 100, function () {
        if (discardPile.length === 0 && deck.length > 0) {
            discardPile.addCard(deck.topCard());
        }
        discardPile.render();
        lowerHand = lowerHand.sort();
        lowerHand.render();
        updateStatus("Your turn! Select cards to play or pick from deck/discard.");
    });
    
    // Randomly decide who starts (player is -1, opponents are 0, 1, 2)
    var randomStart = Math.floor(Math.random() * gameState.numPlayers);
    if (randomStart === 0) {
        gameState.currentPlayerIndex = -1; // Player starts
    } else {
        gameState.currentPlayerIndex = randomStart - 1; // Opponent starts
    }
    
    if (gameState.currentPlayerIndex >= 0) {
        // An opponent starts
        await sleep(1000);
        await playAllOpponentTurnsUntilPlayer();
    } else {
        updateStatus("Your turn! Select cards to play.");
    }
}

// Play all opponent turns until it's the player's turn
async function playAllOpponentTurnsUntilPlayer() {
    while (gameState.currentPlayerIndex >= 0 && gameState.roundInProgress) {
        updateStatus("Opponent " + (gameState.currentPlayerIndex + 1) + "'s turn...");
        var roundEnded = await playOpponentTurn(gameState.currentPlayerIndex);
        if (roundEnded) return;
        
        // Move to next player (cycle through all players)
        gameState.currentPlayerIndex++;
        if (gameState.currentPlayerIndex >= gameState.numPlayers - 1) {
            // Back to player
            gameState.currentPlayerIndex = -1;
        }
    }
    if (gameState.roundInProgress) {
        updateStatus("Your turn! Select cards to play.");
    }
}

// Start of the game: opponents play if needed
async function firstTurnOfOpponentIfNeeded() {
    if (gameState.currentPlayerIndex >= 0) {
        await playAllOpponentTurnsUntilPlayer();
    } else {
        updateStatus("Your turn! Select cards to play.");
    }
}

// Let's deal when the Deal button is pressed:
$('#deal').click(function () {
    // Get selected player count
    gameState.numPlayers = parseInt($('#player-count').val());
    
    // Reset game if starting new game
    if (!gameState.gameStarted) {
        gameState.playerScore = 0;
        gameState.opponentScores = [0, 0, 0];
        updateScores();
        $('#deal').text('DEAL');
    }
    
    gameState.gameStarted = true;
    gameState.roundInProgress = true;
    gameState.selectedCards = [];
    gameState.lastDiscarded = [];
    
    // Position opponent hands based on player count
    positionOpponentHands();
    
    // Create array of all hands for dealing
    var allHands = [lowerHand];
    for (var i = 0; i < gameState.numPlayers - 1; i++) {
        allHands.push(opponentHands[i]);
    }
    
    // Check if we have enough cards to deal, reshuffle discard pile if needed
    var cardsNeeded = 5 * gameState.numPlayers + 1; // 5 per player + 1 for discard
    if (deck.length < cardsNeeded && discardPile.length > 0) {
        var cardsToReshuffle = [];
        // Reshuffle all cards from discard pile
        while (discardPile.length > 0) {
            cardsToReshuffle.push(discardPile.topCard());
            discardPile.splice(discardPile.length - 1, 1);
        }
        if (cardsToReshuffle.length > 0) {
            cards.shuffle(cardsToReshuffle);
            deck.addCards(cardsToReshuffle);
            deck.render({ immediate: true });
        }
    }
    
    // Deck has a built in method to deal to hands.
    $('#deal').hide();
    deck.deal(5, allHands, 100, function () {
        // This is a callback function, called when the dealing is done.
        if (deck.length > 0) {
            discardPile.addCard(deck.topCard());
            discardPile.render();
        }
        lowerHand = lowerHand.sort();
        lowerHand.render();
    });
    
    // Randomly decide who starts (player is -1, opponents are 0, 1, 2)
    var randomStart = Math.floor(Math.random() * gameState.numPlayers);
    if (randomStart === 0) {
        gameState.currentPlayerIndex = -1; // Player starts
    } else {
        gameState.currentPlayerIndex = randomStart - 1; // Opponent starts
    }
    
    firstTurnOfOpponentIfNeeded();
});


// When you click on the top card of a deck, a card is added to your hand
deck.click(function (card) {
    if (gameState.currentPlayerIndex !== -1 || !gameState.roundInProgress) return;
    
    if (card === deck.topCard() && gameState.selectedCards.length > 0) {
        // Play selected cards, then pick from deck
        if (!isValidPlay(gameState.selectedCards)) {
            updateStatus("Invalid play! Cards must be same rank or consecutive sequence of same suit.");
            return;
        }
        
        // Discard selected cards
        gameState.lastDiscarded = [];
        for (var i = 0; i < gameState.selectedCards.length; i++) {
            var cardToDiscard = gameState.selectedCards[i];
            lowerHand.removeCard(cardToDiscard);
            discardPile.addCard(cardToDiscard);
            gameState.lastDiscarded.push(cardToDiscard);
        }
        gameState.selectedCards = [];
        lowerHand.render();
        discardPile.render();
        
        // Pick from deck
        if (deck.length === 0) {
            reshuffleDiscardPile();
        }
        if (deck.length > 0) {
            lowerHand.addCard(deck.topCard());
            lowerHand = lowerHand.sort();
            lowerHand.render();
        }
        
        // Check player score
        var playerScore = scoreOfHand(lowerHand);
        console.log("Your hand value:", playerScore);
        
        // Move to next player (first opponent)
        gameState.currentPlayerIndex = 0;
        
        // Play opponent's turns
        setTimeout(async function() {
            await playAllOpponentTurnsUntilPlayer();
        }, 500);
    }
});

// When you click on the discard pile, pick a card from the discard pile
discardPile.click(function (card) {
    if (gameState.currentPlayerIndex !== -1 || !gameState.roundInProgress) return;
    
    if (gameState.selectedCards.length > 0) {
        // Play selected cards, then pick from discard
        if (!isValidPlay(gameState.selectedCards)) {
            updateStatus("Invalid play! Cards must be same rank or consecutive sequence of same suit.");
            return;
        }
        
        // Check if discard pile has cards available
        if (discardPile.length === 0) {
            updateStatus("No cards available in discard pile!");
            return;
        }
        
        // Save the top card before discarding
        var cardToPickFromDiscard = discardPile.topCard();
        
        // Discard selected cards
        var newLastDiscarded = [];
        for (var i = 0; i < gameState.selectedCards.length; i++) {
            var cardToDiscard = gameState.selectedCards[i];
            lowerHand.removeCard(cardToDiscard);
            discardPile.addCard(cardToDiscard);
            newLastDiscarded.push(cardToDiscard);
        }
        gameState.selectedCards = [];
        lowerHand.render();
        discardPile.render();
        
        // Pick from discard pile (the card we saved earlier)
        lowerHand.addCard(cardToPickFromDiscard);
        lowerHand = lowerHand.sort();
        lowerHand.render();
        
        gameState.lastDiscarded = newLastDiscarded;
        
        // Check player score
        var playerScore = scoreOfHand(lowerHand);
        console.log("Your hand value:", playerScore);
        
        // Move to next player (first opponent)
        gameState.currentPlayerIndex = 0;
        
        // Play opponent's turns
        setTimeout(async function() {
            await playAllOpponentTurnsUntilPlayer();
        }, 500);
    }
});

// When you click a card in your hand, select/deselect it for playing
lowerHand.click(async function (card) {
    if (gameState.currentPlayerIndex !== -1 || !gameState.roundInProgress) return;
    
    // Toggle card selection
    var index = gameState.selectedCards.indexOf(card);
    if (index > -1) {
        // Deselect card
        gameState.selectedCards.splice(index, 1);
        $(card.el).css('top', '+=20'); // Move card down
    } else {
        // Select card
        gameState.selectedCards.push(card);
        $(card.el).css('top', '-=20'); // Move card up to show selection
    }
    
    // Update status with current selection
    if (gameState.selectedCards.length > 0) {
        var cardNames = gameState.selectedCards.map(c => c.toString()).join(', ');
        updateStatus("Selected: " + cardNames + ". Click deck or discard to play.");
    } else {
        updateStatus("Your turn! Select cards to play.");
    }
});

// Add Jap Jap button functionality
$('#japjap-button').click(async function() {
    if (gameState.currentPlayerIndex !== -1 || !gameState.roundInProgress) return;
    
    var playerScore = scoreOfHand(lowerHand);
    if (playerScore <= 5) {
        updateStatus("You call JAP JAP! Score: " + playerScore);
        await endRound(true, -1); // Player wins
    } else {
        updateStatus("Cannot call Jap Jap! Your score (" + playerScore + ") is greater than 5.");
    }
});


// So, that should give you some idea about how to render a card game.
// Now you just need to write some logic around who can play when etc...
// Good luck :)
