
//var socket = io.connect("process.env.IP:process.env.PORT"); /*global.io*/

var t, flag = 0;
var tableID;
var pname;
//var socket = io.connect("https://catchout-jayrungta.c9users.io/");
var socket = io.connect("https://catchout.herokuapp.com/");

io.connect('https://catchout.herokuapp.com/', {
  'reconnect': true,
  'reconnection delay': 500,
  'max reconnection attempts': 10
});

socket.on("logging", function (data) {
  $("#updates").append("<li>" + data.message + "</li>");
  var log = document.getElementById('footer');
  log.scrollTop = log.scrollHeight;
});

socket.on("giveProblem", function (data) {
  $("#problem").text = "";
  $("#problem").append("Aapki Problem hai : " + data.problem);
});

socket.on("timer", function (data) {
  // $("#counter").show();
  $('#counter').html(data.countdown);

  if (data.countdown === 0) {
    tableID = data.tableID;
    socket.emit("readyToPlay", { tableID: tableID });
    $("#counter").hide();
  }
});

socket.on("playOption", function (data) {
  $("#playOption").html(data.message);
  if (data.value) {
    $("#penalising").show();
  } else {
    $("#penalising").hide();
    $("#playOption").hide();
  }
});

socket.on("showRequestCardDialog", function (data) {
  if (data.option == "suite") {
    $("#suiteRequest").show();
  }
});

function playCard(key, value) {
  var index = key;
  var playedCard = value;

  socket.emit("playCard", { tableID: tableID, playedCard: playedCard, index: index });
  console.log(index);
}

/*function explainCard(key, value, id) {
  
  index = key;
  playedCard = value;
  playerId= id;


      $("#explaindiv").show();
      $("#explaindiv").focus();   
      $("#submitExplain").click(function() { 
        var explanation = $("#explainText").val()+"";
        console.log("Just entered exp is" + explanation);
        socket.emit("explainCard", {tableID:1, playedCard: playedCard, index: index, playerId: playerId, explanation: explanation});
        $("#explaindiv").hide();
        return false; 
      });   
}*/
socket.on("Turn1", function (data) {
  t = data.turn;
  console.log(t);
  flag = 1;
});
/*function t1(){
  if(t==true || t == false)
  {
    console.log("in this");
    return t;
  }
  else {
    console.log("in else");
  }
    //t1();
  }*/

socket.on("play", function (data) {
  $("#hand").text("");
  // $('#cards').find('option').remove().end();
  $("#explainText0").val("");
  $("#explainText1").val("");
  $("#explainText2").val("");
  $("#explainText3").val("");
  $("#explainText4").val("");

  pixel = 0;
  console.log(data.explanations);

  for (var i = 0; i < data.hand.length; i++) {
    if (data.explanations != null && data.explanations[i] != null) {
      console.log("changing explanations");
      $("#explainText" + i).val("" + data.explanations[i]);
    }
    else {
      console.log("erasing explanations");
      $("#explainText" + i).val("");

    }
  }
  $.each(data.hand, function (k, v) {
    index = k + 1;
    $("#hand").append("<div style='margin-top:2px;float: left;'><ul style='list-style-type:none'><li class='hand'><img class='card" + k + "' width=185 height=129 src=resources/" + v + ".jpg /></li><li class='hand'><button id='explain" + k + "'' class='btn btn-danger'>Explain</button></li></ul></div>");


    $(".card" + k).click(function () { playCard(k, v); return false; });
    $("#explain" + k).click(function () {

      $("#explaindiv0").hide();
      $("#explaindiv1").hide();
      $("#explaindiv2").hide();
      $("#explaindiv3").hide();
      $("#explaindiv4").hide();
      socket.emit("isTurn", {});
      if (flag == 1) {
        if (t) {
          // console.log("entered explain func");
          $("#explaindiv" + k).show();
          $("#explainText" + k).focus();
          //console.log("finished explain func");

          $("#submitExplain" + k).click(function () {
            var explanation = $("#explainText" + k).val().trim() + "";
            console.log("Just entered exp is " + explanation);
            socket.emit("explainCard", { tableID: tableID, playedCard: v, index: k, explanation: explanation });
            $("#explaindiv" + k).hide();
          });
          // $("#explainText").val('');   
        }
        else {
          // socket.emit("logging", {message: "You cannot add explanations, its your turn to play!"});
          $("#updates").append("<li>You cannot add explanations, its your turn to play!</li>");
          var log = document.getElementById('footer');
          log.scrollTop = log.scrollHeight;
        }
        flag = 0;
      }
      return false;
    });
    pixel = pixel + 250;
  });
});

