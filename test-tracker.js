const { io } = require("socket.io-client");

const socket = io("http://localhost:4008");

const shareToken = "6cdf54b004c309cbce3bd67c93d1847e";

socket.on("connect", () => {
    console.log("👀 Tracker connected");
    console.log("Socket ID:", socket.id);

    socket.emit("joinTrip", shareToken);

    console.log("➡️ Joined trip:", shareToken);
});

socket.on("locationUpdated", (location) => {
    console.log("📍 LIVE LOCATION RECEIVED:");
    console.log(location);
});

socket.on("locationSharingStopped", () => {
    console.log("🛑 Trip owner stopped sharing location");
});

socket.on("tripError", (error) => {
    console.log("❌ Trip error:", error);
});

socket.on("connect_error", (error) => {
    console.log("❌ Connection error:", error.message);
});
