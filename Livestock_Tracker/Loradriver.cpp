#include "Loradriver.h"
#include "Audioplayer.h"


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



void handleCommand(String msg) {
    StaticJsonDocument<200> doc;
    DeserializationError error = deserializeJson(doc, msg);
    
    if (error) {
        Serial.println("JSON parse error");
        return;
    }
    
    String device_id = doc["device_id"];
    String command = doc["command"];
    
    if (device_id != DEVICE_ID) return;
    
    Serial.println("Accepted command: " + command);
    
    if (command == "PLAY_TONE") {
        play_wav_file("/tone.wav");
    }
}

void LoRa_Receive() {
    int packetSize = LoRa.parsePacket();
    if (!packetSize) return;

    String received = "";
    while (LoRa.available()) {
        received += (char)LoRa.read();
    }
    received.trim();

    Serial.println(received);
    handleCommand(received);
}