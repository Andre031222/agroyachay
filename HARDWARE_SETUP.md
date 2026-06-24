# Hardware Setup — ESP32 + DHT11 + FC-28

---

## Componentes

| Componente | Modelo | Funcion |
|---|---|---|
| Microcontrolador | ESP32 DevKit v1 | Procesa sensores y envia datos por WiFi |
| Sensor aire | DHT11 | Temperatura 0-50 C, humedad 20-90% RH |
| Sensor suelo | FC-28 + LM393 | Humedad del suelo por conductividad |

---

## Conexiones

```
DHT11
  VCC  -> 3.3V
  DATA -> GPIO 15
  GND  -> GND

FC-28
  VCC  -> 3.3V
  AO   -> GPIO 34  (ADC, solo entrada)
  GND  -> GND

LED integrado -> GPIO 2
Boton BOOT    -> GPIO 0
```

Usar siempre 3.3V. El ESP32 no tolera 5V en sus pines GPIO.

---

## Firmware

Archivo: `arduino/agrovision_provisioning/agrovision_provisioning.ino`

Librerias necesarias (instalar desde el Gestor de librerias de Arduino IDE):
- ArduinoJson 6.x
- DHT sensor library (Adafruit)
- Adafruit Unified Sensor (se instala como dependencia)

Configuracion de compilacion:
- Placa: ESP32 Dev Module
- Upload Speed: 921600
- Flash Size: 4MB
- Partition Scheme: Default

---

## Primer arranque

1. El ESP32 crea una red WiFi abierta `AgroVision-Setup-XXXX`
2. Conectar el celular o PC a esa red
3. El portal de configuracion abre en `http://192.168.4.1`
4. Seleccionar la red WiFi, ingresar contrasena y la URL del servidor
5. El ESP32 guarda las credenciales en NVS y se reinicia
6. Comienza a enviar lecturas cada 10 segundos

---

## Reset de fabrica

Mantener presionado el boton BOOT 5 segundos. El LED parpadeara 5 veces y el ESP32 borrara las credenciales y volvera al modo Setup.

---

## Indicadores LED (GPIO 2)

| Patron | Significado |
|---|---|
| Parpadeo muy rapido (~150ms) | Modo Setup activo |
| Parpadeo lento (~500ms) | Intentando conectar al WiFi |
| 1 parpadeo corto cada 10s | Enviando datos correctamente |
| 3 parpadeos rapidos | Error al enviar datos |

---

## Formato JSON enviado al backend

```json
{
  "esp32_id": "ESP32_A1B2C3",
  "temperatura": 24.0,
  "humedad_aire": 65.0,
  "humedad_suelo": 23,
  "timestamp": 1745000000
}
```

Endpoint receptor: `POST /api/sensores/lectura`

---

## Calibracion DHT11

El DHT11 no es calibrable por software mas alla de un offset fijo. Si el valor real difiere del sensor, ajustar en el firmware:

```cpp
temp    = dht.readTemperature() - 2.0;
humAire = dht.readHumidity()   - 5.0;
```

Verificar lecturas abriendo el Monitor Serie (115200 baudios). El ESP32 imprime:
```
[DATA] Temp=24.0 C  HumAire=65%  HumSuelo=23%
```

---

## Calibracion FC-28

El FC-28 lee conductividad del suelo. Mas humedad = mayor voltaje = mayor valor ADC (0-4095).

Constantes en el firmware:
```cpp
#define SOIL_DRY   50
#define SOIL_WET  3200
```

Para calibrar:
1. Dejar el sensor en el aire — anotar el `raw ADC` del Monitor Serie — poner `SOIL_DRY = valor + 20`
2. Sumergir las puntas en agua (no el modulo) — anotar el `raw ADC` — poner `SOIL_WET = valor - 50`
3. Recompilar y flashear

---

## Provisioning por USB

Permite configurar el ESP32 desde el panel web sin abrir Arduino IDE.

Requisito en el backend: `pip install pyserial`

Flujo:
1. Conectar el ESP32 por USB al PC donde corre el backend
2. Ir a Dispositivos en el panel web
3. Clic en "Conectar nuevo dispositivo"
4. Seleccionar el puerto COM detectado
5. El sistema escanea redes WiFi y configura el ESP32 automaticamente

---

## Red y firewall

El ESP32 y el servidor deben estar en la misma red WiFi.

Si el ESP32 no puede conectar en Windows:
```
netsh advfirewall firewall add rule name="AgroYachay" dir=in action=allow protocol=TCP localport=5000
```

---

## Endpoints de sensores

| Metodo | Ruta | Descripcion |
|---|---|---|
| POST | /api/sensores/lectura | Recibe lecturas del ESP32 |
| GET | /api/sensores/mis-dispositivos | Sensores del usuario |
| GET | /api/sensores/pendientes | Sensores sin cultivo asignado |
| GET | /api/sensores/esp32/:id/estado | Estado y ultimas lecturas |
| POST | /api/sensores/:id/vincular | Asigna sensor a un cultivo |
| POST | /api/sensores/:id/desvincular | Libera el sensor |
| GET | /api/serial/detectar | Lista puertos COM disponibles |
| POST | /api/serial/configurar | Envia config WiFi al ESP32 por USB |
