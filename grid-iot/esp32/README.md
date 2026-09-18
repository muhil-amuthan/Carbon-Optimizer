# ESP32 Relay Controller for Carbon Optimizer

## Hardware Requirements
- ESP32 DevKit v1
- 2-Channel Relay Module (5V)
- Jumper wires

## Wiring
| ESP32 Pin | Connection |
|-----------|------------|
| GPIO 26   | Relay IN1  |
| GPIO 27   | Relay IN2  |
| GPIO 2    | Status LED |
| 5V        | Relay VCC  |
| GND       | Relay GND  |

## Setup
1. Edit `config.h` with your WiFi and MQTT settings
2. Install Arduino libraries: `PubSubClient`, `ArduinoJson`
3. Select board: "ESP32 Dev Module"
4. Upload `esp32_relay.ino`

## MQTT Topics
- **Subscribe**: `carbon-optimizer/devices/ESP32_001/command`
- **Publish**: `carbon-optimizer/devices/ESP32_001/status`
- **Subscribe**: `carbon-optimizer/grid/status`

## Commands
```json
{"command": "ACTIVATE", "params": {"reason": "low_carbon_window"}}
{"command": "DEACTIVATE", "params": {"reason": "high_carbon_window"}}