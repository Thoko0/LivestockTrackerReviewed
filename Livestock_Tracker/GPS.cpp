//Driver implementation of GPS header file
#include "gps.h"
#include <Arduino.h>
#include <TinyGPSPlus.h>

//========== Pin Configuration ===========
#define GPS_UART       1
#define GPS_RX_PIN     37
#define GPS_TX_PIN     36
#define GPS_BAUDRATE   9600

//=========== Objects ====================
static HardwareSerial GPSSerial(GPS_UART);
static TinyGPSPlus gps;
static GPSData_t gpsData;

//============GPS initialization ==========

void GPS_Init(void)
{
    GPSSerial.begin(GPS_BAUDRATE, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);

    gpsData.valid = false;
}

void GPS_Update(void)
{
    while (GPSSerial.available())
    {
        gps.encode(GPSSerial.read());
    }

    if (gps.location.isUpdated())
    {
        gpsData.latitude  = gps.location.lat();
        gpsData.longitude = gps.location.lng();
        gpsData.speed     = gps.speed.kmph();
        gpsData.valid     = true;
    }
}

GPSData_t GPS_GetData(void)
{
    return gpsData;
}