//check README.md for more information

/// <reference path="TSDef/p5.global-mode.d.ts" />

//for testing purposes I can skip the login phase
var QUICK_LOGIN = true;

//native canvas resolution
var WIDTH = 256;
var HEIGHT = 200;
var canvasScale = 2;
var ASSET_SCALE = 2; //the backgrounds are scaled 2x
var AVATAR_W = 10;
var AVATAR_H = 18;

//create a socket connection
var socket;

//linear speed
var SPEED = 50;
//how long does it stay per character
var MIN_BUBBLE_TIME = 1;
var BUBBLE_TIME = 0.3;
var BUBBLE_MARGIN = 3;

//this object keeps track of all the current players, coordinates and color
var players;
//a reference to this particular player
var me;
var canvas;

var nickName;

//lobby, avatar selection or game?
var screen;

//sprite reference color for palette swap
//hair, skin, shirt, pants
var REF_COLORS = ['#413830', '#c0692a', '#ff004d', '#29adff'];
var AVATAR_PALETTES = [
    ['#ffa300', '#e27c32', '#a8e72e', '#00b543'],
    ['#a8e72e', '#e27c32', '#111d35', '#8f3f17'],
    ['#413830', '#e27c32', '#c2c3c7', '#a28879'],
    ['#a28879', '#e27c32', '#f3ef7d', '#422136'],
    ['#a28879', '#e27c32', '#ca466d', '#1e839d'],
    ['#413830', '#e27c32', '#111d35', '#ca466d'],
    ['#be1250', '#e27c32', '#ffec27', '#1e839d'],
    ['#ffec27', '#e27c32', '#065ab5', '#422136'],

    ['#413830', '#8f3f17', '#ff004d', '#413830'],
    ['#413830', '#8f3f17', '#ff9d81', '#413830'],
    ['#a28879', '#8f3f17', '#ffec27', '#ff6c24'],
    ['#413830', '#8f3f17', '#c2c3c7', '#ca466d'],

    ['#00b543', '#ffccaa', '#ff6c24', '#1e839d'],
    ['#742f29', '#ffccaa', '#ffec27', '#ff6c24'],
    ['#ff6c24', '#ffccaa', '#c2c3c7', '#413830'],
    ['#413830', '#ffccaa', '#be1250', '#422136'],
    ['#413830', '#ffccaa', '#ff6c24', '#8f3f17'],
    ['#413830', '#ffccaa', '#ff6c24', '#8f3f17'],
    ['#742f29', '#ffccaa', '#a8e72e', '#413830']

];
var REF_COLORS_RGB = [];
var AVATAR_PALETTES_RGB = [];

//preset colors
var COLORS = ['#FFEC27', '#00E436', '#29ADFF', '#FF77A8', '#FF004D', '#FCA'];
var LABEL_NEUTRAL_COLOR = "#FFFFFF";
var UI_BG = "#000000";

//preloaded images
var avatarSpriteSheets = [];

//current bg and areas
var bg;
var areas;
//command quequed for when the destination comes
var nextCommand;
//my client only, rollover info
var areaLabel;
var labelColor;
var rolledSprite;

var menuBg, arrowButton;
var menuGroup;

//description text variables, my client only
var longText = "";
var longTextLines;
var longTextAlign;
var longTextLink = "";
var LONG_TEXT_BOX_W = 220;
var LONG_TEXT_PADDING = 4;

var TEXT_H = 8;
var TEXT_PADDING = 3;
var TEXT_LEADING = TEXT_H + 4;
//speech bubbles
var bubbles = [];

//these are number, no need to send images
var currentAvatar;
var currentColor;
var roomColor;
var FONT_SIZE = 16; //to avoid blur
var font;
var ASSETS_FOLDER = "assets/";

var defaultRoom = "likelike";

//prevent from spamming messages, enforced by the server too 
var ANTI_SPAM = 1000;
//set the time at the beginning of the time, the SEVENTIES
var lastMessage = 0;

//animation
var avatarPreview;


//setup is called when all the assets have been loaded
function preload() {

    for (var i = 0; i < 37; i++)
        avatarSpriteSheets[i] = loadImage(ASSETS_FOLDER + "character" + i + ".png");

    //avatarSpriteSheets = [];
    //avatarSpriteSheets[0] = loadImage(ASSETS_FOLDER + "character.png");

    //preload images
    for (var roomId in ROOMS) {
        if (ROOMS.hasOwnProperty(roomId)) {
            var room = ROOMS[roomId];
            room.bgGraphics = loadImage(ASSETS_FOLDER + room.bg);
            room.areaGraphics = loadImage(ASSETS_FOLDER + room.area);

            //preload sprites if any
            if (ROOMS[roomId].sprites != null)
                for (var i = 0; i < ROOMS[roomId].sprites.length; i++) {
                    var spr = ROOMS[roomId].sprites[i];
                    spr.spriteGraphics = loadImage(ASSETS_FOLDER + spr.file);
                }

        }
    }

    REF_COLORS_RGB = [];
    //to make the palette swap faster I save colors as arrays 
    for (var i = 0; i < REF_COLORS.length; i++) {
        var rc = REF_COLORS[i];
        var r = red(rc);
        var g = green(rc);
        var b = blue(rc);
        REF_COLORS_RGB[i] = [r, g, b];
    }

    AVATAR_PALETTES_RGB = [];

    //to make the palette swap faster I save colors as arrays 
    for (var i = 0; i < AVATAR_PALETTES.length; i++) {

        AVATAR_PALETTES_RGB[i] = [];

        //each color
        for (var j = 0; j < AVATAR_PALETTES[i].length; j++) {

            var rc = AVATAR_PALETTES[i][j];
            var r = red(rc);
            var g = green(rc);
            var b = blue(rc);
            AVATAR_PALETTES_RGB[i][j] = [r, g, b];
        }
    }

    menuBg = loadImage(ASSETS_FOLDER + "menu_white.png");
    arrowButton = loadImage(ASSETS_FOLDER + "arrowButton.png");


    //MONOSPACED FONT
    //thank you https://datagoblin.itch.io/monogram
    font = loadFont('assets/monogram_extended.ttf');

}

