//settings are just variables that can be sent to the client from the server
//they are either related to the rooms or shared with the server
module.exports.SETTINGS = {
  //if not specified by the url where is the starting point
  defaultRoom: "entrance",
  //minimum time between talk messages enforced by both client and server
  ANTI_SPAM: 1000,
  //shows up at first non lurking login
  INTRO_TEXT: "CClick around to move!!!!!"
};

module.exports.ROOMS = {
  likelike: {
    //the background graphics, it can be a spreadsheet
    bg: "entrance.png",
    //if spreadsheet frames
    frames: 1,
    //if animated, animation speed in refreshes (frame dependent)
    frameDelay: 0,
    //normally 2, avatars can be scaled to simulate camera distance
    avatarScale: 2,
    //a shade to tint the avatars to simulate light color, #FFFFFF normal
    tint: "#fa84af",
    //the html body color can be changed
    pageBg: "#6a2545",
    //minimum height for the speech bubbles
    bubblesY: 50,
    //if spawning directly in this room, top left and bottom right point defining the rectangular spawn area (random within it)
    spawn: [84, 92, 121, 99],
    //graphics with active areas Sierra Online adventures style
    //color coded as below, #FFFFFF is walkable, transparent is obstacle
    area: "likelike-areas.png",
    //each color can trigger a command, the destination needs to be reached first
    //the "h" is replaced by # to identify color
    areaColors: {
      //enter command changes room
      //room: id of the room to enter
      //label: what to display on rollover
      //point: where to walk after click
      //enterPoint: where to spawn in the next room
      //obstacle: is the area walkable
      hffec27: {
        cmd: "enter",
        room: "likelikeBackyard",
        label: "let's go outside!",
        point: [6, 88],
        enterPoint: [116, 69],
        obstacle: false
      },
      h00e436: {
        cmd: "enter",
        room: "entrance",
        label: "back to starting point...",
        point: [102, 98],
        enterPoint: [103, 84],
        obstacle: false
      },
      //text displays a text only on the client
      //txt: the text
      //align: center or left
      //lines: manual number of lines, p5 doesn't understand line breaks
      //url: uptionally open a page on click
      hff004d: {
        cmd: "text",
        txt: "Hot beverage!",
        align: "left",
        lines: 1,
        label: "a teacup",
        point: [34, 78],
        obstacle: true
      }
    },
    //array of sprites to create in the room
    //sprites are rendered according to depth sort so they can appear above the avatars unlike the background
    //they can be animated, mouse reactive and trigger commands like the areas above
    sprites: [
      //sprite spreadsheets only 1 row ok?
    ]
  },
entrance: {
    bg: "entrance.png",
    frames: 1,
    frameDelay: 0,
    avatarScale: 2,
    pageBg: "#000000",
    area: "entrance-areas.png",
    bubblesY: 44,
    spawn: [14, 84, 119, 92],
    areaColors: {
      //h will be replaced by #
      hb41c53: {
        cmd: "enter",
        room: "likelike",
        lines: 1,
        align: "left",
        label: "Finally: end of the day!",
        point: [100, 84],
        enterPoint: [104, 98],
        obstacle: false
      }
      //hb41c53: { cmd: "enter", room: "likelike", lines: 2, txt:"Non, pas ici !", label: "Enfin: la fin de la journée!", point: [50, 10], enterPoint: [104, 98], obstacle: false },
    }
  },

  likelikeBackyard: {
    bg: "entrance.png",
    frames: 2,
    frameDelay: 30,
    avatarScale: 2,
    area: "likelike-backyard-areas.png",
    tint: "#fdbe4e",
    pageBg: "#413830",
    bubblesY: 20,
    spawn: [38, 63, 108, 83],
    areaColors: {
      //h will be replaced by #
      hff77a8: {
        cmd: "enter",
        room: "likelike",
        label: "Let's go back to the first room",
        point: [119, 69],
        enterPoint: [5, 88],
        obstacle: false
      }
    },
    /*sprites: [
      //spreadsheets only 1 row ok?
      {
        file: "harvey.png",
        frames: 2,
        frameDelay: 10,
        position: [102, 77],
        label: "Harvey",
        command: {
          cmd: "text",
          txt: "*You pet the dog*",
          align: "center",
          lines: 1,
          point: [101, 84]
        }
      },
      { file: "likelike-backyard-chairs.png", position: [33, 44] }
    ]*/
  }
};
