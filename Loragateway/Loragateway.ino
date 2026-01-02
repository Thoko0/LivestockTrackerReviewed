#include <SPI.h>
#include <LoRa.h>
#include <Adafruit_NeoPixel.h>

char rec[256];
int counter = 0;
// ===================== NeoPixel =====================
#define NEOPIXEL_PIN  38
#define NUM_PIXELS    1

Adafruit_NeoPixel pixel(NUM_PIXELS, NEOPIXEL_PIN, NEO_GRB + NEO_KHZ800);
// ===================== Tone command listener =====================
const unsigned int max_message_length = 256;

// Function to send PLAY_WAV command over LoRa

void sendPlayWavOverLora(const char* filename) {
  char loraPayload[64];

  snprintf(loraPayload, sizeof(loraPayload),
           "PLAY_WAV,%s", filename);

  Serial.print("Forwarding over LoRa: ");
  Serial.println(loraPayload);

  // Send via LoRa
  LoRa.beginPacket();
  LoRa.print(loraPayload);
  LoRa.endPacket();
}

void handleCommand(const char* cmd) {
  Serial.print("Received command: ");
  Serial.println(cmd);

  // Expect: PLAY_WAV,beep.wav
  if (strncmp(cmd, "PLAY_WAV", 8) == 0) {
    const char* comma = strchr(cmd, ',');
    if (!comma) {
      Serial.println("Invalid PLAY_WAV format");
      return;
    }

    const char* filename = comma + 1;
    sendPlayWavOverLora(filename);
  } 
  else {
    Serial.println("Unknown command");
  }
}

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

  //tone command listener loop 

  static char message[max_message_length]; //set up character array to store incoming message
  static unsigned int message_position = 0; //position in the message array: where to store the next incoming byte
  while (Serial.available() > 0) {
    char incomingByte = Serial.read(); //read the incoming byte
    if (incomingByte != '\n') { //if the incoming byte is not a newline character, the message is complete
      message[message_position] = incomingByte; //store the incoming byte in the message array
      message_position++; //increment the message position
      if (message_position >= max_message_length -1 ) { //if the message is too long, reset the position to avoid overflow
        message_position = 0;
      }
    } else {
      message[message_position] = '\0'; //null-terminate the message
      handleCommand(message); //call the function to handle the complete message
      Serial.print("Received command: ");
      Serial.println(message); //print the received message 
      message_position = 0; //reset the message position for the next message
  }
}
  // End of tone command listener loop 
}