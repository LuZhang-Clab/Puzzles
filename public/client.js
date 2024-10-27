const socket = io();  // Connect to the server using Socket.IO, enabling real-time communication between the client and server

const pieces = document.querySelectorAll(".puzzle-piece");  // Select all elements with the class "puzzle-piece" and store them in the 'pieces' variable

// New function added to randomize the position of each puzzle piece
function randomizePositions() {
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
    });
}

// Call the randomization function to place puzzle pieces at random locations when the page loads
randomizePositions();  // This line is new

pieces.forEach(piece => {  // Loop through each puzzle piece
    piece.addEventListener("dragstart", (e) => {  // Add an event listener for the "dragstart" event to each piece, triggered when the piece starts being dragged
        e.dataTransfer.setData("text", e.target.id);  // Set the data being transferred during the drag operation as the piece's ID
    });

    piece.addEventListener("dragend", (e) => {  // Add an event listener for the "dragend" event, triggered when the piece is dropped
        // Get the position where the piece was dropped, adjusting the coordinates so the piece centers at the drop point
        const x = e.clientX - piece.clientWidth / 2;
        const y = e.clientY - piece.clientHeight / 2;

        // Move the piece visually to the new position by setting its CSS 'position' property to 'absolute'
        piece.style.position = "absolute";  
        piece.style.left = `${x}px`;  // Set the horizontal position of the piece to the calculated x-coordinate
        piece.style.top = `${y}px`;   // Set the vertical position of the piece to the calculated y-coordinate

        // Emit the move event to the server with the piece's ID and new coordinates (x, y)
        socket.emit("move-piece", { id: piece.id, x, y });
    });
});

// Listen for move events from other clients
socket.on("move-piece", (data) => {  // Listen for the "move-piece" event emitted by the server, which contains the updated piece position data
    const piece = document.getElementById(data.id);  // Find the puzzle piece by its ID from the data received
    if (piece) {  // If the piece exists in the document
        piece.style.position = "absolute";  // Ensure the piece is positioned absolutely
        piece.style.left = `${data.x}px`;   // Update the piece's horizontal position to the new x-coordinate
        piece.style.top = `${data.y}px`;    // Update the piece's vertical position to the new y-coordinate
    }
});
