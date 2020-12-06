import Vector from '../node_modules/math/vector.js';

export default class Player {
    constructor(bounds, controller, color) {
        this.pos = new Vector(0,0);
        this.vel = new Vector(0,0);
        this.acc = new Vector(0,0);
        this.bounds = bounds;
        this.controller = controller;
        this.moveSpeed = 50;
        this.color = "#" + color.toString(16).padStart(6, '0');
    }

    input() {
        this.acc.add(Vector.mult(this.controller.movement, this.moveSpeed));
    }

    update(deltaTime) {
        this.vel.add(this.acc.mult(deltaTime));
        this.acc.set(0,0);
        const futurePos = Vector.add(this.pos, this.vel);
        if (futurePos.x > this.bounds.x || futurePos.x < 0) {
            this.vel.x = 0;
            this.pos.x = Math.min(Math.max(futurePos.x, 0), this.bounds.x);
        }
        if (futurePos.y > this.bounds.y || futurePos.y < 0) {
            this.vel.y = 0;
            this.pos.y = Math.min(Math.max(futurePos.y, 0), this.bounds.y);
        }
        this.pos.add(this.vel);
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.pos.x - 10, this.pos.y - 10, 20, 20);
    }

    remove() {
        this.controller.remove();
    }
}