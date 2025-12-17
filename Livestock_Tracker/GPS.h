//Driver interface 

#pragma once

#include <stdbool.h>

typedef struct {
    double latitude;
    double longitude;
    float  speed;
    bool   valid;
} GPSData_t;

// ==========Initializing GPS hardware==========
void GPS_Init(void);

//======update internal GPS state =======
void GPS_Update(void);

//=======Get latest parsed GPS data======
GPSData_t GPS_GetData(void);
