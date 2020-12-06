import Vector from "../node_modules/math/vector.js";

export default class Controller {
    constructor() {
        this.movement = new Vector(0,0);
    }
}

export class LocalController extends Controller {
    constructor(element, io) {
        super();
        this.io = io;
        this.element = element;
        this.keys = new Map();
        this.element.addEventListener('keydown', (e)=>{
            this.keys.set(e.key, true);
            this.update();
        })
        this.element.addEventListener('keyup', (e)=>{
            this.keys.set(e.key, false);
            this.update();
        })
    }

    update() {
        this.movement.set((this.keys.get("a")?-1:0) + (this.keys.get("d")?1:0),(this.keys.get("w")?-1:0) + (this.keys.get("s")?1:0))
        this.io.emit('move-update', [...this.movement])
    }

    remove() {

    }
}

export class NetworkController extends Controller {
    constructor(io, id) {
        super();
        this.io = io;
        this.id = id;
        this.moveUpdate = this.moveUpdate.bind(this);
        this.io.on('move-update', this.moveUpdate);
    }

    moveUpdate(id, movement) {
        if (id === this.id) {
            this.movement.set(...movement);
        }
    }

    remove() {
        this.io.off('move-update', this.moveUpdate);
    }
}