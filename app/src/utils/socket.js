import socketClient from "socket.io-client";


const socketEndpoint = "http://localhost/";
const socketPath = "/socket";

export const socket = socketClient(socketEndpoint, {path: socketPath});

