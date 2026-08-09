import asyncio
import websockets

async def handle_connection(websocket):
    print("A client connected!")
    try:
        async for message in websocket:
            print(f"Received telemetry: {message}")
            await websocket.send(f"Server got: {message}")
    except websockets.exceptions.ConnectionClosed:
        print("Client disconnected.")

async def main():
    print("WebSocket Server is running on ws://localhost:8080")
    async with websockets.serve(handle_connection, "0.0.0.0", 8080):
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())