socket.on("changeRoundNo", function (data) {
  $("#currentRoundNo").text("");
  $("#currentRoundNo").html("Rounds Completed: <span class='label label-info'>" + data.roundno + "</span>");
});

socket.on("showStage2", function (data) {
  $("#stage2Button").show();
});

socket.on("updatePackCount", function (data) {
  $("#pack").text("");
  $("#pack").html("Size of pack is: <span class='label label-info'>" + data.packCount + "</span>");
});

socket.on("updateCardsOnTable", function (data) {
  $("#table").text("");
  if (data.cardsOnTable == "") {
    $("#table").text("");
  } else {
    $("#table").append("<img width=185 height=129 src=resources/" + data.lastCardOnTable + ".jpg>");
  }
});

socket.on("turn", function (data) {
  if (data.won) {
    $("#playArea").hide();
    if (data.won == "yes") {
      $("#progressUpdate").html("<span class='label label-success'>You won - well done! Game over.</span>");
    } else {
      $("#progressUpdate").html("<span class='label label-info'>You lost - better luck next time. Game over.</span>");
    }
  } else {
    if (data.myturn) {
      $("#progressUpdate").html("<span class='label label-danger'>It's your turn.</span>");
      socket.emit("preliminaryRoundCheck", { tableID: tableID }); //When a player has a turn, we need to control a few items, this is what enables us to make it happen.
    } else {
      $("#progressUpdate").html("<span class='label label-info'>It's " + data.name + "'s turn.</span>");
    }
  }
});

socket.on("cardInHandCount", function (data) {
/*  var spanClass="badge-success";
  var plural = "s";
  if (data.cardsInHand <= 2) {
    spanClass = "badge-important";
  }
  if (data.cardsInHand <= 1) {
    plural = "";
  }
  $("#opponentCardCount").html("Your opponent has <span class='badge " + spanClass + "''>"+ data.cardsInHand + "</span> card"+plural+" in hand.");
*/});

socket.on("tableFull", function () {
  $("#tableFull").fadeIn("slow");
});

