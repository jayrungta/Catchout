//Cards: from 1-13, where 1: Ace, 11: Jack, 12: Queen, 13: King
//Symbols: hearts, dimonds, clubs, spades -> h, d, c, s
//Therefore 1S is the Ace of Spades, 11H is the Jack of Hearts, 7C is the Seven of Clubs --> remember: http://youtu.be/1iwC2QljLn4
var Utils = require("./utils.js");
var utils = new Utils();
var fs = require('fs');
function Game() {
  this.pack = this.newpack();
  this.problem = this.giveProblem();
}

Game.prototype.giveProblem = function() {
  var n;
  //var data = fs.readFileSync("resources/problems.txt", 'utf8');
  fs.readFile("resources/problems.txt", 'utf8', function read(err, data) {
    if (err) {
        throw err;
    }
     var lines = data.split("\n");
  var prev=[];
  n = lines.length; //total no of problems
  /*  console.log ("HEY BRO    "+lines);
    console.log ("HEY BRO 2.0   "+n);*/
  while(true)
  {
      var newprob=lines[Math.floor(Math.random()*lines.length)];

    if (!(prev.indexOf(newprob) > -1))
    {
      prev.push(newprob);
      break;
    }
  }
   return newprob;
});
}

Game.prototype.newpack = function() {
  var totalcards=60;
  var n=60;
  var pack = [];
  var packCount= 0;
  
      //picking random n cards out of totalcards

      //first card
      pack[0]=Math.floor((Math.random() * ((totalcards - 1) + 1)) + 1);
      packCount++;

      //rest of the cards
        while(packCount!=n)
        {
        var temp=Math.floor((Math.random() * ((totalcards - 1) + 1)) + 1);
        if (!(pack.indexOf(temp) > -1))
        pack[packCount++] = temp;
        }
      
    //  console.log("HEY HERE"+pack);

  return pack;
}

//draw one card from the pack of cards, initial T|F appends cards in hand
  Game.prototype.drawCard = function(pack, amount, hand, initial) {
    var cards = [];
    console.log("Cutting deck by "+amount);
    cards = pack.slice(0, amount);
    pack.splice(0, amount);
    if (!initial) {
      hand.push.apply(hand, cards); 
    }
    return cards;
  }

  //draw one card from the discarded cards, initial T|F appends cards in hand
  Game.prototype.drawDiscardedCard = function(pack, amount, hand, initial) {
    console.log(pack.length);
    var cards = pack.pop();
    if (!initial) {
      hand.push.call(hand, cards); 
    }
    return cards;
  }

//plays a card with specific index, from specific hand, and places the card on the table
Game.prototype.playCard = function(index, hand, table, explanations) {
  var playedCard = hand.splice(index, 1); //we can only play one card at a time at the moment
  var rejectedExplanation = explanations.splice(index, 1); 
  table.push.apply(table, playedCard);
}

//at the start of the game, we put one card to the table from the pack (top card of the deck)
Game.prototype.playFirstCardToTable = function(pack) {
  return  pack.splice(0,1);
}
//not yet tested but - it should return all the cards on the table - so we can reshuffle it and use it as a new pack
Game.prototype.cardsOnTable = function(table, card) {
  if (card) {
    return table.concat(card);
  } else {
    return table;
  }
}
//returns the last card on the table
Game.prototype.lastCardOnTable = function(table) {
  return utils.last(table);
}

Game.prototype.isCardPlayable = function(card, lastCardOnTable) {
  if (card) {
    var cardNumber = parseInt(card);
  //  var cardSuite = card[card.length-1];
    var lastCardNumber = parseInt(lastCardOnTable);
   // var lastCardSuite = lastCardOnTable[lastCardOnTable.length-1];
    if (cardNumber === lastCardNumber ) {
      return true;
    } else {
      return false;
    }
  }
}

Game.prototype.isPenalisingActionCardPlayable = function(card, lastCardOnTable) {
  if (card) {
    var cardNumber = parseInt(card);
    var lastCardNumber = parseInt(lastCardOnTable);
    if (cardNumber === 2 && lastCardNumber === 2) {
        return true;
    } else {
      return false;
    } 
  }
}

Game.prototype.isRequestActionCardPlayable = function(card, lastCardOnTable) {
  if (card) {
    var cardNumber = parseInt(card);
    var lastCardNumber = parseInt(lastCardOnTable);
    if (cardNumber === 1  && lastCardNumber === 1) {
        return true;
    } else if (cardNumber === 13 && lastCardNumber === 13) {
      return true;
    } else {
      return false;
    }
  }
}

/* checking if card is an action card */
Game.prototype.isActionCard = function(card, penalising) {
  penalising = (typeof penalising === "undefined") ? false : penalising;
  if (card && !penalising) {
    var cardNumber = parseInt(card);
    console.log(cardNumber);
    if (cardNumber in utils.has(["1", "2", "13"])) {
      return true;
    } else {
      return false;
    }
  }
  if (card && penalising) {
    var cardNumber = parseInt(card);
    if (cardNumber === 2) {
      return true;
    } else {
      return false;
    }
  }
}

Game.prototype.isInHand = function(card, hand) { //checks whether there's a card in our hand, forced draw
  if (card) {
    cardNumber = parseInt(card);
    //parse numbers in hand
    var numbersInHand = [];
    for (var i = 0; i < hand.length; i++) {
      numbersInHand.push(parseInt(hand[i]));
    }
    if (utils.indexOf(numbersInHand, cardNumber) > -1) {
      return true; //I can play a card if i want to
    } else {
      return false; //I can't play, force me to draw.
    }
  }
}

Game.prototype.isSuiteInHand = function(suite, hand) {
  if (suite) {
    var suitesInHand = [];
    for (var i = 0; i < hand.length; i++) {
      console.log(hand[i]);
      suitesInHand.push(hand[i][hand[i].length-1]);
    }
    if (utils.indexOf(suitesInHand, suite) > -1) {
      return true;
    } else {
      return false;
    }
  }
}

Game.prototype.isWinning = function(hand) {
  if (hand.length == 0) {
    return true;
  } else { return false; }
}

module.exports = Game;