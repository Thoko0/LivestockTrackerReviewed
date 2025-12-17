#include "mpu6050.h"
#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>

static Adafruit_MPU6050 mpu;
static MPU6050_Data_t mpuData;

bool MPU6050_Init(uint8_t sdaPin, uint8_t sclPin)
{
    Wire.begin(sdaPin, sclPin);  // <-- set SDA/SCL for ESP32
    if (!mpu.begin()) {
        mpuData.valid = false;
        return false;
    }

    mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
    mpu.setGyroRange(MPU6050_RANGE_500_DEG);
    mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);

    mpuData.valid = true;
    return true;
}

void MPU6050_Update(void)
{
    sensors_event_t accel, gyro, temp;
    mpu.getEvent(&accel, &gyro, &temp);

    mpuData.ax = accel.acceleration.x;
    mpuData.ay = accel.acceleration.y;
    mpuData.az = accel.acceleration.z;

    mpuData.gx = gyro.gyro.x;
    mpuData.gy = gyro.gyro.y;
    mpuData.gz = gyro.gyro.z;
}

MPU6050_Data_t MPU6050_GetData(void)
{
    return mpuData;
}
