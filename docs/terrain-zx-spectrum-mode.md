# Pixels in the Past: Coding a ZX-Spectrum Display Mode inside Terrain

*By the Retro Computing Desk*

## A Night at the Neon Grid

Nothing says "microcomputer chic" quite like the ZX Spectrum’s electric palette. In the browser-based **Terrain** playground, an experimental 3D heightmap explorer built with WebGL and custom shader toys, we decided to recreate that unmistakable look in a dedicated display mode. Think of it as a software time machine: chunky pixels, attribute clash, and all, projected onto a procedurally generated landscape.

## Anatomy of a Palette

Before any code is written, it pays to revisit Sir Clive Sinclair’s chromatic fingerprints. The Spectrum offered eight base hues—blue, red, magenta, green, cyan, yellow, white, and black—each with a bright counterpart toggled per 8×8 attribute cell. Terrain already pipelines height, moisture, and biome data through GLSL. Our ZX-mode graft takes those buffers and funnels them into a compact lookup table, mapping normalized terrain values to the original Spectrum palette. The trick is to quantize twice: first for color banding, then for brightness.

## Attribute Clash on Purpose

Attribute clash—those jarring color boundaries whenever two sprites entered the same 8×8 block—was once a hardware limitation. Inside Terrain, we emulate it deliberately. The fragment shader snaps UV coordinates to an attribute grid, storing ink and paper values in a texture atlas. By keeping only two colors per block, we honor the Spectrum’s constraint while letting the terrain’s topography pick which pair wins. Elevation shifts influence the paper color, while slope and biome heat decide the ink. The resulting clash is not a bug: it is the headline aesthetic.

## Wiring Up the Mode Switch

Terrain’s UI already supports toggles for wireframe and follow-camera states. The ZX switch hijacks that same state machine. A new `ZXMode` flag joins the terrainState object, listening for a keyboard chord—`Shift` + `Z`. Activating it hot-swaps the material on the terrain mesh, swapping modern PBR shading for our retro shader. When the mode is off, the original material is cached and reinstated, ensuring zero shader recompilations mid-flight.

## Perf Budgeting Like It’s 1982

The Spectrum ran at 50 Hz with roughly 7 cycles per pixel line. While the web build does not share those hardware limits, respecting the spirit means keeping the shader lean. We target a hard 1 ms budget on mid-tier GPUs by replacing dynamic branching with bitwise masks, packing the attribute grid into a single RGBA8 texture, and precomputing brightness thresholds in JavaScript. Frame pacing remains smooth even when Terrain recycles chunks in follow mode.

## Beyond Nostalgia

A ZX overlay is more than cosplay. The high-contrast palette sharpens silhouettes and transforms the terrain into a tactical map, ideal for spotting ridgelines or carved valleys. It also invites remix culture: modders can swap in their own 8×8 tables, or bend the rules with half-bright experiments. And because Terrain is open to extension, the ZX shader becomes a teaching tool for both retro graphics and modern WebGL techniques.

## Try It Yourself

Clone the Terrain repo, run the local server, and tap `Shift` + `Z` to flip the world into Spectrum vision. If you grew up coaxing art out of 48K of RAM, you’ll feel instantly at home. If you didn’t, welcome to the neon grid—a slice of 1980s Britain rendered on today’s silicon, one attribute block at a time.

