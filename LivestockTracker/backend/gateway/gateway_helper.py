import requests

def poll_playtone(ser, backend_url="https://livestocktrackerwebapp.onrender.com/gateway/playtone"):
    """
    Polls the backend for the next queued PLAY_TONE command
    and writes it to the provided serial connection.

    Args:
        ser: The pyserial Serial object connected to the Gateway ESP32.
        backend_url: URL of the FastAPI endpoint that returns queued commands.
    """
    try:
        response = requests.get(backend_url, timeout=5)
        data = response.json()

        command = data.get("command")
        device_id = data.get("device_id")

        if command and device_id:
            # Write command to serial so Gateway ESP32 can read it
            ser.write((command + "\n").encode())
            print(f"[DOWNLINK] Wrote '{command}' to serial for device {device_id}")

    except Exception as e:
        print(f"[DOWNLINK] Error polling Play Tone: {e}")
