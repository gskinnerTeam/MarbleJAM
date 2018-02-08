# MarbleJAM

An experiment that followed [JAMJAM](http://blog.gskinner.com/archives/2017/10/jamjam-2017.html). Using @gskinner's [JustAddMusic](https://github.com/gskinner/JustAddMusic), marbles bounce as if they are sitting on a speaker, based on their size and weight.

The purpose of this experiment was to use a 2d [EaselJS](https://github.com/CreateJS/EaselJS/) Canvas as a 2d texture on a ThreeJS surface. The
reflections/ripples are translated to the canvas, and then updated as the marbles bounce on the surface.

![Screenshot](/assets/MarbleJAM.png "MarbleJAM Screenshot")

Check out a [live version of MarbleJAM](https://lab.gskinner.com/content/lanny.mcnie/marble-jam/) hidden on the gskinner lab!

## Using CanvasTexture

```
// Init the texture with the canvas
texture = new THREE.CanvasTexture(canvas);

// Update the texture when it changes
texture.needsUpdate = true;
```