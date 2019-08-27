
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

// Now lets create a couple of hands, one face down, one face up.
upperHand = new cards.Hand({ faceUp: false, y: 60 });
// Start with probability 1/2
yourTurn = Math.random() <= 0.5;
lowerHand = new cards.Hand({ faceUp: true, y: 340 });

// Lets add a discard pile
discardPile = new cards.Deck({ faceUp: true });
discardPile.x += 50;

// Compute the score of a hand (sum of rank of card)
function scoreOfHand(hand) {
    var score = 0;
    hand.forEach(card => {
        score += card.rank;
    });
    return score;
}

// Wait for some time
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

var defaultSleepBetweenOperations = 300;

// Function "artificial intelligence" to let the opponent play
async function playOpponentTurn() {
    console.log("playOpponentTurn");
    await sleep(defaultSleepBetweenOperations);
    // plays first card
    // FIXME do something smart!
    var playedCard = upperHand.topCard();
    upperHand.render();
    await sleep(defaultSleepBetweenOperations);
    // throw it
    discardPile.addCard(playedCard);
    discardPile.render();
    await sleep(defaultSleepBetweenOperations);
    // pick new one
    upperHand.addCard(deck.topCard());
    upperHand.render();
    await sleep(defaultSleepBetweenOperations);
}

// Start of the game: the opponent plays ONCE if you don't start
async function firstTurnOfOpponentIfNeeded() {
    if (!yourTurn) {
        await playOpponentTurn();
        yourTurn = !yourTurn;
    }
}

// Let's deal when the Deal button is pressed:
$('#deal').click(function () {
    // Deck has a built in method to deal to hands.
    $('#deal').hide();
    deck.deal(5, [upperHand, lowerHand], 100, function () {
        // This is a callback function, called when the dealing
        // is done.
        discardPile.addCard(deck.topCard());
        discardPile.render();
        lowerHand = lowerHand.sort();
        lowerHand.render();
    });
    firstTurnOfOpponentIfNeeded();
});


// When you click on the top card of a deck, a card is added
// to your hand
deck.click(function (card) {
    // FIXME implement the game's logic!
    if (card === deck.topCard()) {
        lowerHand.addCard(deck.topCard());
        lowerHand.render();
    }
});

// When you click on the top card of the discard, a card is added
// to your hand
discardPile.click(function (card) {
    // FIXME implement the game's logic!
    if (card === discardPile.topCard()) {
        lowerHand.addCard(discardPile.topCard());
        lowerHand.render();
    }
});

// Finally, when you click a card in your hand, if it's
// the same suit or rank as the top card of the discard pile
// then it's added to it
lowerHand.click(async function (card) {
    if (yourTurn) {
        // It's your turn, you can play
        // if (discardPile.topCard() === undefined
        //     // FIXME implement the game's logic!
        //     || card.suit == discardPile.topCard().suit
        //     || card.rank == discardPile.topCard().rank
        // ) {
            discardPile.addCard(card);
            discardPile.render();
            lowerHand.addCard(deck.topCard());
            lowerHand = lowerHand.sort();
            lowerHand.render();
            // pick new one
            console.log("Value of current hand: ", scoreOfHand(lowerHand));
            // Go to the opponent's turn
            yourTurn = false;
            // Play the opponent's turn
            await playOpponentTurn();
            // Go to your turn
            yourTurn = true;
        // }
    }
});


// So, that should give you some idea about how to render a card game.
// Now you just need to write some logic around who can play when etc...
// Good luck :)
