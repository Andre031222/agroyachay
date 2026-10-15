# Configuración del hardware: ESP32 + DHT11 + FC-28

> English version: [`HARDWARE.md`](HARDWARE.md)

Esta guía describe el nodo de sensado de AgroYachay: componentes, conexiones,
firmware, configuración y calibración. Para probar el nodo sin hardware, use la
[simulación en Wokwi](../simulation/README.md).

## Componentes

| Componente | Modelo | Función |
|---|---|---|
| Microcontrolador | ESP32 DevKit v1 | Lee los sensores y envía los datos por WiFi |
| Sensor de aire | DHT11 | Temperatura 0–50 °C, humedad relativa 20–90 % |
| Sensor de suelo | Sonda FC-28 + módulo LM393 | Humedad del suelo por conductividad |

## Conexiones

```
DHT11
  VCC  -> 3.3V
  DATA -> GPIO 15
  GND  -> GND

FC-28
  VCC  -> 3.3V
  AO   -> GPIO 34  (ADC1, solo entrada)
  GND  -> GND

LED integrado -> GPIO 2
Botón BOOT    -> GPIO 0
```

Use siempre 3,3 V. Los pines GPIO del ESP32 no toleran 5 V. Si los sensores
están en otros pines, el comando serie `{"cmd":"detect_pins"}` (que usa
AgroCommish) los localiza y los guarda en NVS.

## Firmware

Código fuente: [`firmware/agroyachay-node/agroyachay-node.ino`](../firmware/agroyachay-node/agroyachay-node.ino)
con `portal_html.h` (página del portal cautivo).

> **Ubicación nueva en v3.** Hasta la v1.0.1 el sketch estaba en
> `arduino/agrovision_provisioning/agrovision_provisioning.ino`. Solo cambiaron
> la carpeta y el nombre del archivo; el código, el protocolo serie, las claves
> NVS, el nombre de la red de configuración y el JSON enviado son idénticos, así
> que los nodos grabados con el firmware de la v1 no necesitan actualizarse.

Librerías necesarias (Gestor de librerías del Arduino IDE):

- ArduinoJson 7.x (el sketch usa `JsonDocument`)
- DHT sensor library (Adafruit)
- Adafruit Unified Sensor (se instala como dependencia)

Configuración de compilación: placa *ESP32 Dev Module*, velocidad de carga
921600, memoria flash 4 MB, esquema de particiones *Default*. Arduino exige que
la carpeta y el `.ino` tengan el mismo nombre; abra directamente
`firmware/agroyachay-node/agroyachay-node.ino`.

### Binario para AgroCommish

