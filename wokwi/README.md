# Wokwi simulation — AgroYachay sensing node

Run the ESP32 telemetry node **in the browser, with no physical hardware**, so the
end-to-end data path can be reproduced and reviewed. This addresses software-only
evaluation: the simulated node produces the exact JSON payload the backend
ingests.

## What it simulates

| Real hardware | Wokwi part | Pin |
|---|---|---|
| DHT11 (air temp/humidity) | `wokwi-dht22` | GPIO 15 |
| FC-28 soil probe (analog) | `wokwi-potentiometer` | GPIO 34 (ADC) |
| Status LED | `wokwi-led` | GPIO 2 |

The DHT22 is used because Wokwi provides it; the physical node uses a DHT11 with
the same wiring. The potentiometer stands in for the FC-28 analog output, so you
can sweep soil moisture from dry to wet by turning the knob.

## How to run

1. Go to <https://wokwi.com> and create a new **ESP32** project.
2. Replace `diagram.json` with the one in this folder.
3. Replace `sketch.ino` with `agroyachay_node_sim.ino`.
4. Add the **DHT sensor library** and **ArduinoJson** in the Library Manager panel.
5. Press **Play**. The Serial Monitor prints a reading every 10 s:

```
[DATA] {"esp32_id":"ESP32_WOKWI_SIM","temperatura":17.0,"humedad_aire":68.0,"humedad_suelo":48,"timestamp":10}
```

## Sending to a live backend (optional)

Set `SERVER_URL` at the top of the sketch to your instance, e.g.
`https://agroyachay.ginit.dev/api/sensores/lectura`. Wokwi's virtual WiFi
(`Wokwi-GUEST`) reaches the public internet, so the simulated node registers and
streams like a real one. Leave it empty to only print the payload.

## Files

- `diagram.json` — the circuit (ESP32 + DHT22 + potentiometer + LED)
- `agroyachay_node_sim.ino` — the simulation firmware
- `wokwi.toml` — Wokwi project configuration

The full production firmware, with the WiFi provisioning portal and NVS storage,
is in [`../arduino/agrovision_provisioning/`](../arduino/agrovision_provisioning/).
