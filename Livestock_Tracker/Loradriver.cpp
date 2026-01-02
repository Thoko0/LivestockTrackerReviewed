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

void LoRa_Receive() {
    int packetSize = LoRa.parsePacket();
    if (packetSize) {
        String received = "";
        while (LoRa.available()) {
            received += (char)LoRa.read();
        }

        Serial.print("LoRa Packet received: ");
        Serial.println(received);

        // Check for PLAY_WAV command
        if (received.startsWith("PLAY_WAV,")) {
            String filename = received.substring(9); // skip "PLAY_WAV,"
            filename.trim();  // remove whitespace or newline

            Serial.print("Playing WAV file: ");
            Serial.println(filename);

            set_playback_speed(0.5f);              // optional: same speed
            play_wav_file(filename.c_str(), pixel); // call your existing function
        }
    }
}
