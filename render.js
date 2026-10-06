/**
 * Bard's Tale RPG Engine - Canvas Raycaster & Procedural Texture Renderer
 * File: renderer.js
 */

class RaycasterRenderer {
    constructor(canvasId) {
        this.canvasId = canvasId;
        this.canvas = null;
        this.ctx = null;
        this.FOV = Math.PI / 3;
        this.HALF_FOV = this.FOV / 2;
        this.NUM_RAYS = 320;
        this.MAX_DEPTH = 8;

        // Texture Buffer (16x16 pixels)
        this.texSize = 16;
        this.wallTexture = null;
    }

    init() {
        if (!this.canvas) {
            this.canvas = document.getElementById(this.canvasId);
            if (this.canvas) {
                this.ctx = this.canvas.getContext('2d');
                this.generateStoneTexture();
            }
        }
        return !!this.ctx;
    }

    /**
     * Generates a 16x16 Pixelated Stone Brick Texture in memory
     */
    generateStoneTexture() {
        const offCanvas = document.createElement('canvas');
        offCanvas.width = this.texSize;
        offCanvas.height = this.texSize;
        const offCtx = offCanvas.getContext('2d');

        // Base Stone Color (Dark Grayish Green)
        offCtx.fillStyle = '#1e2b20';
        offCtx.fillRect(0, 0, this.texSize, this.texSize);

        // Brick Mortar Grid Lines (Dark Charcoal)
        offCtx.fillStyle = '#080d09';
        // Horizontal mortar lines (every 4 pixels)
        for (let y = 0; y < this.texSize; y += 4) {
            offCtx.fillRect(0, y, this.texSize, 1);
        }

        // Vertical mortar lines (staggered pattern for alternating brick rows)
        for (let x = 0; x < this.texSize; x += 8) {
            offCtx.fillRect(x, 0, 1, 4);
            offCtx.fillRect((x + 4) % this.texSize, 4, 1, 4);
            offCtx.fillRect(x, 8, 1, 4);
            offCtx.fillRect((x + 4) % this.texSize, 12, 1, 4);
        }

        // Add Pixel Noise & Highlights for Stone Texture
        for (let y = 0; y < this.texSize; y++) {
            for (let x = 0; x < this.texSize; x++) {
                // Skip mortar lines
                if (y % 4 === 0 || (y < 4 && x % 8 === 0) || (y >= 4 && y < 8 && (x + 4) % 8 === 0)) continue;

                if (Math.random() < 0.25) {
                    offCtx.fillStyle = 'rgba(255, 255, 255, 0.08)'; // Highlight
                    offCtx.fillRect(x, y, 1, 1);
                } else if (Math.random() < 0.25) {
                    offCtx.fillStyle = 'rgba(0, 0, 0, 0.15)'; // Shadow
                    offCtx.fillRect(x, y, 1, 1);
                }
            }
        }

        // Store pixel array for fast sampling
        this.wallTexture = offCtx.getImageData(0, 0, this.texSize, this.texSize).data;
    }

