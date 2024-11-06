//------------Initialize the express 'app' object--------
let express = require("express");
// const express = require("express");  
let app = express();
// const app = express();  

//----------Initialize HTTP server------
let http = require("http");
// const http = require("http");  
let server = http.createServer(app);
// const server = http.createServer(app); 

//------------Initialize socket.io---------
let io = require("socket.io");
io = new io.Server(server);
// const socketIO = require("socket.io");  
// const io = socketIO(server);  


// ------Set the server to listen on port 3000 -------
let port = process.env.PORT || 3000;  
server.listen(port, () => {  
    console.log(`Server is running on port ${port}`);  
});


let piecePositions = {};

app.use("/", express.static("public"));
// app.use(express.static("public"));  

// Handle a new connection event
io.on("connection", (socket) => {  // Listen for clients connecting to the Socket.IO server

    console.log("A user connected:" + socket.id);  // Log when a user successfully connects to the server
    
    //send the current state to the new user
    socket.emit('initialize-pieces',piecePositions);

    //----new version testing
    //set up initializing pieces for everyone
    socket.on('initialize-pieces', (positions) => {
        piecePositions = positions;
        io.emit('initialize-pieces', positions);
    });

socket.on("start-game", () => {
        if (!gameStarted) { // 确保只启动一次
            gameStarted = true;
            io.emit("game-started"); // 通知所有客户端游戏开始
            startTimer(); // 启动计时
        }
    });
   //listen for message from client
    socket.on('move-piece', (data) => {
        piecePositions[data.id] = { x: data.x, y: data.y};
        //Send data to ALL clients, including this one
        io.emit('move-piece',data);
        


    // ---------old version-------
    // // Listen for 'move-piece' events from the client
    // socket.on("move-piece", (data) => {  // When a "move-piece" event is received from the client, handle it
    //     socket.broadcast.emit("move-piece", data);  // Broadcast the piece's movement data to all other connected clients, except the sender
    // });
    });


    let gameStarted = false;
let timer = 15; // 初始计时设为 15 秒

// 处理客户端的 'start-game' 请求
// io.on("connection", (socket) => {
    // socket.on("start-game", () => {
    //     if (!gameStarted) { // 确保只启动一次
    //         gameStarted = true;
    //         io.emit("game-started"); // 通知所有客户端游戏开始
    //         startTimer(); // 启动计时
    //     }
    // });
// });

function startTimer() {
    const interval = setInterval(() => {
        timer -= 1;
        console.log (timer);
        io.emit("timer-update", timer); // 广播倒计时给所有客户端

        if (timer <= 0) {
            clearInterval(interval);
            gameStarted = false;
            timer = 15; // 重置计时器
            io.emit("game-ended"); // 广播游戏结束
        }
    }, 1000);
}


// Handle a disconnection event
    socket.on("disconnect", () => {  // Listen for the disconnection event when a user disconnects from the server
        console.log("A user disconnected"+ socket.id);  // Log when a user disconnects from the server
    });
});
