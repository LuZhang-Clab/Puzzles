let socket = io();  // Connect to the server using Socket.IO, enabling real-time communication between the client and server

const pieces = document.querySelectorAll(".puzzle-piece");  // Select all elements with the class "puzzle-piece" and store them in the 'pieces' variable
let maxZIndex = 1000;  // Initialize maxZIndex to track the highest z-index used

let previousPieceId = null; //save previous piece

let gameStarted = false;

function startGame() {
    socket.emit("start-game");
    // gameStarted =true;
    document.getElementById('gameStartButton').disabled = true;//让gamestart按钮失效
    // startTimer();//计时器功能开启

}

// 监听服务器的游戏开始事件
socket.on("game-started", () => {
    gameStarted = true;
    console.log("game-start");

    startTimerUI();// 启动客户端的计时显示
})

// 监听倒计时更新事件
socket.on("timer-update", (timeLeft) => {
    document.getElementById("timer").innerText = `Time left: ${timeLeft} seconds`;
    console.log(timeLeft);
})

// 监听游戏结束事件
socket.on("game-ended", () => {
    console.log("game end");
    gameStarted = false;
    pieces.forEach(piece => {
        piece.style.pointerEvents = "none"; // 禁用所有图层的拖动功能
    });
    alert("Game Over!");
});

// 添加计时显示的 UI
// 添加计时显示的 UI
function startTimerUI() {
    let timerDisplay = document.getElementById("timer");
    // console.log("start time UI");
    if (!timerDisplay) {
        timerDisplay = document.createElement("div");
        timerDisplay.id = "timer";
        timerDisplay.style.position = "absolute";
        timerDisplay.style.top = "10px";
        timerDisplay.style.right = "10px";
        timerDisplay.style.fontSize = "20px";
        timerDisplay.style.color = "red";
        document.body.appendChild(timerDisplay);
        // console.log("timer UI add");
    }
    // console.log(pieces.length);
    pieces.forEach(piece => {
        addDragFunctionality(piece);
    });
}

// console.log(pieces.length);
// pieces.forEach(piece => {
//     addDragFunctionality(piece);
// });

let timerInterval;

function startTimer() {
    let timeLeft = 10; // 10秒倒计时
    timerInterval = setInterval(() => {
        console.log(`Time left: ${timeLeft} seconds`);
        timeLeft--;

        if (timeLeft < 0) {
            clearInterval(timerInterval);
            endGame(); // 游戏结束
        }
    }, 1000);
}

function endGame() {
    gameStarted = false;
    pieces.forEach(piece => {
        piece.style.pointerEvents = "none"; // 禁用所有图层的拖动功能
    });
    alert("Game Over!");
}



// Function to bring a piece to the front by setting a higher z-index
function bringToFront(pieceId) {
    const piece = document.getElementById(pieceId);
    if (piece) {
        if (previousPieceId && previousPieceId !== pieceId) {
            maxZIndex += 1; // Increase maxZIndex to make this piece appear on top
            piece.style.zIndex = maxZIndex;
            previousPieceId = pieceId; //record the current layer
        }
    }
}

// Function to check if clicked pixel is non-transparent
function isNonTransparent(event, piece) {
    // Create an offscreen canvas
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = piece.width;
    canvas.height = piece.height;

    // Draw the image onto the canvas
    ctx.drawImage(piece, 0, 0, piece.width, piece.height);

    // Calculate the click position relative to the image
    const rect = piece.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Define a margin of error for detecting nearby non-transparent pixels
    const margin = 10;
    for (let dx = -margin; dx <= margin; dx++) {
        for (let dy = -margin; dy <= margin; dy++) {
            const pixel = ctx.getImageData(x + dx, y + dy, 1, 1).data;
            if (pixel[3] > 0) return true;
        }
    }

    return false;
}


