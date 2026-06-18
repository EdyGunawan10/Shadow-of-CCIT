class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 16;
        this.speed = 165;
        this.sprintSpeed = 255;
        this.hp = 100;
        this.stamina = 100;
        this.maxStamina = 100;
        this.status = 'VISIBLE';
        this.direction = { x: 1, y: 0 };
        this.isMoving = false;
        this.takedownCooldown = 0;
        this.wasHidden = false;
    }

    update(delta, keys, level, guards, soundManager) {
        this.takedownCooldown = Math.max(0, this.takedownCooldown - delta);
        const input = this.getInputVector(keys);
        this.isMoving = input.x !== 0 || input.y !== 0;

        if (this.isMoving) {
            this.direction = { x: input.x, y: input.y };
        }

        const wantsSprint = keys.shift && this.stamina > 3 && this.isMoving;
        const currentSpeed = wantsSprint ? this.sprintSpeed : this.speed;
        const nextX = this.x + input.x * currentSpeed * delta;
        const nextY = this.y + input.y * currentSpeed * delta;

        if (!level.collidesWithWall(nextX, this.y, this.radius)) {
            this.x = Math.max(this.radius, Math.min(level.width - this.radius, nextX));
        }

        if (!level.collidesWithWall(this.x, nextY, this.radius)) {
            this.y = Math.max(this.radius, Math.min(level.height - this.radius, nextY));
        }

        if (wantsSprint) {
            this.stamina = Math.max(0, this.stamina - 36 * delta);
        } else {
            this.stamina = Math.min(this.maxStamina, this.stamina + 24 * delta);
        }

        const hiddenBySpot = level.isPointInHidingSpot({ x: this.x, y: this.y });
        const activelyChased = guards.some((guard) => guard.state === 'ALERT' && !guard.eliminated);
        this.status = hiddenBySpot && !activelyChased ? 'HIDDEN' : 'VISIBLE';

        if (this.status === 'HIDDEN' && !this.wasHidden) {
            soundManager.playHidingSound();
        }
        this.wasHidden = this.status === 'HIDDEN';
    }

    getInputVector(keys) {
        let x = 0;
        let y = 0;

        if (keys.left) x -= 1;
        if (keys.right) x += 1;
        if (keys.up) y -= 1;
        if (keys.down) y += 1;

        const length = Math.hypot(x, y);
        if (length === 0) {
            return { x: 0, y: 0 };
        }

        return { x: x / length, y: y / length };
    }

    attemptTakedown(guards, soundManager) {
        if (this.takedownCooldown > 0) return false;

        let target = null;
        let bestDistance = Infinity;

        guards.forEach((guard) => {
            if (guard.eliminated || guard.state === 'ALERT') return;
            const distance = Math.hypot(this.x - guard.x, this.y - guard.y);
            const vectorFromGuardToPlayer = {
                x: (this.x - guard.x) / Math.max(1, distance),
                y: (this.y - guard.y) / Math.max(1, distance)
            };
            const behindDot = vectorFromGuardToPlayer.x * guard.direction.x + vectorFromGuardToPlayer.y * guard.direction.y;
            const playerFacingGuard = this.direction.x * -vectorFromGuardToPlayer.x + this.direction.y * -vectorFromGuardToPlayer.y;
            const isBehindGuard = behindDot < -0.35;
            const isCloseEnough = distance < 45;
            const isIntentional = playerFacingGuard > -0.35;

            if (isCloseEnough && isBehindGuard && isIntentional && distance < bestDistance) {
                target = guard;
                bestDistance = distance;
            }
        });

        if (!target) return false;

        target.eliminate();
        soundManager.playAssassinateSound();
        this.takedownCooldown = 0.42;
        return true;
    }

    takeDamage(amount) {
        this.hp = Math.max(0, this.hp - amount);
    }

    draw(ctx) {
        ctx.save();
        const glowColor = this.status === 'HIDDEN' ? 'rgba(48, 242, 122, 0.7)' : 'rgba(0, 217, 255, 0.52)';
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = this.status === 'HIDDEN' ? 24 : 14;
        ctx.fillStyle = this.status === 'HIDDEN' ? '#30f27a' : '#f6f8ff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#0f0f12';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.strokeStyle = '#dc3545';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.direction.x * 26, this.y + this.direction.y * 26);
        ctx.stroke();
        ctx.restore();
    }
}

class Guard {
    constructor(x, y, waypoints) {
        this.x = x;
        this.y = y;
        this.radius = 15;
        this.waypoints = waypoints;
        this.currentWaypoint = 1;
        this.speed = 85;
        this.chaseSpeed = 165;
        this.direction = { x: 1, y: 0 };
        this.state = 'PATROL';
        this.eliminated = false;
        this.fovAngle = Math.PI / 2;
        this.visionDistance = 180;
        this.damageCooldown = 0;
        this.alertPulse = 0;
    }

    update(delta, player, level, soundManager) {
        if (this.eliminated) return;

        this.damageCooldown = Math.max(0, this.damageCooldown - delta);
        this.alertPulse += delta;

        const canSeePlayer = this.canSeePlayer(player, level);

        if (canSeePlayer && this.state !== 'ALERT') {
            this.state = 'ALERT';
            soundManager.playAlertSound();
        }

        if (this.state === 'ALERT') {
            this.chasePlayer(delta, player, level);
            this.tryAttack(player);
        } else {
            this.patrol(delta, level);
        }
    }

