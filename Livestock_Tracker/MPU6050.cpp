#include "mpu6050.h"
#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>

static Adafruit_MPU6050 mpu;
static MPU6050_Data_t mpuData;

// Offsets for calibration
static float offX = 0, offY = 0, offZ = 0;

// Constants
const float MOVE_THRESHOLD = 1.8;
const float STILL_THRESHOLD = 0.25;
const float GRAZING_PITCH = -25.0;

bool MPU6050_Init(uint8_t sdaPin, uint8_t sclPin) {
    Wire.begin(sdaPin, sclPin);
    if (!mpu.begin()) {
        mpuData.valid = false;
        return false;
    }

    mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
    mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);

    // --- Auto-Calibration Routine ---
    Serial.println("Calibrating MPU6050... Do not move.");
    float sX = 0, sY = 0, sZ = 0;
    for (int i = 0; i < 100; i++) {
        sensors_event_t a, g, t;
        mpu.getEvent(&a, &g, &t);
        sX += a.acceleration.x;
        sY += a.acceleration.y;
        sZ += a.acceleration.z;
        delay(10);
    }
    offX = sX / 100.0;
    offY = sY / 100.0;
    offZ = (sZ / 100.0) - 9.81; // Z should be gravity

    mpuData.valid = true;
    return true;
}

void MPU6050_Update(void) {
    sensors_event_t accel, gyro, temp;
    mpu.getEvent(&accel, &gyro, &temp);

    // Apply offsets
    mpuData.ax = accel.acceleration.x - offX;
    mpuData.ay = accel.acceleration.y - offY;
    mpuData.az = accel.acceleration.z - offZ;
    mpuData.gx = gyro.gyro.x;
    mpuData.gy = gyro.gyro.y;
    mpuData.gz = gyro.gyro.z;

    // Math
    mpuData.magnitude = sqrt(pow(mpuData.ax, 2) + pow(mpuData.ay, 2) + pow(mpuData.az, 2));
    mpuData.pitch = atan2(mpuData.ax, sqrt(pow(mpuData.ay, 2) + pow(mpuData.az, 2))) * 180 / M_PI;

    // Behavior Logic
    float diff = abs(mpuData.magnitude - 9.81);

    if (diff > MOVE_THRESHOLD) {
        mpuData.behavior = "2";
    } else if (mpuData.pitch < GRAZING_PITCH) {
        mpuData.behavior = "0";
    } else if (diff < STILL_THRESHOLD) {
        if (abs(mpuData.ay) > 7.5) mpuData.behavior = "3";
        else mpuData.behavior = "1";
    } else {
        mpuData.behavior = "1";
    }
}

MPU6050_Data_t MPU6050_GetData(void) {
    return mpuData;
}