function addDragFunctionality(piece) {
    let isDragging = false; // To track if the piece is currently being dragged
    let offsetX, offsetY; // To store the offset of the mouse position relative to the piece

    // Mouse down event: Start dragging
    piece.addEventListener("mousedown", (e) => {
        console.log("mouse is pressed");
        if (!gameStarted) return;//游戏未开始,则禁止拖动
        e.preventDefault(); // Prevent default behavior

        // Only start dragging if clicked on a non-transparent pixel
        if (isNonTransparent(e, piece)) {
            isDragging = true;

            // Calculate the offset of the mouse position relative to the piece
            offsetX = e.clientX - piece.getBoundingClientRect().left;
            offsetY = e.clientY - piece.getBoundingClientRect().top;

            // Set cursor to indicate dragging
            piece.style.cursor = 'grabbing';

            // Bring the piece to the front
            //piece.style.zIndex = 1000;

            // Bring the piece to the front when it starts dragging
            bringToFront(piece.id);

            // Add a mousemove event listener to the document
            document.addEventListener("mousemove", movePiece);
        }
    });

    // Move the piece function
    const movePiece = (e) => {
        if (isDragging && gameStarted) {
            // Calculate the new position of the piece
            const x = e.clientX - offsetX;
            const y = e.clientY - offsetY;

            //1. record picture's location relative to center of window/browser   ===>client在本地移动一片拼图，移动持续过程中上传给server，这个piece的相对于屏幕中心的x距离和y距离；
            // relativeXDist = PuzzlePiece.x - windowWidth/2; 
            // relativeYDist = PuzzlePiece.x - windowHeight/2; 
            //2. when window is stretched /  re-scaled, refresh every piece's location with relativeXDist;   ====> server讲数据广播给所有其他client，其他client在接受时，会设置这个piece在自己本地显示屏上的位置，
            //这个piece在本地显示的x坐标应该= 本地的浏览器窗口宽度的一半（也就是中心点）加上传入的relativeXDist； 
            // [new X of puzzle piece] = windowWidth/2 + relativeXDist; 
            // [new Y of puzzle piece] = windowHeight/2 + relativeYDist; 


            // Log the position to the console
            console.log(`Piece ID: ${piece.id}, New Position: (${x}, ${y})`);

            // Set the piece's position to the new coordinates
            piece.style.position = "absolute";
            piece.style.left = `${x}px`;
            piece.style.top = `${y}px`;
            socket.emit("move-piece", { id: piece.id, x, y });
        }
    };

    // Mouse up event: Stop dragging
    document.addEventListener("mouseup", () => {
        if (isDragging) {
            isDragging = false;

            // Reset the cursor
            piece.style.cursor = 'grab';

            // // Get the final position of the piece
            // const x = parseInt(piece.style.left, 10);
            // const y = parseInt(piece.style.top, 10);

            // // Emit the move event to the server with the piece's ID and new coordinates (x, y)
            // socket.emit("move-piece", { id: piece.id, x, y });

            // Remove the mousemove event listener to stop dragging
            document.removeEventListener("mousemove", movePiece);
        }
    });
};



// New function added to randomize the position of each puzzle piece
function setup() {
    const positions = [];
    pieces.forEach(piece => {
        // Get the width and height of the browser window
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        // Generate random x and y coordinates ensuring pieces stay within the screen
        const randomX = Math.random() * (windowWidth - piece.clientWidth);
        const randomY = Math.random() * (windowHeight - piece.clientHeight);

        // Set the puzzle piece's CSS to place it at a random position
        piece.style.position = "absolute";
        piece.style.left = `${randomX}px`;
        piece.style.top = `${randomY}px`;

        positions.push({ id: piece.id, x: randomX, y: randomY });
    });
    socket.emit('initialize-pieces', positions);
}

//Only run setup if it is the first load
if (!sessionStorage.getItem('hasLoaded')) {
    setup();
    sessionStorage.setItem('hasLoaded', 'true');
}

socket.on('initialize-pieces', (positions) => {
    for (let id in positions) {
        const piece = document.getElementById(id);
        if (piece) {
            piece.style.position = "absolute";
            piece.style.left = `${positions[id].x}px`;
            piece.style.top = `${positions[id].y}px`;
        }
    }
});



socket.on("move-piece", (data) => {
    const piece = document.getElementById(data.id);
    if (piece) {
        piece.style.position = "absolute";
        piece.style.left = `${data.x}px`;
        piece.style.top = `${data.y}px`;
    }
});

// Call the function for each piece 
pieces.forEach(piece => addDragFunctionality(piece));

//Listen for confirmation of connection
socket.on('connect', () => {
    console.log("Connected");
});


//Listen for an event named 'message-share' from the server
socket.on('message-share', (data) => {
    console.log(data);
    addDragFunctionality(document.getElementById(data.id));

});
