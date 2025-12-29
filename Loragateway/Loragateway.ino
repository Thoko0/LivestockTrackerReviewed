#include <SPI.h>
#include <LoRa.h>
#include <Adafruit_NeoPixel.h>

char rec[256];
int counter = 0;
// ===================== NeoPixel =====================
#define NEOPIXEL_PIN  38
#define NUM_PIXELS    1

Adafruit_NeoPixel pixel(NUM_PIXELS, NEOPIXEL_PIN, NEO_GRB + NEO_KHZ800);

void setup() {
  Serial.begin(115200);
  delay(200);

  // NeoPixel init
  pixel.begin();
  pixel.clear();
  pixel.show();

  // LoRa init
  
  SPI.begin(14, 12, 13);  // SCK, MISO, MOSI
  LoRa.setPins(15, 10, 9);  // CS, RST, DIO0
  Serial.println("[LoRa] Initializing...");

  if (!LoRa.begin(433E6)) {
    Serial.println("Starting LoRa failed!");
    while (1);
  }

  LoRa.setSyncWord(0x34);   // must match sender
  LoRa.receive();
  Serial.println("LoRa Gateway ready — listening...");
}

// ===================== Loop =====================
void loop() {
  counter = 0;
  int packetSize = LoRa.parsePacket();

  if (packetSize) {
    Serial.print("Packet received: ");
    while (LoRa.available() && counter < sizeof(rec) - 1) {
    rec[counter++] = (char)LoRa.read();
    }
    rec[counter] = '\0';

    // Print ONLY received data 
    while (Serial.println(rec)){;
    pixel.setPixelColor(0, pixel.Color(255, 0, 0));  // RED
    pixel.show();
    delay(5000);
    pixel.clear();
    pixel.show();
    }
  }
}
