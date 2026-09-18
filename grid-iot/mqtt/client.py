"""MQTT client for Carbon Optimizer IoT communication."""

import json
import logging
from typing import Callable, Optional

try:
    import paho.mqtt.client as mqtt
except ImportError:
    mqtt = None
    logging.warning("paho-mqtt not installed. MQTT features will be simulated.")


class CarbonMQTTClient:
    """MQTT client wrapper for Carbon Optimizer."""

    def __init__(
        self,
        broker: str = "localhost",
        port: int = 1883,
        topic_prefix: str = "carbon-optimizer",
    ):
        self.broker = broker
        self.port = port
        self.topic_prefix = topic_prefix
        self.client: Optional[object] = None
        self.connected = False
        self.message_callback: Optional[Callable] = None

        if mqtt:
            self.client = mqtt.Client(client_id="carbon-optimizer-server")
            self.client.on_connect = self._on_connect
            self.client.on_message = self._on_message
            self.client.on_disconnect = self._on_disconnect

    def connect(self):
        """Connect to the MQTT broker."""
        if not self.client:
            logging.info("MQTT simulation mode - no broker connection")
            return

        try:
            self.client.connect(self.broker, self.port, keepalive=60)
            self.client.loop_start()
            logging.info(f"Connecting to MQTT broker at {self.broker}:{self.port}")
        except Exception as e:
            logging.error(f"Failed to connect to MQTT broker: {e}")

    def disconnect(self):
        """Disconnect from the MQTT broker."""
        if self.client and self.connected:
            self.client.loop_stop()
            self.client.disconnect()

    def _on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            self.connected = True
            logging.info("Connected to MQTT broker")
            # Subscribe to device responses
            self.client.subscribe(f"{self.topic_prefix}/devices/+/status")
        else:
            logging.error(f"MQTT connection failed with code {rc}")

    def _on_message(self, client, userdata, msg):
        try:
            payload = json.loads(msg.payload.decode())
            logging.info(f"MQTT message on {msg.topic}: {payload}")
            if self.message_callback:
                self.message_callback(msg.topic, payload)
        except json.JSONDecodeError:
            logging.warning(f"Invalid JSON on {msg.topic}: {msg.payload}")

    def _on_disconnect(self, client, userdata, rc):
        self.connected = False
        logging.warning(f"Disconnected from MQTT broker (rc={rc})")

    def publish(self, topic: str, payload: dict):
        """Publish a message to an MQTT topic."""
        full_topic = f"{self.topic_prefix}/{topic}"
        message = json.dumps(payload)

        if self.client and self.connected:
            self.client.publish(full_topic, message)
            logging.info(f"Published to {full_topic}: {message}")
        else:
            logging.info(f"[SIMULATED] Publish to {full_topic}: {message}")

    def subscribe(self, topic: str, callback: Optional[Callable] = None):
        """Subscribe to an MQTT topic."""
        full_topic = f"{self.topic_prefix}/{topic}"
        if callback:
            self.message_callback = callback

        if self.client and self.connected:
            self.client.subscribe(full_topic)
            logging.info(f"Subscribed to {full_topic}")

    def send_device_command(self, device_id: str, command: str, params: dict = None):
        """Send a command to a specific ESP32 device."""
        payload = {
            "device_id": device_id,
            "command": command,
            "params": params or {},
            "timestamp": __import__("datetime").datetime.now().isoformat(),
        }
        self.publish(f"devices/{device_id}/command", payload)