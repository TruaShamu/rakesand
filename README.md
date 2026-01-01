# Zen Sand Garden

Interactive zen garden sand raking simulation built with Phaser 3. Click to place waypoints, generate paths between them, and rake patterns into the sand.

**Live Demo:** https://truashamu.github.io/rakesand/  
**Video:** https://youtu.be/lXzMfnFgqyM

## Usage
Open `index.html`. Click tiles to set waypoints, generate a path, then rake to create sand patterns.

## Implementation

Uses isometric grid rendering with Phaser 3 graphics. Path generation uses Manhattan distance (X-axis then Y-axis movement) to create L-shaped segments between waypoints. Rake patterns are rendered dynamically based on path direction, with parallel offset lines for continuous paths and concentric ripples for isolated points.