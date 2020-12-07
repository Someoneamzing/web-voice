import {Server as SocketIO} from 'socket.io';
// import Vector from './node_modules/math/vector.js';
// import Stack from './node_modules/collections/Stack.js';

const io = new SocketIO(3000);

const players = new Map();

io.on('connection', (socket) => {
    console.log("Connection");
    socket.on('steam-id', (id)=>{
        players.set(id, socket);
        console.log("New player ", id);
        socket.steamID = id;
        socket.broadcast.emit('new-player', id);
    })

    socket.on('offer', (id, offer, cb) => {
        players.get(id).emit('offer', socket.steamID, offer, (offer)=>{
            cb(offer);
        })
    })

    socket.on('ice-candidate', (id, candidate)=>{
        players.get(id).emit('ice-candidate', socket.steamID, candidate);
    })

    socket.on('disconnect', ()=>{
        socket.broadcast.emit('player-disconnect', socket.steamID);
        players.delete(socket.steamID);
    })
})