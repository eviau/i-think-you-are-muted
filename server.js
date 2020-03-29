//check README.md

//create a web application that uses the express frameworks and socket.io to communicate via http (the web protocol)
var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var Filter = require('bad-words');

//minimum time between talk messages
//enforced by server
var ANTI_SPAM = 1000;

//We want the server to keep track of the whole game state
//in this case the game state are the attributes of each player
var gameState = {
    players: {}
}


//when a client connects serve the static files in the public directory ie public/index.html
app.use(express.static('public'));

//when a client connects the socket is established and I set up all the functions listening for events
io.on('connection', function (socket) {
    //this appears in the terminal
    console.log('A user connected');


    //wait for the player to send their name and info, then broadcast them
    socket.on('join', function (playerInfo) {
        console.log("New user joined the server: " + playerInfo.nickName + " avatar# " + playerInfo.avatar + " color# " + playerInfo.color);

        //the player objects on the client will keep track of the room
        var newPlayer = { id: socket.id, nickName: filter.clean(playerInfo.nickName), color: playerInfo.color, room: playerInfo.room, avatar: playerInfo.avatar, x: playerInfo.x, y: playerInfo.y };

        //save the same information in my game state
        gameState.players[socket.id] = newPlayer;
        //set last message at the beginning of time, the SEVENTIES
        gameState.players[socket.id].lastMessage = 0;

        //send the user to the default room
        socket.join(playerInfo.room, function () {
            //console.log(socket.rooms);
        });


        //this is sent to the client upon connection
        socket.emit('serverMessage', 'Hello welcome!');

        //send all players information about the new player
        //upon creation destination and position are the same 
        io.to(playerInfo.room).emit('playerJoined', newPlayer);

        console.log("There are now " + Object.keys(gameState.players).length + " players on this server");

    });

    //when a client disconnects I have to delete its player object
    //or I would end up with ghost players
    socket.on('disconnect', function () {
        console.log("Player disconnected " + socket.id);
        io.sockets.emit('playerLeft', { id: socket.id });
        //send the disconnect
        //delete the player object
        delete gameState.players[socket.id];
        console.log("There are now " + Object.keys(gameState.players).length + " players on this server");

    });

    //when I receive an intro send it to the recipient
    socket.on('intro', function (newComer, obj) {
        io.to(newComer).emit('onIntro', obj);
    });


    //when I receive a talk send it to everybody in the room
    socket.on('talk', function (obj) {
        var time = new Date().getTime();

        if (time - gameState.players[socket.id].lastMessage > ANTI_SPAM) {
            //remove leading and trailing whitespaces
            obj.message = obj.message.replace(/^\s+|\s+$/g, "");
            //filter bad words
            obj.message = filter.clean(obj.message);
            //advanced cleaning

            //f u c k
            var test = obj.message.replace(/\s/g, '');
            //fffffuuuuck
            var test2 = obj.message.replace(/(.)(?=.*\1)/g, "");
            //f*u*c*k
            var test3 = obj.message.replace(/\W/g, "");
            //spaces
            var test4 = obj.message.replace(/\s/g, '');

            if (filter.isProfane(test) || filter.isProfane(test2) || filter.isProfane(test3) || test4 == "") {
                console.log(socket.id + " is problematic");
            }
            else {
                io.to(obj.room).emit('playerTalked', { id: socket.id, color: obj.color, message: obj.message, x: obj.x, y: obj.y });
            }

            //update the last message time
            gameState.players[socket.id].lastMessage = time;
        }

    });


    //when I receive a move sent it to everybody
    socket.on('changeRoom', function (obj) {

        console.log("Player " + socket.id + " moved from " + obj.from + " to " + obj.to);
        socket.leave(obj.from);
        socket.join(obj.to);

        //broadcast the change to everybody in the current room
        //from the client perspective leaving the room is the same as disconnecting
        io.to(obj.from).emit('playerLeft', { id: socket.id });

        //same for joining, sending everybody in the room the player state
        var playerObject = gameState.players[socket.id];
        playerObject.room = obj.to;
        playerObject.x = playerObject.destinationX = obj.x;
        playerObject.y = playerObject.destinationY = obj.y;
        io.to(obj.to).emit('playerJoined', playerObject);


    });

    //when I receive a move sent it to everybody
    socket.on('move', function (obj) {

        //broadcast the movement to everybody
        io.to(obj.room).emit('playerMoved', { id: socket.id, x: obj.x, y: obj.y, destinationX: obj.destinationX, destinationY: obj.destinationY });

    });


});


//listen to the port 3000
http.listen(3000, function () {
    console.log('listening on *:3000');
});

//in my gallery people can swear but not use slurs, override bad-words list, and add my own
let myBadWords = ['chink', 'cunt', 'cunts', "fag", "fagging", "faggitt", "faggot", "faggs", "fagot", "fagots", "fags", "jap", "homo", "nigger", "niggers", "n1gger", "nigg3r"];
var filter = new Filter({ emptyList: true });
filter.addWords(...myBadWords);



