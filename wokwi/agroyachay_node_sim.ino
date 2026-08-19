/*
 * AgroYachay sensing node -- Wokwi simulation sketch
 * ---------------------------------------------------
 * Hardware-free reproduction of the ESP32 telemetry node. It reads a DHT22
 * (air temperature/humidity) and a potentiometer standing in for the FC-28
 * analog soil-moisture probe, formats the exact JSON payload the backend
 * expects, prints it to the serial monitor, and -- when a SERVER_URL is set --
 * POSTs it to /api/sensores/lectura over Wokwi's simulated WiFi.
 *
 * Run it in the browser at https://wokwi.com (no physical hardware needed):
 * open this folder as a Wokwi project (diagram.json + this sketch).
 *
 * Real firmware (with WiFi provisioning portal and NVS storage):
 *   arduino/agrovision_provisioning/agrovision_provisioning.ino
 */
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

#define DHT_PIN   15
#define DHT_TYPE  DHT22        // Wokwi part; the physical node uses a DHT11
#define SOIL_PIN  34           // ADC1 -- potentiometer simulates the FC-28
#define LED_PIN   2

// FC-28 calibration bounds (raw ADC): dry (air) .. wet (submerged)
#define SOIL_DRY  50
#define SOIL_WET  3200

// Leave empty to only print the payload; set to your instance to POST it.
const char* SERVER_URL = "";  // e.g. "https://agroyachay.ginit.dev/api/sensores/lectura"
const char* ESP32_ID   = "ESP32_WOKWI_SIM";
const unsigned long SEND_EVERY_MS = 10000;

DHT dht(DHT_PIN, DHT_TYPE);

int soilPercent(int raw) {
  int pct = map(raw, SOIL_DRY, SOIL_WET, 0, 100);
  return constrain(pct, 0, 100);
}

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  dht.begin();
  WiFi.begin("Wokwi-GUEST", "");   // Wokwi's open virtual network
  Serial.print("Connecting WiFi");
  for (int i = 0; i < 20 && WiFi.status() != WL_CONNECTED; i++) {
    delay(300); Serial.print(".");
  }
  Serial.println(WiFi.status() == WL_CONNECTED ? " connected" : " offline (will only print)");
}

void loop() {
  float temp = dht.readTemperature();
  float humAir = dht.readHumidity();
  int rawSoil = analogRead(SOIL_PIN);
  int humSoil = soilPercent(rawSoil);

  if (isnan(temp) || isnan(humAir)) {
    Serial.println("[WARN] DHT read failed");
    delay(SEND_EVERY_MS);
    return;
  }

  StaticJsonDocument<192> doc;
  doc["esp32_id"]      = ESP32_ID;
  doc["temperatura"]   = round(temp * 10) / 10.0;
  doc["humedad_aire"]  = round(humAir * 10) / 10.0;
  doc["humedad_suelo"] = humSoil;
  doc["timestamp"]     = (uint32_t)(millis() / 1000);

  String payload;
  serializeJson(doc, payload);
  Serial.print("[DATA] ");
  Serial.println(payload);

  if (strlen(SERVER_URL) && WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(SERVER_URL);
    http.addHeader("Content-Type", "application/json");
    int code = http.POST(payload);
    Serial.printf("[POST] HTTP %d\n", code);
    http.end();
    digitalWrite(LED_PIN, code == 200 ? HIGH : LOW);
  } else {
    digitalWrite(LED_PIN, HIGH); delay(80); digitalWrite(LED_PIN, LOW);
  }

  delay(SEND_EVERY_MS);
}
