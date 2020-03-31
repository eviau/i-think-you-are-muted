//check README.md

require('dotenv').config();

var port = process.env.PORT || 3000;

//create a web application that uses the express frameworks and socket.io to communicate via http (the web protocol)
var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var Filter = require('bad-words');

//minimum time between talk messages
//enforced by server
var ANTI_SPAM = 1000;

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
var admins = process.env.ADMINS.split(",");

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
        try {
      
          const address = socket.handshake.headers["x-forwarded-for"].split(",")[0];
          console.log(address);

            if (playerInfo.nickName == "")
                console.log("New user joined the server in lurking mode " + socket.id);
            else
                console.log("New user joined the game: " + playerInfo.nickName + " avatar# " + playerInfo.avatar + " color# " + playerInfo.color + " " + socket.id);

            //prevent a hacked client from duplicating players
            if (gameState.players[socket.id] != null) {
                console.log("ATTENTION: there is already a player associated to the socket " + socket.id);
            }
            else {
                //the first validation was to give the player feedback, this one is for real
                var val = 1;

                //always validate lurkers, they can't do anything
                if (playerInfo.nickName != "")
                    val = validateName(playerInfo.nickName);

                if (val == 0) {
                    console.log("ATTENTION: " + socket.id + " tried to bypass username validation");
                }
                else {

                    //if there is an | strip the after so the password remains in the admin client
                    var combo = playerInfo.nickName.split("|");
                    playerInfo.nickName = combo[0];

                    if (val == 2)
                        console.log(playerInfo.nickName + " joins as admin");

                    //the player objects on the client will keep track of the room
                    var newPlayer = { id: socket.id, nickName: filter.clean(playerInfo.nickName), color: playerInfo.color, room: playerInfo.room, avatar: playerInfo.avatar, x: playerInfo.x, y: playerInfo.y };

                    //save the same information in my game state
                    gameState.players[socket.id] = newPlayer;
                    //set last message at the beginning of time, the SEVENTIES
                    gameState.players[socket.id].lastMessage = 0;
                    //is it admin?
                    gameState.players[socket.id].admin = (val == 2) ? true : false;
                    gameState.players[socket.id].spam = 0;
                    gameState.players[socket.id].muted = false;

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
                }
            }
        } catch (e) {
            console.log("Error on join, object malformed from" + socket.id + "?");
            console.error(e);
        }
    });

    //when a client disconnects I have to delete its player object
    //or I would end up with ghost players
    socket.on('disconnect', function () {
        try {
            console.log("Player disconnected " + socket.id);
            io.sockets.emit('playerLeft', { id: socket.id });
            //send the disconnect
            //delete the player object
            delete gameState.players[socket.id];
            console.log("There are now " + Object.keys(gameState.players).length + " players on this server");
        }
        catch (e) {
            console.log("Error on disconnect, object malformed from" + socket.id + "?");
            console.error(e);
        }
    });

    //when I receive an intro send it to the recipient
    socket.on('intro', function (newComer, obj) {
        //verify the id to make sure a hacked client can't fake players
        if (obj != null) {

            if (obj.id == socket.id) {
                io.to(newComer).emit('onIntro', obj);
            }
            else {
                console.log("ATTENTION: Illegitimate intro from " + socket.id);
            }
        }

    });


    //when I receive a talk send it to everybody in the room
    socket.on('talk', function (obj) {
        try {

            var time = new Date().getTime();

            //block if spamming
            if (time - gameState.players[socket.id].lastMessage > ANTI_SPAM && !gameState.players[socket.id].muted) {

                //Admin commands can be typed as messages
                //is this an admin
                if (gameState.players[socket.id].admin && obj.message.charAt(0) == "/") {
                    console.log("Admin " + gameState.players[socket.id].nickName + " attempts command " + obj.message);
                    adminCommand(socket, obj.message);
                }
                else {
                    //normal talk stuff

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
                }

                //update the last message time
                gameState.players[socket.id].lastMessage = time;
            }
        } catch (e) {
            console.log("Error on talk, object malformed from" + socket.id + "?");
            console.error(e);
        }

    });


    //when I receive a move sent it to everybody
    socket.on('changeRoom', function (obj) {
        try {
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
        } catch (e) {
            console.log("Error on join, object malformed from" + socket.id + "?");
            console.error(e);
        }

    });

    //when I receive a move sent it to everybody
    socket.on('move', function (obj) {
        try {
            //broadcast the movement to everybody
            io.to(obj.room).emit('playerMoved', { id: socket.id, x: obj.x, y: obj.y, destinationX: obj.destinationX, destinationY: obj.destinationY });

        } catch (e) {
            console.log("Error on join, object malformed from" + socket.id + "?");
            console.error(e);
        }
    });


    //when I receive a user name validate it
    socket.on('sendName', function (nn) {
        try {
            var res = validateName(nn);
            //send the code 0 no - 1 ok - 2 admin
            socket.emit('nameValidation', res);
        } catch (e) {
            console.log("Error on sendName " + socket.id + "?");
            console.error(e);
        }
    });

});

