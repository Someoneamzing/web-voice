import EventEmitter from 'events';

export default class IPCServer extends EventEmitter {
    constructor() {
        super();
        process.on('message', (e)=>{
            this.emit(e.event, ...e.args);
        })
    }
}