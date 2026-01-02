import serial
import json
import requests
import time
from gateway_helper import poll_playtone



# ==================== Configuration ====================
SERIAL_PORT = 'COM5'       # Replace with your ESP32 COM port
BAUD = 115200
SERVER_URL = 'https://livestocktrackerwebapp.onrender.com/data'  # FastAPI endpoint

# ==================== Initialize Serial ====================
try:
    ser = serial.Serial(SERIAL_PORT, BAUD, timeout=1)
    print(f"LoRa Gateway listening on {SERIAL_PORT} at {BAUD} baud...")
except serial.SerialException as e:
    print(f"Error opening serial port {SERIAL_PORT}: {e}")
    exit(1)

# ==================Initialise writer =================
GATEWAY_POLL_INTERVAL = 2  # seconds

def poll_playtone(device_id):
    try:
        r = requests.get(f"https://livestocktrackerwebapp.onrender.com/gateway/playtone/{device_id}", timeout=5)
        data = r.json()

        command = data.get("command")
        if command:
            ser.write((command + "\n").encode())  # write to serial
            print(f"[DOWNLINK] Wrote to serial: {command}")

    except Exception as e:
        print(f"[DOWNLINK] Error polling Play Tone: {e}")

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

            # Parse JSON
            try:
                data = json.loads(line)
                print("Parsed data:", data)
            except json.JSONDecodeError as e:
                print(f"Parse error: invalid JSON ({e})")
                continue

            # Send to FastAPI
            try:
                response = requests.post(SERVER_URL, json=data, timeout=5)
                if response.status_code == 200:
                    print("[HTTP] Successfully sent to FastAPI!")
                else:
                    print(f"[HTTP] Failed → {response.status_code}: {response.text}")
            except requests.RequestException as e:
                print(f"[HTTP] Connection error: {e}")

            # Send downlink to gateway ESP32
                poll_playtone(ser)

                time.sleep(2)

            

    except KeyboardInterrupt:
        print("\nExiting LoRa gateway...")
        ser.close()
        break
    except Exception as e:
        print(f"Unexpected error: {e}")



