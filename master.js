import cp from 'child_process';
import readline from 'readline';
import Server from './node_modules/network-js/SocketServer.mjs';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const server = new Server(3456);

let n = null;

server.on('update', (ws, data)=>{
    if (n) n.send({event: 'update', args: [null, data]})
});

server.on('players', (ws, data)=>{
    if (n) n.send({event: 'players', args: [null, data]})
});

(async ()=>{
    for await (let line of rl) {
        if (line.startsWith('reload')) {
            if (n) {
                n.kill();
                n.unref();
            }
            n = cp.fork('./SEClient.js');
            n.on('exit', ()=>n=null);
        }
    }
})()