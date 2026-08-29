# Persistent Triggers

Experimental Geode mod for Geometry Dash 2.2081 / Android64.

Adds three editor pseudo-triggers:

- **SAVE** — synchronously stores an integer value under a Save ID.
- **LOAD** — checked when the level starts; if the saved value matches, it spawns a group.
- **CRASH** — attempts to loop roughly the last 10 ms of the active music, freezes briefly, then force-quits the process.

The objects are stored internally as Text Game Objects, so levels remain loadable without the mod (they appear as text there).
