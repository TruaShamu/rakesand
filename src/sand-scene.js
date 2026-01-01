class SandScene extends Phaser.Scene {
    constructor() {
        super({ key: 'SandScene' });
        this.config = GARDEN_CONFIG;
        this.tileWidth = this.config.grid.tileWidth;  
        this.tileHeight = this.config.grid.tileHeight; 
        this.gridSize = this.config.grid.size;
        this.originX = this.config.origin.x;   
        this.originY = this.config.origin.y;

        this.colorSand = this.config.colors.sand;
        this.colorShadow = this.config.colors.shadow; 
        this.colorGrid = this.config.colors.grid;
        
        this.grid = []; 
        this.waypoints = [];
        this.generatedPath = [];
        this.isPathGenerated = false;
        this.uiController = null;
    }

    create() {
        this.initGrid();
        this.graphics = this.add.graphics();
        this.overlayGraphics = this.add.graphics();
        
        this.uiController = new UIController(this);

        this.input.on('pointerdown', (pointer) => {
            const tile = this.getTileFromWorld(pointer.worldX, pointer.worldY);
            if (tile && !this.isPathGenerated) {
                const lastW = this.waypoints[this.waypoints.length - 1];
                if (!lastW || (lastW.x !== tile.x || lastW.y !== tile.y)) {
                    this.waypoints.push(tile);
                    this.uiController.enableGenerateButton();
                }
            }
        });
    }

    clearState() {
        this.waypoints = [];
        this.generatedPath = [];
        this.isPathGenerated = false;
    }

    initGrid() {
        for (let x = 0; x < this.gridSize; x++) {
            this.grid[x] = [];
            for (let y = 0; y < this.gridSize; y++) {
                this.grid[x][y] = { type: 'flat' };
            }
        }
    }

    generatePath() {
        if (this.waypoints.length === 0) return;
        this.generatedPath = [];

        if (this.waypoints.length === 1) {
            this.generatedPath.push({ x: this.waypoints[0].x, y: this.waypoints[0].y });
        } else {
            for (let i = 0; i < this.waypoints.length - 1; i++) {
                const start = this.waypoints[i];
                const end = this.waypoints[i + 1];
                const segment = this.createPathSegment(start, end);
                
                segment.forEach((tile, idx) => {
                    if (idx === 0 && this.generatedPath.length > 0) {
                        const last = this.generatedPath[this.generatedPath.length - 1];
                        if (last.x === tile.x && last.y === tile.y) return;
                    }
                    this.generatedPath.push(tile);
                });
            }
        }

        this.isPathGenerated = true;
    }

    createPathSegment(start, end) {
        const path = [];
        let current = { x: start.x, y: start.y };
        
        // Move X axis first
        while (current.x !== end.x) {
            path.push({ x: current.x, y: current.y });
            current.x += (end.x > current.x) ? 1 : -1;
        }
        // Move Y axis second
        while (current.y !== end.y) {
            path.push({ x: current.x, y: current.y });
            current.y += (end.y > current.y) ? 1 : -1;
        }
        path.push({ x: current.x, y: current.y });
        return path;
    }

    applyRake() {
        if (this.generatedPath.length === 0) return;
        
        const savedPath = [...this.generatedPath];
        // Check if start and end meet to treat as a closed loop
        const isLoop = savedPath.length > 1 && 
                       savedPath[0].x === savedPath[savedPath.length-1].x && 
                       savedPath[0].y === savedPath[savedPath.length-1].y;

        for (let i = 0; i < savedPath.length; i++) {
            const tile = savedPath[i];
            this.grid[tile.x][tile.y] = { 
                type: 'path',
                index: i,
                fullPath: savedPath,
                isLoop: isLoop
            };
        }
        this.clearState();
    }

    update() {
        this.graphics.clear();
        this.overlayGraphics.clear();
        this.renderGrid();
        this.renderSelection();
    }

    getTileFromWorld(worldX, worldY) {
        const adjX = worldX - this.originX;
        const adjY = worldY - this.originY;
        const gridY = (adjY / this.tileHeight - adjX / this.tileWidth) / 2;
        const gridX = (adjY / this.tileHeight + adjX / this.tileWidth) / 2;
        const rX = Math.round(gridX);
        const rY = Math.round(gridY);
        if (rX >= 0 && rX < this.gridSize && rY >= 0 && rY < this.gridSize) return { x: rX, y: rY };
        return null;
    }

    getIsoXY(gridX, gridY) {
        return {
            x: this.originX + (gridX - gridY) * this.tileWidth,
            y: this.originY + (gridX + gridY) * this.tileHeight
        };
    }

    renderGrid() {
        for (let x = 0; x < this.gridSize; x++) {
            for (let y = 0; y < this.gridSize; y++) {
                const pos = this.getIsoXY(x, y);
                const cell = this.grid[x][y];
                
                this.graphics.lineStyle(1, this.colorGrid, 0.4);
                this.graphics.fillStyle(this.colorSand, 1);
                this.graphics.beginPath();
                this.graphics.moveTo(pos.x, pos.y - this.tileHeight);
                this.graphics.lineTo(pos.x + this.tileWidth, pos.y);
                this.graphics.lineTo(pos.x, pos.y + this.tileHeight);
                this.graphics.lineTo(pos.x - this.tileWidth, pos.y);
                this.graphics.closePath();
                this.graphics.fillPath();
                this.graphics.strokePath();

                if (cell.type === 'path') {
                    this.drawPathContent(x, y, cell);
                }
            }
        }
    }

    getOffsetVector(from, to, lane) {
        const isXMove = from.x !== to.x;
        const amount = lane * this.config.rake.laneSpacing;
        if (isXMove) {
            return { x: amount, y: -amount * 0.5 };
        } else {
            return { x: amount, y: amount * 0.5 };
        }
    }

    drawPathContent(gridX, gridY, cell) {
        const path = cell.fullPath;
        const idx = cell.index;
        const center = this.getIsoXY(gridX, gridY);
        
        let prevTile = path[idx - 1];
        let nextTile = path[idx + 1];

        if (cell.isLoop) {
            if (idx === 0) {
                prevTile = path[path.length - 2]; 
            }
            if (idx === path.length - 1) {
                nextTile = path[1]; 
            }
        }

        this.graphics.lineStyle(1.5, this.colorShadow, 0.8);

        // Singular isolated point (stone ripples)
        if (!prevTile && !nextTile) {
            const rippleWidths = this.config.ripples.widths;
            rippleWidths.forEach(r => {
                this.graphics.beginPath();
                this.graphics.moveTo(center.x, center.y - (this.tileHeight * r));
                this.graphics.lineTo(center.x + (this.tileWidth * r), center.y);
                this.graphics.lineTo(center.x, center.y + (this.tileHeight * r));
                this.graphics.lineTo(center.x - (this.tileWidth * r), center.y);
                this.graphics.closePath();
                this.graphics.strokePath();
            });
            return;
        }

        const lanes = this.config.rake.lanes;
        lanes.forEach(lane => {
            if (prevTile) {
                const mid = this.getIsoXY((gridX + prevTile.x)/2, (gridY + prevTile.y)/2);
                const offset = this.getOffsetVector(prevTile, {x: gridX, y: gridY}, lane);
                this.graphics.lineBetween(mid.x + offset.x, mid.y + offset.y, center.x + offset.x, center.y + offset.y);
            }
            if (nextTile) {
                const mid = this.getIsoXY((gridX + nextTile.x)/2, (gridY + nextTile.y)/2);
                const offset = this.getOffsetVector({x: gridX, y: gridY}, nextTile, lane);
                this.graphics.lineBetween(center.x + offset.x, center.y + offset.y, mid.x + offset.x, mid.y + offset.y);
            }
        });
    }

    renderSelection() {
        this.waypoints.forEach((tile) => {
            const pos = this.getIsoXY(tile.x, tile.y);
            this.overlayGraphics.fillStyle(0xffffff, 0.8);
            this.overlayGraphics.fillCircle(pos.x, pos.y, 4);
        });

        if (this.generatedPath.length > 0) {
            this.overlayGraphics.lineStyle(2, 0xffffff, 0.5);
            const points = this.generatedPath.map(p => this.getIsoXY(p.x, p.y));
            if (points.length === 1) {
                this.overlayGraphics.strokeRect(points[0].x - 5, points[0].y - 5, 10, 10);
            } else {
                for(let i = 0; i < points.length - 1; i++) {
                    this.overlayGraphics.lineBetween(points[i].x, points[i].y, points[i+1].x, points[i+1].y);
                }
            }
        }
    }
}