function setup() {
    /*
    //assign random name and avatar and get to the game
    if (QUICK_LOGIN) {
        nickName = "user" + floor(random(0, 1000));
        hideLobby();
        nameOk();
        avatarSelection();
        newGame();
    }
    else {
        screen = "lobby";
    }*/

    canvasSetup();
    screen = "lobby";
    showUser();

}

function windowResized() {
    scaleCanvas();
    print("CANVAS RESIZE");
}

function canvasSetup() {
    //create a canvas
    canvas = createCanvas(WIDTH, HEIGHT);
    //accept only the clicks on the canvas (not the ones on the UI)
    canvas.mouseReleased(canvasClicked);
    //by default the canvas is attached to the bottom, i want a 
    canvas.parent('canvas-container');
    canvas.mouseOut(outOfCanvas);

    scaleCanvas();

    //since my avatars are pixelated and scaled I kill the antialiasing on canvas
    noSmooth();
}

function scaleCanvas() {
    //landscape scale to height
    if (windowWidth > windowHeight) {
        canvasScale = windowHeight / WIDTH; //scale to W because I want to leave room for chat and instructions (squareish)
        canvas.style("width", WIDTH * canvasScale + "px");
        canvas.style("height", HEIGHT * canvasScale + "px");
    }
    else {
        canvasScale = windowWidth / WIDTH;
        canvas.style("width", WIDTH * canvasScale + "px");
        canvas.style("height", HEIGHT * canvasScale + "px");
    }

    var container = document.getElementById("canvas-container");
    container.setAttribute("style", "width:" + WIDTH * canvasScale + "px; height: " + HEIGHT * canvasScale + "px");

    var form = document.getElementById("interface");
    form.setAttribute("style", "width:" + WIDTH * canvasScale + "px;");

}

//I could do this in DOM (regular html and javascript elements) 
//but I want to show a canvas with html overlay
function avatarSelection() {
    menuGroup = new Group();
    screen = "avatar";

    //buttons
    var previousBody, nextBody, previousColor, nextColor;

    var ss = loadSpriteSheet(arrowButton, 28, 28, 3);
    var animation = loadAnimation(ss);

    //the position is the bottom left
    previousBody = createSprite(8 * ASSET_SCALE + 14, 47 * ASSET_SCALE + 14);
    previousBody.addAnimation("default", animation);
    previousBody.animation.stop();
    previousBody.mirrorX(-1);
    menuGroup.add(previousBody);

    nextBody = createSprite(24 * ASSET_SCALE + 14, 47 * ASSET_SCALE + 14);
    nextBody.addAnimation("default", animation);
    nextBody.animation.stop();
    menuGroup.add(nextBody);

    previousColor = createSprite(90 * ASSET_SCALE + 14, 47 * ASSET_SCALE + 14);
    previousColor.addAnimation("default", animation);
    previousColor.animation.stop();
    previousColor.mirrorX(-1);
    menuGroup.add(previousColor);

    nextColor = createSprite(106 * ASSET_SCALE + 14, 47 * ASSET_SCALE + 14);
    nextColor.addAnimation("default", animation);
    nextColor.animation.stop();
    menuGroup.add(nextColor);

    previousBody.onMouseOver = nextBody.onMouseOver = previousColor.onMouseOver = nextColor.onMouseOver = function () {
        this.animation.changeFrame(1);
    }
    previousBody.onMouseOut = nextBody.onMouseOut = previousColor.onMouseOut = nextColor.onMouseOut = function () {
        this.animation.changeFrame(0);
    }

    previousBody.onMousePressed = nextBody.onMousePressed = previousColor.onMousePressed = nextColor.onMousePressed = function () {
        this.animation.changeFrame(2);
    }

    previousBody.onMouseReleased = function () {
        currentAvatar -= 1;
        if (currentAvatar < 0)
            currentAvatar = avatarSpriteSheets.length - 1;

        previewAvatar();
        this.animation.changeFrame(1);
    }

    nextBody.onMouseReleased = function () {
        currentAvatar += 1;
        if (currentAvatar >= avatarSpriteSheets.length)
            currentAvatar = 0;

        previewAvatar();
        this.animation.changeFrame(1);
    }

    previousColor.onMouseReleased = function () {
        currentColor -= 1;
        if (currentColor < 0)
            currentColor = AVATAR_PALETTES.length - 1;

        previewAvatar();
        this.animation.changeFrame(1);
    }

    nextColor.onMouseReleased = function () {
        currentColor += 1;
        if (currentColor >= AVATAR_PALETTES.length)
            currentColor = 0;

        previewAvatar();
        this.animation.changeFrame(1);
    }

    //nextBody.onMouseReleased = previousColor.onMouseReleased = nextColor.onMouseReleased = function () {

    randomAvatar();
}