function validateName(nn) {
    //console.log("Validating " + nn);

    var admin = false;
    var duplicate = false;
    var reserved = false;

    //check if the nickname is a name + password combo
    var combo = nn.split("|");

    //it may be
    if (combo.length > 1) {
        var n = combo[0];
        var p = combo[1];

        for (var i = 0; i < admins.length; i++) {
            if (admins[i].toUpperCase() == nn.toUpperCase()) {
                //it is an admin name! check if the password is correct, case insensitive 
                admin = true;
            }
        }
        //if there is an | just strip the after
        nn = n;
    }

    //if not admin check if the nickname is reserved (case insensitive)
    if (!admin) {
        for (var i = 0; i < admins.length; i++) {
            var combo = admins[i].split("|");
            if (combo[0].toUpperCase() == nn.toUpperCase()) {
                //it is! kill it. Yes, it should be done at login and communicated 
                //but hey I don't have to be nice to users who steal my name
                reserved = true;
            }
        }
    }

    var id = idByName(nn);
    if (id != null) {
        duplicate = true;
        console.log("There is already a player named " + nn);
    }

    if (duplicate || reserved)
        return 0
    else if (admin)
        return 2
    else
        return 1

}

//parse a potential admin command
function adminCommand(adminSocket, str) {
    try {
        //remove /
        str = str.substr(1);
        cmd = str.split(" ");
        switch (cmd[0]) {
            case "kick":
                var s = socketByName(cmd[1]);
                if (s != null) {
                    s.disconnect();
                }
                else {
                    //popup to admin
                    adminSocket.emit("popup", "I can't find a user named " + cmd[1]);
                }
                break;

            case "mute":
                var s = idByName(cmd[1]);
                if (s != null) {
                    gameState.players[s].muted = true;
                }
                else {
                    //popup to admin
                    adminSocket.emit("popup", "I can't find a user named " + cmd[1]);
                }
                break;

            case "popup":

                var s = socketByName(cmd[1]);
                if (s != null) {
                    //take the rest as string
                    cmd.shift();
                    cmd.shift();
                    var msg = cmd.join(" ");
                    s.emit("popup", msg);
                }
                else {
                    //popup to admin
                    adminSocket.emit("popup", "I can't find a user named " + cmd[1]);
                }
                break;
        }
    }
    catch (e) {
        console.log("Error admin command");
        console.error(e);
    }
}

function socketByName(nick) {
    var s = null;
    for (var id in gameState.players) {
        if (gameState.players.hasOwnProperty(id)) {
            if (gameState.players[id].nickName.toUpperCase() == nick.toUpperCase()) {
                s = io.sockets.sockets[id];
            }
        }
    }
    return s;
}

function idByName(nick) {
    var i = null;
    for (var id in gameState.players) {
        if (gameState.players.hasOwnProperty(id)) {
            if (gameState.players[id].nickName.toUpperCase() == nick.toUpperCase()) {
                i = id;
            }
        }
    }
    return i;
}

//listen to the port 3000
http.listen(port, function () {
    console.log('listening on *:3000');
});

//in my gallery people can swear but not use slurs, override bad-words list, and add my own
let myBadWords = ['chink', 'cunt', 'cunts', "fag", "fagging", "faggitt", "faggot", "faggs", "fagot", "fagots", "fags", "jap", "homo", "nigger", "niggers", "n1gger", "nigg3r"];
var filter = new Filter({ emptyList: true });
filter.addWords(...myBadWords);



