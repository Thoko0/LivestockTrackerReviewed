#ifndef LORADRIVER_H
#define LORADRIVER_H
#define THIS_DEVICE_ID "test_001"

#include <SPI.h>
#include <LoRa.h>
#include <Adafruit_NeoPixel.h>



void LoRa_Init();
void LoRa_Send(const String &payload);
void LoRa_Receive();
void handleCommand(String msg);

#endif
