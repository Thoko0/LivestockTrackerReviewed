#include <SPI.h>
#include <LoRa.h>
#include <Adafruit_NeoPixel.h>


/*IF data comes from LoRa:
    add '<'
    send to Serial
    DO NOT send to LoRa

IF data comes from Serial:
    IF starts with '>':
        remove '>'
        send to LoRa
    ELSE:
        ignore
        */



char rec[256];
int counter = 0;
// ===================== NeoPixel =====================
#define NEOPIXEL_PIN  5
#define NUM_PIXELS    1

Adafruit_NeoPixel pixel(NUM_PIXELS, NEOPIXEL_PIN, NEO_GRB + NEO_KHZ800);
// ===================== Tone command listener =====================
const unsigned int max_message_length = 256;


/**
 * Initializes the setup for the device.
 * - Initializes serial communication at 115200 baud rate.
 * - Delays for 200 milliseconds.
 * - Begins operation of the pixel.
 * - Clears the pixel display.
 * - Shows the pixel display.
 * - Initializes LoRa communication at 433MHz frequency.
 * - Sets the sync word for LoRa communication.
 * - Sets LoRa to receive mode.
 * - Prints a message indicating LoRa Gateway is ready and listening.
 *
 * @returns None
 */
void setup() {
  Serial.begin(115200);// for gateway.py
  delay(200);

  // NeoPixel init
  pixel.begin();
  pixel.clear();
  pixel.show();

  // LoRa init
  
  SPI.begin(14, 12, 13);  // SCK, MISO, MOSI
  LoRa.setPins(15, 10, 9);  // CS, RST, DIO0
  Serial.println("LoRa Initializing...");

  if (!LoRa.begin(433E6)) {
    Serial.println("Starting LoRa failed!");
    while (1);
  }

  LoRa.setSyncWord(0x34);   // must match sender
  LoRa.receive();
  Serial.println("LoRa Gateway ready — listening...");

}

// ===================== Loop =====================
/**
 * Loops to receive and process LoRa packets.
 *
 * This function initializes a counter and checks for incoming LoRa packets. If a packet is received,
 * it reads the packet data into the 'rec' array until the end of the array or no more data is available.
 * It then checks if the first character of the received message is '>'. If so, it extracts the command
 * from the message and sends it back using LoRa.
 *
 * @returns None
 */
void loop() {
  counter = 0;
  int packetSize = LoRa.parsePacket();

  if (packetSize) {
    while (LoRa.available() && counter < sizeof(rec) - 1) {
      rec[counter++] = (char)LoRa.read();
    }
    rec[counter] = '\0';

    Serial.print("<");
    Serial.println(rec);

    // GREEN flash = LoRa packet received
    pixel.setPixelColor(0, pixel.Color(0, 255, 0));
    pixel.show();
    delay(200);
    pixel.clear();
    pixel.show();
  }
  static String message = "";

  while (Serial.available() > 0) {
    String line = Serial.readStringUntil('\n');
    
    if (line.length() > 0) {
      // YELLOW flash = Serial command received
      pixel.setPixelColor(0, pixel.Color(255, 255, 0));
      pixel.show();
      delay(100);
      pixel.clear();
      pixel.show();

      if (line[0] == '>') {
        String cmd = line.substring(1);  // Remove '>'
        
        // BLUE flash = Sending via LoRa
        pixel.setPixelColor(0, pixel.Color(0, 0, 255));
        pixel.show();
        delay(100);
        pixel.clear();
        pixel.show();

        LoRa.beginPacket();
        LoRa.print(cmd);
        LoRa.endPacket();
      }
    }
  }
}
    
    