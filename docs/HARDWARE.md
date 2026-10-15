# Hardware setup: ESP32 + DHT11 + FC-28

> Spanish version: [`HARDWARE.es.md`](HARDWARE.es.md)

This guide covers the AgroYachay sensing node: parts, wiring, firmware, configuration
and calibration. To try the node without hardware, use the
[Wokwi simulation](../simulation/README.md).

## Components

| Component | Model | Function |
|---|---|---|
| Microcontroller | ESP32 DevKit v1 | Reads the sensors and sends data over WiFi |
| Air sensor | DHT11 | Temperature 0–50 °C, relative humidity 20–90 % |
| Soil sensor | FC-28 probe + LM393 module | Soil moisture by conductivity |

## Wiring

```
DHT11
  VCC  -> 3.3V
  DATA -> GPIO 15
  GND  -> GND

FC-28
  VCC  -> 3.3V
  AO   -> GPIO 34  (ADC1, input only)
  GND  -> GND

Built-in LED -> GPIO 2
BOOT button  -> GPIO 0
```

Always use 3.3 V. The ESP32 GPIO pins are not 5 V tolerant. If the sensors are
on other pins, the serial command `{"cmd":"detect_pins"}` (used by AgroCommish)
finds them and stores them in NVS.

## Firmware

Source: [`firmware/agroyachay-node/agroyachay-node.ino`](../firmware/agroyachay-node/agroyachay-node.ino)
with `portal_html.h` (captive portal page).

> **Moved in v3.** Until v1.0.1 the sketch was
> `arduino/agrovision_provisioning/agrovision_provisioning.ino`. Only the
> folder and file name changed; the code, serial protocol, NVS keys, SoftAP
> name and HTTP payload are identical, so nodes flashed with v1 firmware need
> no update.

Required libraries (Arduino IDE Library Manager):

- ArduinoJson 7.x (the sketch uses `JsonDocument`)
- DHT sensor library (Adafruit)
- Adafruit Unified Sensor (installed as a dependency)

Build settings: board *ESP32 Dev Module*, upload speed 921600, flash size 4 MB,
partition scheme *Default*. Arduino requires the sketch folder and the `.ino`
file to share the name, so open `firmware/agroyachay-node/agroyachay-node.ino` directly.

### Binary for AgroCommish

