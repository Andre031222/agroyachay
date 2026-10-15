# Wokwi simulation of the AgroYachay sensing node

This folder runs the ESP32 telemetry node in the browser, without physical
hardware, so that the end-to-end data path can be reproduced and reviewed. The
simulated node produces the same JSON payload that the API ingests from real
devices.

## What it simulates

| Real hardware | Wokwi part | Pin |
|---|---|---|
| DHT11 (air temperature and humidity) | `wokwi-dht22` | GPIO 15 |
| FC-28 soil probe (analog) | `wokwi-potentiometer` | GPIO 34 (ADC1) |
| Status LED | `wokwi-led` | GPIO 2 |

Wokwi provides a DHT22 but not a DHT11; the wiring is the same. The
potentiometer stands in for the FC-28 analog output, so soil moisture can be
swept from dry to wet by turning the knob.

## How to run

1. Open <https://wokwi.com> and create a new **ESP32** project.
2. Replace `diagram.json` with the file in this folder.
3. Replace `sketch.ino` with the contents of `agroyachay_node_sim.ino`.
4. Add **DHT sensor library** and **ArduinoJson** in the Library Manager panel.
5. Press **Play**. The Serial Monitor prints one reading every 10 s:

```
[DATA] {"esp32_id":"ESP32_WOKWI_SIM","temperatura":17.0,"humedad_aire":68.0,"humedad_suelo":48,"timestamp":10}
[POST] HTTP 201
```

The `timestamp` is the simulated uptime in seconds; the API replaces any
timestamp earlier than 2020 with the server time.

## Server URL

`SERVER_URL` at the top of the sketch defaults to the production instance:

```
https://agroyachay.ginit.dev/api/sensores/lectura
```

Wokwi's virtual network (`Wokwi-GUEST`) reaches the public internet, so the
simulated node appears in AgroYachay as a pending device with id `ESP32_WOKWI_SIM`
and can be claimed from **Devices** like a real one. The production firmware
uses `http://agroyachay.ginit.dev/api/sensores/lectura` because it has no CA
bundle and does not follow redirects; the server accepts this endpoint over
both HTTP and HTTPS, so either form works in the simulation. Point
`SERVER_URL` at a local instance (for example
`http://192.168.1.10:9001/api/sensores/lectura`) for development, or set it to
`""` to print the payload only.

The sketch uses `WiFiClientSecure::setInsecure()` for HTTPS because Wokwi has no
certificate bundle. This shortcut is limited to the simulation; it is not part
of the production firmware.

## Files

- `diagram.json`: the circuit (ESP32, DHT22, potentiometer, LED)
- `agroyachay_node_sim.ino`: the simulation sketch
- `wokwi.toml`: Wokwi project configuration (for the VS Code extension)

The production firmware, with the WiFi provisioning portal and NVS storage, is
in [`../firmware/agroyachay-node/`](../firmware/agroyachay-node/).
