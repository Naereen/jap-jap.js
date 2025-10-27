
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
    currentPlayerIndex: -1, // -1 = human player, 0-2 = opponents
    hasPlayedInRound: false // Track if any cards have been played in current round
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

var defaultSleepBetweenOperations = 400;
var opponentHandRevealDuration = 2000; // Duration to show opponent's hand when they call Jap-Jap

// Helper function to reset opponent hands to face down
function resetOpponentHandVisibility() {
    for (var i = 0; i < gameState.numPlayers - 1; i++) {
        opponentHands[i].faceUp = false;
    }
}

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
const opponentHandsDefaultxPosition = opponentHands[0].x;
function positionOpponentHands() {
    var numOpponents = gameState.numPlayers - 1;
    
    if (numOpponents === 1) {
        // Single opponent at top center
        opponentHands[0].x = opponentHandsDefaultxPosition;
        opponentHands[0].y = 60;
    } else if (numOpponents === 2) {
        // Two opponents: left and right quadrants at top
        opponentHands[0].x = opponentHandsDefaultxPosition - 200;
        opponentHands[0].y = 60;
        opponentHands[1].x = opponentHandsDefaultxPosition + 200;
        opponentHands[1].y = 60;
    } else if (numOpponents === 3) {
        // Three opponents: left, center, right at top
        opponentHands[0].x = opponentHandsDefaultxPosition - 240;
        opponentHands[0].y = 60;
        opponentHands[1].x = opponentHandsDefaultxPosition;
        opponentHands[1].y = 60;
        opponentHands[2].x = opponentHandsDefaultxPosition + 240;
        opponentHands[2].y = 60;
    }
}

// AI Helper: Find all possible plays from a hand
function findAllPossiblePlays(hand) {
    var plays = [];
    
    // Find all pairs, triplets, and quadruplets
    var rankGroups = {};
    for (var i = 0; i < hand.length; i++) {
        var rank = hand[i].rank;
        if (!rankGroups[rank]) {
            rankGroups[rank] = [];
        }
        rankGroups[rank].push(hand[i]);
    }
    
    for (var rank in rankGroups) {
        var cards = rankGroups[rank];
        if (cards.length >= 2) {
            // Add all combinations of 2 or more cards of the same rank
            for (var size = 2; size <= cards.length; size++) {
                plays.push(cards.slice(0, size));
            }
        }
    }
    
    // Find all sequences
    var cardsBySuit = {};
    for (var i = 0; i < hand.length; i++) {
        var suit = hand[i].suit;
        if (!cardsBySuit[suit]) {
            cardsBySuit[suit] = [];
        }
        cardsBySuit[suit].push(hand[i]);
    }
    
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
            // Only add sequences of 2 or more cards (add once per starting position)
            if (sequence.length >= 2) {
                plays.push(sequence);
            }
        }
    }
    
    // Add single card plays
    for (var i = 0; i < hand.length; i++) {
        plays.push([hand[i]]);
    }
    
    return plays;
}

// AI Helper: Evaluate the value of a play (higher is better to discard)
function evaluatePlay(play, remainingHand) {
    var playValue = 0;
    
    // Sum up the ranks of cards being discarded (prioritize high-value cards)
    for (var i = 0; i < play.length; i++) {
        playValue += play[i].rank;
    }
    
    // Bonus for playing multiple cards at once (more efficient)
    if (play.length > 1) {
        playValue += play.length * 2;
    }
    
    // Check if remaining hand has potential for good plays
    var remainingPlays = findAllPossiblePlays(remainingHand);
    var hasGoodRemainingPlay = remainingPlays.some(p => p.length > 1);
    if (hasGoodRemainingPlay) {
        playValue += 3; // Bonus if we leave ourselves with good options
    }
    
    return playValue;
}

// AI Helper: Decide whether to pick from discard pile or deck
function shouldPickFromDiscard(hand, discardTopCard) {
    if (!discardTopCard || discardPile.length === 0) {
        return false;
    }
    
    // Check if the discard card helps complete a pair/triplet
    var matchingRank = hand.filter(c => c.rank === discardTopCard.rank).length;
    if (matchingRank >= 1) {
        // Taking it would create/extend a pair
        return true;
    }
    
    // Check if the discard card extends a sequence
    var sameSuitCards = hand.filter(c => c.suit === discardTopCard.suit);
    for (var i = 0; i < sameSuitCards.length; i++) {
        var card = sameSuitCards[i];
        if (Math.abs(card.rank - discardTopCard.rank) === 1) {
            // Adjacent rank in same suit - could form/extend sequence
            return true;
        }
    }
    
    // Check if discard card is low value (Ace through 4) and we have high cards
    if (discardTopCard.rank <= 4) {
        var avgHandValue = scoreOfHand(hand) / hand.length;
        if (avgHandValue > 7) {
            // Our hand has high average, low card is valuable
            return true;
        }
    }
    
    return false;
}

