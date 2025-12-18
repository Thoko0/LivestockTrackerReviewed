#ifndef LORADRIVER_H
#define LORADRIVER_H

#include <SPI.h>
#include <LoRa.h>
#include <Adafruit_NeoPixel.h>



void LoRa_Init();
void LoRa_Send(const String &payload);
void LoRa_Receive(bool &Tone_trigger);

#endif