[AgroCommish](https://github.com/Andre031222/agrocommish) graba una imagen ya
compilada en lugar de compilar el sketch. Después de modificar el firmware:

1. En el Arduino IDE elija **Programa → Exportar binarios compilados**.
2. Copie el archivo exportado `agroyachay-node.ino.bin` (en
   `firmware/agroyachay-node/build/…`) al repositorio de AgroCommish como
   `firmware/firmware.bin`.

El archivo `firmware/INSTRUCCIONES.txt` de AgroCommish todavía menciona la ruta
antigua `arduino/agrovision_provisioning/`; el sketch al que se refiere ahora
es `firmware/agroyachay-node/agroyachay-node.ino`.

## Configuración de un nodo

### Con AgroCommish (recomendado)

AgroCommish graba el firmware por USB, envía por el puerto serie las
credenciales WiFi y la URL del servidor, espera las primeras lecturas con
`GET /api/sensores/lecturas-recientes` y abre AgroYachay con la sesión iniciada. En
AgroCommish, la URL del servidor para la instancia pública es:

```
http://agroyachay.ginit.dev/api/sensores/lectura
```

La URL usa HTTP sin cifrar a propósito: el firmware no tiene un paquete de
certificados de autoridad y no sigue redirecciones, por lo que el servidor
acepta este endpoint por HTTP sin redirigirlo a HTTPS (véase más abajo).

Para una API local de desarrollo use `http://<ip-de-la-red-local>:5000/api/sensores/lectura`,
que es el valor por defecto de AgroCommish.

### Con el portal cautivo

1. En el primer arranque el ESP32 abre una red WiFi sin contraseña llamada
   `AgroVision-Setup-XXXX`. Se conserva el nombre de la v1 porque AgroCommish y
   las instrucciones existentes dependen de él.
2. Conecte un celular o una PC a esa red; el portal se abre en
   `http://192.168.4.1`.
3. Elija la red WiFi y escriba su contraseña. En *configuración avanzada del
   servidor* escriba la URL del servidor (como arriba).
4. El ESP32 guarda la configuración en NVS, se reinicia y envía una lectura
   cada 10 segundos.
5. En AgroYachay, abra **Cultivos → Dispositivos**. El nodo aparece como pendiente con
   su identificador (`ESP32_XXXXXX`); reclámelo y vincúlelo a un cultivo.

### URL del servidor, HTTP y HTTPS

El firmware envía los datos con `HTTPClient` del ESP32, no carga un
certificado de autoridad y no sigue redirecciones. Por eso nginx atiende
`POST /api/sensores/lectura` directamente por HTTP sin cifrar, mientras que el
resto de rutas pasa a HTTPS. La URL recomendada es:

- `http://agroyachay.ginit.dev/api/sensores/lectura`

El servidor también acepta la forma `https://` de la misma URL, pero si el
Monitor Serie muestra `[HTTP] Error -1` con ella, la versión del firmware no
puede abrir la conexión TLS sin certificado; use la forma `http://`.

Los nodos ya configurados con cualquiera de las dos URL en v1 siguen
funcionando sin cambios: la versión 3 se sirve en el mismo dominio,
`agroyachay.ginit.dev`, con la misma ruta y el mismo formato de datos.

## Restablecimiento de fábrica

Mantenga presionado el botón BOOT 5 segundos. El LED parpadea 5 veces, el ESP32
borra las credenciales guardadas y vuelve al modo de configuración.

## Indicadores LED (GPIO 2)

| Patrón | Significado |
|---|---|
| Parpadeo muy rápido | Modo de configuración activo |
| Parpadeo lento | Conectando al WiFi |
| Un parpadeo corto cada 10 s | Lectura enviada correctamente |
| Tres parpadeos rápidos | Error al enviar |

## JSON enviado

```json
{
  "esp32_id": "ESP32_A1B2C3",
  "temperatura": 24.0,
  "humedad_aire": 65.0,
  "humedad_suelo": 23,
  "timestamp": 1745000000
}
```

Endpoint: `POST /api/sensores/lectura`, sin autenticación. El contrato completo
está en [`docs/API.md`](API.md).

## Calibración del DHT11

El DHT11 solo admite una corrección con un desplazamiento fijo. Si un
instrumento de referencia no coincide con el sensor, ajuste la lectura en el
firmware:

```cpp
temp    = dht.readTemperature() - 2.0;
humAire = dht.readHumidity()   - 5.0;
```

Revise las lecturas en el Monitor Serie (115200 baudios).

## Calibración del FC-28

El FC-28 mide la conductividad del suelo: más humedad produce más voltaje y un
valor ADC mayor (0–4095). Constantes en el firmware:

```cpp
#define SOIL_DRY   50
#define SOIL_WET  3200
```

1. Deje la sonda al aire, lea `raw ADC` en el Monitor Serie y fije
   `SOIL_DRY = valor + 20`.
2. Sumerja las puntas de la sonda (no el módulo) en agua, lea `raw ADC` y fije
   `SOIL_WET = valor - 50`.
3. Vuelva a compilar y grabar (y exporte un binario nuevo para AgroCommish).

AgroCommish también puede calibrar con el comando serie `{"cmd":"calibrate"}`
sin recompilar.

## Red local de desarrollo

Cuando la API corre en una laptop (puerto 5000), el ESP32 y la laptop deben
estar en la misma red WiFi y el cortafuegos debe permitir conexiones TCP
entrantes al puerto 5000. En Windows:

```
netsh advfirewall firewall add rule name="AgroYachay API" dir=in action=allow protocol=TCP localport=5000
```

## Endpoints de dispositivos en AgroYachay

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/sensores/lectura` | Recibe las lecturas del nodo (sin autenticación) |
| GET | `/api/sensores/lecturas-recientes?esp32_id=…` | Últimas lecturas de un nodo (usado por AgroCommish) |
| GET | `/api/devices` | Dispositivos del usuario |
| GET | `/api/devices/pending` | Dispositivos sin dueño vistos en las últimas 24 h |
| POST | `/api/devices/:id/claim` | Reclamar un dispositivo y, opcionalmente, vincularlo a un cultivo |
| PATCH | `/api/devices/:id` | Renombrar, vincular a un cultivo, fijar umbrales |
| POST | `/api/devices/:id/release` | Desvincular; el dispositivo vuelve a pendiente |
| GET | `/api/devices/:id/readings?range=24h` | Series de lecturas |

Las rutas de la v1 `/api/sensores/mis-dispositivos`, `/api/sensores/:id/vincular`
y `/api/serial/*` se reemplazaron por las anteriores; la configuración por USB
la realiza AgroCommish.
