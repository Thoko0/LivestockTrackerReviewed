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
void loop() {
  counter = 0;
  int packetSize = LoRa.parsePacket();

  if (packetSize) {
    while (LoRa.available() && counter < sizeof(rec) - 1) {
    rec[counter++] = (char)LoRa.read();
    }
    rec[counter] = '\0';

    // Print ONLY received data  prefix with a < to indicate its to be sent to db 
    Serial.print("<");
    Serial.println(rec);

    pixel.setPixelColor(0, pixel.Color(255, 0, 0)); // RED
    pixel.show();
    delay(100);
    pixel.clear();
    pixel.show();
  }

  //tone command listener loop 

  static char message[max_message_length]; //set up character array to store incoming message
  static unsigned int message_position = 0;//position in the message array: where to store the next incoming byte
  
  
  while (Serial.available() > 0) {
    char incomingByte = Serial.read(); //read the incoming byte

    if (incomingByte != '\n') { //if the incoming byte is not a newline character, the message is complete
      message[message_position++] = incomingByte; //store the incoming byte in the message array increment the message position
      if (message_position >= max_message_length -1 ) { //if the message is too long, reset the position to avoid overflow
        message_position = 0;
      }
    } else {
      message[message_position] = '\0'; //null-terminate the message
      message_position = 0; //reset the message position for the next message


      // ONLY forward commands that start with '>'
      if (message[0] == '>') {
        // Strip '>'
        char *cmd = message + 1;

        LoRa.beginPacket();
        LoRa.print(cmd);
        LoRa.endPacket();
      }
    }
  }
}