[AgroCommish](https://github.com/Andre031222/agrocommish) flashes a prebuilt
image rather than compiling the sketch. After changing the firmware:

1. In the Arduino IDE choose **Sketch → Export Compiled Binary**.
2. Copy the exported `agroyachay-node.ino.bin` (in `firmware/agroyachay-node/build/…`) into
   the AgroCommish repository as `firmware/firmware.bin`.

AgroCommish's `firmware/INSTRUCCIONES.txt` still names the old
`arduino/agrovision_provisioning/` path; the sketch it refers to is now
`firmware/agroyachay-node/agroyachay-node.ino`.

## Configuring a node

### With AgroCommish (recommended)

AgroCommish flashes the firmware over USB, sends the WiFi credentials and the
server URL through the serial port, waits for the first readings with
`GET /api/sensores/lecturas-recientes` and opens AgroYachay with the user signed in.
In AgroCommish, the server URL for the public instance is:

```
http://agroyachay.ginit.dev/api/sensores/lectura
```

The URL uses plain HTTP on purpose: the firmware has no CA certificate bundle
and does not follow redirects, so the server accepts this endpoint over HTTP
without redirecting it to HTTPS (see below).

For a local development API use `http://<lan-ip>:5000/api/sensores/lectura`,
which is AgroCommish's default.

### With the captive portal

1. On first boot the ESP32 opens an open WiFi network named
   `AgroVision-Setup-XXXX`. The name is kept from v1 because AgroCommish and
   existing instructions rely on it.
2. Connect a phone or PC to that network; the portal opens at
   `http://192.168.4.1`.
3. Select the WiFi network and enter its password. Under *advanced server
   settings* enter the server URL (as above).
4. The ESP32 stores the settings in NVS, reboots and sends a reading every
   10 seconds.
5. In AgroYachay, open **Crops → Devices**. The node appears as pending with its id
   (`ESP32_XXXXXX`); claim it and link it to a crop.

### Server URL, HTTP and HTTPS

The firmware posts with the ESP32 `HTTPClient`, does not load a CA certificate
and does not follow redirects. For that reason nginx serves
`POST /api/sensores/lectura` over plain HTTP directly, while every other path
is moved to HTTPS. The recommended URL is therefore:

- `http://agroyachay.ginit.dev/api/sensores/lectura`

The `https://` form of the same URL is also accepted by the server, but if the
serial monitor shows `[HTTP] Error -1` with it, the firmware build cannot open
the TLS connection without a certificate; use the `http://` form.

Nodes already configured with either URL under v1 keep working without
changes: version 3 is served on the same domain, `agroyachay.ginit.dev`, with
the same path and payload.

## Factory reset

Hold the BOOT button for 5 seconds. The LED blinks 5 times, the ESP32 clears
the stored credentials and returns to setup mode.

## LED indicators (GPIO 2)

| Pattern | Meaning |
|---|---|
| Very fast blink | Setup mode active |
| Slow blink | Connecting to WiFi |
| One short blink every 10 s | Reading sent correctly |
| Three fast blinks | Error while sending |

## JSON payload

```json
{
  "esp32_id": "ESP32_A1B2C3",
  "temperatura": 24.0,
  "humedad_aire": 65.0,
  "humedad_suelo": 23,
  "timestamp": 1745000000
}
```

Endpoint: `POST /api/sensores/lectura`, no authentication. The full contract is
in [`docs/API.md`](API.md).

## DHT11 calibration

The DHT11 can only be corrected with a fixed offset. If a reference instrument
disagrees with the sensor, adjust the reading in the firmware:

```cpp
temp    = dht.readTemperature() - 2.0;
humAire = dht.readHumidity()   - 5.0;
```

Check the readings in the Serial Monitor (115200 baud).

## FC-28 calibration

The FC-28 measures soil conductivity: more moisture gives a higher voltage and
a higher ADC value (0–4095). Constants in the firmware:

```cpp
#define SOIL_DRY   50
#define SOIL_WET  3200
```

1. Hold the probe in the air, read `raw ADC` in the Serial Monitor and set
   `SOIL_DRY = value + 20`.
2. Dip the probe tips (not the module) in water, read `raw ADC` and set
   `SOIL_WET = value - 50`.
3. Recompile and flash (and export a new binary for AgroCommish).

AgroCommish can also run the calibration through the serial command
`{"cmd":"calibrate"}` without recompiling.

## Local development network

When the API runs on a laptop (port 5000), the ESP32 and the laptop must be on
the same WiFi network, and the firewall must allow incoming TCP on port 5000.
On Windows:

```
netsh advfirewall firewall add rule name="AgroYachay API" dir=in action=allow protocol=TCP localport=5000
```

## Device endpoints in AgroYachay

| Method | Path | Description |
|---|---|---|
| POST | `/api/sensores/lectura` | Receives node readings (no authentication) |
| GET | `/api/sensores/lecturas-recientes?esp32_id=…` | Last readings of a node (used by AgroCommish) |
| GET | `/api/devices` | Devices of the signed-in user |
| GET | `/api/devices/pending` | Unclaimed devices seen in the last 24 h |
| POST | `/api/devices/:id/claim` | Claim a device and optionally link it to a crop |
| PATCH | `/api/devices/:id` | Rename, link to a crop, set thresholds |
| POST | `/api/devices/:id/release` | Unlink; the device returns to pending |
| GET | `/api/devices/:id/readings?range=24h` | Reading series |

The v1 routes `/api/sensores/mis-dispositivos`, `/api/sensores/:id/vincular`
and `/api/serial/*` were replaced by the routes above; USB configuration is
done by AgroCommish.
