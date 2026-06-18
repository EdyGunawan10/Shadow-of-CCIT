class HUDRenderer {
    constructor(canvas) {
        this.canvas = canvas;
    }

    draw(ctx, game) {
        if (game.state !== 'PLAYING') return;

        this.drawTopBars(ctx, game.player, game.detectionMeter);
        this.drawMissionInfo(ctx, game);
        this.drawStealthStatus(ctx, game.player);
        this.drawMiniObjective(ctx, game);
    }

    drawTopBars(ctx, player, detectionMeter) {
        this.drawBar(ctx, 24, 24, 250, 18, player.hp / 100, '#dc3545', 'HP');
        this.drawBar(ctx, 24, 54, 250, 18, player.stamina / 100, '#00d9ff', 'STAMINA');
        this.drawBar(ctx, 24, 84, 250, 18, detectionMeter / 100, '#f6c343', 'DETECTION');
    }

    drawBar(ctx, x, y, width, height, ratio, color, label) {
        ctx.save();
        ctx.fillStyle = 'rgba(15, 15, 18, 0.78)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.13)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, x, y, width, height, 9, true, true);

        ctx.shadowColor = color;
        ctx.shadowBlur = 14;
        ctx.fillStyle = color;
        this.roundRect(ctx, x + 3, y + 3, Math.max(0, (width - 6) * ratio), height - 6, 7, true, false);

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#f6f8ff';
        ctx.font = '700 10px Orbitron, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`${label} ${Math.round(ratio * 100)}%`, x + width + 12, y + 13);
        ctx.restore();
    }

    drawMissionInfo(ctx, game) {
        ctx.save();
        ctx.fillStyle = 'rgba(15, 15, 18, 0.72)';
        ctx.strokeStyle = 'rgba(0, 217, 255, 0.18)';
        this.roundRect(ctx, 728, 20, 248, 92, 18, true, true);

        ctx.fillStyle = '#00d9ff';
        ctx.font = '700 11px Orbitron, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('MISSION STATUS', 748, 45);

        ctx.fillStyle = '#f6f8ff';
        ctx.font = '700 15px Orbitron, sans-serif';
        ctx.fillText(`Neutralized: ${game.enemiesEliminated}/${game.totalEnemies}`, 748, 72);

        ctx.fillStyle = game.missionComplete ? '#f6c343' : '#9ca3b8';
        ctx.font = '500 11px Orbitron, sans-serif';
        ctx.fillText(game.missionComplete ? 'Extraction zone unlocked' : 'Objective locked', 748, 96);
        ctx.restore();
    }

    drawStealthStatus(ctx, player) {
        ctx.save();
        const hidden = player.status === 'HIDDEN';
        const x = 24;
        const y = 534;
        const width = 230;
        const height = 42;

        ctx.fillStyle = 'rgba(15, 15, 18, 0.74)';
        ctx.strokeStyle = hidden ? 'rgba(48, 242, 122, 0.7)' : 'rgba(220, 53, 69, 0.42)';
        ctx.shadowColor = hidden ? 'rgba(48, 242, 122, 0.44)' : 'rgba(220, 53, 69, 0.24)';
        ctx.shadowBlur = hidden ? 18 : 10;
        this.roundRect(ctx, x, y, width, height, 18, true, true);

        ctx.shadowBlur = 0;
        ctx.fillStyle = hidden ? '#30f27a' : '#dc3545';
        ctx.font = '700 14px Orbitron, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(hidden ? 'STEALTH: HIDDEN' : 'STEALTH: VISIBLE', x + 18, y + 27);
        ctx.restore();
    }

    drawMiniObjective(ctx, game) {
        ctx.save();
        const seconds = Math.floor(game.elapsedTime);
        const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
        const rest = (seconds % 60).toString().padStart(2, '0');
        ctx.fillStyle = 'rgba(15, 15, 18, 0.68)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        this.roundRect(ctx, 804, 534, 172, 42, 18, true, true);
        ctx.fillStyle = '#f6f8ff';
        ctx.font = '700 14px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`TIME ${minutes}:${rest}`, 890, 561);
        ctx.restore();
    }

    roundRect(ctx, x, y, width, height, radius, fill, stroke) {
        const r = Math.min(radius, width / 2, height / 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + width, y, x + width, y + height, r);
        ctx.arcTo(x + width, y + height, x, y + height, r);
        ctx.arcTo(x, y + height, x, y, r);
        ctx.arcTo(x, y, x + width, y, r);
        ctx.closePath();
        if (fill) ctx.fill();
        if (stroke) ctx.stroke();
    }
}

window.HUDRenderer = HUDRenderer;
