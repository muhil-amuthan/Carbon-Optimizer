/*
 * Carbon Optimizer - ESP32 Relay Controller
 * Controls industrial equipment based on grid carbon intensity
 * Communicates via MQTT with the Carbon Optimizer backend
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "config.h"

WiFiClient espClient;
PubSubClient mqttClient(espClient);

bool relayState = false;
unsigned long lastHeartbeat = 0;
float currentGridIntensity = 500.0;
bool isGreenWindow = false;

void setup() {
    Serial.begin(115200);

    // Initialize pins
    pinMode(RELAY_PIN_1, OUTPUT);
    pinMode(RELAY_PIN_2, OUTPUT);
    pinMode(STATUS_LED, OUTPUT);

    digitalWrite(RELAY_PIN_1, LOW);
    digitalWrite(RELAY_PIN_2, LOW);

    // Connect WiFi
    connectWiFi();

    // Setup MQTT
    mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
    mqttClient.setCallback(mqttCallback);

    Serial.println("Carbon Optimizer ESP32 Ready");
}

void loop() {
    if (!mqttClient.connected()) {
        reconnectMQTT();
    }
    mqttClient.loop();

    // Send heartbeat
    if (millis() - lastHeartbeat > HEARTBEAT_INTERVAL) {
        sendStatus();
        lastHeartbeat = millis();
    }
}

void connectWiFi() {
    Serial.printf("Connecting to WiFi: %s\n", WIFI_SSID);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 30) {
        delay(500);
        Serial.print(".");
        attempts++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.printf("\nWiFi connected. IP: %s\n", WiFi.localIP().toString().c_str());
        digitalWrite(STATUS_LED, HIGH);
    } else {
        Serial.println("\nWiFi connection failed!");
    }
}

void reconnectMQTT() {
    while (!mqttClient.connected()) {
        Serial.println("Connecting to MQTT...");
        if (mqttClient.connect(MQTT_CLIENT_ID)) {
            Serial.println("MQTT connected");
            mqttClient.subscribe(MQTT_TOPIC_CMD);
            mqttClient.subscribe(MQTT_TOPIC_GRID);
            sendStatus();
        } else {
            Serial.printf("MQTT failed, rc=%d. Retrying...\n", mqttClient.state());
            delay(RECONNECT_DELAY);
        }
    }
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
    // Parse JSON payload
    StaticJsonDocument<512> doc;
    DeserializationError error = deserializeJson(doc, payload, length);

    if (error) {
        Serial.printf("JSON parse error: %s\n", error.c_str());
        return;
    }

    String topicStr = String(topic);

    if (topicStr == MQTT_TOPIC_CMD) {
        handleCommand(doc);
    } else if (topicStr == MQTT_TOPIC_GRID) {
        handleGridUpdate(doc);
    }
}

void handleCommand(JsonDocument& doc) {
    const char* command = doc["command"];
    Serial.printf("Command received: %s\n", command);

    if (strcmp(command, "ACTIVATE") == 0 || strcmp(command, "ON") == 0) {
        setRelay(true);
    } else if (strcmp(command, "DEACTIVATE") == 0 || strcmp(command, "OFF") == 0) {
        setRelay(false);
    } else if (strcmp(command, "SCHEDULE") == 0) {
        // Future: implement scheduled operations
        Serial.println("Schedule command received (not yet implemented)");
    }

    sendStatus();
}

void handleGridUpdate(JsonDocument& doc) {
    currentGridIntensity = doc["carbon_intensity_gco2_kwh"] | 500.0;
    isGreenWindow = doc["is_green_window"] | false;

    Serial.printf("Grid update - Intensity: %.1f gCO2/kWh, Green: %s\n",
                   currentGridIntensity, isGreenWindow ? "YES" : "NO");
}

void setRelay(bool state) {
    relayState = state;
    digitalWrite(RELAY_PIN_1, state ? HIGH : LOW);
    Serial.printf("Relay set to: %s\n", state ? "ON" : "OFF");
}

void sendStatus() {
    StaticJsonDocument<256> doc;
    doc["device_id"] = MQTT_CLIENT_ID;
    doc["relay_state"] = relayState ? "ON" : "OFF";
    doc["grid_intensity"] = currentGridIntensity;
    doc["is_green_window"] = isGreenWindow;
    doc["wifi_rssi"] = WiFi.RSSI();
    doc["uptime_ms"] = millis();

    char buffer[256];
    serializeJson(doc, buffer);
    mqttClient.publish(MQTT_TOPIC_STATUS, buffer);
}