function newGame() {
    screen = "game";
    nextCommand = null;
    areaLabel = "";
    rolledSprite = null;
    hideUser();
    hideAvatar();
    showChat();


    /*
    //This is to visualize framerate independent movements
    var fps = random(30, 60);
    frameRate(fps);
    console.log("Simulating a framerate of " + fps);
    */

    //paint background
    roomColor = color("#FFF1E8");
    background(roomColor);


    //initialize players as object
    players = {};

    //I create socket but I wait to assign all the functions before opening a connection
    socket = io({
        autoConnect: false
    });

    //if the client detects a server connection it may be because the server restarted 
    //in that case the clients reconnect automatically and are assigned new ids so I have to clear
    //the previous player list to avoid ghosts
    socket.on('connect', function () {
        players = {};
        deleteAllSprites();
        bubbles = [];

        spawnZone = ROOMS[defaultRoom].spawn;

        //randomize position
        var sx = round(random(spawnZone[0] * ASSET_SCALE, spawnZone[2] * ASSET_SCALE));
        var sy = round(random(spawnZone[1] * ASSET_SCALE, spawnZone[3] * ASSET_SCALE));


        //send the server my name and avatar
        socket.emit('join', { nickName: nickName, color: currentColor, avatar: currentAvatar, room: defaultRoom, x: sx, y: sy });
    });

    //when somebody joins the game create a new player
    socket.on('playerJoined',
        function (p) {

            console.log("new player in the room " + p.room + " " + p.id + " " + p.x + " " + p.y + " color " + p.color);

            //stop moving
            p.destinationX = p.x;
            p.destinationY = p.y;

            //if it's me
            if (socket.id == p.id) {
                players = {};
                bubbles = [];

                deleteAllSprites();

                players[p.id] = me = new Player(p);
                me.sprite.mouseActive = false;
                me.sprite.onMouseOver = function () { };
                me.sprite.onMouseOut = function () { };


                //load level background
                try {
                    //can be static or spreadsheet
                    var bgg = ROOMS[p.room].bgGraphics;
                    //find frame number
                    var f = 1;
                    if (ROOMS[p.room].frames != null)
                        f = ROOMS[p.room].frames;

                    var ss = loadSpriteSheet(bgg, WIDTH, HEIGHT, f);
                    bg = loadAnimation(ss);

                    if (ROOMS[p.room].frameDelay != null) {
                        bg.frameDelay = ROOMS[p.room].frameDelay;
                    }

                    areas = ROOMS[p.room].areaGraphics;
                    if (areas == null)
                        print("ERROR: no area assigned to  " + p.room);

                    //create sprites
                    if (ROOMS[p.room].sprites != null)
                        for (var i = 0; i < ROOMS[p.room].sprites.length; i++) {
                            var sprite = ROOMS[p.room].sprites[i];

                            var f = 1;

                            if (sprite.frames != null)
                                f = sprite.frames;

                            var sw = floor(sprite.spriteGraphics.width / f);
                            var sh = sprite.spriteGraphics.height;

                            var ss = loadSpriteSheet(sprite.spriteGraphics, sw, sh, f);
                            var animation = loadAnimation(ss);

                            if (sprite.frameDelay != null)
                                animation.frameDelay = sprite.frameDelay;


                            //the position is the bottom left
                            var newSprite = createSprite(sprite.position[0] * ASSET_SCALE + floor(sw / 2), sprite.position[1] * ASSET_SCALE + floor(sh / 2));
                            newSprite.addAnimation("default", animation);

                            //if label make it rollover reactive
                            newSprite.label = sprite.label;
                            if (sprite.label != null) {

                                newSprite.onMouseOver = function () {
                                    rolledSprite = this;
                                };

                                newSprite.onMouseOut = function () {
                                    if (rolledSprite == this)
                                        rolledSprite = null;
                                };
                            }
                            //if command, make it interactive like an area
                            if (sprite.command != null) {
                                newSprite.command = sprite.command;

                                newSprite.onMouseReleased = function () {
                                    if (rolledSprite == this)
                                        moveToCommand(this.command);
                                };
                            }

                        }
                    //sprites: [
                    //    { file: "pink-cabinet.png", position: [24, 89], label: "A time traveling game", command: { cmd: "link", arg: "https://cephalopodunk.itch.io/the-last-human-touch", label: "A time traveling game", point: [33, 95] } }
                    //]
                }
                catch (e) {
                    console.log("Error room " + p.room + " has no bacground image");
                }
            }
            else {
                //
                players[p.id] = new Player(p);

                //console.log("I shall introduce myself to " + p.id);

                //If I'm not the new player send an introduction to the new player
                socket.emit('intro', p.id, {
                    id: socket.id,
                    nickName: me.nickName,
                    color: me.color,
                    avatar: me.avatar,
                    room: me.room,
                    x: me.x,
                    y: me.y,
                    destinationX: me.destinationX,
                    destinationY: me.destinationY
                });
            }

            console.log("There are now " + Object.keys(players).length + " players in this room");

        }
    );

    //each existing player sends me an object with their parameters
    socket.on('onIntro',
        function (p) {
            //console.log("Hello newcomer I'm " + p.nickName + " " + p.id);
            players[p.id] = new Player(p);
            console.log("There are now " + Object.keys(players).length + " players in this room");
        }
    );


    //when somebody clicks to move, update the destination (not the position)
    socket.on('playerMoved',
        function (p) {
            console.log(p.id + " moves to: " + p.destinationX + " " + p.destinationY);

            //make sure the player exists
            if (players.hasOwnProperty(p.id)) {
                //players[p.id].x = p.x;
                //players[p.id].y = p.y;
                players[p.id].destinationX = p.destinationX;
                players[p.id].destinationY = p.destinationY;
            }
        });


    //when somebody disconnects/leaves the room
    socket.on('playerLeft',
        function (p) {
            console.log("Player " + p.id + " left");

            if (players[p.id] != null)
                removeSprite(players[p.id].sprite);

            delete players[p.id];
            console.log("There are now " + Object.keys(players).length + " players in this room");
        }
    );



    //when somebody talks
    socket.on('playerTalked',
        function (p) {
            console.log("new message from " + p.id + ": " + p.message + " color " + p.color);
            var playerId = p.id;
            //make sure the player exists in the client
            if (players.hasOwnProperty(p.id)) {

                //minimum y of speech bubbles depends on room, typically higher half
                var offY = ROOMS[me.room].bubblesY * ASSET_SCALE;
                var newBubble = new Bubble(p.id, p.message, p.color, p.x, p.y, offY);

                pushBubbles(newBubble);
                bubbles.push(newBubble);
            }
        }

    );

    //when a server message arrives
    socket.on('serverMessage',
        function (msg) {
            if (socket.id) {
                console.log("Message from server: " + msg);
            }
        }

    );

    socket.open();

}

