# Hardware Setup — ESP32 + DHT11 + FC-28

> Spanish version: [`HARDWARE_SETUP.es.md`](HARDWARE_SETUP.es.md)

---

## Components

| Component | Model | Function |
|---|---|---|
| Microcontroller | ESP32 DevKit v1 | Reads sensors and sends data over WiFi |
| Air sensor | DHT11 | Temperature 0–50 °C, humidity 20–90% RH |
| Soil sensor | FC-28 + LM393 | Soil moisture by conductivity |

---

## Wiring

```
DHT11
  VCC  -> 3.3V
  DATA -> GPIO 15
  GND  -> GND

FC-28
  VCC  -> 3.3V
  AO   -> GPIO 34  (ADC, input only)
  GND  -> GND

Built-in LED -> GPIO 2
BOOT button  -> GPIO 0
```

Always use 3.3 V. The ESP32 GPIO pins are not 5 V tolerant.

---

## Firmware

File: `arduino/agrovision_provisioning/agrovision_provisioning.ino`

Required libraries (install from the Arduino IDE Library Manager):
- ArduinoJson 6.x
- DHT sensor library (Adafruit)
- Adafruit Unified Sensor (installed as a dependency)

Build configuration:
- Board: ESP32 Dev Module
- Upload Speed: 921600
- Flash Size: 4MB
- Partition Scheme: Default

---

## First boot

1. The ESP32 creates an open WiFi network `AgroVision-Setup-XXXX`.
2. Connect a phone or PC to that network.
3. The configuration portal opens at `http://192.168.4.1`.
4. Select the WiFi network, enter its password and the server URL.
5. The ESP32 stores the credentials in NVS and reboots.
6. It starts sending readings every 10 seconds.

---

## Factory reset

Hold the BOOT button for 5 seconds. The LED blinks 5 times, the ESP32 clears the
stored credentials and returns to Setup mode.

---

## LED indicators (GPIO 2)

| Pattern | Meaning |
|---|---|
| Very fast blink (~150 ms) | Setup mode active |
| Slow blink (~500 ms) | Trying to connect to WiFi |
| One short blink every 10 s | Sending data correctly |
| Three fast blinks | Error while sending data |

---

## JSON payload sent to the backend

```json
{
  "esp32_id": "ESP32_A1B2C3",
  "temperatura": 24.0,
  "humedad_aire": 65.0,
  "humedad_suelo": 23,
  "timestamp": 1745000000
}
```

Receiving endpoint: `POST /api/sensores/lectura`

---

## DHT11 calibration

The DHT11 cannot be calibrated in software beyond a fixed offset. If the true
value differs from the sensor reading, adjust it in the firmware:

```cpp
temp    = dht.readTemperature() - 2.0;
humAire = dht.readHumidity()   - 5.0;
```

Check the readings by opening the Serial Monitor (115200 baud). The ESP32 prints:
```
[DATA] Temp=24.0 C  HumAire=65%  HumSuelo=23%
```

---

## FC-28 calibration

The FC-28 reads soil conductivity. More moisture = higher voltage = higher ADC
value (0–4095).

Constants in the firmware:
```cpp
#define SOIL_DRY   50
#define SOIL_WET  3200
```

To calibrate:
1. Leave the sensor in the air — note the `raw ADC` from the Serial Monitor — set
   `SOIL_DRY = value + 20`.
2. Dip the probe tips in water (not the module) — note the `raw ADC` — set
   `SOIL_WET = value - 50`.
3. Recompile and flash.

---

## USB provisioning

Lets you configure the ESP32 from the web panel without opening the Arduino IDE.

Backend requirement: `pip install pyserial`

Flow:
1. Connect the ESP32 by USB to the PC running the backend.
2. Go to Devices in the web panel.
3. Click "Connect new device".
4. Select the detected COM port.
5. The system scans WiFi networks and configures the ESP32 automatically.

---

## Network and firewall

The ESP32 and the server must be on the same WiFi network.

If the ESP32 cannot connect on Windows:
```
netsh advfirewall firewall add rule name="AgroYachay" dir=in action=allow protocol=TCP localport=5000
```

---

## Sensor endpoints

| Method | Route | Description |
|---|---|---|
| POST | /api/sensores/lectura | Receives ESP32 readings |
| GET | /api/sensores/mis-dispositivos | User's sensors |
| GET | /api/sensores/pendientes | Sensors with no crop assigned |
| GET | /api/sensores/esp32/:id/estado | Status and latest readings |
| POST | /api/sensores/:id/vincular | Links a sensor to a crop |
| POST | /api/sensores/:id/desvincular | Unlinks the sensor |
| GET | /api/serial/detectar | Lists available COM ports |
| POST | /api/serial/configurar | Sends WiFi config to the ESP32 over USB |
