T-033 done: every colour pair the app puts on screen now
meets WCAG AA, measured rather than assumed — `contrastRatio` is in the domain
layer and a test computes every pair in both themes. The three recorded
failures are fixed by darkening along their own hue. Two more turned up on the
way: all six life-area colours were text colours all along, because a selected
filter chip puts white text on them, and the primary button hard-coded white
text so it was unreadable in dark mode at 2.22. The night tint added with the
companions had never been measured and sat at 4.42. Companion bodies were
reviewed and left alone — they are illustration, not information. Next task:
T-030.