//this p5 function is called continuously 60 times per second by default
function draw() {
    if (screen == "lobby") {
        image(menuBg, 0, 0, WIDTH, HEIGHT);
    }
    //renders the avatar selection screen which can be fully within the canvas
    if (screen == "avatar") {
        image(menuBg, 0, 0, WIDTH, HEIGHT);

        //background(240, 240, 240);
        drawSprites();
        //menuGroup.drawSprites();


    }
    if (screen == "game") {
        //draw a background
        background(roomColor);
        imageMode(CORNER);

        if (bg != null) {
            animation(bg, floor(WIDTH / 2), floor(HEIGHT / 2));
        }


        textFont(font, FONT_SIZE);
        //text("ABCDE abcde", round(width / 2), (height / 2));

        //iterate through the players
        for (var playerId in players) {
            if (players.hasOwnProperty(playerId)) {

                var p = players[playerId];

                var prevX, prevY;


                //make sure the coordinates are non null since I may have created a player
                //but I may still be waiting for the first update
                if (p.x != null && p.y != null) {
                    //save in case of undo
                    prevX = p.x;
                    prevY = p.y;

                    //position and destination are different, move
                    if (p.x != p.destinationX || p.y != p.destinationY) {

                        //a series of vector operations to move toward a point at a linear speed

                        // create vectors for position and dest.
                        var destination = createVector(p.destinationX, p.destinationY);
                        var position = createVector(p.x, p.y);

                        // Calculate the distance between your destination and position
                        var distance = destination.dist(position);

                        // this is where you actually calculate the direction
                        // of your target towards your rect. subtraction dx-px, dy-py.
                        var delta = destination.sub(position);

                        // then you're going to normalize that value
                        // (normalize sets the length of the vector to 1)
                        delta.normalize();

                        // then you can multiply that vector by the desired speed
                        var increment = delta.mult(SPEED * deltaTime / 1000);

                        /*
                        IMPORTANT
                        deltaTime The system variable deltaTime contains the time difference between 
                        the beginning of the previous frame and the beginning of the current frame in milliseconds.
                        the speed is not based on the client framerate which can be variable but on the actual time that passes
                        between frames. Replace deltaTime with 30 and uncomment the random frameRate at the beginning
                        */

                        //increment the position
                        position.add(increment);


                        //calculate new distance
                        var newDistance = position.dist(createVector(p.destinationX, p.destinationY));

                        //if I got farther than I was originally I overshot so set position to destination
                        if (newDistance > distance) {

                            p.x = p.destinationX;
                            p.y = p.destinationY;
                            p.stopAnimation();

                        }
                        else {
                            //this system is not pathfinding but it makes characters walk "around" corners instead of getting stuck
                            //test new position for obstacle repeat for both sides
                            var obs = isObstacle(position.x - AVATAR_W / 2, position.y, p.room, areas);
                            var obs2 = isObstacle(position.x + AVATAR_W / 2, position.y, p.room, areas);

                            if (!obs && !obs2) {
                                p.x = position.x;
                                p.y = position.y;
                                p.playAnimation();
                            }
                            //if obstacle test only x movement
                            else {

                                var obsX = isObstacle(position.x - AVATAR_W / 2, p.y, p.room, areas);
                                var obsX2 = isObstacle(position.x + AVATAR_W / 2, p.y, p.room, areas);

                                //if not obstacle move only horizontally at full speed
                                if (!obsX && !obsX2 && abs(delta.x) > 0.1) {

                                    p.x += SPEED * deltaTime / 1000 * (p.x > position.x) ? -1 : 1;
                                    p.playAnimation();

                                }
                                else {
                                    //if obs on y test the y
                                    var obsY = isObstacle(p.x - AVATAR_W / 2, position.y, p.room, areas);
                                    var obsY2 = isObstacle(p.x + AVATAR_W / 2, position.y, p.room, areas);

                                    if (!obsY && !obsY2 && abs(delta.y) > 0.1) {

                                        p.y += SPEED * deltaTime / 1000 * (p.y > position.y) ? -1 : 1;
                                        p.playAnimation();

                                    }
                                    else {
                                        //if not complete block
                                        p.destinationX = p.x;
                                        p.destinationY = p.y;
                                        p.stopAnimation();
                                        //cancel command if me
                                        if (p == me) {
                                            nextCommand = null;

                                            //stop if moving
                                            socket.emit('move', { x: me.x, y: me.y, room: me.room, destinationX: me.x, destinationY: me.y });
                                        }
                                    }

                                }
                            }

                            //change dir
                            if (prevX != p.x) {
                                p.dir = (prevX > p.x) ? -1 : 1;
                                p.sprite.mirrorX(p.dir);
                            }
                        }

                    }
                    else {
                        p.stopAnimation();
                    }

                    //////this part is only triggered by ME
                    if (p == me) {
                        //reached destination, execute action
                        if (me.x == me.destinationX && me.y == me.destinationY && nextCommand != null) {
                            executeCommand(nextCommand);
                            nextCommand = null;
                        }

                    }//

                    p.updatePosition();

                }

            }
        }//player update cycle


        //set the existing sprites' depths in relation to their position
        for (var i = 0; i < allSprites.length; i++) {
            //sprites on the bottom will be drawn first
            allSprites[i].depth = allSprites[i].position.y + allSprites[i].height / 2;

        }

        //
        drawSprites();

        //GUI


        //draw all the speech bubbles lines first only if the players have not moves since speaking
        for (var i = 0; i < bubbles.length; i++) {
            var b = bubbles[i];
            var speaker = players[bubbles[i].pid];
            if (speaker != null && !b.orphan) {
                if (round(speaker.x) == b.px && round(speaker.y) == b.py) {
                    var s = ROOMS[speaker.room].avatarScale;

                    strokeWeight(s);
                    stroke(UI_BG);
                    strokeCap(SQUARE);
                    line(floor(speaker.x), floor(speaker.y - AVATAR_H * s - BUBBLE_MARGIN), floor(speaker.x), floor(b.y));
                }
                else {
                    //once it moves break the line
                    b.orphan = true;
                }
            }
        }



        //draw speech bubbles
        for (var i = 0; i < bubbles.length; i++) {
            bubbles[i].update();
        }
        //delete the expired ones
        for (var i = 0; i < bubbles.length; i++) {
            if (bubbles[i].counter < 0) {
                bubbles.splice(i, 1);
                i--; //decrement
            }
        }

        var label = areaLabel;
        var labelColor = LABEL_NEUTRAL_COLOR;

        //player and sprites label override areas
        if (rolledSprite != null && rolledSprite != me.sprite) {
            if (rolledSprite.label != null) {
                label = rolledSprite.label;
            }

            if (rolledSprite.labelColor != null) {
                labelColor = rolledSprite.labelColor;
            }
        }


        //draw rollover label
        if (label != "" && longText == "") {
            textFont(font, FONT_SIZE);
            textAlign(LEFT, BASELINE);
            var lw = textWidth(label);
            var lx = mouseX;

            if ((mouseX + lw + TEXT_PADDING * 2) > width) {
                lx = width - lw - TEXT_PADDING * 2;
            }
            fill(UI_BG);
            noStroke();
            rect(floor(lx), floor(mouseY - TEXT_H - TEXT_PADDING * 2), lw + TEXT_PADDING * 2 + 1, TEXT_H + TEXT_PADDING * 2 + 1);
            fill(labelColor);
            text(label, floor(lx + TEXT_PADDING) + 1, floor(mouseY - TEXT_PADDING));
        }

        //long text above everything
        if (longText != "") {

            noStroke();
            textFont(font, FONT_SIZE);
            textLeading(TEXT_LEADING);

            if (longTextAlign == "left")
                textAlign(LEFT, BASELINE);
            else
                textAlign(CENTER, BASELINE);

            //measuring text height requires a PhD so we
            //require the user to do trial and error and counting the lines
            //and use some magic numbers

            var tw = LONG_TEXT_BOX_W - LONG_TEXT_PADDING * 2;
            var th = longTextLines * TEXT_LEADING;

            if (longTextAlign == "center" && longTextLines == 1)
                tw = textWidth(longText + " ");

            var rw = tw + LONG_TEXT_PADDING * 2;
            var rh = th + LONG_TEXT_PADDING * 2;

            fill(UI_BG);

            rect(floor(width / 2 - rw / 2), floor(height / 2 - rh / 2), floor(rw), floor(rh));
            //rect(20, 20, 100, 50);

            fill(LABEL_NEUTRAL_COLOR);
            text(longText, floor(width / 2 - tw / 2 + LONG_TEXT_PADDING - 1), floor(height / 2 - th / 2) + TEXT_LEADING - 3, floor(tw));

        }


    }

    //

}


