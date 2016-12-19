//This game's development was started on 18th Dec 2015, 
//Version 1 completed on 20th Dec 2015 

//c: Jay Rungta

var socket = require('socket.io');
var Game = require('./game.js');
var Player = require("./player.js");
var Messaging = require('./messaging.js');
var Room = require('./room.js');
var Utils = require('./utils.js');
var utils = new Utils();
var firstRound = 1;
var drawFlag=0;
var firstTime=0;
var ff=0;

var finishedPlayers=[];
//setup an Express server to serve the content
var http = require("http");
var express = require("express");
var app = express();
var intervalID;
var max=0;
var winner;
app.use("/", express.static(__dirname + "/"));
app.use("/resources", express.static(__dirname + "/resources"));
var server = http.createServer(app);
var port =process.env.PORT;
server.listen(port);
var io = socket.listen(server);

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});
//io.set("log level", 1);
console.log("Server is Up Bitch!! "+port);
//creating the messaging object & testroom with sample table
var messaging = new Messaging();
var room = new Room("Test Room");
room.tables = messaging.createSampleTables(2000);


//TIMEZONE
var currentTime = new Date();

var currentOffset = currentTime.getTimezoneOffset();

var ISTOffset = 330;   // IST offset UTC +5:30 

var ISTTime = new Date(currentTime.getTime() + (ISTOffset + currentOffset)*60000);


var nodemailer = require('nodemailer');

// create reusable transporter object using the default SMTP transport
var transporter = nodemailer.createTransport('smtps://rungta.jay%40gmail.com:mds4lf12@smtp.gmail.com');



//EMAIL SET UP END

   function checkExplanations(player){

  for(var i=0;i<=4;i++)
  {
    if(player.explanations[i]=="")
      return false;
  }
    return true;
  }
  
  function whoseTurn(table)
  {
      for(var i=0;i<table.players.length;i++)
      {
        if(table.players[i].turnFinished==false)
        {
          return table.players[i];
        
        }
      }
      
      return null;
  }
  
  function removeAllPlayers(table)
  {
 for(var i=0; i<table.players.length;i++)
        {
          
          table.emailtext= table.emailtext+ "Player Name: " + table.players[i].name +"\n";
          console.log("Debug Player "+i+" and "+table.players[i].name);
          table.emailtext= table.emailtext+ "Player TableID: " + table.players[i].tableID +"\n";
          table.emailtext= table.emailtext+ "Player Cards: " + table.players[i].hand +"\n";
          table.emailtext= table.emailtext+ "Player Explanations:\n \t Card 1: " + table.players[i].explanations[0] +"\n\tCard 2: " + table.players[i].explanations[1] +"\n\tCard 3: " + table.players[i].explanations[2] +"\n\tCard 4: " + table.players[i].explanations[3] +"\n\tCard 5: " + table.players[i].explanations[4] +"\n";  
          table.emailtext= table.emailtext+ "Marks Given By Other Players:\n \t ";
          var z=0;
          for(var k=0;k<table.players[i].playerscores_order.length;k++)
          {
             // console.log("entered outer loop");
              table.emailtext= table.emailtext+ table.players[i].playerscores_order[k] +":\n\t";
              var c=1;
              for(var h=z;h<z+5;h++)
              {
                               // console.log("entered inner loop");

                table.emailtext= table.emailtext+ "\tMarks for explanation "+c+": "+table.players[i].playerscores[h] +" marks\n";
                c++;
              }
              z=z+5;
          }
          
          table.emailtext= table.emailtext+ "Player Problem: " + table.players[i].problem +"\n";  
          table.emailtext= table.emailtext+ "Player Score: " + table.players[i].score +"\n";  
          table.emailtext= table.emailtext+ "*************************************\n";  
          room.removePlayer(table.players[i]);
          table.removePlayer(table.players[i]);
        }
        
        // SEND EMAIL
        // setup e-mail data with unicode symbols
        
        var emailintro= "Pranam! Is game ki details hain: \n\n" + ISTTime + "\n\n"; //2014/08/06 15:59:48
        
        //record end time
        var currentTime2 = new Date();

        var currentOffset2 = currentTime2.getTimezoneOffset();

        var ISTOffset = 330;   // IST offset UTC +5:30 

        var ISTTime2 = new Date(currentTime2.getTime() + (ISTOffset + currentOffset2)*60000);

        //calculate time difference, in minutes
        var timediff=(ISTTime2.getHours()-ISTTime.getHours())*60 + (ISTTime2.getMinutes()-ISTTime.getMinutes());
        
        //checking if game was completed or not
        if(table.check==1)
        emailintro = emailintro + "Game completed. \n Total Time: "+timediff+ " minutes.\n\n"
        
        
        else if(table.check==0)
        emailintro = emailintro + "Game left incomplete. \n Total Time: "+timediff+ " minutes.\n\n"
        
        //updating emailtext
        table.emailtext = emailintro + table.emailtext;
        
            var mailOptions = {
                from: 'guruji.games.server@gmail.com', // sender address
                to: 'jayrungta.nmims@gmail.com', // list of receivers
                subject: 'Hello', // Subject line
                text: table.emailtext, // plaintext body
                //html: '<b>Hello world 🐴</b>' // html body
            };
            
            // send mail with defined transport object
            transporter.sendMail(mailOptions, function(error, info){
                if(error){
                    return console.log(error);
                }
                console.log('Message sent: ' + info.response);
            });
        
  }

