# HOW TO CREATE A ROOM

_a short introduction to the codebase_

Basically, each room is composed of:

- a background image, visible by the user
- an areas image, hidden to the user
- sprites : objects that you might be able interact with,
  that will be displayed on top of a background image
- code to let the app know what to do on various actions.

The main way for the user to interact with the room is to click on the background image.
The background image actions areas are defined by the areas image.

Each colour on the areas image is linked to an action in the code.
We know which action to do based on which colour was used to define an area in the areas image.

Let's give an example :)

You can go to [https://post-work-hangout.glitch.me/?room=example](https://post-work-hangout.glitch.me/?room=example) for an example of a room where the background image _is the same_ as the area image.

You will see a blue blob in the upleft corner, that you won't be able to walk on.
You will see a pink rectangle in the bottom right corner, that you will be able to walk in.

Here is the code behind this room:

      module.exports.ROOMS = {

          example: {
            bg: "entrance-areas.png",
            area: "entrance-areas.png",
            spawn: [84, 92, 121, 99],
            areaColors: {
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
            }
              

This room is refered to as the `example`room.

The `bg` feature allows you to set the .png image that the user will see as a background.

To set the coloured areas indicating actions, you need the `area` feature.

You can spawn the user avatar with the `spawn` feature.

Finally, you can set the action to undertake based on the colours with the `areaColors`section.