//copy the properties
function Player(p) {
    this.id = p.id;
    this.nickName = p.nickName;
    this.color = p.color;
    this.avatar = p.avatar;

    this.tint = color("#FFFFFF");

    if (ROOMS[p.room].tint != null) {
        this.tint = color(ROOMS[p.room].tint);
    }

    //tint the image
    this.avatarGraphics = paletteSwap(avatarSpriteSheets[p.avatar], AVATAR_PALETTES_RGB[p.color], this.tint);//avatarSpriteSheets[p.avatar];////tintGraphics(avatarSpriteSheets[p.avatar], COLORS[p.color]);
    this.spriteSheet = loadSpriteSheet(this.avatarGraphics, AVATAR_W, AVATAR_H, round(avatarSpriteSheets[p.avatar].width / AVATAR_W));
    this.walkAnimation = loadAnimation(this.spriteSheet);
    this.sprite = createSprite(100, 100);

    this.sprite.scale = 2;

    this.sprite.addAnimation('walk', this.walkAnimation);
    this.sprite.mouseActive = true;
    //this.sprite.debug = true;

    //no parent in js? WHAAAAT?
    this.sprite.id = this.id;
    this.sprite.label = p.nickName;
    //this.sprite.labelColor = COLORS[p.color];

    //save the dominant color for bubbles and rollover label
    var c = color(AVATAR_PALETTES[p.color][2]);

    if (brightness(c) > 30)
        this.sprite.labelColor = color(AVATAR_PALETTES[p.color][2]);
    else
        this.sprite.labelColor = color(AVATAR_PALETTES[p.color][3]);

    this.room = p.room;
    this.x = p.x;
    this.y = p.y;
    this.dir = 1;
    this.destinationX = p.destinationX;
    this.destinationY = p.destinationY;

    this.stopAnimation = function () {
        this.sprite.animation.changeFrame(0);
        this.sprite.animation.stop();
    }

    this.playAnimation = function () {
        this.sprite.animation.play();
    }

    this.updatePosition = function () {

        this.sprite.position.x = round(this.x);
        this.sprite.position.y = round(this.y - AVATAR_H / 2 * this.sprite.scale);
    }


    this.sprite.onMouseOver = function () {
        rolledSprite = this;
    };

    this.sprite.onMouseOut = function () {
        if (rolledSprite == this)
            rolledSprite = null;
    };

    this.sprite.onMousePressed = function () {

    };

    this.stopAnimation();
}


