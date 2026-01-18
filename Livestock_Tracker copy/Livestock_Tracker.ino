#include <WiFi.h>
#include <Adafruit_NeoPixel.h>
#include "gps.h"
#include "mpu6050.h"
#include "LoRaDriver.h"
#include "Audioplayer.h"
#include <WiFiManager.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>


// ==================== Server Endpoint ====================
const char *serverURL = "https://livestocktrackerwebapp.onrender.com/gateway/playtone/test_001";

// ==================== NeoPixel ====================
#define NEOPIXEL_PIN 38   // safe pin
#define NUM_PIXELS 1
Adafruit_NeoPixel pixel(NUM_PIXELS, NEOPIXEL_PIN, NEO_GRB + NEO_KHZ800);

// ==================== Tone Trigger ====================
bool Tone_trigger = false;




// ==================== Setup ====================
/**
 * Initializes various components and sets up the system.
 *
 * @returns None
 */
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

    //WiFiManager, Local intialization. Once its business is done, there is no need to keep it around
  WiFiManager wm;
  bool result;
  result = wm.autoConnect("UNZA_Tracker", "12345678");
  
  if(!result){
    Serial.println("Failed to connect to the WiFi");
  }
  else{
    Serial.println("WiFi Connected.");
  }
}

// ==================== Loop ====================
/**
 * Main loop function that updates GPS and MPU6050 data, receives LoRa messages,
 * constructs a JSON payload with GPS and MPU6050 data, prints the payload to Serial,
 * and sends the payload via LoRa. It then delays for 5 seconds before repeating.
 *
 * @returns None
 */
void loop() {
    GPS_Update();
    MPU6050_Update();

    GPSData_t gpsData = GPS_GetData();
    MPU6050_Data_t mpuData = MPU6050_GetData();


// Check for play tone command from db 
    if (WiFi.status() == WL_CONNECTED)
  {
    HTTPClient http;
    http.begin(serverURL);
    http.addHeader("Content-Type", "application/json");
    int httpCode = http.GET();

    if (httpCode == 200)
    {
      String response = http.getString();
      Serial.println("Command received: " + response);
      // Parse JSON response
      StaticJsonDocument<256> doc;
      DeserializationError error = deserializeJson(doc, response);
      
      if (error) {
        Serial.println("JSON parse error");
      } else {
        const char* device_id = doc["device_id"];
        const char* command = doc["command"];
        
        // Check if device_id matches
        if (device_id && String(device_id) == "test_001") {
          Serial.println("Device ID matches! Playing tone...");
          play_wav_file("/BEEP.wav");
        } else {
          Serial.println("Device ID mismatch or missing");
        }
      }
    }
    else
    {
      Serial.println("GET failed: " + String(httpCode));
    }
    http.end();
  }
  else
  {
    Serial.println("WiFi disconnected!");
  }


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
