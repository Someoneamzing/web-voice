import Client from './node_modules/network-js/SocketClient.mjs';

let client = new Client('wss://localhost:3456');

// client.client.emit('update', '{"test": "hello"}')