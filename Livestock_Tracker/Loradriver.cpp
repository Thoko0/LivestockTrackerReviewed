#include "LoRadriver.h"
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
    int idKey = msg.indexOf("\"device_id\":\"");
    if (idKey == -1) return;

    int idStart = idKey + 13;
    int idEnd   = msg.indexOf("\"", idStart);
    if (idEnd == -1) return;

    String device_id = msg.substring(idStart, idEnd);
    if (device_id != THIS_DEVICE_ID) return;

    int cmdKey = msg.indexOf("\"command\":\"");
    if (cmdKey == -1) return;

    int cmdStart = cmdKey + 11;
    int cmdEnd   = msg.indexOf("\"", cmdStart);
    if (cmdEnd == -1) return;

    String command = msg.substring(cmdStart, cmdEnd);

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