//starting the socket and awaiting connections
io.sockets.on('connection', function (socket) {

  /*
  When a player connects to the server,  we immediately create the player object.
    - the Player's name comes from frontend.
    - the player ID is the socket.ID
    - every player by default will be added to a room ("lounge")
  Message is shown in the logging board
  */
  socket.on('connectToServer',function(data) {
    var player = new Player(socket.id);
    var name = data.name; //get the player's name
    player.setName(name);
    room.addPlayer(player); //add to room -- all players go to a room first
    //io.sockets.emit();
  //  io.sockets.emit("logging", {message: name + " has connected."});
  });

  /* 
  When someone connects to a table we need to do a few things:
  These include:
    - check if there's space at the table where they want to connect
    - assign the player to a table (if available)
    - change the player's status from 'available' to 'in table'
    - save the player's name, and ID (socket client ID) in the appropriate arrays at the table.

  If a table has 2 players, we need to do more:
    - set the table's status from 'available' to 'unavailable'
    - create a pack (instantiate the game object)
    - send a time counter of 3 seconds to both connected clients
    - after the 3 second delay, emit a 'PLAY' message
  */

  socket.on('connectToTable',function(data) {
    var player = room.getPlayer(socket.id);
     var table = null;
    //find a suitable empty table
    for(var i =0;i<room.tableLimit;i++)
    {
      var temp=room.tables[i];
      if(temp.players.length<temp.playerLimit  && temp.isTableAvailable())
      {
           table = temp;
           break;
      }
    }
    
    if(table!=null) //if table was found
    {
        //if name is the same, add a random number in front
        var pname = player.name;
        var checker=0;
      while(1)
      {
          checker=0;
        for(var i=0;i<table.playernames.length;i++)
      {
          if(player.name==table.playernames[i])
          {
              var r= (Math.floor((Math.random() * 100) + 1));
              player.name=pname + "" + r;
              checker=1;
              break;
          }
      }
      if (checker==0)
      break;
      }
      
    if (table.addPlayer(player)) {
      player.tableID = table.id;
      player.status = "intable";
      
      
      
      table.playersID.push(socket.id); //probably not needed
    //  io.sockets.emit("logging", {message: player.name + " has connected to table: " + table.name + "."});
        messaging.sendEventToAllPlayers('logging', {message: player.name + " has connected to table: " + table.name + "."}, io, table.players);
      if (table.players.length < table.playerminLimit) {
       // io.sockets.emit("logging", {message: "There is " + table.players.length + " player at this table. The table requires " + table.playerminLimit + " players to join." });
        messaging.sendEventToAllPlayers('logging', {message: "There is " + table.players.length + " player at this table. The table requires " + table.playerminLimit + " players to join."}, io, table.players);
       // io.sockets.emit("waiting", {message: "Waiting for other players to join."});
        messaging.sendEventToAllPlayers('waiting', {message: "Waiting for other players to join."}, io, table.players);
        
      } else if(table.players.length >= table.playerminLimit && table.players.length <= table.playerLimit ) {
       // io.sockets.emit("logging", {message: "There are " + table.players.length + " players at this table. Play will commence shortly." });
          messaging.sendEventToAllPlayers('logging', {message: "There are " + table.players.length + " players at this table. Play will commence shortly."}, io, table.players);
        if(table.players.length==table.playerminLimit)
        {
        //emit counter
         //3 seconds in reality...
        intervalID= setInterval(function() {
          table.countdown--;
          //io.sockets.emit('timer', { countdown: table.countdown, tableID: table.id });
          messaging.sendEventToAllPlayers('timer', { countdown: table.countdown, tableID: table.id }, io, table.players);
          
        }, 1000);
      }
      else
      {
        
      }
      }
      else
      {
       //io.sockets.emit("logging", {message: "Table " +table.name+" is full. Please try connecting to another table." });
       messaging.sendEventToAllPlayers('logging', {message: "Table " +table.name+" is full. Please try connecting to another table."}, io, table.players);
        
      }
    } else {
      console.log("for whatever reason player can't be added to table."); //needs looking at
    }
  }
  else
  {
   // io.sockets.emit("logging", {message: "All tables are full, please try again later " });
        messaging.sendEventToAllPlayers('logging', {message: "All tables are full, please try again later " }, io, table.players);

    
  }
  });
  
  /*
  Once the counter has finished both clients will emit a "ToPlay" message
  Upon the receival of this message, we check against a local variable (never trust data from the client) and
  we setup the play environment:
    - change the table's state to "unavailable" 
    - change the player's status to "playing"
    - assign 5 cards to each player
    - flip the first card
      - we are going to check if this card is an action card
      - if it is, we will call the appropriate action
    - otherwise we are going to assign the start priviledge to a random player at the table
  */
  

socket.on("isTurn", function(data){
 var player = room.getPlayer(socket.id);
  var table = room.getTable(data.tableID);
  //console.log(player.turnFinished);
socket.emit("Turn1", {turn: player.turnFinished});

});
  
  socket.on("readyToPlay", function(data) {
    console.log("Ready to play called");
    var player = room.getPlayer(socket.id);
    var table = room.getTable(data.tableID);
    player.status = "playing";
  
       var newproblem=  table.gameObj.giveProblem();
      player.problem = newproblem;
   //   io.sockets.emit("giveProblem", {problem: player.problem});
      messaging.sendEventToAPlayer("giveProblem", {problem: player.problem}, io, table.players, player);
    table.readyToPlayCounter++;
    console.log("Players at "+table.name+": "+table.playernames);
   // var randomNumber = Math.floor(Math.random() * table.players.length);
    if (ff==0 && (table.readyToPlayCounter >= table.playerminLimit)) {
            ff=1;
           clearInterval(intervalID);
    //  table.status="full";

    //  var firstCardOnTable = table.cardsOnTable = table.gameObj.playFirstCardToTable(table.pack); //assign first card on table
      table.status = "unavailable"; //set the table status to unavailable

      for (var i = 0; i < table.players.length; i++) { //go through the players array (contains all players sitting at a table)
        table.players[i].hand = table.gameObj.drawCard(table.pack, 5, "", 1); //assign initial 5 cards to players
        console.log("giving 5 cards to "+table.players[i].name );
        var startingPlayerID = table.playersID[0]; //get the ID of the randomly selected player who will start
        if (table.players[i].id == startingPlayerID) { //this player will start the turn
          table.players[i].turnFinished = false;
          console.log(table.players[i].name + " starts the game.");
          io.to(table.players[i].id).emit("play", { hand: table.players[i].hand, turn: player.turnFinished, explanations:player.explanations}); //send the cards in hands to player
          io.to(table.players[i].id).emit("turn", { myturn: true, name: whoseTurn(table).name }); //send the turn-signal to player
          io.to(table.players[i].id).emit("ready", { ready: true }); //send the 'ready' signal
        
         // io.to(table.players[i].id).emit("cardInHandCount", {cardsInHand: table.players[i].hand.length});
        } else {
          table.players[i].turnFinished = true;
          console.log(table.players[i].name + " will not start the game.");
          io.to(table.players[i].id).emit("play", { hand: table.players[i].hand, turn: player.turnFinished }); //send the card in hands to player
          io.to(table.players[i].id).emit("turn", { myturn: false, name: whoseTurn(table).name }); //send the turn-signal to player
          io.to(table.players[i].id).emit("ready", { ready: true }); //send the 'ready' signal
          io.to(table.players[i].id).emit("cardInHandCount", {cardsInHand: table.players[i].hand.length});
        }
      }
      //sends the cards to the table.
      messaging.sendEventToAllPlayers('updateCardsOnTable', {cardsOnTable: table.cardsOnTable, lastCardOnTable: table.cardsOnTable}, io, table.players);
     // io.sockets.emit('updatePackCount', {packCount: table.pack.length});
            messaging.sendEventToAllPlayers('updatePackCount', {packCount: table.pack.length }, io, table.players);

    //  io.sockets.emit("changeRoundNo", {roundno: table.roundNo}); //????
            messaging.sendEventToAllPlayers("changeRoundNo", {roundno: table.roundNo}, io, table.players);

    }
  });

/*
Before the players have a chance to play in their respective turns
i.e. draw or play a card, we are going to do preliminary checks
These checks will determine whether there are (active) requests  or
(active) penalising cards on the table
*/

socket.on("preliminaryRoundCheck", function(data) {
  console.log("preliminary round check called.");
  var player = room.getPlayer(socket.id);
  var table = room.getTable(data.tableID);
  var last = table.gameObj.lastCardOnTable(table.cardsOnTable); //last card on Table
  console.log('Last card on table ==>' + last);

  //console.log("Table ==> " + JSON.stringify(table));
  firstRound--;
});

socket.on("explainCard", function(data) {
  //console.log("explain card called.");
  var player = room.getPlayer(socket.id);
  var table = room.getTable(data.tableID);
  player.explanations[data.index]=data.explanation;
  messaging.sendEventToAPlayer("logging", {message: "Your explanation for card " + data.playedCard + " has been successfully changed"}, io, table.players, player);
//  console.log(player);
});

  socket.on("disconnect", function() {
    var player = room.getPlayer(socket.id);
    
    var socketClient = socketioClient.connect(socketHost);

    var tryReconnect = function(){

        if (socketClient.socket.connected === false &&
        socketClient.socket.connecting === false) {
        // use a connect() or reconnect() here if you want
        socketClient.socket.connect()
         }
        }

    var intervalID = setInterval(tryReconnect, 2000);
    
    if (player) //&& player.status === "intable" ) 
    { 
      var table = room.getTable(player.tableID);
      table.emailtext= table.emailtext+ "Player Name: " + player.name +"\n";
      table.emailtext= table.emailtext+ "Player TableID: " + player.tableID +"\n";
      table.emailtext= table.emailtext+ "Player Cards: " + player.hand +"\n";
      table.emailtext= table.emailtext+ "Player Explanations:\n \tCard 1: " + player.explanations[0] +"\n\tCard 2: " + player.explanations[1] +"\n\tCard 3: " + player.explanations[2] +"\n\tCard 4: " + player.explanations[3] +"\n\tCard 5: " + player.explanations[4] +"\n";  
      
      table.emailtext= table.emailtext+ "Marks Given By Other Players:\n \t ";
          var z=0;
          for(var k=0;k<player.playerscores_order.length;k++)
          {
                        //    console.log("entered outer loop");

              table.emailtext= table.emailtext+ player.playerscores_order[k] +":\n\t";
              var c=1;
              for(var h=z;h<z+5;h++)
              {
                           //     console.log("entered inner loop");

                table.emailtext= table.emailtext+ "\tMarks for explanation "+c+": "+player.playerscores[h] +" marks\n";
                c++;
              }
              z=z+5;
          }
      
      table.emailtext= table.emailtext+ "Player Problem: " + player.problem +"\n";  
      table.emailtext= table.emailtext+ "Player Score: " + player.score +"\n";  
      table.emailtext= table.emailtext+ "*************************************\n";  
      
       table.removePlayer(player);
       console.log(player.name+ " disconnected from "+table.name);
     // room.removePlayer(player);
      if(table.players.length<table.playerminLimit)
      {
          console.log("Player length less than minimum");
        //game cannot continue anymore. We must free up the table
       // table.status = "available";
        table.countdown=60;
        table.readyToPlayCounter=0;
        table.roundNo=0;
        table.playersID = [];
      	table.playernames =[];
        table.cardsOnTable = [];
	   	table.pack =  table.gameObj.pack;
       ff=0;
        firstRound = 1;
        drawFlag=0;
        firstTime=0;
        finishedPlayers=[];
    //    io.sockets.emit("logging", {message: player.name + " has left the table. Number of players has reached less than the required amount. The game cannot continue anymore."});
        messaging.sendEventToAllPlayers("logging", {message: player.name + " has left the table. Number of players has reached less than the required amount. The game cannot continue anymore."}, io, table.players);
        messaging.sendEventToAllPlayers('endgame', {}, io, table.players);
       
       removeAllPlayers(table);
       
       
      // io.sockets.emit("endgame",{});

      }
      else
      {
      if(table.players.length!=1 && player.turnFinished==false)
        {
          table.progressRound(player);
          var whoseTurnPlayer= whoseTurn(table);
          var n;
          if(whoseTurnPlayer==null)
          n = "";
          else
          {
          n=whoseTurnPlayer.name;

          messaging.sendEventToAPlayer("turn", {myturn: true, name: n }, io, table.players, whoseTurnPlayer);
          messaging.sendEventToAllPlayersButPlayer("turn", {myturn: false, name: whoseTurnPlayer.name}, io, table.players, whoseTurnPlayer);
        }}
     
      player.status = "available";
     // io.sockets.emit("logging", {message: player.name + " has left the table."});
      messaging.sendEventToAllPlayers("logging", {message: player.name + " has left the table."}, io, table.players);

    } }
  });

  socket.on("drawCard", function(data) {
      var player = room.getPlayer(socket.id);
      var table = room.getTable(data.tableID);
      if (!player.turnFinished) {
          if(drawFlag==0){
            drawFlag=1;
          var card = table.gameObj.drawCard(table.pack, 1, player.hand, 0);
          if (table.pack.length < 1) { //when we drew the last card
            var newPack = table.cardsOnTable; //remember the last card
            if (table.pack.length != 1) {
              newPack.pop(); //create new pack
            }
            var last = table.gameObj.lastCardOnTable(newPack); //last card on Table
           // table.pack = table.gameObj._shufflePack(table.cardsOnTable); //shuffle the new pack
            table.cardsOnTable = last; //add the last card back on the table
          }
          socket.emit("play", {hand: player.hand, turn: player.turnFinished, explanations:player.explanations});
          messaging.sendEventToAPlayer("logging", {message: "You took " + card + " from the pack."}, io, table.players, player);
       //   io.sockets.emit('updatePackCount', { packCount: table.pack.length });
               messaging.sendEventToAllPlayers("updatePackCount", {packCount: table.pack.length}, io, table.players);
      //    io.sockets.emit("changeRoundNo", {roundno: table.roundNo}); //????
      //    table.progressRound(player); //end of turn
      //    messaging.sendEventToAPlayer("turn", {myturn: false}, io, table.players, player);
      //    messaging.sendEventToAllPlayersButPlayer("turn", {myturn: true}, io, table.players, player);
          messaging.sendEventToAllPlayersButPlayer("cardInHandCount", {cardsInHand: player.hand.length}, io, table.players, player);
      }
      else
      {
        messaging.sendEventToAPlayer("logging", {message: "You must now play a card!"}, io, table.players, player);

      }
}
         else {
          messaging.sendEventToAPlayer("logging", {message: "It's your opponent's turn."}, io, table.players, player);
        }
  });

socket.on("drawDiscarded", function(data) {
      var player = room.getPlayer(socket.id);
      var table = room.getTable(data.tableID);
        if (!player.turnFinished) {
          if(drawFlag==0){
            drawFlag=1;
          if (table.cardsOnTable.length >= 1) { //if no card discarded yet
          var card = table.gameObj.drawDiscardedCard(table.cardsOnTable, 1, player.hand, 0);

          socket.emit("play", {hand: player.hand, turn: player.turnFinished, explanations:player.explanations});
          messaging.sendEventToAPlayer("logging", {message: "You took " + card + " from the discarded."}, io, table.players, player);
         // io.sockets.emit('updatePackCount', { packCount: table.pack.length });
          messaging.sendEventToAllPlayers("updatePackCount", {packCount: table.pack.length}, io, table.players);
        //  io.sockets.emit("changeRoundNo", {roundno: table.roundNo}); //????
          messaging.sendEventToAllPlayers("changeRoundNo", {roundno: table.roundNo}, io, table.players);
          messaging.sendEventToAllPlayers('updateCardsOnTable', {cardsOnTable: table.cardsOnTable, lastCardOnTable: table.cardsOnTable[table.cardsOnTable.length-1]}, io, table.players);
       //   table.progressRound(player); //end of turn
       //   messaging.sendEventToAPlayer("turn", {myturn: false}, io, table.players, player);
       //   messaging.sendEventToAllPlayersButPlayer("turn", {myturn: true}, io, table.players, player);
          messaging.sendEventToAllPlayersButPlayer("cardInHandCount", {cardsInHand: player.hand.length}, io, table.players, player);
          }

          else
          {
             drawFlag=0;
          	  messaging.sendEventToAPlayer("logging", {message: "No card to pick"}, io, table.players, player);
          }

          }
          else
            {     messaging.sendEventToAPlayer("logging", {message: "You must now place a card"}, io, table.players, player);
            }
      }   else {
          messaging.sendEventToAPlayer("logging", {message: "It's your opponent's turn."}, io, table.players, player);
       } 

  });


  socket.on("playCard", function(data) {
      /*
      server needs to check:
      - if it's the player's turn
      - if the played card is in the owner's hand
      - if the played card's index, matches the server side index value
      - if the played card is valid to play
      */
      var player = room.getPlayer(socket.id);
      var table = room.getTable(data.tableID);
      if(!player.turnFinished){
            
      var errorFlag = false;
      
      var last = table.gameObj.lastCardOnTable(table.cardsOnTable); //last card on Table

      if (drawFlag==1) {
        drawFlag=0;
        var playedCard = data.playedCard;
        var index = data.index; //from client
        var serverIndex = utils.indexOf(player.hand, data.playedCard);

        //console.log("index => " + index + " | serverindex ==> " + serverIndex);

        if (index == serverIndex) {
          errorFlag = false;
        } else {
          errorFlag = true;
          playedCard = null;
          messaging.sendEventToAPlayer("logging", {message: "Index mismatch - you have altered with the code."}, io, table.players, player);
          socket.emit("play", {hand: player.hand, turn: player.turnFinished, explanations:player.explanations});
        }

        if (utils.indexOf(player.hand, data.playedCard) > -1) {
          errorFlag = false;
          playedCard = data.playedCard; //overwrite playedCard
        } else {
          errorFlag = true;
          playedCard = null;
          messaging.sendEventToAPlayer("logging", {message: "The card is not in your hand."}, io, table.players, player);
          socket.emit("play", {hand: player.hand, turn: player.turnFinished, explanations:player.explanations});
        }
        if (!errorFlag) {
         
                  
                table.gameObj.playCard(index, player.hand, table.cardsOnTable, player.explanations);
                messaging.sendEventToAllPlayers('updateCardsOnTable', {cardsOnTable: table.cardsOnTable, lastCardOnTable: playedCard}, io, table.players);
             //   io.sockets.emit("logging", {message: player.name + " plays a card: " + playedCard});
                 messaging.sendEventToAllPlayers("logging", {message: player.name + " plays a card: " + playedCard}, io, table.players);
                table.progressRound(player); //end of turn
                console.log(player.name+"'s turn finished.");
                //notify frontend
                var whoseTurnPlayer= whoseTurn(table);
                messaging.sendEventToAPlayer("turn", {myturn: true, name: whoseTurnPlayer.name}, io, table.players, whoseTurnPlayer);
                messaging.sendEventToAllPlayersButPlayer("turn", {myturn: false, name: whoseTurnPlayer.name}, io, table.players, whoseTurnPlayer);
             //   messaging.sendEventToAllPlayersButPlayer("cardInHandCount", {cardsInHand: player.hand.length}, io, table.players, player);
              //  io.sockets.emit("changeRoundNo", {roundno: table.roundNo}); //????
                messaging.sendEventToAllPlayers("changeRoundNo", {roundno: table.roundNo}, io, table.players);

                //stage 2 advancement

                if(table.roundNo==table.minRoundLimit)
                {
               //   io.sockets.emit("showStage2",{flag:1})
                messaging.sendEventToAllPlayers("showStage2",{flag:1}, io, table.players);
                }
                var winner = table.gameObj.isWinning(player.hand);
                if (!winner) {
                  socket.emit("play", {hand: player.hand, turn: player.turnFinished, explanations:player.explanations});
                } else {
                //game is finished //WASTE CODE BLOCK
                  socket.emit("play", {hand: player.hand, turn: player.turnFinished, explanations:player.explanations});
                messaging.sendEventToAPlayer("turn", {won: "yes"}, io, table.players, player);
                messaging.sendEventToAllPlayersButPlayer("turn", {won: "no"}, io, table.players, player);
                socket.emit("gameover", {gameover: true});
               // io.sockets.emit("logging", {message: player.name + " is the WINNER!"});
                                messaging.sendEventToAllPlayers("logging", {message: player.name + " is the WINNER!"}, io, table.players);

                  
                }
              
           

          
            }
           
       
         else {
         //   io.sockets.emit("logging", {message: "Error flag is TRUE, something went wrong"});
            messaging.sendEventToAllPlayers("logging", {message:"Error flag is TRUE, something went wrong"}, io, table.players);

        }
    }
       else { 
       messaging.sendEventToAPlayer("logging", {message: "You must first draw a card!"}, io, table.players, player);
    }
  }
  else //end of turn
  {
     messaging.sendEventToAPlayer("logging", {message: "It's your opponent's turn."}, io, table.players, player);
   

  }
  });


socket.on("reqplayerData",function(data)
{
       var p = room.getPlayerViaName(data.name); //jiska data lana hai
       var player = room.getPlayer(socket.id);
       var table = room.getTable(data.tableID);
       messaging.sendEventToAPlayer("playerData", {name: p.name, cards: p.hand, explanations: p.explanations, problem: p.problem, id:p.id}, io, table.players, player);

});
   
socket.on("recordScores",function(data)
{
       var player = room.getPlayer(socket.id);
       var table = room.getTable(data.tableID);
       var scores= data.scores;
       var array= data.array;
       console.log("Scores given by "+player.name+":"+array);
       var p = room.getPlayerViaName(data.id); //jisko score diya gaya hai
       var check=1;
       table.check=1;
     //  var winner;
       p.score=p.score+scores;
       p.scoreUpdates++;
       
       p.playerscores_order.push(player.name);
       for(var i=0; i<array.length; i++)
       {
           p.playerscores.push(array[i]);
       }
       for(var i=0;i<table.players.length;i++)
       {
        if(!(table.players[i].scoreUpdates==table.players.length-1))
          {
              check=0;
              table.check=0;
          }
        if(table.players[i].score>max)
        {
          max=table.players[i].score;
          winner=table.players[i];
        }
       }
       if (check==1) //game has ended
       {
        console.log("Winner is "+winner.name);
        messaging.sendEventToAllPlayersButPlayer("loss", {winner: winner.name}, io, table.players, winner);
        messaging.sendEventToAPlayer("win", {winner: winner.name}, io, table.players, winner);
       // io.sockets.emit("win", {winner: winner.name});
        //remove all players
        max=0;
        ff=0;
       // removeAllPlayers(table);
       
        //table.status="available";
       }

});
   

socket.on("stage2Begin", function(data) {
   var player = room.getPlayer(socket.id);
   var table = room.getTable(data.tableID);
   
   if(firstTime==0){
    //end all turns
    for(var i = 0; i < table.players.length; i++) {
    table.players[i].turnFinished = true;
    //alert all other players of stage 2
    } 
    messaging.sendEventToAllPlayers("logging", {message: "The judgment will begin soon... Please finish writing all explanations and press finish." }, io, table.players);
    firstTime=1;
    }//end first time
    console.log("Finished players are "+finishedPlayers);
   

   //if player is not yet ready
   if(finishedPlayers.indexOf(player.id)==-1)
   { 
   // player.turnFinished=true;
   
  //check if all explanations done
   if(checkExplanations(player))
   {
   finishedPlayers.push(player.id);
   messaging.sendEventToAPlayer("logging", {message: "Please wait while other players write their explanations..."}, io, table.players, player);
   messaging.sendEventToAPlayer('stage2setup', {}, io, table.players, player);
   }
   else
     messaging.sendEventToAPlayer("logging", {message: "Please finish all your explanations and press finish again.. only then we can proceed."}, io, table.players, player);
   
   if(finishedPlayers.length==table.players.length)
   {
   console.log("ALL PLAYERS READY FOR STAGE 2");
        messaging.sendEventToAllPlayers("showButtons", {players:table.players}, io, table.players);
    /*for(var i = 0; i < table.players.length; i++) {
       // messaging.sendEventToAllPlayersButPlayer("cardInHandCount", {cardsInHand: player.hand.length}, io, table.players, player);

    } */

   }
   }
   
else
     messaging.sendEventToAPlayer("logging", {message: "Please wait while other players write their explanations..."}, io, table.players, player);


});


});




