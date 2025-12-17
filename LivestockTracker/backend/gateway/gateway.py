import serial
import json
import requests
import time

# ==================== Configuration ====================
SERIAL_PORT = 'COM10'       # Replace with your ESP32 COM port
BAUD = 115200
SERVER_URL = 'http://10.215.25.198:8000/data'  # FastAPI endpoint

# ==================== Initialize Serial ====================
try:
    ser = serial.Serial(SERIAL_PORT, BAUD, timeout=1)
    print(f"LoRa Gateway listening on {SERIAL_PORT} at {BAUD} baud...")
except serial.SerialException as e:
    print(f"Error opening serial port {SERIAL_PORT}: {e}")
    exit(1)

# ==================== Main Loop ====================
while True:
    try:
        line = ser.readline().decode('utf-8').strip()
        if not line:
            continue

        print("RAW:", line)

        # Parse JSON from ESP32
        try:
            data = json.loads(line)
        except json.JSONDecodeError:
            print("Parse error: invalid JSON")
            continue

        # Debug: show parsed values
        print("Parsed data:", data)

        # Send to FastAPI
        try:
            response = requests.post(SERVER_URL, json=data, timeout=5)
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
