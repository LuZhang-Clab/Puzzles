const express = require("express");  // Import the Express module, a web framework for building server-side applications in Node.js
const http = require("http");  // Import the HTTP module to create an HTTP server
const socketIO = require("socket.io");  // Import the Socket.IO module, which allows real-time communication between the server and clients

const app = express();  // Create an instance of an Express application
const server = http.createServer(app);  // Create an HTTP server that uses the Express app to handle requests
const io = socketIO(server);  // Initialize a new instance of Socket.IO and bind it to the HTTP server for real-time communication

app.use(express.static("public"));  // Serve static files (HTML, CSS, JS, etc.) from the "public" folder

// Handle a new connection event
io.on("connection", (socket) => {  // Listen for clients connecting to the Socket.IO server
    console.log("A user connected");  // Log when a user successfully connects to the server

    // Listen for 'move-piece' events from the client
    socket.on("move-piece", (data) => {  // When a "move-piece" event is received from the client, handle it
        socket.broadcast.emit("move-piece", data);  // Broadcast the piece's movement data to all other connected clients, except the sender
    });

    // Handle a disconnection event
    socket.on("disconnect", () => {  // Listen for the disconnection event when a user disconnects from the server
        console.log("A user disconnected");  // Log when a user disconnects from the server
    });
});

// Set the server to listen on port 3000 or an environment-specified port
const PORT = process.env.PORT || 3000;  // Define the port the server will listen on, either from the environment variable or default to 3000
server.listen(PORT, () => {  // Start the server and have it listen for incoming connections on the defined port
    console.log(`Server is running on port ${PORT}`);  // Log that the server is running and the port it is using
});
