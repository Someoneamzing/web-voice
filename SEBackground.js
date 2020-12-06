// Modules to control application life and create native browser window
import {app, BrowserWindow, ipcMain} from 'electron';
let mainWindow;
let steamID = null;
function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('SEClient.html')

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

import Server from 'network-js/SocketServer.mjs';
// import Server from './node_.js';
import {Vector} from 'math';
// import Stack from 'collections/Stack.js';

let server = new Server(3456);
// console.log("New Run");


const track = new (class {
    constructor() {
        this.maps = [new Map(), new Map()];
        this.index = true;
    }

    get next() {return this.maps[+!this.index]}
    get prev() {return this.maps[+this.index]}

    swapIndex() {
        this.index = !this.index;
    }
})()

class NetworkEdge {
    constructor(a, b) {
        this.a = a;
        this.b = b;
    }

    get strength() {
        return this.a.type == 'IMyLaserAntenna'?1:(Math.sqrt(Math.min(this.a.radius, this.b.radius) ** 2 - this.a.position.distance2(this.b.position))/Math.min(this.a.radius, this.b.radius));
    }
}

class NetworkNode {
    constructor(grid) {
        this.grid = grid;
        this.antennas = new Map();
        this.connections = new Map();
    }

    addAntenna(antenna) {
        this.antennas.set(antenna.id, antenna);
    }

    static connect(a, b) {
        let edgeAB = new NetworkEdge(a, b);
        let edgeBA = new NetworkEdge(b, a);
        if(a.node) a.node.connections.set(b, edgeAB);
        if(b.node) b.node.connections.set(a, edgeBA);
    }
}

const network = new Map();
const antennas = new Set();

server.on('update', (ws, data)=>{
    network.clear();
    antennas.clear();
    let messages = JSON.parse(data);
    for (let message of messages) {
        let entity = message.entity;
        track.next.set(entity.id, entity);
        switch (entity.type) {
            case "IMyLaserAntenna":
            case "IMyRadioAntenna": {
                entity.node = network.get(entity.grid);
                entity.position = new Vector(...entity.position)
                entity.node.addAntenna(entity);
                antennas.add(entity);
                break;
            }
            case "IMyCubeGrid": {
                network.set(entity.id, new NetworkNode(entity));
                break;
            }
            default:
                break;
        }
    }
    for (let antenna of antennas) {
        if (!antenna.working) continue;
        switch (antenna.type) {
            case "IMyLaserAntenna":
                NetworkNode.connect(antenna,track.next.get(antenna.target));
                break;
            case "IMyRadioAntenna":
                for (let other of antennas) {
                    if (other.type == "IMyRadioAntenna" && other != antenna && other.position.distance2(antenna.position) < Math.min(antenna.radius, other.radius) ** 2) {
                        NetworkNode.connect(antenna, other)
                    }
                }
                break;
            default:
                break;
        }
    }
    track.swapIndex()
})

const strengths = new Map();

class PathNode {
    constructor(node) {
        this.node = node;
        this.strength = 0;
        this.from = null;
        PathNode.paths.set(node, this);
    }

    static from(node) {
        return PathNode.paths.has(node)?PathNode.paths.get(node): new PathNode(node);
    }
}

PathNode.paths = new Map();

function walkConnections(start, me) {
    PathNode.paths.clear();
    // console.log("Walk START ", start.name);
    let unvisited = new Set();
    let visited = new Set();
    let current = PathNode.from(start.node);
    current.strength = 1;
    let result = 0;
    do {
        
        unvisited.delete(current);
        
        for (let [node, edge] of current.node.connections) {
            // console.log(edge.a.name, '-->', edge.b.name);
            let path = PathNode.from(edge.b.node);
            let strength = edge.strength * current.strength;
            if (strength > path.strength) {
                // console.log('Path was shorter: ', strength);
                path.from = current;
                path.strength = strength;
            }
            if (path.node.type == "PLAYER") {
                // console.log("We found a player");
                if (path.node.id == me) {
                    // console.log("We found me");
                    result = Math.max(path.strength, result);
                }
                continue;
            }
            if (!visited.has(path)) {
                // console.log("Path was unvisited, adding...");
                unvisited.add(path);
            }
        }
        visited.add(current);
        let smallest = null;
        for (let candidate of unvisited) {
            if (!smallest || smallest.strength > candidate.strength) smallest = candidate;
        }
        current = smallest;
        // console.log('Unvisited: ', unvisited.size);
        // console.log("Exploring ", current?.node.grid?.name);
    } while (unvisited.size > 0)
    return result;
}

server.on('players', (ws, data)=>{
    // console.log(data);
    strengths.clear();
    let {me, players} = JSON.parse(data);
    if (!steamID) {
      steamID = me;
      mainWindow.webContents.send('steam-id', steamID)
    }
    let playerMap = new Map();
    for (let player of players) {
        strengths.set(player.id, 0);
        playerMap.set(player.id, player);
        player.radius = Infinity;
        player.type = "PLAYER";
        player.position = new Vector(...player.position);
        player.node = player;
        player.connections = new Map();
        for (let antenna of antennas) if (antenna.type == "IMyRadioAntenna") {
            if (player.position.distance2(antenna.position) < antenna.radius ** 2) {
                NetworkNode.connect(antenna, player);
            }
        }
        if (player.id != me) strengths.set(player.id, Math.max(strengths.get(player.id), walkConnections(player, me))) 
    }

    // let toSend = Object.create(null);

    // for (let [id, strength] of strengths) {
    //     toSend[id] = strength;
    //     // console.log(`${("" + playerMap.get(id).name).padStart(30, ' ')}: ${strength}`);
    // }

    mainWindow.webContents.send('strengths', [...strengths.entries()]);
})
