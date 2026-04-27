import { io } from "socket.io-client";

// Connect to the same server that serves the page
export const socket = io();
