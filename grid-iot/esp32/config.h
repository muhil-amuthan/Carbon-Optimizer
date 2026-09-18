/*
 * Carbon Optimizer - ESP32 Configuration
 * Configure WiFi, MQTT, and relay pin settings
 */

#ifndef CONFIG_H
#define CONFIG_H

// WiFi Configuration
#define WIFI_SSID       "YourWiFiSSID"
#define WIFI_PASSWORD   "YourWiFiPassword"

// MQTT Configuration
#define MQTT_BROKER     "192.168.1.100"
#define MQTT_PORT       1883
#define MQTT_CLIENT_ID  "ESP32_001"
#define MQTT_TOPIC_CMD  "carbon-optimizer/devices/ESP32_001/command"
#define MQTT_TOPIC_STATUS "carbon-optimizer/devices/ESP32_001/status"
#define MQTT_TOPIC_GRID "carbon-optimizer/grid/status"

// Relay Pin Configuration
#define RELAY_PIN_1     26
#define RELAY_PIN_2     27
#define STATUS_LED      2

// Timing
#define HEARTBEAT_INTERVAL  30000  // 30 seconds
#define RECONNECT_DELAY     5000   // 5 seconds

#endif