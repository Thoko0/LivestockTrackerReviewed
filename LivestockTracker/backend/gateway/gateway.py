import serial
import json
import requests
import time
from datetime import datetime
import threading



# ==================== Configuration ====================
SERIAL_PORT = 'COM11'       # Replace with your ESP32 COM port
BAUD = 115200
SERVER_URL1 = 'https://livestocktrackerwebapp.onrender.com/data'  # FastAPI endpoint
SERVER_URL2 = 'https://livestocktrackerwebapp.onrender.com/gateway/playtone'


# ==================== Initialize Serial ====================
try:
    ser = serial.Serial(SERIAL_PORT, BAUD, timeout=1)
    print(f"LoRa Gateway listening on {SERIAL_PORT} at {BAUD} baud...")
except serial.SerialException as e:
    print(f"Error opening serial port {SERIAL_PORT}: {e}")
    exit(1)

# ==================Initialise writer =================
def poll_playtone_background(device_id):
    """
    Continuously poll the server for playtone commands and send them to an ESP32 device over serial in a separate thread.
    @param device_id - The ID of the device to receive commands
    @return None
    """
    """
    Continuously polls the server for playtone commands and
    sends them to ESP32 over serial. Runs in a separate thread.
    """
    while True:
        try:
            # Get next command from server
            r = requests.get(f"{SERVER_URL2}/{device_id}", timeout=10)  # assume server returns next command with device_id
            if r.status_code != 200:
                print(f"DOWNLINK Failed to fetch command: {r.status_code}")
                time.sleep(2)
                continue

            data = r.json()
            if not data or "command" not in data:
                # No queued command
                print(f"DOWNLINK No queued command for {device_id}")
                time.sleep(2)
                continue

            command = data.get("command")

            payload = json.dumps({"device_id": device_id, "command": command})
            ser.write((f">{payload}\n").encode())
            ser.flush()
            #[SERIAL →] >{"device_id": "test_001", "command": "PLAY_TONE"}
            print(f">{payload}")

            # Poll interval
            time.sleep(2)

        except Exception as e:
            print(f" Error polling Play Tone: {e}")
            time.sleep(2)


# listen for each registered tracker can be stored on a file locally when later deployed for all trackers 
threading.Thread(target=poll_playtone_background, args=("test_001",), daemon=True).start()
threading.Thread(target=poll_playtone_background, args=("test_002",), daemon=True).start()


# ==================== Main Loop ====================
buffer = ""

while True:
    try:
        # Read all available bytes
        bytes_read = ser.read(ser.in_waiting or 1)
        buffer += bytes_read.decode('utf-8', errors='ignore')

        # Process full JSON objects separated by newline
        while '\n' in buffer:
            line, buffer = buffer.split('\n', 1)
            line = line.strip()
            if not line:
                continue

            print("RAW:", line)

            # ---- START TOKEN LOGIC ----
            if line.startswith(">"):
                # This is a command we sent (or serial echo) → ignore
                print("[SERIAL] Ignored outgoing echo")
                continue

            if not line.startswith("<"):
                print("[SERIAL] Unknown message format, skipping")
                continue

            # Remove '<' token
            line = line[1:]
            # ---- END TOKEN LOGIC ----


            # Parse JSON
            try:
                data = json.loads(line)
                print("Parsed data:", data)
            except json.JSONDecodeError as e:
                print(f"Parse error: invalid JSON ({e})")
                continue

            # Send to FastAPI
            try:
                response = requests.post(SERVER_URL1, json=data, timeout=5)
                if response.status_code == 200:
                    print("[HTTP] Successfully sent to FastAPI!")
                else:
                    print(f"[HTTP] Failed → {response.status_code}: {response.text}")
            except requests.RequestException as e:
                print(f"[HTTP] Connection error: {e}")

        
            

    except KeyboardInterrupt:
        print("\nExiting LoRa gateway...")
        ser.close()
        break
    except Exception as e:
        print(f"Unexpected error: {e}")



