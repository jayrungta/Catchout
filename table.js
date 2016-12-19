var Game = require('./game.js');


Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

function Table(tableID){
	this.id = tableID;
	this.name = "";
	this.status = "available";
	this.players = [];
	this.playersID = [];
	this.playernames =[];
	this.readyToPlayCounter = 0;
	this.playerLimit = 5;
    this.playerminLimit = 2;
	this.pack = [];
	this.cardsOnTable = [];
	this.countdown=10;
//	this.gameStage = 1;
	this.roundNo = 0;
	this.minRoundLimit=3;
	this.maxRoundLimit=8;
    this.emailtext = "";
	this.actionCard = false;
	this.requestActionCard = false;
	this.penalisingActionCard = false;
	this.forcedDraw = 0;
	this.check=0;
	this.suiteRequest = "";
	this.numberRequest = "";

	this.gameObj = null;
};
var a=0;

Table.prototype.progressRound = function(player) {
	//find out nigga position in  array
  for(var i = 0; i < this.players.length; i++) {
  	//this.players[i].turnFinished = false;
	  	if(this.players[i].id == player.id) { //IRRELAVANT COMMENTwhen player is the same that plays, end their turn
		//	player.turnFinished = true;
		break;
		} 
	}
	//end that nigga turn
	player.turnFinished=true;
	
	//if he was the last nigga, make it first niggas turn
	if(i==this.players.length-1)
	this.players[0].turnFinished=false;
	
	//else make it the next niggas turn
	else 
	{
		for(var j=i+1;j<this.players.length;j++)
		{
			if(this.players[j])
			{
			this.players[j].turnFinished=false;
			break;
			}
		}
	}
	
	a++;
	if(a%this.players.length==0)
		this.roundNo++;
}

Table.prototype.setName = function(name){
	this.name = name;
};

Table.prototype.getName = function(){
	return this.name;
};

Table.prototype.setStatus = function(status){
	this.status = status;
};

Table.prototype.isAvailable = function(){
	return this.status === "available";
};

Table.prototype.isFull = function(){
	return this.status === "full";
};

Table.prototype.isPlaying = function(){
	return this.status === "playing";
};

Table.prototype.addPlayer = function(player) {
	if (this.status === "available") {
		var found = false;
		for(var i = 0; i < this.players.length; i++) {
			if(this.players[i].id == player.id){
				found = true;
				break;
			}
		}
		if(!found){
			this.players.push(player);
			this.playernames.push(player.name);
			if(this.players.length == this.playerminLimit){
				//this.status = "playing";
				for(var i = 0; i < this.players.length; i++){
					this.players[i].status = "intable";

				}
			}
			return true;
		}
	}
	return false;
};

Table.prototype.removePlayer = function(player){
	var index = -1;
	for(var  i = 0; i < this.players.length; i++){
		if(this.players[i].id === player.id){
			index = i;
			break;
		}
	}
	if(index != -1){
		this.players.remove(index);
		this.playernames.remove(index);
	}
};

Table.prototype.isTableAvailable = function() {
	if( (this.playerLimit >= this.players.length) && (this.status === "available")) {
		return true;
	} else {
		return false;
	}
	//return (this.playerLimit > this.players.length);
};

Table.prototype.createMessageObject = function() {
	var table = this;
	var TableMessage = function(){
		this.id = table.id;
		this.name = table.name;
		this.status = table.status;
		this.players = table.players;
		this.playerLimit = table.playerLimit;
	};

	return new TableMessage();
};

module.exports = Table;