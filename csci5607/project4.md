# Maze Game Implementation Documentation

## Continuous Movement

I stored the player's position using floats (`playerX`, `playerZ`, `playerY`) instead of integers, so they aren't locked to grid positions. Each frame, I update these coordinates by small amounts based on delta time and move speed, which creates smooth, fluid movement through the world.

## Walls & Doors

I render walls as white cubes with a brick texture whenever I encounter a 'W' tile. For doors A through E, I give each one a unique color—red for A, green for B, blue for C, yellow for D, and magenta for E—by checking the tile character and setting the appropriate RGB values.

## Keys

I load the keys from an OBJ file as actual 3D models rather than simple cubes. To make collected keys follow the player, I invert the view matrix and position them in screen space at the bottom of the viewport, applying a continuous rotation so they appear to float and spin in front of the camera.

## User Input

I implemented WASD controls where W and S move forward and backward along the player's facing direction, while A and D strafe left and right. For camera control, I capture mouse motion events and use the relative movement to adjust yaw (`playerDir`) and pitch (`playerPitch`), clamping pitch to prevent over-rotation.

## Collision Detection

I created an `isWalkable()` function that tests four corner points around the player's circular collision radius against the map grid. Movement only proceeds if none of these points would intersect walls or locked doors, effectively preventing the player from clipping through solid objects.

## Floors & Ceilings

I render a floor cube at y=-0.5 for every tile in the map, giving it a darker gray color to distinguish it from walls. I decided not to implement a ceiling to keep the scene more open.

## Lighting

I pass normal vectors with each vertex to the fragment shader, which uses them for ambient and diffuse lighting calculations to give the scene proper shading and depth.

## New Maps

I wrote a `loadMap()` function that reads level files from disk, allowing me to specify different map layouts via command-line arguments or defaulting to level1.txt.

## Strafing

For the A and D keys, I calculate movement perpendicular to the facing direction by using the player's direction angle without the -π/2 offset, which gives true sidestepping motion independent of where the player is looking vertically.

## Jumping

When the player presses spacebar while grounded, I apply an initial upward velocity of 4.0. Each frame, I subtract gravity (9.8 m/s²) from the velocity and integrate it into the vertical position, creating a natural parabolic jump arc that lands smoothly.

## OBJ Loading

I implemented `loadOBJ()` to parse Wavefront OBJ files by reading vertex positions and face indices. For each triangle, I calculate the surface normal using cross products of the edges, then pack everything into my vertex buffer format.

## Door Animation

When a player unlocks a door, I add it to an `activeDoors` vector with a 1-second timer. Each frame, I decrease the door's y-offset to make it sink into the floor, and once the timer expires, I remove that tile from the map entirely so the player can walk through.