$(document).ready(function () {
  $("#tableFull").hide();
  $("#playArea").hide();
  $("#waiting").hide();
  $("#error").hide();
  // $("#name").focus();
  $("#progressUpdate").hide();
  $("#stage2Button").hide();
  $("#stage2").hide();
  $("#explaindiv0").hide();
  $("#explaindiv1").hide();
  $("#explaindiv2").hide();
  $("#explaindiv3").hide();
  $("#explaindiv4").hide();
  $("#counter").text('');

  $("#StartArea").show();
  $("#GameArea").hide();
  $("#HowToArea").hide();

  $("form").submit(function (event) {
    event.preventDefault();
  });

  $("#StartGame").click(function () {
    $("#StartArea").hide();
    $("#GameArea").show();
  })

  $("#HowToPlay").click(function () {
    $("#StartArea").hide();
    $("#HowToArea").show();
  })

  $("#BackToMenu").click(function () {
    $("#HowToArea").hide();
    $("#StartArea").show();

  })

  $("#join").click(function () {
    var name = $("#name").val();
    if (name.length > 0) {
      socket.emit("connectToServer", { name: name });
      pname = name;
      socket.emit('connectToTable', {});
      $("#loginForm").hide();
      $("#tableFull").hide();
      $("#explaindiv").hide();
      $("#waiting").show();

      socket.on("ready", function (data) {
        $("#head").hide();
        $("#page-header").css('height', '100px');
        $("#wrap").css('top', '150px');
        $('#welcometext').html("<h3>Catch Out!</h3>");
        $("#waiting").hide();
        $("#playArea").show();
        $("#progressUpdate").show();
      });
    } else {
      $("#error").show();
      $("#error").append('<p class="text-error">Please enter a name.</p>');
    }
  });

  $("#drawCard").click(function () {
    socket.emit("drawCard", { tableID: tableID });
  });
  /*penalising card taken button*/
  $("#drawDiscarded").click(function () {
    socket.emit("drawDiscarded", { tableID: tableID });

  });
  $("#stage2Button").click(function () {
    socket.emit("stage2Begin", { tableID: tableID });
  });

  socket.on("stage2setup", function (data) {

    $("#playArea").hide();
    $("#footer").hide();
    $("#explainmaster").hide();
    $("#p").hide();
    $("#stage2").show();
    $("#judgement").hide();
    $("#judgeform").hide();
    $("#problem").hide();
    $("#footer").hide();
  });

  socket.on("win", function (data) {
    $("#stage2").hide();

    $("#wait2").html("<h4>You have won this game!!!<br><br>Aapki jeet hui!!!</h4><br><img src='resources/win.gif'>");


  });

  socket.on("loss", function (data) {
    $("#stage2").hide();

    $("#wait2").html("<h4>You have lost this game..... Aapki haar hui. <br> <br> Player " + data.winner + " is the winner.<br><br>Player " + data.winner + " ki jeet hui</h4><br><img src='resources/loss.gif'>");


  });

  socket.on("endgame", function (data) {
    $("#stage2").hide();
    $("#tableFull").hide();
    $("#playArea").hide();
    $("#waiting").hide();
    $("#error").hide();
    $("#name").hide();
    $("#topstuff").hide();
    $("#problem").hide();
    $("#progressUpdate").hide();
    $("#stage2Button").hide();
    $("#stage2").hide();
    $("#explaindiv0").hide();
    $("#explaindiv1").hide();
    $("#explaindiv2").hide();
    $("#explaindiv3").hide();
    $("#explaindiv4").hide();
    $("#counter").hide();

    $("#wait2").html("Number of players less than required... The game must end. The page will be reloaded in 5 seconds.");
    window.setTimeout('location.reload()', 5000);


  });

  socket.on("playerData", function (data) {
    $("#buttons").hide();
    $("#playerData").append("Player " + data.name + " ki problem hai:" + data.problem);
    $("#judgement").append(" <button id='submitJudgement" + data.name + "' class='btn btn-danger'>Submit</button>");
    $("#submitJudgement" + data.name).click(function () {
      var id = this.id.substring(15);
      var sum = Number(getRadioCheckedValue("c1")) + Number(getRadioCheckedValue("c2")) + Number(getRadioCheckedValue("c3")) + Number(getRadioCheckedValue("c4")) + Number(getRadioCheckedValue("c5"));
      var score = [Number(getRadioCheckedValue("c1")), Number(getRadioCheckedValue("c2")), Number(getRadioCheckedValue("c3")), Number(getRadioCheckedValue("c4")), Number(getRadioCheckedValue("c5"))];
      // $("#p"+data.name).hide();

      socket.emit("recordScores", { scores: sum, id: id, array: score, tableID: tableID });

      $('input[type=radio]').prop('checked', function () {
        return this.getAttribute('checked') == 'checked';
      });
      $('#judgeform').hide();
      $("#buttons").show();
      $("#wait1").html("<h4>Waiting for all players to give scores....</h4>");
      $('#p' + data.name).hide();
      $("#playerData").html("");
      $("#submitJudgement" + data.name).hide();
      return false;
    });

    for (var i = 0; i <= 4; i++) {
      $("#playerData").append("<ul style='list-style-type:none'><li><img width=185 height=129 src=resources/" + data.cards[i] + ".jpg></li><li>Explanation:" + data.explanations[i] + "</li></ul>");
    }
    $('#judgement').show();
    $('#judgeform').show();


  });


  function showplayerdata(aye) {
    var name = aye;
    // var  name = pn;

    console.log("Requesting data of playerid, name " + name);
    socket.emit("reqplayerData", { name: name, tableID: tableID });

  }

  function getRadioCheckedValue(radio_name) {
    var oRadio = document.getElementById('judgeform').elements[radio_name];

    for (var i = 0; i < oRadio.length; i++) {
      if (oRadio[i].checked) {
        return oRadio[i].value;
      }
    }

    return '';
  }



  socket.on("showButtons", function (data) {
    var players = data.players;
    $('#judgement').hide();
    $('#judgeform').hide();

    $("#wait1").html("<h4>Give Judgement To:</h4>");
    $("#buttons").append("<ul class='e1'>");
    for (var i = 0; i < players.length; i++) {

      if (players[i].name == pname)
        continue;

      // var aye= players[i].id;
      //var pn=players[i].name;
      $("#buttons").append("<li><button id='p" + players[i].name + "' class='btn btn-success'>" + players[i].name + "</button></li>");
      $("#p" + players[i].name).click(function () {
        var id = this.id;
        var id2 = id.substring(1);

        $("#p" + id).hide();
        $("#buttons").hide();
        showplayerdata(id2);
        return false;
      });
    }
    $("#buttons").append("</ul>");
  });


});//!!!!!!!!!DONT MESS WITH THIS bracket, too much shit this has caused :(

