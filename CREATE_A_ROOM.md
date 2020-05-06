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

You can go to 
