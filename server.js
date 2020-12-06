import express from 'express';
const app = express();
import HTTP from 'http';
const http = HTTP.createServer(app);
import {Server} from 'socket.io';
const io = new Server(http);
import path from 'path';
import Player from './classes/Player.js';

const players = Map();

app.get('/', (req, res) => {
    res.sendFile(path.resolve('./index.html'));
});

app.use(express.static(path.resolve('./')))

const sockets = new Map();

io.on('connection', (socket)=>{
    const color = Math.floor(Math.random() * 0x1000000);
    console.log(color);
    socket.once('ready', ()=>{
        socket.emit('player-init', Array.from(sockets.values()).filter(other=>other.id!=socket.id).map(other=>({id: other.id, color: other.color})), color)
    })
    socket.color = color;

    
    sockets.set(socket.id, socket);
    players.set(socket.id, new Player())

    socket.broadcast.emit('new-player', socket.id, color);

    socket.on('move-update', (movement)=>{
        socket.broadcast.emit('move-update', socket.id, movement)
    })

    socket.on('disconnect', ()=>{
        sockets.delete(socket.id);
        socket.broadcast.emit('player-leave', socket.id)
    })
})

setInterval(()=>{
    io.emit('heartbeat', )
}, 200)


http.listen(3000)
