#include <WiFi.h>
#include <Adafruit_NeoPixel.h>
#include "gps.h"
#include "mpu6050.h"
#include "LoRaDriver.h"
#include "Audioplayer.h"

// ==================== NeoPixel ====================
#define NEOPIXEL_PIN 38   // safe pin
#define NUM_PIXELS 1
Adafruit_NeoPixel pixel(NUM_PIXELS, NEOPIXEL_PIN, NEO_GRB + NEO_KHZ800);

// ==================== Tone Trigger ====================
bool Tone_trigger = false;

// ==================== Setup ====================
void setup() {
    Serial.begin(115200);
    delay(300);

    // ---- NeoPixel init (touch once only) ----
    pixel.begin();
    pixel.setBrightness(10);   // low current, stable
    pixel.clear();
    pixel.show();


    // ---- Init peripherals ----
    GPS_Init();
    MPU6050_Init(21, 17);

    init_spiffs();
    init_i2s();

    LoRa_Init();

    // ---- SYSTEM READY INDICATOR ----
    pixel.setPixelColor(0, pixel.Color(0, 255, 0)); // solid green
    pixel.show();

    Serial.println("=== SYSTEM READY ===");
}

// ==================== Loop ====================
void loop() {
    GPS_Update();
    MPU6050_Update();

    GPSData_t gpsData = GPS_GetData();
    MPU6050_Data_t mpuData = MPU6050_GetData();

    LoRa_Receive(Tone_trigger);

    if (Tone_trigger) {
        set_playback_speed(0.5f);
        play_wav_file("/Kabolala.wav", pixel);
        Tone_trigger = false;
    }


    String payload = "{";
    payload += "\"lat\":" + String(gpsData.valid ? gpsData.latitude : 0.0, 6) + ",";
    payload += "\"lon\":" + String(gpsData.valid ? gpsData.longitude : 0.0, 6) + ",";
    payload += "\"ax\":" + String(mpuData.ax, 3) + ",";
    payload += "\"ay\":" + String(mpuData.ay, 3) + ",";
    payload += "\"az\":" + String(mpuData.az, 3) + ",";
    payload += "\"gyro_x\":" + String(mpuData.gx, 3) + ",";
    payload += "\"gyro_y\":" + String(mpuData.gy, 3) + ",";
    payload += "\"gyro_z\":" + String(mpuData.gz, 3);
    payload += "}";

    Serial.println(payload);
    LoRa_Send(payload);

    delay(5000);
}