//they exist in a different container so kill them
function deleteAllSprites() {
    allSprites.removeSprites();
}

//speech bubble object
function Bubble(pid, message, col, x, y, oy) {
    //always starts at row zero

    this.row = 0;
    this.pid = pid;
    this.message = message;

    //the color is the 3rd color in the palette unless too dark, in that case it's the second
    var c = color(AVATAR_PALETTES[col][2]);

    if (brightness(c) > 30)
        this.color = color(AVATAR_PALETTES[col][2]);
    else
        this.color = color(AVATAR_PALETTES[col][3]);

    this.orphan = false;
    this.counter = MIN_BUBBLE_TIME + message.length * BUBBLE_TIME;

    //to fix an inexplicable bug that mangles bitmap text on small textfields
    //I scale short messages
    this.fontScale = 1;
    if (message.length < 4) {
        this.fontScale = 2;
        this.message = this.message.toUpperCase();
    }


    textFont(font, FONT_SIZE * this.fontScale);
    textAlign(LEFT, BASELINE);
    this.tw = textWidth(this.message);
    //whole bubble with frame
    this.w = round(this.tw + TEXT_PADDING * 2);
    this.h = round(TEXT_H + TEXT_PADDING * 2 * this.fontScale);

    //save the original player position so I can render a line as long as they are not moving
    this.px = round(x);
    this.py = round(y);

    this.offY = oy;

    this.x = round(this.px - this.w / 2);
    if (this.x + this.w + BUBBLE_MARGIN > width) {
        this.x = width - this.w - BUBBLE_MARGIN
    }
    if (this.x < BUBBLE_MARGIN) {
        this.x = BUBBLE_MARGIN;
    }


    this.update = function () {
        this.counter -= deltaTime / 1000;

        noStroke();
        textFont(font, FONT_SIZE * this.fontScale);
        textAlign(LEFT, BASELINE);
        rectMode(CORNER);
        fill(UI_BG);
        this.y = this.offY - floor((TEXT_H + TEXT_PADDING * 2 + BUBBLE_MARGIN) * this.row);
        rect(this.x, this.y, this.w + 1, this.h);
        fill(this.color);
        text(this.message, floor(this.x + TEXT_PADDING) + 1, floor(this.h + this.y - TEXT_PADDING));

    }
}

//move bubbles up if necessary
function pushBubbles(b) {

    //go through bubbles
    for (var i = 0; i < bubbles.length; i++) {
        if (bubbles[i] != b && bubbles[i].row == b.row) {
            //this bubble is on the same row, will they overlap?
            if (b.x < (bubbles[i].x + bubbles[i].w) && (b.x + b.w) > bubbles[i].x) {
                bubbles[i].row++;
                pushBubbles(bubbles[i]);
                //if off screen mark for deletion
                if (bubbles[i].y - bubbles[i].h < 0)
                    bubbles[i].counter = -1;
            }

        }
    }
}



