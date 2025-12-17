#include "LoRadriver.h"

void LoRa_Init() {
    Serial.println("LoRa Initializing...");
    SPI.begin(LORA_SCK, LORA_MISO, LORA_MOSI, LORA_SS);
    LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);
    LoRa.setSyncWord(0x34);
    LoRa.setTxPower(20);

    if (!LoRa.begin(LORA_FREQ)) {
        Serial.println("LoRa ERROR: Module not found!");
        while(1);
    }
    Serial.println("LoRa Module ready");
}

void LoRa_Send(const String &payload) {
    if (payload.length() > 0){

        LoRa.beginPacket();
        LoRa.print(payload);
        if (LoRa.endPacket() == 1) {
            Serial.println("LoRa Packet sent successfully!");
        } else {
            Serial.println("Failed to send packet");
        }

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