// Function "artificial intelligence" to let the opponent play
async function playOpponentTurn(opponentIndex) {
    console.log("playOpponentTurn for opponent " + (opponentIndex + 1));
    await sleep(defaultSleepBetweenOperations);
    
    var opponentHand = opponentHands[opponentIndex];
    
    // Improved AI: Strategic play selection
    if (opponentHand.length === 0) return;
    
    // Check if opponent should call "Jap Jap!" at the BEGINNING of their turn
    // But only if at least one card has been played in this round
    var opponentScore = scoreOfHand(opponentHand);
    console.log("Opponent " + (opponentIndex + 1) + " hand value:", opponentScore);
    if (opponentScore <= 5 && gameState.hasPlayedInRound) {
        // Show opponent's hand face up before announcing
        opponentHand.faceUp = true;
        opponentHand.render();
        await sleep(opponentHandRevealDuration); // Pause to show the hand
        updateStatus("Opponent " + (opponentIndex + 1) + " calls JAP JAP! Score: " + opponentScore);
        await endRound(false, opponentIndex); // Opponent wins
        return true; // Round ended
    }
    
    // Find all possible plays
    var allPlays = findAllPossiblePlays(opponentHand);
    
    // Evaluate each play and choose the best one
    var bestPlay = null;
    var bestScore = -1;
    
    for (var i = 0; i < allPlays.length; i++) {
        var play = allPlays[i];
        // Use a Set for O(1) lookup instead of includes() for O(n) lookup
        var playSet = new Set(play);
        var remainingCards = opponentHand.filter(function(c) { return !playSet.has(c); });
        var score = evaluatePlay(play, remainingCards);
        
        if (score > bestScore) {
            bestScore = score;
            bestPlay = play;
        }
    }
    
    // Use best play (or single lowest card as fallback)
    var cardsToPlay = bestPlay || [opponentHand.slice().sort((a, b) => a.rank - b.rank)[0]];
    
    // Play the selected cards
    gameState.lastDiscarded = [];
    gameState.hasPlayedInRound = true; // Mark that cards have been played in this round
    for (var i = 0; i < cardsToPlay.length; i++) {
        var card = cardsToPlay[i];
        opponentHand.removeCard(card);
        discardPile.addCard(card);
        gameState.lastDiscarded.push(card);
    }
    opponentHand.render();
    discardPile.render();
    await sleep(defaultSleepBetweenOperations);
    
    // Decide whether to pick from discard or deck
    var pickFromDiscard = false;
    if (discardPile.length > 0) {
        var topCard = discardPile.topCard();
        pickFromDiscard = shouldPickFromDiscard(opponentHand, topCard);
    }
    
    if (pickFromDiscard && discardPile.length > 0) {
        // Pick from discard pile
        var cardFromDiscard = discardPile.topCard();
        opponentHand.addCard(cardFromDiscard);
        console.log("Opponent " + (opponentIndex + 1) + " picks from discard: " + cardFromDiscard.toString());
    } else {
        // Pick from deck
        if (deck.length === 0) {
            reshuffleDiscardPile();
        }
        if (deck.length > 0) {
            opponentHand.addCard(deck.topCard());
        }
    }
    opponentHand.render();
    await sleep(defaultSleepBetweenOperations);
    
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
    
    // Reset opponent hands to face down
    resetOpponentHandVisibility();
    
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
    gameState.hasPlayedInRound = false; // Reset for new round
    
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
    gameState.hasPlayedInRound = false; // Reset for new round
    
    // Position opponent hands based on player count
    positionOpponentHands();
    
    // Reset opponent hands to face down
    resetOpponentHandVisibility();
    
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
        gameState.hasPlayedInRound = true; // Mark that cards have been played in this round
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
        gameState.hasPlayedInRound = true; // Mark that cards have been played in this round
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
    if (playerScore <= 5 && gameState.hasPlayedInRound) {
        updateStatus("You call JAP JAP! Score: " + playerScore);
        await endRound(true, -1); // Player wins
    } else if (playerScore <= 5 && !gameState.hasPlayedInRound) {
        updateStatus("Cannot call Jap Jap yet! You must play at least one turn first.");
    } else {
        updateStatus("Cannot call Jap Jap! Your score (" + playerScore + ") is greater than 5.");
    }
});


// So, that should give you some idea about how to render a card game.
// Now you just need to write some logic around who can play when etc...
// Good luck :)
