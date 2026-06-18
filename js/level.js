class Level {
    constructor() {
        this.width = 1000;
        this.height = 600;
        this.spawn = { x: 72, y: 520 };
        this.objectiveZone = { x: 884, y: 42, width: 82, height: 82 };
        this.hidingSpots = [
            { x: 116, y: 118, width: 108, height: 64 },
            { x: 314, y: 440, width: 138, height: 70 },
            { x: 602, y: 116, width: 110, height: 74 },
            { x: 758, y: 392, width: 128, height: 72 }
        ];
        this.walls = [
            { x: 0, y: 0, width: 1000, height: 16 },
            { x: 0, y: 584, width: 1000, height: 16 },
            { x: 0, y: 0, width: 16, height: 600 },
            { x: 984, y: 0, width: 16, height: 600 },
            { x: 270, y: 90, width: 26, height: 260 },
            { x: 450, y: 250, width: 250, height: 28 },
            { x: 705, y: 72, width: 28, height: 230 },
            { x: 130, y: 310, width: 188, height: 26 },
            { x: 560, y: 420, width: 30, height: 120 }
        ];
        this.grassBlades = this.createGrassBlades();
        this.guards = [
            {
                x: 398,
                y: 124,
                waypoints: [
                    { x: 398, y: 124 },
                    { x: 578, y: 124 },
                    { x: 578, y: 214 },
                    { x: 398, y: 214 }
                ]
            },
            {
                x: 770,
                y: 502,
                waypoints: [
                    { x: 770, y: 502 },
                    { x: 928, y: 502 },
                    { x: 928, y: 304 },
                    { x: 770, y: 304 }
                ]
            },
            {
                x: 172,
                y: 412,
                waypoints: [
                    { x: 172, y: 412 },
                    { x: 420, y: 412 },
                    { x: 420, y: 536 },
                    { x: 172, y: 536 }
                ]
            }
        ];
    }


    createGrassBlades() {
        const blades = [];
        this.hidingSpots.forEach((spot, spotIndex) => {
            for (let i = 0; i < 20; i += 1) {
                const seed = (spotIndex + 1) * 97 + i * 31;
                const xRatio = (Math.sin(seed) + 1) / 2;
                const yRatio = (Math.cos(seed * 1.7) + 1) / 2;
                blades.push({
                    x: spot.x + 8 + xRatio * (spot.width - 16),
                    y: spot.y + 10 + yRatio * (spot.height - 18),
                    sway: Math.sin(seed * 0.3) * 5
                });
            }
        });
        return blades;
    }

    isInsideRect(point, rect) {
        return point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;
    }

    isPointInHidingSpot(point) {
        return this.hidingSpots.some((spot) => this.isInsideRect(point, spot));
    }

    circleIntersectsRect(circle, rect) {
        const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
        const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
        const distanceX = circle.x - closestX;
        const distanceY = circle.y - closestY;
        return distanceX * distanceX + distanceY * distanceY < circle.radius * circle.radius;
    }

    collidesWithWall(x, y, radius) {
        return this.walls.some((wall) => this.circleIntersectsRect({ x, y, radius }, wall));
    }

    hasLineOfSight(fromPoint, toPoint) {
        const steps = Math.ceil(Math.hypot(toPoint.x - fromPoint.x, toPoint.y - fromPoint.y) / 12);

        for (let i = 1; i <= steps; i += 1) {
            const t = i / steps;
            const x = fromPoint.x + (toPoint.x - fromPoint.x) * t;
            const y = fromPoint.y + (toPoint.y - fromPoint.y) * t;

            if (this.walls.some((wall) => this.isInsideRect({ x, y }, wall))) {
                return false;
            }
        }

        return true;
    }

    draw(ctx, missionComplete) {
        const gradient = ctx.createLinearGradient(0, 0, this.width, this.height);
        gradient.addColorStop(0, '#101119');
        gradient.addColorStop(1, '#08080d');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);

        this.drawGrid(ctx);
        this.drawWalls(ctx);
        this.drawHidingSpots(ctx);
        this.drawObjective(ctx, missionComplete);
    }

    drawGrid(ctx) {
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 217, 255, 0.045)';
        ctx.lineWidth = 1;

        for (let x = 0; x <= this.width; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.height);
            ctx.stroke();
        }

        for (let y = 0; y <= this.height; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.width, y);
            ctx.stroke();
        }

        ctx.restore();
    }

    drawWalls(ctx) {
        ctx.save();
        this.walls.forEach((wall) => {
            const wallGradient = ctx.createLinearGradient(wall.x, wall.y, wall.x + wall.width, wall.y + wall.height);
            wallGradient.addColorStop(0, '#252633');
            wallGradient.addColorStop(1, '#11121a');
            ctx.fillStyle = wallGradient;
            ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
            ctx.strokeStyle = 'rgba(0, 217, 255, 0.22)';
            ctx.strokeRect(wall.x + 0.5, wall.y + 0.5, wall.width - 1, wall.height - 1);
        });
        ctx.restore();
    }

    drawHidingSpots(ctx) {
        ctx.save();
        this.hidingSpots.forEach((spot) => {
            ctx.fillStyle = '#0f3c26';
            ctx.fillRect(spot.x, spot.y, spot.width, spot.height);
            ctx.strokeStyle = 'rgba(48, 242, 122, 0.45)';
            ctx.lineWidth = 2;
            ctx.strokeRect(spot.x + 1, spot.y + 1, spot.width - 2, spot.height - 2);

            this.grassBlades
                .filter((blade) => blade.x >= spot.x && blade.x <= spot.x + spot.width && blade.y >= spot.y && blade.y <= spot.y + spot.height)
                .forEach((blade) => {
                    ctx.strokeStyle = 'rgba(48, 242, 122, 0.18)';
                    ctx.beginPath();
                    ctx.moveTo(blade.x, blade.y + 8);
                    ctx.lineTo(blade.x + 8 + blade.sway, blade.y - 6);
                    ctx.stroke();
                });
        });
        ctx.restore();
    }

    drawObjective(ctx, missionComplete) {
        const zone = this.objectiveZone;
        ctx.save();
        ctx.globalAlpha = missionComplete ? 1 : 0.38;
        ctx.fillStyle = missionComplete ? 'rgba(246, 195, 67, 0.24)' : 'rgba(246, 195, 67, 0.08)';
        ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
        ctx.strokeStyle = missionComplete ? '#f6c343' : 'rgba(246, 195, 67, 0.3)';
        ctx.lineWidth = 3;
        ctx.strokeRect(zone.x + 1.5, zone.y + 1.5, zone.width - 3, zone.height - 3);
        ctx.fillStyle = missionComplete ? '#f6c343' : 'rgba(246, 195, 67, 0.55)';
        ctx.font = '700 13px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(missionComplete ? 'EXTRACT' : 'LOCKED', zone.x + zone.width / 2, zone.y + zone.height / 2 + 4);
        ctx.restore();
    }
}

window.Level = Level;
