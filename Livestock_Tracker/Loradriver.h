#ifndef LORADRIVER_H
#define LORADRIVER_H

#include <SPI.h>
#include <LoRa.h>
#include <Adafruit_NeoPixel.h>

// LoRa Pins & Config
#define LORA_SCK   14
#define LORA_MISO  12
#define LORA_MOSI  13
#define LORA_SS    15
#define LORA_RST   10
#define LORA_DIO0  9
#define LORA_FREQ  433E6

void LoRa_Init();
void LoRa_Send(const String &payload);
void LoRa_Receive(bool &Tone_trigger);

#endif
