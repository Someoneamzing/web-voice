import Vector from './node_modules/math/vector.js';
import Compositor from './node_modules/compositor/compositor.js';
import Player from './classes/Player.js';
import {LocalController, NetworkController} from './classes/Controller.js';

const canvas = document.getElementById('canvas');
const comp = new Compositor(canvas);
const players = new Map();
window.players = players;
const bounds = new Vector(canvas.width, canvas.height);
// const socket = io('http://localhost:3000');

function createBackgroundLayer() {
    return function drawBackground(ctx) {
        ctx.fillStyle = "#000000";
        ctx.fillRect(0,0,ctx.canvas.width, ctx.canvas.height);
    }
}

function createEntityLayer(entities) {
    return function drawEntities(ctx) {
        for (let entity of entities.values()) entity.draw(ctx);
    }
}

function createMovementDebugLayer(entities) {
    return function drawDebugLayer(ctx) {
        for (let entity of entities.values()) {
            ctx.strokeStyle = "red";
            ctx.beginPath()
            ctx.moveTo(entity.pos.x, entity.pos.y);
            ctx.lineTo(entity.pos.x + entity.controller.movement.x * 20, entity.pos.y + entity.controller.movement.y * 20)
            ctx.stroke();
        }
    }
}

comp.addLayer(createBackgroundLayer());
comp.addLayer(createEntityLayer(players));

const myPlayer = new Player(bounds, new LocalController(window, socket), 'lime');

players.set(socket.id, myPlayer);

socket.emit('ready')

socket.on('player-init', (playerIds, color) => {
    console.log(playerIds, color);
    myPlayer.color = "#" + color.toString(16).padStart(6, '0');
    for (let {id, color} of playerIds) players.set(id, new Player(bounds, new NetworkController(socket, id), color));
})

socket.on('new-player', (id, color)=>{
    players.set(id, new Player(bounds, new NetworkController(socket, id), color));
})

socket.on('player-leave', id=>{
    if (!players.has(id)) return;
    players.get(id).remove();
    players.delete(id);
})

let lastTime = 0;

function draw(totalTime) {
    let deltaTime = (totalTime - lastTime) / 1000;
    lastTime = totalTime;
    for (let player of players.values()) {
        player.input(deltaTime);
        player.update(deltaTime);
    }
    comp.draw();

    requestAnimationFrame(draw);
}

requestAnimationFrame(draw);