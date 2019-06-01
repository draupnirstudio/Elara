import socketClient from "socket.io-client";
import {storageClient} from "./storage";

const socketEndpoint = "/";
const socketPath = "/socket";

export const socket = socketClient(socketEndpoint, {path: socketPath});

const userIdKey = 'elara-userId';

socket.on('connect', () => {
  const userId = storageClient.get(userIdKey);
  
  socket.emit('user-connect', {userId});
});

socket.on('user-id-generated', (data) => {
  const {userId} = data;
  
  storageClient.set(userIdKey, userId);
  
  console.log('userId saved in localStorage', userId);
});
