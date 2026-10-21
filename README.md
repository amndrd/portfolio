# Portfolio

A portfolio site styled as an old CRT terminal: worn white-on-black interface, phosphor grain, and a frame-timed animation for every step. Projects sit in a 3 × 5 grid of pictograms. Pick one and a crosshair flies to it, the cell flips and moves to the top-left, and a project panel builds itself around a live ASCII view of the project. LAUNCH plays a boot log before the detail page.

Everything is drawn on a single canvas and filtered through a WebGL CRT pass. The site is silent for now: recorded sounds are being chosen and will be wired to the cue names in `site/js/sound.js`.

![Grid](docs/screenshots/grid.png)
![Project panel](docs/screenshots/panel.png)

## Run it

No build step: it is a static site.

```sh
cd site
python3 -m http.server 8080
```

Then open <http://localhost:8080>.

| Input | Action |
|---|---|
| Click a cell, or arrows + Enter | Open a project |
| Drag / scroll on the ASCII screen | Orbit / zoom the 3D view |
| BACK, HOME or Esc | Back to the grid |
| LAUNCH or Enter | Start the launch sequence |
| Sound button (top-right) or M | Mute / unmute: the label decodes again on hover and on each toggle |
| I | Invert the colours (black on paper) |

The mute and invert choices are saved in the browser. Browsers block audio until the first click or key press, so the first boot of the grid is silent.

## The flow

1. **Boot**: cells boot one after another in random order, one every 4 frames at 60 fps. Corner brackets blink, the frame closes, then the pictogram fades in.
2. **Selection**: the crosshair fades in, travels to the cell on a fitted cubic-bezier, locks, and the cell tilts, flashes and inverts. The other cells vanish one per frame.
3. **Panel**: the cell and the crosshair move to the top-left, the title types in, then rulers, frames, data blocks and lists light up on a fixed rhythm. The ASCII screen renders the project's design in real time.
4. **Launch**: the button blinks, the panel text is backspaced away, a boot log generated from the project data types out, and the screen cuts to black.
5. **Detail page**: a placeholder for now, with a HOME button.

![Launch terminal](docs/screenshots/terminal.png)

## Layout

```
site/                  the website
  index.html
  js/app.js            timeline, drawing, input, sound cues
  js/crt.js            WebGL CRT pass: grain, scanlines, wear, bloom, normal / inverted palette
  js/grid.js           grid geometry, cell frames, pictogram drawing
  js/pictos.js         placeholder pictograms (drawn in code)
  js/projects.js       project entries: edit this file to add content
  js/sound.js          sound cues and mute state (silent until the recorded sounds are wired)
prototypes/            the step-by-step design explorations that led to the site
tools/                 Playwright scripts: screenshots, frame sequences, end-to-end test, audio recording
```

### Adding a project

Each grid cell maps to one entry in `site/js/projects.js`, in reading order. An entry sets the title, language, type, year, duration, language composition, stack, a second list, a short description, the ASCII view (`tower`, `network` or `torus`) and a few lines for the launch log. Fields left out fall back to the defaults at the top of the file.

## Tools

```sh
cd tools
npm install
node site-test.mjs                    # end-to-end run of the whole flow (site served on :8080)
node capture.mjs <page> <out> name=query ...   # screenshots of a prototype
node sequence.mjs <page> <out> <query> <from> <to>   # frame-by-frame export
node record-audio.mjs                 # records the site's audio over a scripted run
```

The scripts drive the locally installed Google Chrome through Playwright.

## Status

Content is placeholder: the titles are planned projects and the numbers are made up. Still to come:

- the project detail page (real images and videos in colour);
- a button bar (GitHub, sound, invert);
- a mobile layout;
- final pictograms.

## Credits

Fonts: [Handjet](https://fonts.google.com/specimen/Handjet) and [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono), both under the SIL Open Font License, loaded from Google Fonts.
