class RaycasterRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.FOV = Math.PI / 3;
        this.HALF_FOV = this.FOV / 2;
        this.NUM_RAYS = this.canvas.width;
        this.MAX_DEPTH = 8;
    }

    render(engine) {
        this.ctx.fillStyle = engine.currentZone === 'CITY' ? '#050b14' : '#0a0a0a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height / 2);
        this.ctx.fillStyle = engine.currentZone === 'CITY' ? '#111a10' : '#151515';
        this.ctx.fillRect(0, this.canvas.height / 2, this.canvas.width, this.canvas.height / 2);

        for (let ray = 0; ray < this.NUM_RAYS; ray++) {
            const rayAngle = (engine.player.angle - this.HALF_FOV) + (ray / this.NUM_RAYS) * this.FOV;
            let distanceToWall = 0;
            let hitWall = false;

            const sin = Math.sin(rayAngle);
            const cos = Math.cos(rayAngle);

            while (!hitWall && distanceToWall < this.MAX_DEPTH) {
                distanceToWall += 0.02;
                const checkX = Math.floor(engine.player.x + cos * distanceToWall);
                const checkY = Math.floor(engine.player.y + sin * distanceToWall);

                if (checkX < 0 || checkX >= 8 || checkY < 0 || checkY >= 8) {
                    hitWall = true;
                    distanceToWall = this.MAX_DEPTH;
                } else if (engine.activeMap[checkY][checkX] === 1) {
                    hitWall = true;
                }
            }

            const correctedDist = distanceToWall * Math.cos(rayAngle - engine.player.angle);
            const wallHeight = Math.min(this.canvas.height, (this.canvas.height / correctedDist));
            const shade = Math.max(0, 255 - Math.floor(correctedDist * 32));

            if (engine.currentZone === 'CITY') {
                this.ctx.fillStyle = `rgb(0, ${Math.floor(shade * 0.8)}, ${shade})`;
            } else {
                this.ctx.fillStyle = `rgb(0, ${shade}, ${Math.floor(shade * 0.3)})`;
            }

            const wallTop = (this.canvas.height / 2) - (wallHeight / 2);
            this.ctx.fillRect(ray, wallTop, 1, wallHeight);
        }

        this.renderMiniMap(engine);
    }

    renderMiniMap(engine) {
        const tileSize = 8;
        const mapPixelSize = 8 * tileSize;
        const offsetX = this.canvas.width - mapPixelSize - 8;
        const offsetY = 8;

        this.ctx.fillStyle = 'rgba(0, 20, 10, 0.85)';
        this.ctx.fillRect(offsetX - 2, offsetY - 2, mapPixelSize + 4, mapPixelSize + 4);
        this.ctx.strokeStyle = '#00ff66';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(offsetX - 2, offsetY - 2, mapPixelSize + 4, mapPixelSize + 4);

        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                const tx = offsetX + x * tileSize;
                const ty = offsetY + y * tileSize;

                if (!engine.activeVisited[y][x]) {
                    this.ctx.fillStyle = '#05110a';
                    this.ctx.fillRect(tx, ty, tileSize, tileSize);
                } else {
                    const tile = engine.activeMap[y][x];
                    if (tile === 1) this.ctx.fillStyle = '#00aa44';
                    else if (tile === 2) this.ctx.fillStyle = '#ffff00';
                    else if (tile === 3) this.ctx.fillStyle = '#ff3333';
                    else if (tile === 6) this.ctx.fillStyle = '#ff6600';
                    else if (tile === 7) this.ctx.fillStyle = '#bb66ff';
                    else if (tile === 8) this.ctx.fillStyle = '#33ffff';
                    else if (tile === 9) this.ctx.fillStyle = '#ffffff';
                    else this.ctx.fillStyle = '#003311';
                    this.ctx.fillRect(tx, ty, tileSize - 1, tileSize - 1);
                }
            }
        }

        const px = offsetX + engine.player.x * tileSize;
        const py = offsetY + engine.player.y * tileSize;

        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        this.ctx.fill();

        const dirX = px + Math.cos(engine.player.angle) * 6;
        const dirY = py + Math.sin(engine.player.angle) * 6;
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.moveTo(px, py);
        this.ctx.lineTo(dirX, dirY);
        this.ctx.stroke();
    }
}

window.renderer = new RaycasterRenderer('viewport');