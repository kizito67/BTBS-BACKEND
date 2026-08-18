const { io } = require("socket.io-client");

const socket = io("http://localhost:4008");

const shareToken = "6cdf54b004c309cbce3bd67c93d1847e";

socket.on("connect", () => {
    console.log("✅ Connected to Socket.IO");
    console.log("Socket ID:", socket.id);

    // Join the trip
    socket.emit("joinTrip", shareToken);

    console.log("➡️ Joining trip:", shareToken);

    // Wait 2 seconds, then send a fake location
    setTimeout(() => {
        socket.emit("locationUpdate", {
            shareToken,
            latitude: 6.5244,
            longitude: 3.3792,
        });

        console.log("📍 Test location sent");
    }, 2000);
});

socket.on("locationUpdated", (location) => {
    console.log("📍 Location received:");
    console.log(location);
});

socket.on("tripError", (error) => {
    console.log("❌ Trip error:", error);
});

socket.on("disconnect", () => {
    console.log("🔌 Disconnected");
});