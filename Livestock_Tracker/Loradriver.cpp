#include "LoRadriver.h"

void LoRa_Init() {
    

    // --- SPI PINS (your custom wiring) ---
    SPI.begin(14, 12, 13);  // SCK, MISO, MOSI
    LoRa.setPins(15, 10, 9);  // CS, RST, DIO0
   

    if (!LoRa.begin(433E6)) {
        Serial.println("LoRa ERROR: Module not found!");
        while(1);
    }
    LoRa.setSyncWord(0x34);
    LoRa.setTxPower(20);
    Serial.println("LoRa ready");
}

void LoRa_Send(const String &payload) {
    if (payload.length() > 0){

        LoRa.beginPacket();
        LoRa.print(payload);
        LoRa.endPacket();
        Serial.println("Sent ID: " + String(payload));

        delay(500);
        
    }
    else if (payload.length() == 0){ 
        return;
    }
}

void LoRa_Receive(bool &Tone_trigger) {
    int packetSize = LoRa.parsePacket();
    if (packetSize) {
        String received = "";
        while (LoRa.available()) {
            received += (char)LoRa.read();
        }
        Serial1.print("LoRa Packet received:");
        Serial1.println(received);

        if (received == "TONE") {
            Tone_trigger = true;
        }
    }
}
