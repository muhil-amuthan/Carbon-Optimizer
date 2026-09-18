"""MQTT publisher for grid status updates."""

import json
import time
import logging
from datetime import datetime
from grid_service import GridService
from client import CarbonMQTTClient


class GridPublisher:
    """Publishes grid carbon intensity data via MQTT at regular intervals."""

    def __init__(
        self,
        broker: str = "localhost",
        port: int = 1883,
        interval_seconds: int = 30,
    ):
        self.grid_service = GridService()
        self.mqtt_client = CarbonMQTTClient(broker=broker, port=port)
        self.interval = interval_seconds

    def start(self):
        """Start publishing grid data."""
        logging.basicConfig(level=logging.INFO)
        self.mqtt_client.connect()

        logging.info(f"Grid publisher started (interval: {self.interval}s)")

        try:
            while True:
                status = self.grid_service.get_current_grid_status()

                self.mqtt_client.publish("grid/status", status)

                # Send device commands based on grid conditions
                if status["is_green_window"]:
                    self.mqtt_client.send_device_command(
                        "ESP32_001", "ACTIVATE", {"reason": "low_carbon_window"}
                    )
                elif status["is_red_window"]:
                    self.mqtt_client.send_device_command(
                        "ESP32_001", "DEACTIVATE", {"reason": "high_carbon_window"}
                    )

                time.sleep(self.interval)

        except KeyboardInterrupt:
            logging.info("Publisher stopped")
            self.mqtt_client.disconnect()


if __name__ == "__main__":
    publisher = GridPublisher()
    publisher.start()