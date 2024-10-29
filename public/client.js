let socket = io();  // Connect to the server using Socket.IO, enabling real-time communication between the client and server

const pieces = document.querySelectorAll(".puzzle-piece");  // Select all elements with the class "puzzle-piece" and store them in the 'pieces' variable


function addDragFunctionality(piece){
    let isDragging = false; // To track if the piece is currently being dragged
    let offsetX, offsetY; // To store the offset of the mouse position relative to the piece

    // Mouse down event: Start dragging
    piece.addEventListener("mousedown", (e) => {
        e.preventDefault(); // Prevent default behavior
        isDragging = true;

        // Calculate the offset of the mouse position relative to the piece
        offsetX = e.clientX - piece.getBoundingClientRect().left;
        offsetY = e.clientY - piece.getBoundingClientRect().top;

        // Set cursor to indicate dragging
        piece.style.cursor = 'grabbing';

        // Bring the piece to the front
        piece.style.zIndex = 1000;

        // Add a mousemove event listener to the document
        document.addEventListener("mousemove", movePiece);
    });

    // Move the piece function
    const movePiece = (e) => {
        if (isDragging) {
            // Calculate the new position of the piece
            const x = e.clientX - offsetX;
            const y = e.clientY - offsetY;

            // Set the piece's position to the new coordinates
            piece.style.position = "absolute";
            piece.style.left = `${x}px`;
            piece.style.top = `${y}px`;
            socket.emit("move-piece", { id: piece.id, x, y});
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

        positions.push({ id: piece.id, x: randomX, y: randomY});
    });
    socket.emit('initialize-pieces',positions);
}

//Only run setup if it is the first load
if (!sessionStorage.getItem('hasLoaded')){
    setup();
    sessionStorage.setItem('hasLoaded','true');
}

socket.on('initialize-pieces', (positions)=>{
    for (let id in positions){
        const piece =document.getElementById(id);
        if(piece){
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
