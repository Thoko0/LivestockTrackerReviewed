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
    Serial.println("GPS initalized");
    if (!MPU6050_Init(21, 17)) {
        Serial.println("MPU6050 Init Failed!");
        while (1);
    }
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

    LoRa_Receive();


    String payload = "{";
    payload += "\"device_id\":\"test_001\","; // Example device ID
    payload += "\"latitude\":" + String(gpsData.valid ? gpsData.latitude : 0.0, 6) + ",";
    payload += "\"longitude\":" + String(gpsData.valid ? gpsData.longitude : 0.0, 6) + ",";
    payload += "\"speed\":" + String(gpsData.valid ? gpsData.speed : 0.0, 6) + ",";
    payload += "\"behavior\":" + String(mpuData.behavior);
    payload += "}";


    Serial.println(payload);
    LoRa_Send(payload);

    delay(5000);
}
