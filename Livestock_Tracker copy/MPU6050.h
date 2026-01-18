#ifndef MPU6050_H
#define MPU6050_H

#include <Arduino.h>

typedef struct {
    bool valid;
    float ax, ay, az;
    float gx, gy, gz;
    float magnitude;
    float pitch;
    String behavior; // Added to store the classification
} MPU6050_Data_t;

bool MPU6050_Init(uint8_t sdaPin = 21, uint8_t sclPin = 17);
void MPU6050_Update(void);
MPU6050_Data_t MPU6050_GetData(void);

#endif