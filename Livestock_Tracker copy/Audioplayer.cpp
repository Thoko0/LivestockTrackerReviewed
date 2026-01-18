#include "Audioplayer.h"

// ==================== I2S Config ====================
const i2s_port_t I2S_PORT = I2S_NUM_0;
const int ORIGINAL_SAMPLE_RATE = 16000;
const int I2S_BITS = 16;
float playbackSpeed = 1.0f;

// Example pins (update if needed)
const int PIN_BCLK  = 5;
const int PIN_LRCLK = 7;
const int PIN_DATA  = 8;

void init_spiffs() {
    if(!SPIFFS.begin(true)) {
        Serial1.println("[SPIFFS] ERROR: Failed to mount");
        while(1);
    }
    Serial1.println("[SPIFFS] Mounted");
}

void init_i2s() {
    i2s_config_t i2s_config = {
        .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX),
        .sample_rate = (uint32_t)(ORIGINAL_SAMPLE_RATE * playbackSpeed),
        .bits_per_sample = (i2s_bits_per_sample_t)I2S_BITS,
        .channel_format = I2S_CHANNEL_FMT_RIGHT_LEFT,
        .communication_format = I2S_COMM_FORMAT_I2S_MSB,
        .intr_alloc_flags = 0,
        .dma_buf_count = 4,
        .dma_buf_len = 512,
        .use_apll = false
    };

    i2s_pin_config_t pin_config = {
        .bck_io_num = PIN_BCLK,
        .ws_io_num  = PIN_LRCLK,
        .data_out_num = PIN_DATA,
        .data_in_num = I2S_PIN_NO_CHANGE
    };

    i2s_driver_install(I2S_PORT, &i2s_config, 0, NULL);
    i2s_set_pin(I2S_PORT, &pin_config);
}

void set_playback_speed(float speed) {
    if (speed <= 0) return;
    playbackSpeed = speed;
    int new_rate = (int)(ORIGINAL_SAMPLE_RATE * playbackSpeed);
    i2s_set_sample_rates(I2S_PORT, new_rate);
    Serial1.printf("[Audio] Playback speed set to %.2f (sample rate %d)\n", playbackSpeed, new_rate);
}

void play_wav_file(const char* path) {
    File file = SPIFFS.open(path, "r");
    if(!file) {
        Serial1.println("[Audio] Failed to open WAV file!");
        return;
    }

    file.seek(44); // Skip WAV header

    const size_t buffer_size = 1024;
    uint8_t buffer[buffer_size];
    size_t bytes_read;
    size_t bytes_written;
    bool ledOn = false;

    while ((bytes_read = file.read(buffer, buffer_size)) > 0) {
        i2s_write(I2S_PORT, buffer, bytes_read, &bytes_written, portMAX_DELAY);
    }

}