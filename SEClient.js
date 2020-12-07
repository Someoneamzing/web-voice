const {ipcRenderer} = require('electron');
const io = require('socket.io-client');
const chroma = require('chroma-js');

const strengthGradient = chroma.scale(['red', 'yellow', 'lime'])

const players = new Map();
//{urls: "stun:stun1.l.google.com:19302"}
const configuration = {}
const audioContext = new AudioContext();

window.players = players;
let SteamID = null;
let client = null;
let mic = null;



(async _=>{
    await audioContext.audioWorklet.addModule('distortion-processor.js');
    mic = await navigator.mediaDevices.getUserMedia({video: false, audio: true});
    reconnect(ip.value);
    ip.addEventListener('change', (e)=>{
        reconnect(ip.value);
    });
    // const node = audioContext.createMediaStreamSource(mic);
    // window.myFilter = new AudioWorkletNode(audioContext, 'distortion-processor');
    // myFilter.parameters.get('overallStrength').value = 0.9;
    // frequency.oninput = ()=>myFilter.parameters.get('signalStrength').value = frequency.value;
    // node.connect(myFilter);
    // myFilter.connect(audioContext.destination);
})()

function reconnect(url) {
    players.clear();
    console.log(url);
    if (client) {
        client.disconnect()
        client = null;
    }

    client = io(new URL(url, 'http://localhost').href);
    client.connect();
    client.on('connect', _=> {if (SteamID) {
        console.log(SteamID);
        client.emit('steam-id', SteamID)
    }})

    function finaliseRTC(id) {
        const player = players.get(id);
        const {peerConnection, stream} = player;

        const a = new Audio();
        a.muted = true;
        a.srcObject = stream;
        const callElem = document.createElement('div');
        callElem.classList.add('call-entry')
        callElem.innerHTML = `<span class="player-name"></span><span class="strength-indicator"><span class="strength-fill"></span></span>`;
        player.callElem = callElem;
        player.nameElement = callElem.querySelector('.player-name');
        player.strengthIndicator = callElem.querySelector('.strength-indicator');
        player.strengthFill = callElem.querySelector('.strength-fill');
        callList.append(callElem);

        peerConnection.addEventListener('icecandidate', (event)=>{
            console.log("local canddiate");
            if (event.candidate) client.emit('ice-candidate', id, JSON.stringify(event.candidate));
        })

        peerConnection.addEventListener('connectionstatechange', event => {
            if (peerConnection.connectionState === 'connected') {
                console.log("Connected to: ", id);
            }
        })

        peerConnection.addEventListener('track', event => {
            stream.addTrack(event.track);
            // console.log('track', stream);
            // testPlayback.srcObject = stream;
            console.log(event);
            // player.streamNode = audioContext.createMediaStreamSource(event.streams[0]);
            player.streamNode = audioContext.createMediaStreamSource(stream);
            player.filterNode = new AudioWorkletNode(audioContext, 'distortion-processor');
            player.filterNode.parameters.get('overallStrength').value = 0.9;
            player.streamNode.connect(player.filterNode);
            player.filterNode.connect(audioContext.destination);
        })

        peerConnection.addEventListener('icecandidateerror', (e)=>{
            console.error(e)
        })
    }

    client.on('offer', async (id, offer, cb)=>{
        console.log('offer', offer);
        const peerConnection = new RTCPeerConnection(configuration);
        players.set(id, {peerConnection, stream: new MediaStream()});
        mic.getTracks().forEach(track=>{
            peerConnection.addTrack(track, mic);
        })
        finaliseRTC(id);

        peerConnection.setRemoteDescription(new RTCSessionDescription(JSON.parse(offer)));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        cb(JSON.stringify(answer));
    })

    client.on('new-player', async (id) => {
        console.log('new-player');
        const peerConnection = new RTCPeerConnection(configuration);
        players.set(id, {peerConnection, stream: new MediaStream()});
        mic.getTracks().forEach(track=>{
            peerConnection.addTrack(track, mic);
        })
        finaliseRTC(id);

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        client.emit('offer', id, JSON.stringify(offer), async (answer) => {
            console.log('answer');
            const remoteDesc = new RTCSessionDescription(JSON.parse(answer));
            await peerConnection.setRemoteDescription(remoteDesc);
        });
    })

    client.on('ice-candidate', async (id, candidate)=>{
        console.log('ice-candidate');
        await players.get(id).peerConnection.addIceCandidate(JSON.parse(candidate));
    })

    client.on('player-disconnect', (id)=>{
        const player = players.get(id);
        player.callElem.remove();
        players.delete(id);
    })
}

ipcRenderer.on('steam-id', (event, id)=>{
    let needsSend = SteamID == null;
    SteamID = id;
    console.log(SteamID);
    if (needsSend && client) client.emit('steam-id', SteamID);
});

ipcRenderer.on('strengths', (event, strengthArray, playerList)=>{
    let strengths = new Map(strengthArray);
    // strengthPara.innerText = strengths.map(e=>e.join(': ')).join(', ')
    for (let [id, strength] of strengths) {
        if (players.has(id)) {
            if (players.get(id).filterNode) {
                players.get(id).filterNode.parameters.get('signalStrength').value = strength;
                console.log(id, strength);
            }
        }
    }
    playerList = Array.from(playerList);
    for (let player of playerList) {
        if (players.has(player.id)) {
            const {nameElement, strengthIndicator, strengthFill} = players.get(player.id)
            nameElement.innerText = player.name;
            let color = strengthGradient(strengths.get(player.id));
            strengthFill.style.width = (strengths.get(player.id) * 100) + '%';
            strengthIndicator.style.backgroundColor = color.darken()
            strengthFill.style.backgroundColor = color;
        }
    }
});