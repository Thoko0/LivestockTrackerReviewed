#ifndef AUDIODRIVER_H
#define AUDIODRIVER_H

#include <Arduino.h>
#include <SPIFFS.h>
#include "driver/i2s.h"
#include <Adafruit_NeoPixel.h>

void init_spiffs();
void init_i2s();
void play_wav_file(const char* path);
void set_playback_speed(float speed);

#endif