function isObstacle(x, y, room, a) {
    var obs = true;

    if (room != null && a != null) {

        var c1 = a.get(x, y);

        //if not white check if color is obstacle
        if (c1[0] != 255 || c1[1] != 255 || c1[2] != 255) {
            var cmd = getCommand(c1, room);

            if (cmd != null)
                if (cmd.obstacle != null)
                    obs = cmd.obstacle;
        }
        else
            obs = false; //if white

    }
    return obs;
}

//rollover state
function mouseMoved() {
    if (areas != null && me != null) {
        var c = areas.get(mouseX, mouseY);
        areaLabel = "";

        if (alpha(c) != 0 && me.room != null) {
            //walk icon?
            if (c[0] == 255 && c[1] == 255 && c[2] == 255) {
            }
            else {

                var command = getCommand(c, me.room);
                if (command != null)
                    if (command.label != null) {
                        areaLabel = command.label;
                    }
            }
        }

    }
}

//when I click to move
function canvasClicked() {

    //exit text
    if (longText != "") {

        if (longTextLink != "")
            window.open(longTextLink, '_blank');

        longText = "";
        longTextLink = "";

    }
    else if (me != null) {
        //clicked on person
        if (rolledSprite != null) {

            //click on player sprite attempt to move next to them
            if (rolledSprite.id != null) {
                nextCommand = null;
                var t = players[rolledSprite.id];
                if (t != null) {
                    var d = (me.x < t.x) ? -(AVATAR_W * 2) : (AVATAR_W * 2);
                    socket.emit('move', { x: me.x, y: me.y, room: me.room, destinationX: t.x + d, destinationY: t.y });
                }
            }
        }
        //check the area info
        else if (areas != null && me.room != null) {

            var c = areas.get(mouseX, mouseY);

            //if transparent or semitransparent do nothing
            if (alpha(c) != 255) {
                //cancel command
                nextCommand = null;
                //stop if moving
                if (me.x != me.destinationX && me.y != me.destinationY)
                    socket.emit('move', { x: me.x, y: me.y, room: me.room, destinationX: me.x, destinationY: me.y });
            }
            else if (c[0] == 255 && c[1] == 255 && c[2] == 255) {
                //if white, generic walk stop command
                nextCommand = null;
                console.log("walk to " + mouseX + ", " + mouseY);
                socket.emit('move', { x: me.x, y: me.y, room: me.room, destinationX: mouseX, destinationY: mouseY });
            }
            else {
                //if something else check the commands
                var command = getCommand(c, me.room);

                //walk and executed when you arrive or stop
                if (command != null)
                    moveToCommand(command);
            }
        }


    }


}

//queue a command, move to the point
function moveToCommand(command) {

    nextCommand = command;

    //I need to change my destination locally before the message bouces back

    if (command.point != null) {
        me.destinationX = command.point[0] * ASSET_SCALE;
        me.destinationY = command.point[1] * ASSET_SCALE;
        socket.emit('move', { x: me.x, y: me.y, room: me.room, destinationX: command.point[0] * ASSET_SCALE, destinationY: command.point[1] * ASSET_SCALE });
    }
    else //just move where you clicked (area) 
    {
        me.destinationX = mouseX;
        me.destinationY = mouseY;
        socket.emit('move', { x: me.x, y: me.y, room: me.room, destinationX: mouseX, destinationY: mouseY });
    }

}

function getCommand(c, roomId) {
    try {
        //turn color into string
        var cString = color(c).toString('#rrggbb');//for com

        var areaColors = ROOMS[roomId].areaColors;
        var command;

        //go through properties
        for (var colorId in areaColors) {

            if (areaColors.hasOwnProperty(colorId)) {
                var aString = "#" + colorId.substr(1);

                if (aString == cString) {
                    //color found
                    command = areaColors[colorId];

                }
            }
        }
    }
    catch (e) {
        console.log("Get command error " + roomId + " color " + c);
        console.error(e);
    }

    return command;
}


function executeCommand(c) {
    areaLabel = "";
    print("Executing command " + c.cmd);
    switch (c.cmd) {
        case "enter":
            var sx, sy;
            if (c.enterPoint != null) {
                sx = c.enterPoint[0] * ASSET_SCALE;
                sy = c.enterPoint[1] * ASSET_SCALE;
                socket.emit('changeRoom', { from: me.room, to: c.room, x: sx, y: sy });

            }
            else if (ROOMS[c.room].spawn != null) {
                spawnZone = ROOMS[c.room].spawn;
                sx = round(random(spawnZone[0] * ASSET_SCALE, spawnZone[2] * ASSET_SCALE));
                sy = round(random(spawnZone[1] * ASSET_SCALE, spawnZone[3] * ASSET_SCALE));
                socket.emit('changeRoom', { from: me.room, to: c.room, x: sx, y: sy });

            }
            else {
                console.log("ERROR: No spawn point or area set for " + c.room);
            }

            break;


        case "text":
            if (c.txt != null) {

                longText = c.txt;
                if (c.lines != null)
                    longTextLines = c.lines;
                else
                    longTextLines = 1;

                if (c.align != null)
                    longTextAlign = c.align;
                else
                    longTextAlign = "center";//or center

                if (c.url == null)
                    longTextLink = "";
                else
                    longTextLink = c.url;

            }
            else
                print("Warning for text: make sure to specify arg as text")


            break;


    }

}

