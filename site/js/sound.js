// Interface sounds. Silent for now: the synthesized set was removed and recorded sounds will be wired to
// the cue names below (the selection is in docs/sound-selection.md). The mute state is kept.
//   loops:     room (room tone), boot (while the grid boots), drone (under the launch log)
//   one-shots: cell, hover, select, travel, type, lock, vanish, move, tick, panel, scan,
//              launch, cut, off, back, toggle

const Sound = (() => {
  let muted = false;
  try { muted = localStorage.getItem('portfolio.muted') === '1'; } catch {}
  return {
    // audio can only start on a user gesture: called on every click and key press
    init() {},
    get muted() { return muted; },
    setMuted(v) {
      muted = v;
      try { localStorage.setItem('portfolio.muted', v ? '1' : '0'); } catch {}
    },
    play(name) {},
    start(name) {},
    stop(name) {},
  };
})();
