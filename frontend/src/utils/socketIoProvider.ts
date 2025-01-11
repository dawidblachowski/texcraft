import * as Y from 'yjs';
import { Awareness, encodeAwarenessUpdate, applyAwarenessUpdate } from "y-protocols/awareness";


export default class SocketIOProvider extends Y.AbstractConnector {
    socket: any;
    projectId: string;
    fileId: string;

    constructor(doc:Y.Doc, projectId:string, fileId: string, socket:any) {
        super(doc, new Awareness(doc));
        this.projectId = projectId;
        this.fileId = fileId;
        this.socket = socket;

        this.socket.emit('joinProjectFile', this.projectId, this.fileId);

        this.socket.emit("requestSync");

        this.socket.on("update", (update: any)=>{
            Y.applyUpdate(this.doc, new Uint8Array(update));
        })

        this.doc.on("update", (update, origin)=>{
            this.socket.emit("update", projectId, fileId, update);
        })

        this.socket.on("sync", (syncMessage: any)=>{
            Y.applyUpdate(this.doc, new Uint8Array(syncMessage));
        })

        this.awareness.on("update", ({added, updated, removed}: {added: any, updated: any, removed: any})=>{
            const changedClients = added.concat(updated).concat(removed);
            const awarenessUpdate = encodeAwarenessUpdate(this.awareness, changedClients);
            this.socket.emit("awareness-update", this.projectId, this.fileId, awarenessUpdate);
        })

        this.socket.on("awareness-update", (update: any)=>{
            applyAwarenessUpdate(this.awareness, new Uint8Array(update), this.socket.id);
        })
    }
}