#include <SPI.h>
#include <LoRa.h>
#include <Adafruit_NeoPixel.h>

// ===================== LoRa Pins =====================
// ⚠️ Adjust if your wiring is different
#define LORA_SCK   14
#define LORA_MISO  12
#define LORA_MOSI  13
#define LORA_SS    15
#define LORA_RST   10
#define LORA_DIO0  9

#define LORA_FREQ  433E6   // use 868E6 or 433E6 if needed

// ===================== NeoPixel =====================
#define NEOPIXEL_PIN  5
#define NUM_PIXELS    1

Adafruit_NeoPixel pixel(NUM_PIXELS, NEOPIXEL_PIN, NEO_GRB + NEO_KHZ800);

// ===================== Setup =====================
void setup() {
  Serial.begin(115200);
  delay(200);

  // NeoPixel init
  pixel.begin();
  pixel.clear();
  pixel.show();

  // LoRa init
  Serial.println("[LoRa] Initializing...");
  SPI.begin(LORA_SCK, LORA_MISO, LORA_MOSI, LORA_SS);
  LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);

  if (!LoRa.begin(LORA_FREQ)) {
    Serial.println("[LoRa] ERROR: Failed to start");
    while (1);
  }

  LoRa.setSyncWord(0x34);   // must match sender
  LoRa.setTxPower(20);

  Serial.println("[LoRa] Gateway ready — listening...");
}

// ===================== Loop =====================
void loop() {
  int packetSize = LoRa.parsePacket();
  if (packetSize) {

    // 🔵 Blue flash while receiving
    pixel.setPixelColor(0, pixel.Color(0, 0, 255));
    pixel.show();

    String received = "";
    while (LoRa.available()) {
      received += (char)LoRa.read();
    }

    // Print ONLY received data (PySerial friendly)
    Serial.println(received);

    // Turn LED off
    pixel.clear();
    pixel.show();
  }
}