    patrol(delta, level) {
        const target = this.waypoints[this.currentWaypoint];
        const distance = Math.hypot(target.x - this.x, target.y - this.y);

        if (distance < 8) {
            this.currentWaypoint = (this.currentWaypoint + 1) % this.waypoints.length;
            return;
        }

        const move = {
            x: (target.x - this.x) / distance,
            y: (target.y - this.y) / distance
        };

        this.direction = move;
        const nextX = this.x + move.x * this.speed * delta;
        const nextY = this.y + move.y * this.speed * delta;

        if (!level.collidesWithWall(nextX, this.y, this.radius)) this.x = nextX;
        if (!level.collidesWithWall(this.x, nextY, this.radius)) this.y = nextY;
    }

    chasePlayer(delta, player, level) {
        const distance = Math.hypot(player.x - this.x, player.y - this.y);
        if (distance === 0) return;

        const move = {
            x: (player.x - this.x) / distance,
            y: (player.y - this.y) / distance
        };

        this.direction = move;
        const nextX = this.x + move.x * this.chaseSpeed * delta;
        const nextY = this.y + move.y * this.chaseSpeed * delta;

        if (!level.collidesWithWall(nextX, this.y, this.radius)) this.x = nextX;
        if (!level.collidesWithWall(this.x, nextY, this.radius)) this.y = nextY;
    }

    tryAttack(player) {
        const distance = Math.hypot(player.x - this.x, player.y - this.y);
        if (distance <= this.radius + player.radius + 4 && this.damageCooldown <= 0) {
            player.takeDamage(14);
            this.damageCooldown = 0.62;
        }
    }

    canSeePlayer(player, level) {
        if (player.status === 'HIDDEN') return false;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.hypot(dx, dy);

        if (distance > this.visionDistance) return false;

        const angleToPlayer = Math.atan2(dy, dx);
        const guardAngle = Math.atan2(this.direction.y, this.direction.x);
        const angleDifference = Math.abs(this.normalizeAngle(angleToPlayer - guardAngle));

        if (angleDifference > this.fovAngle / 2) return false;

        return level.hasLineOfSight({ x: this.x, y: this.y }, { x: player.x, y: player.y });
    }

    normalizeAngle(angle) {
        while (angle > Math.PI) angle -= Math.PI * 2;
        while (angle < -Math.PI) angle += Math.PI * 2;
        return angle;
    }

    getVisionCone() {
        const baseAngle = Math.atan2(this.direction.y, this.direction.x);
        const leftAngle = baseAngle - this.fovAngle / 2;
        const rightAngle = baseAngle + this.fovAngle / 2;

        return [
            { x: this.x, y: this.y },
            { x: this.x + Math.cos(leftAngle) * this.visionDistance, y: this.y + Math.sin(leftAngle) * this.visionDistance },
            { x: this.x + Math.cos(rightAngle) * this.visionDistance, y: this.y + Math.sin(rightAngle) * this.visionDistance }
        ];
    }

    eliminate() {
        this.eliminated = true;
        this.state = 'ELIMINATED';
    }

    draw(ctx) {
        if (this.eliminated) {
            this.drawEliminated(ctx);
            return;
        }

        this.drawVision(ctx);

        ctx.save();
        ctx.shadowColor = this.state === 'ALERT' ? 'rgba(220, 53, 69, 0.9)' : 'rgba(246, 195, 67, 0.45)';
        ctx.shadowBlur = this.state === 'ALERT' ? 24 : 12;
        ctx.fillStyle = this.state === 'ALERT' ? '#dc3545' : '#f6c343';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#0f0f12';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.strokeStyle = this.state === 'ALERT' ? '#ffffff' : '#0f0f12';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.direction.x * 25, this.y + this.direction.y * 25);
        ctx.stroke();
        ctx.restore();
    }

    drawVision(ctx) {
        const cone = this.getVisionCone();
        ctx.save();
        const alertAlpha = this.state === 'ALERT' ? 0.28 + Math.sin(this.alertPulse * 10) * 0.08 : 0.16;
        ctx.fillStyle = this.state === 'ALERT' ? `rgba(220, 53, 69, ${alertAlpha})` : 'rgba(246, 195, 67, 0.13)';
        ctx.strokeStyle = this.state === 'ALERT' ? 'rgba(220, 53, 69, 0.45)' : 'rgba(246, 195, 67, 0.28)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cone[0].x, cone[0].y);
        ctx.lineTo(cone[1].x, cone[1].y);
        ctx.lineTo(cone[2].x, cone[2].y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    drawEliminated(ctx) {
        ctx.save();
        ctx.globalAlpha = 0.44;
        ctx.strokeStyle = '#6b7280';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(this.x - 12, this.y - 12);
        ctx.lineTo(this.x + 12, this.y + 12);
        ctx.moveTo(this.x + 12, this.y - 12);
        ctx.lineTo(this.x - 12, this.y + 12);
        ctx.stroke();
        ctx.restore();
    }
}

window.Player = Player;
window.Guard = Guard;
