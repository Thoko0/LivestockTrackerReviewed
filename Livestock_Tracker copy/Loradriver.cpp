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
    Serial.println("DEBUG: handleCommand received: " + msg);
    
    StaticJsonDocument<256> doc;
    DeserializationError error = deserializeJson(doc, msg);
    
    if (error) {
        Serial.println("JSON parse error: " + String(error.f_str()));
        return;
    }
    
    const char* device_id = doc["device_id"];
    const char* command = doc["command"];
    
    Serial.println("DEBUG: device_id = " + String(device_id));
    Serial.println("DEBUG: command = " + String(command));
    Serial.println("DEBUG: DEVICE_ID = " + String(DEVICE_ID));
    
    if (!device_id || !command) {
        Serial.println("Missing fields in JSON");
        return;
    }
    
    if (String(device_id) != DEVICE_ID) {
        Serial.println("Device ID mismatch!");
        return;
    }
    
    Serial.println("Accepted command: " + String(command));
    
    if (String(command) == "PLAY_TONE") {
        Serial.println("Playing tone...");
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

    Serial.println("LoRa packet received: " + received);
    handleCommand(received);
}