    render(engine) {
        if (!this.init()) return;
        if (!engine || !engine.activeMap) return;

        // 1. Clear & Render Sky & Floor Gradients
        const skyGradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height / 2);
        skyGradient.addColorStop(0, engine.currentZone === 'CITY' ? '#050d1a' : '#050505');
        skyGradient.addColorStop(1, engine.currentZone === 'CITY' ? '#0f2038' : '#141414');
        this.ctx.fillStyle = skyGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height / 2);

        const floorGradient = this.ctx.createLinearGradient(0, this.canvas.height / 2, 0, this.canvas.height);
        floorGradient.addColorStop(0, engine.currentZone === 'CITY' ? '#0f1a0e' : '#0a1a0d');
        floorGradient.addColorStop(1, engine.currentZone === 'CITY' ? '#050a05' : '#020502');
        this.ctx.fillStyle = floorGradient;
        this.ctx.fillRect(0, this.canvas.height / 2, this.canvas.width, this.canvas.height / 2);

        // 2. Cast 3D Rays
        for (let ray = 0; ray < this.NUM_RAYS; ray++) {
            const rayAngle = (engine.player.angle - this.HALF_FOV) + (ray / this.NUM_RAYS) * this.FOV;
            let distanceToWall = 0;
            let hitWall = false;

            const sin = Math.sin(rayAngle);
            const cos = Math.cos(rayAngle);

            let hitX = 0, hitY = 0;

            while (!hitWall && distanceToWall < this.MAX_DEPTH) {
                distanceToWall += 0.02;
                hitX = engine.player.x + cos * distanceToWall;
                hitY = engine.player.y + sin * distanceToWall;

                const checkX = Math.floor(hitX);
                const checkY = Math.floor(hitY);

                if (checkX < 0 || checkX >= 8 || checkY < 0 || checkY >= 8) {
                    hitWall = true;
                    distanceToWall = this.MAX_DEPTH;
                } else if (engine.activeMap[checkY] && engine.activeMap[checkY][checkX] === 1) {
                    hitWall = true;
                }
            }

            // Correct Fish-Eye Distortion
            const correctedDist = distanceToWall * Math.cos(rayAngle - engine.player.angle);
            const wallHeight = Math.min(this.canvas.height, (this.canvas.height / Math.max(0.05, correctedDist)));
            const wallTop = Math.floor((this.canvas.height / 2) - (wallHeight / 2));

            // Determine texture X coordinate (0 to 15) from hit point
            const hitOffset = (hitX % 1) + (hitY % 1);
            const texX = Math.floor(hitOffset * this.texSize) % this.texSize;

            // Distance Shading Factor (0.1 to 1.0)
            const shade = Math.max(0.1, 1 - (correctedDist / this.MAX_DEPTH));

            // Render Textured Vertical Column
            for (let y = 0; y < wallHeight; y++) {
                const screenY = wallTop + y;
                if (screenY < 0 || screenY >= this.canvas.height) continue;

                // Sample texture Y coordinate
                const texY = Math.floor((y / wallHeight) * this.texSize) % this.texSize;
                const texIdx = (texY * this.texSize + texX) * 4;

                // Apply shading tint (Blue-Green for City, Emerald for Dungeon)
                let r = Math.floor(this.wallTexture[texIdx] * shade);
                let g = Math.floor(this.wallTexture[texIdx + 1] * shade * (engine.currentZone === 'CITY' ? 1.2 : 1.5));
                let b = Math.floor(this.wallTexture[texIdx + 2] * shade * (engine.currentZone === 'CITY' ? 1.8 : 0.8));

                this.ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                this.ctx.fillRect(ray, screenY, 1, 1);
            }
        }

        // 3. Render Top-Right Mini-Map HUD
        this.renderMiniMap(engine);
    }

    renderMiniMap(engine) {
        if (!this.ctx) return;

        this.ctx.save();

        const tileSize = 8;
        const mapPixelSize = 8 * tileSize; // 64x64 px
        const offsetX = this.canvas.width - mapPixelSize - 8;
        const offsetY = 8;

        // Container Box
        this.ctx.fillStyle = 'rgba(0, 15, 8, 0.9)';
        this.ctx.fillRect(offsetX - 2, offsetY - 2, mapPixelSize + 4, mapPixelSize + 4);
        this.ctx.strokeStyle = '#00ff66';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(offsetX - 2, offsetY - 2, mapPixelSize + 4, mapPixelSize + 4);

        // Map Tiles
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                const tx = offsetX + x * tileSize;
                const ty = offsetY + y * tileSize;

                const isVisited = engine.activeVisited && engine.activeVisited[y] && engine.activeVisited[y][x];

                if (!isVisited) {
                    this.ctx.fillStyle = '#030a05'; // Unexplored fog
                    this.ctx.fillRect(tx, ty, tileSize, tileSize);
                } else {
                    const tile = engine.activeMap[y][x];
                    if (tile === 1) this.ctx.fillStyle = '#00bb44';      // Wall
                    else if (tile === 2) this.ctx.fillStyle = '#ffff00'; // Chest
                    else if (tile === 3) this.ctx.fillStyle = '#ff3333'; // Monster
                    else if (tile === 6) this.ctx.fillStyle = '#ff6600'; // Tavern
                    else if (tile === 7) this.ctx.fillStyle = '#bb66ff'; // Guild
                    else if (tile === 8) this.ctx.fillStyle = '#33ffff'; // Shop
                    else if (tile === 9) this.ctx.fillStyle = '#ffffff'; // Stairs
                    else this.ctx.fillStyle = '#00220a';                // Open floor

                    this.ctx.fillRect(tx, ty, tileSize - 1, tileSize - 1);
                }
            }
        }

        // Player Dot & Vector
        const px = offsetX + engine.player.x * tileSize;
        const py = offsetY + engine.player.y * tileSize;

        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        this.ctx.fill();

        const dirX = px + Math.cos(engine.player.angle) * 7;
        const dirY = py + Math.sin(engine.player.angle) * 7;
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.moveTo(px, py);
        this.ctx.lineTo(dirX, dirY);
        this.ctx.stroke();

        this.ctx.restore();
    }
}

window.renderer = new RaycasterRenderer('viewport');