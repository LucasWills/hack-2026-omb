import { useState, useRef, useEffect } from "react";

/**
 * WebSocketPanel
 * A drop-in component that lets the user type in a server address
 * (e.g. 192.168.1.5:8080) and connect to it over WebSocket.
 * Handles connect/disconnect/errors safely so it never crashes the app.
 */
export default function WebSocketPanel() {
  const [address, setAddress] = useState("localhost:8080");
  const [status, setStatus] = useState("disconnected"); // disconnected | connecting | connected | error
  const [messages, setMessages] = useState([]);
  const [messageToSend, setMessageToSend] = useState("");
  const socketRef = useRef(null);

  // Clean up the socket if the component unmounts while connected
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  function handleConnect() {
    // If already connected, close the old one first
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    setStatus("connecting");
    setMessages((prev) => [...prev, `Connecting to ws://${address} ...`]);

    let socket;
    try {
      socket = new WebSocket(`ws://${address}`);
    } catch (err) {
      // Catches things like a malformed address
      setStatus("error");
      setMessages((prev) => [...prev, `Could not connect: ${err.message}`]);
      return;
    }

    socket.onopen = () => {
      setStatus("connected");
      setMessages((prev) => [...prev, "Connected!"]);
    };

    socket.onmessage = (event) => {
      setMessages((prev) => [...prev, `Server: ${event.data}`]);
    };

    socket.onerror = () => {
      // This fires on things like wrong IP, server down, etc.
      // We just update state here — we do NOT let this throw/crash the app.
      setStatus("error");
      setMessages((prev) => [...prev, "Connection error (check the address and that the server is running)."]);
    };

    socket.onclose = () => {
      setStatus("disconnected");
      setMessages((prev) => [...prev, "Disconnected."]);
    };

    socketRef.current = socket;
  }

  function handleDisconnect() {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
  }

  function handleSend() {
    if (socketRef.current && status === "connected" && messageToSend.trim() !== "") {
      socketRef.current.send(messageToSend);
      setMessages((prev) => [...prev, `You: ${messageToSend}`]);
      setMessageToSend("");
    }
  }

  const statusColor = {
    disconnected: "#888",
    connecting: "#e0a800",
    connected: "#2e7d32",
    error: "#c62828",
  }[status];

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 480, margin: "0 auto" }}>
      <h3>WebSocket Connection</h3>

      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="e.g. 192.168.1.5:8080"
          style={{ flex: 1, padding: 6 }}
        />
        {status === "connected" || status === "connecting" ? (
          <button onClick={handleDisconnect}>Disconnect</button>
        ) : (
          <button onClick={handleConnect}>Connect</button>
        )}
      </div>

      <div style={{ marginBottom: 8 }}>
        Status:{" "}
        <span style={{ color: statusColor, fontWeight: "bold" }}>{status}</span>
      </div>

      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: 4,
          height: 200,
          overflowY: "auto",
          padding: 8,
          background: "#fafafa",
          marginBottom: 8,
        }}
      >
        {messages.map((m, i) => (
          <div key={i} style={{ fontSize: 13, color: "#333" }}>
            {m}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          value={messageToSend}
          onChange={(e) => setMessageToSend(e.target.value)}
          placeholder="Type a message to send"
          disabled={status !== "connected"}
          style={{ flex: 1, padding: 6 }}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button onClick={handleSend} disabled={status !== "connected"}>
          Send
        </button>
      </div>
    </div>
  );
}