//For better user experience I automatically focus on the chat textfield upon pressing a key
function keyPressed() {
    if (screen == "game") {
        var field = document.getElementById("chatField");
        field.focus();
    }
    if (screen == "lobby") {
        var field = document.getElementById("lobby-field");
        field.focus();
    }
}

//when I hits send
function talk(msg) {

    if (msg.replace(/\s/g, '') != "")
        socket.emit('talk', { message: msg, color: me.color, room: me.room, x: me.x, y: me.y });
}

//called by the talk button in the html
function getTalkInput() {

    var time = new Date().getTime();

    if (time - lastMessage > ANTI_SPAM) {
        // Selecting the input element and get its value 
        var inputVal = document.getElementById("chatField").value;
        //sending it to the talk function in sketch
        talk(inputVal);
        document.getElementById("chatField").value = "";
        //save time
        lastMessage = time;
    }
    //prevent page from refreshing (default form behavior)
    return false;
}

//called by the continue button in the html
function nameOk() {
    var v = document.getElementById("lobby-field").value;

    if (v != "") {
        nickName = v;
        console.log(">welcome " + nickName);
        hideUser();
        showAvatar();
        //the div container

        //the canvas background
        avatarSelection();
        //prevent page from refreshing on enter (default form behavior)
        return false;
    }

}

//draws a random avatar body in the center of the canvas
//colors it a random color
function randomAvatar() {
    currentColor = floor(random(0, AVATAR_PALETTES.length));
    currentAvatar = floor(random(0, avatarSpriteSheets.length));
    previewAvatar();
}

function previewAvatar() {

    if (avatarPreview != null)
        removeSprite(avatarPreview);

    var aGraphics = paletteSwap(avatarSpriteSheets[currentAvatar], AVATAR_PALETTES_RGB[currentColor]);//avatarSpriteSheets[p.avatar];////tintGraphics(avatarSpriteSheets[p.avatar], COLORS[p.color]);
    var aSS = loadSpriteSheet(aGraphics, AVATAR_W, AVATAR_H, round(avatarSpriteSheets[currentAvatar].width / AVATAR_W));
    var aAnim = loadAnimation(aSS);
    avatarPreview = createSprite(width / 2, height / 2);
    avatarPreview.scale = 4;
    avatarPreview.addAnimation("default", aAnim);
    //avatarPreview.debug = true;
    avatarPreview.animation.stop();

}

function paletteSwap(ss, palette, t) {

    var tint = [255, 255, 255];

    if (t != null)
        tint = [red(t), green(t), blue(t)];

    var img = createImage(ss.width, ss.height);
    img.copy(ss, 0, 0, ss.width, ss.height, 0, 0, ss.width, ss.height);
    img.loadPixels();

    for (var i = 0; i < img.pixels.length; i += 4) {

        if (img.pixels[i + 3] == 255) {
            var found = false;

            //non transparent pix replace with palette
            for (var j = 0; j < REF_COLORS_RGB.length && !found; j++) {

                if (img.pixels[i] == REF_COLORS_RGB[j][0] && img.pixels[i + 1] == REF_COLORS_RGB[j][1] && img.pixels[i + 2] == REF_COLORS_RGB[j][2]) {
                    found = true;
                    img.pixels[i] = palette[j][0] * tint[0] / 255;
                    img.pixels[i + 1] = palette[j][1] * tint[1] / 255;
                    img.pixels[i + 2] = palette[j][2] * tint[2] / 255;
                }

            }
        }
    }
    img.updatePixels();

    return img;
}

function tintGraphics(img, colorString) {

    var c = color(colorString);
    let pg = createGraphics(img.width, img.height);
    pg.noSmooth();
    pg.tint(red(c), green(c), blue(c), 255);
    pg.image(img, 0, 0, img.width, img.height);
    //i need to convert it back to image in order to use it as spritesheet
    var img = createImage(pg.width, pg.height);
    img.copy(pg, 0, 0, pg.width, pg.height, 0, 0, pg.width, pg.height);

    return img;
}

function bodyOk() {

    newGame();
}

function keyTyped() {
    if (screen == "avatar") {
        if (keyCode === ENTER || keyCode === RETURN) {
            newGame();
        }
    }
}

function showUser() {
    var e = document.getElementById("user-form");
    if (e != null)
        e.style.display = "block";

    e = document.getElementById("lobby-container");
    if (e != null)
        e.style.display = "block";
}

function hideUser() {
    var e = document.getElementById("user-form");
    if (e != null)
        e.style.display = "none";

    e = document.getElementById("lobby-container");
    if (e != null)
        e.style.display = "none";
}

function showAvatar() {

    var e = document.getElementById("avatar-form");
    if (e != null) {
        e.style.display = "block";
    }

}

function hideAvatar() {

    var e = document.getElementById("avatar-form");
    if (e != null)
        e.style.display = "none";
}

function showLobby() {
    document.getElementById("lobby-container").style.display = "block";
}

function hideLobby() {
    document.getElementById("lobby-container").style.display = "none";
}

//enable the chat input when it's time
function showChat() {
    var e = document.getElementById("talk-form");

    if (e != null)
        e.style.display = "block";
}

function hideChat() {
    var e = document.getElementById("talk-form");
    if (e != null)
        e.style.display = "none";
}

function outOfCanvas() {
    areaLabel = "";
    rolledSprite = null;
}
