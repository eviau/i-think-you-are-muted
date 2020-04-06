//check README.md

//load secret config vars
require('dotenv').config();
const DATA = require('./data');

//.env content
/*
ADMINS=username1|pass1,username2|pass2
PORT = 3000
*/


var port = process.env.PORT || 3000;

//number of emits per second allowed for each player, after that ban the IP.
//over 30 emits in this game means that the client is hacked and the flooding is malicious
//if you change the game logic make sure this limit is still reasonable
var PACKETS_PER_SECONDS = 30;

/*
The client and server version strings MUST be the same!
They can be used to force clients to hard refresh to load the latest client.
If the server gets updated it can be restarted, but if there are active clients (users' open browsers) they could be outdated and create issues.
If the VERSION vars are mismatched they will send all clients in an infinite refresh loop. Make sure you update sketch.js before restarting server.js
*/
var VERSION = "1.0";

//create a web application that uses the express frameworks and socket.io to communicate via http (the web protocol)
var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var Filter = require('bad-words');


//time before disconnecting (forgot the tab open?)
var ACTIVITY_TIMEOUT = 10 * 60 * 1000;
//should be the same as index maxlength="16"
var MAX_NAME_LENGTH = 16;

//cap the overall players 
var MAX_PLAYERS = -1;
//refuse people when a room is full 
var MAX_PLAYERS_PER_ROOM = 200;

//views since the server started counts relogs
var visits = 0;

/*
A very rudimentary admin system. 
Reserved usernames and admin pass are stored in .env file as
ADMINS=username1|pass1,username2|pass2

Admin logs in as username|password in the normal field
If combo user|password is correct (case insensitive) mark the player as admin on the server side
The "username|password" remains stored on the client as var nickName 
and it's never shared to other clients, unlike player.nickName

admins can call admin commands from the chat like /kick nickName
*/
var admins = [];
if (process.env.ADMINS != null)
    admins = process.env.ADMINS.split(",");

//We want the server to keep track of the whole game state
//in this case the game state are the attributes of each player
var gameState = {
    players: {}
}

//a collection of banned IPs
//not permanent, it lasts until the server restarts
var banned = [];

//when a client connects serve the static files in the public directory ie public/index.html
app.use(express.static('public'));
