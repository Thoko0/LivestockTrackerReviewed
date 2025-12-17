#ifndef MPU6050_H
#define MPU6050_H

#include <Arduino.h>

typedef struct {
    bool valid;
    float ax, ay, az;
    float gx, gy, gz;
} MPU6050_Data_t;

// Add default pins as optional arguments
bool MPU6050_Init(uint8_t sdaPin = 21, uint8_t sclPin = 17);
void MPU6050_Update(void);
MPU6050_Data_t MPU6050_GetData(void);

#endif
