# Guion de los videotutoriales de AgroYachay

Serie de videos para agricultores, extensionistas y revisores. Cada video
puede verse por separado. Las rutas y los nombres de pantalla siguen
`docs/ARCHITECTURE.md` §8; si el texto de un botón cambia en la versión final,
se graba lo que muestre la aplicación.

Este guion es para una serie larga y narrada en español. Es distinto de la
guía en video pública ya publicada en <https://agroyachay.ginit.dev/guide>:
doce videos de 20 segundos, uno por módulo, hechos con capturas reales de la
aplicación, narrados en inglés con voces sintéticas y con subtítulos. Cada
módulo enlaza a su video desde el panel «¿Cómo se usa?».

Instancia: <https://agroyachay.ginit.dev> · Guía en video: <https://agroyachay.ginit.dev/guide> · Código: <https://github.com/Andre031222/agroyachay>

## Resumen de la serie

| N.º | Título | Ruta principal | Duración objetivo |
|---|---|---|---|
| 0 | Presentación de AgroYachay | `/` | 2:00 |
| 1 | Registro e inicio de sesión | `/register`, `/login` | 2:30 |
| 2 | Puesta en marcha del nodo ESP32 con AgroCommish | AgroCommish, `/app/devices` | 5:00 |
| 3 | Vincular el dispositivo a un cultivo | `/app/crops`, `/app/devices` | 3:00 |
| 4 | Monitoreo en tiempo real y alertas | `/app/monitoring`, `/app` | 3:00 |
| 5 | Clima y plan semanal | `/app/weather` | 3:00 |
| 6 | Almanaque agrícola | `/app/almanac` | 3:30 |
| 7 | Detección de plagas con el modelo local | `/app/pests` | 4:00 |
| 8 | Cálculo de insumos y catálogo | `/app/inputs` | 3:00 |
| 9 | Estimación de cosecha e ingresos | `/app/yield` | 3:30 |
| 10 | Asesoría: asistente y agrónomo | `/app/advisory` | 3:30 |
| 11 | Informes | `/app/reports` | 2:30 |
| 12 | Administración | `/app/admin` | 4:00 |
| 13 | Cierre: código abierto y cómo citar | `/`, GitHub | 1:30 |
| | **Total aproximado** | | **44:00** |

Menú lateral de referencia, en el orden de trabajo del agricultor: **Inicio** ·
**Mi campo** (Cultivos, Dispositivos, Monitoreo) · **Clima y calendario** (Clima,
Almanaque) · **Decisiones** (Plagas, Insumos, Cosecha, Asesoría) · **Registros**
(Informes) · **Administración** (Usuarios, Bitácora, Catálogo y Configuración;
solo administradores, y Configuración solo superadministradores). En pantallas
menores de 1024 px el menú pasa a una barra inferior: Inicio, Cultivos,
Monitoreo, Plagas y Más. El menú de la cuenta (avatar) tiene Perfil, Guía en
video y Cerrar sesión.

## Recomendaciones de grabación

- Resolución 1920 × 1080, 30 fps, navegador al 100 % de zoom, sin barras de
  marcadores ni extensiones visibles.
- Toma principal con el tema claro. Incluir al menos una toma con el tema
  oscuro (en el video 0) para mostrar el cambio de tema. Solo hay dos temas,
  claro y oscuro.
- Demostrar el cambio de idioma a quechua y aimara (video 0) y volver al
  español para el resto de la serie.
- Usar una cuenta de demostración con datos de ejemplo: dos cultivos (papa en
  Puno, quinua en Juliaca), un nodo vinculado con varios días de lecturas y una
  alerta abierta. No usar cuentas ni datos reales de agricultores.
- Nunca mostrar el archivo `.env`, contraseñas, claves de API ni la consola del
  servidor con variables de entorno.
- En la edición, difuminar correos electrónicos, tokens (por ejemplo la URL de
  `/auto-login#token=…`), identificadores de dispositivos reales y nombres de
  redes WiFi privadas.
- Narración pausada, frases cortas, vocabulario de campo. Subtítulos en español
  incrustados o como archivo `.srt`.
- Grabar la pantalla del celular (videos 2, 4 y 7) en vertical y mostrarla en un
  recuadro sobre fondo neutro.
- Las fotos de hojas del video 7 deben ser propias o con licencia libre; no usar
  imágenes de bancos con marca de agua.

---

## Video 0. Presentación de AgroYachay

- **Objetivo:** que el espectador sepa qué es AgroYachay, para quién es y cómo
  cambiar idioma y tema.
- **Duración:** 2:00
- **Requisitos previos:** ninguno.

| Tiempo | Pantalla / acción | Narración |
|---|---|---|
| 0:00 | Portada `/`: titular «Su chacra, medida. Sus decisiones, informadas.» | Esto es AgroYachay: en quechua, *yachay* es saber, conocimiento. |
| 0:10 | Desplazamiento lento por la cuadrícula de la portada: video del nodo, lectura en vivo, clima, plagas, cultivos, idiomas, cosecha. | AgroYachay une sensores de bajo costo en la parcela con herramientas que ayudan a decidir: cuándo regar, qué hacer ante una plaga, cuánto se puede cosechar y cuánto se puede ganar. |
| 0:35 | Sección sobre AgroYachay y el artículo. | Esta es AgroYachay 3, la nueva versión del sistema publicado en la revista SoftwareX en 2026. Funciona en la misma dirección, agroyachay.ginit.dev. |
| 0:50 | Clic en la píldora de idioma (globo y código de dos letras); elegir *Runasimi* (quechua). | La aplicación está en español, inglés, quechua y aimara. |
| 1:05 | Cambiar a *Aymar aru*; luego volver a español. | Puede cambiar el idioma en cualquier momento; AgroYachay lo recuerda en este navegador. |
| 1:20 | Botón redondo de tema: claro → oscuro. | También puede elegir tema claro u oscuro. La primera vez AgroYachay sigue la configuración del equipo; después recuerda su elección. |
| 1:30 | Señalar «Guía en video» en la barra superior; abrir `/guide` un momento. | Si quiere un resumen rápido, la guía en video muestra cada parte en veinte segundos. |
| 1:40 | Volver a la portada y al tema claro; señalar «Iniciar sesión» y «Comenzar». | En el siguiente video creamos una cuenta. |
| 1:55 | Logo de AgroYachay. | Cierre: «AgroYachay: información de su chacra para decidir mejor». |

---

## Video 1. Registro e inicio de sesión

- **Objetivo:** crear una cuenta con correo y contraseña o con Google, e
  iniciar sesión.
- **Duración:** 2:30
- **Requisitos previos:** un correo electrónico.

| Tiempo | Pantalla / acción | Narración |
|---|---|---|
| 0:00 | Portada; clic en «Comenzar» → `/register`. | Para usar AgroYachay necesita una cuenta. Es gratuita. |
| 0:10 | Escribir nombre, correo y contraseña (correo difuminado). | Escriba su nombre, su correo y una contraseña de al menos ocho caracteres. |
| 0:30 | Clic en «Crear mi cuenta»; aparece el Inicio `/app` con la lista «Primeros pasos». | Al crear la cuenta entra directamente al Inicio. La lista «Primeros pasos» le indica qué hacer: registrar un cultivo, conectar un sensor, vincularlo y guardar su ubicación. |
| 0:45 | Menú de usuario → «Cerrar sesión». | Cerramos sesión para ver la otra forma de entrar. |
| 0:55 | `/login`; clic en «Continuar con Google»; elegir cuenta (difuminada). | Si tiene cuenta de Google, puede entrar con un clic. Si ya se registró con el mismo correo, AgroYachay une ambas formas de ingreso. |
| 1:20 | De vuelta en `/app`. | Ya estamos dentro. |
| 1:30 | Menú de usuario → Perfil `/app/profile`; mostrar idioma y ubicación guardada. | En su perfil puede cambiar el nombre, el idioma, la ubicación y la contraseña. |
| 1:40 | `/login` → «¿Olvidó su contraseña?»; escribir el correo; mostrar el correo recibido (difuminado) y el botón verde. | Si olvida su contraseña, escriba su correo. Le llegará un mensaje con un botón verde para poner una contraseña nueva. El enlace sirve una sola vez y durante 60 minutos. |
| 1:50 | Diapositiva con los tres roles. | Hay tres roles. Agricultor, el rol de toda cuenta nueva. Administrador, que gestiona usuarios, el catálogo y las respuestas de asesoría. Y superadministrador, que además cambia la configuración y nombra administradores. |
| 2:20 | Volver a `/app`. | Cierre: «Con su cuenta lista, conectemos el primer sensor». |

---

## Video 2. Puesta en marcha del nodo ESP32 con AgroCommish

- **Objetivo:** grabar el firmware, configurar WiFi y servidor con AgroCommish,
  verificar que llegan datos y ver el dispositivo como pendiente en AgroYachay.
- **Duración:** 5:00
- **Requisitos previos:** nodo armado (ESP32 DevKit v1, DHT11, FC-28; ver
  `HARDWARE_SETUP.es.md`), cable USB de datos, PC con Windows y AgroCommish
  instalado, una red WiFi de 2,4 GHz, cuenta en AgroYachay.

| Tiempo | Pantalla / acción | Narración |
|---|---|---|
| 0:00 | Plano del nodo sobre la mesa: ESP32, DHT11 y sonda FC-28. | Este es el nodo de AgroYachay: una placa ESP32, un sensor de temperatura y humedad del aire, y una sonda de humedad del suelo. |
| 0:20 | Conectar el cable USB a la PC. | Conecte el ESP32 a la computadora con un cable USB que transmita datos, no solo carga. |
| 0:30 | Abrir AgroCommish; aparece el puerto detectado. | Abra AgroCommish. El programa reconoce la placa y su puerto. |
| 0:45 | Clic en grabar firmware; barra de progreso. | Primero grabamos el firmware. Tarda menos de un minuto; no desconecte el cable. |
| 1:30 | Paso de WiFi: lista de redes; elegir la red; escribir contraseña (difuminada). | Elija la red WiFi de la chacra o de la casa y escriba su contraseña. El ESP32 solo usa redes de 2,4 GHz. |
| 2:00 | Campo «URL del servidor»: escribir `http://agroyachay.ginit.dev/api/sensores/lectura`. | En la dirección del servidor escriba: http, dos puntos, barra, barra, agroyachay punto ginit punto dev, barra api, barra sensores, barra lectura. |
| 2:20 | Rótulo en pantalla con la URL completa. | La dirección empieza con http, sin la ese, porque el nodo no usa certificados de seguridad. Si su nodo ya estaba configurado con la versión anterior de AgroYachay, no necesita cambiar nada: la dirección es la misma y sigue funcionando. |
| 2:35 | Clic en enviar configuración; el ESP32 se reinicia. | AgroCommish envía la configuración por el cable. El ESP32 se reinicia y se conecta a la red. |
| 2:50 | Pantalla de verificación de AgroCommish: llegan las lecturas de temperatura, humedad del aire y del suelo. | Ahora AgroCommish pregunta al servidor por las últimas lecturas. Cuando aparecen los tres valores, el nodo está enviando datos. |
| 3:20 | Si no llegan datos: rótulo con tres comprobaciones. | Si no aparecen datos después de un minuto, revise la contraseña del WiFi, que la red sea de 2,4 GHz y la dirección del servidor. |
| 3:40 | Ingresar a AgroYachay desde AgroCommish; el navegador abre AgroYachay ya con la sesión iniciada (URL difuminada). | AgroCommish abre AgroYachay con su cuenta, directamente en Dispositivos. |
| 4:00 | `/app/devices`: el nodo en «Pendientes» con su identificador `ESP32_…`. | Aquí está el nodo como dispositivo pendiente, con su identificador. Todavía no pertenece a ninguna chacra. |
| 4:20 | Señalar el LED del ESP32: un parpadeo cada 10 s. | En la placa, un parpadeo corto cada diez segundos indica que los datos se envían bien; tres parpadeos rápidos indican un error. |
| 4:40 | Plano del nodo instalado en una parcela de prueba. | Instale el nodo protegido de la lluvia directa, con la sonda enterrada en la zona de raíces. |
| 4:55 | — | Cierre: «En el siguiente video lo vinculamos a un cultivo». |

---

## Video 3. Vincular el dispositivo a un cultivo

- **Objetivo:** registrar un cultivo, reclamar el dispositivo pendiente,
  vincularlo y ajustar umbrales.
- **Duración:** 3:00
- **Requisitos previos:** video 2 completado.

| Tiempo | Pantalla / acción | Narración |
|---|---|---|
| 0:00 | Menú **Mi campo** → Cultivos `/app/crops`. | Primero registramos el cultivo. |
| 0:10 | «Nuevo cultivo»: nombre «Papa – parcela norte», especie papa, variedad, área 0,5 ha, fecha de siembra, ubicación en el mapa. | Escriba un nombre, la especie, la variedad, el área en hectáreas y la fecha de siembra. La ubicación sirve para el clima y la estimación de cosecha. |
| 0:50 | Guardar; el cultivo aparece en la lista. | El cultivo queda guardado. |
| 1:00 | Menú **Mi campo** → Dispositivos `/app/devices`; pendiente `ESP32_…`; clic en «Reclamar». | Volvemos a Dispositivos. En el nodo pendiente, pulse «Reclamar». |
| 1:15 | Diálogo: nombre «Nodo parcela norte», cultivo «Papa – parcela norte». | Póngale un nombre que reconozca y elija el cultivo. |
| 1:35 | El dispositivo pasa a activo, con estado «en línea». | El nodo ya es suyo y está en línea: se vio hace menos de un minuto. |
| 1:50 | Abrir el dispositivo → Umbrales: temperatura 2–28 °C, humedad del aire 40–85 %, humedad del suelo 30–80 %. | AgroYachay pone umbrales por defecto. Si una lectura sale de estos rangos, se abre una alerta. |
| 2:15 | Cambiar el mínimo de temperatura a 0 °C; guardar. | Puede ajustarlos a su cultivo y a su zona. Por ejemplo, para vigilar heladas en la puna. |
| 2:35 | Mostrar «Liberar» sin pulsarlo. | Si vende o traslada el nodo, «Liberar» lo desvincula y vuelve a quedar pendiente. |
| 2:50 | — | Cierre: «Ahora veamos los datos en tiempo real». |

---

## Video 4. Monitoreo en tiempo real y alertas

- **Objetivo:** leer gráficos de lecturas, cambiar el periodo y atender
  alertas.
- **Duración:** 3:00
- **Requisitos previos:** nodo vinculado con varios días de datos.

| Tiempo | Pantalla / acción | Narración |
|---|---|---|
| 0:00 | Menú **Mi campo** → Monitoreo `/app/monitoring`. | En Monitoreo ve lo que miden sus sensores. |
| 0:10 | Tarjetas con la última lectura: temperatura, humedad del aire, humedad del suelo. | Arriba están los valores más recientes; se actualizan solos. |
| 0:30 | Gráfico de 24 h; señalar las líneas de umbral. | El gráfico muestra cómo cambiaron durante el día. Las líneas marcan sus umbrales. |
| 0:50 | Cambiar el rango a 1 h, 7 d y 30 d. | Puede ver la última hora, el día, la semana o el mes. En periodos largos AgroYachay muestra promedios, mínimos y máximos. |
| 1:20 | Lista de alertas abiertas: «Humedad del suelo baja». | Cuando una lectura sale del rango, aparece una alerta. Esta indica que el suelo está seco. |
| 1:45 | Clic en «Resolver» después de explicar que se regó. | Cuando ya actuó, por ejemplo después de regar, marque la alerta como resuelta. |
| 2:05 | Menú **Inicio** `/app`: contadores y últimas alertas. | El Inicio junta todo: cultivos, dispositivos activos, alertas abiertas y diagnósticos. |
| 2:30 | Grabación en celular con la barra inferior. | En el celular funciona igual; el menú pasa a la parte de abajo. |
| 2:50 | — | Cierre: «En el siguiente video, el clima de su zona». |

---

## Video 5. Clima con ubicación en tiempo real y plan semanal

- **Objetivo:** dar la ubicación, interpretar los indicadores agroclimáticos y
  generar el plan semanal.
- **Duración:** 3:00
- **Requisitos previos:** cuenta sin ubicación guardada (para mostrar el
  primer uso).

| Tiempo | Pantalla / acción | Narración |
|---|---|---|
| 0:00 | Menú **Clima y calendario** → Clima `/app/weather`; aviso para compartir ubicación. | La primera vez, AgroYachay pide su ubicación para darle el clima de su chacra. |
| 0:15 | Aceptar el permiso del navegador. | Pulse «Permitir». La ubicación se guarda en su perfil. |
| 0:25 | Mostrar la alternativa «Buscar lugar» escribiendo «Ilave». | Si prefiere no compartirla, busque su distrito o comunidad. |
| 0:40 | Condiciones actuales y pronóstico de 24 horas. | Aquí está el tiempo ahora y hora por hora. Los datos vienen de Open-Meteo. |
| 1:00 | Pronóstico de 7 días. | Y el pronóstico de la semana. |
| 1:15 | Indicadores: riesgo de helada, estrés por calor, lluvia de 7 días, evapotranspiración, ventanas de aplicación, sugerencia de riego. | Estos indicadores traducen el pronóstico en decisiones: si hay riesgo de helada, cuánta agua se pierde, cuándo se puede fumigar sin viento ni lluvia y si conviene regar. |
| 1:50 | Clic en «Generar plan semanal»; espera; aparece el plan por día. | El plan semanal lo prepara el modelo de lenguaje, por defecto un modelo abierto instalado en el propio servidor, a partir del pronóstico: qué hacer y qué evitar cada día. |
| 2:30 | Señalar el nivel de riesgo y el resumen. | Tómelo como una sugerencia. Usted conoce su terreno; contrástelo con su experiencia. |
| 2:50 | — | Cierre: «Ahora, el almanaque agrícola». |

---

## Video 6. Almanaque agrícola

- **Objetivo:** usar el calendario lunar y solar y el calendario agrícola
  andino, distinguiendo saber tradicional y evidencia.
- **Duración:** 3:30
- **Requisitos previos:** ubicación guardada.

| Tiempo | Pantalla / acción | Narración |
|---|---|---|
| 0:00 | Menú **Clima y calendario** → Almanaque `/app/almanac`, mes actual. | El almanaque se calcula para su ubicación; no es un texto fijo. |
| 0:15 | Vista de mes con la fase lunar de cada día. | Cada día muestra la fase de la luna y el porcentaje iluminado. |
| 0:35 | Señalar las cuatro fases principales con fecha y hora. | Aquí están la luna nueva, cuarto creciente, luna llena y cuarto menguante, con su hora exacta. |
| 0:55 | Abrir un día: salida y puesta del sol, duración del día. | Al abrir un día ve la salida y la puesta del sol y cuántas horas de luz hay. |
| 1:20 | Estación y calendario agrícola andino: preparación de tierras, siembra, aporque y deshierbe, cosecha, chuño y tunta, temporada de heladas. | Este es el calendario agrícola del Altiplano y los valles interandinos: preparación de terrenos en agosto y setiembre, siembra grande de setiembre a diciembre, aporque y deshierbe, cosecha de abril a junio y elaboración de chuño y tunta en las heladas. |
| 2:00 | Fechas señaladas: Candelaria, Inti Raymi, ofrenda a la Pachamama, equinoccios y solsticios. | También marca las fechas de la comunidad: la Candelaria, el Inti Raymi, la ofrenda a la Pachamama y los solsticios y equinoccios del año. |
| 2:25 | Primer plano de una práctica con la etiqueta «Saber tradicional». | Las prácticas que relacionan la luna con la siembra llevan la etiqueta «saber tradicional». AgroYachay las muestra con respeto, pero no las presenta como resultados comprobados por la investigación agronómica. |
| 2:55 | Cambiar al mes siguiente. | Puede avanzar o retroceder meses para planificar. |
| 3:20 | — | Cierre: «En el próximo video, cómo revisar una hoja enferma con una foto». |

---

## Video 7. Detección de plagas con el modelo local

- **Objetivo:** tomar una foto adecuada, interpretar el resultado, pedir el
  plan de manejo y entender los límites de la herramienta.
- **Duración:** 4:00
- **Requisitos previos:** fotos de hojas de papa sanas y con tizón tardío.

| Tiempo | Pantalla / acción | Narración |
|---|---|---|
| 0:00 | Menú **Decisiones** → Plagas `/app/pests`. | Con una foto, AgroYachay ayuda a revisar si una planta tiene una plaga o enfermedad. |
| 0:10 | Grabación del celular: foto de cerca de una hoja con mancha, con buena luz. | Tome la foto de cerca, con luz de día y sin sombra fuerte. Que la hoja ocupe casi toda la imagen. |
| 0:35 | Subir la foto; elegir cultivo «Papa»; «Analizar». | Suba la foto e indique el cultivo. |
| 0:50 | Indicador «Analizando la imagen…». | El análisis lo hace un modelo de visión abierto, Qwen2.5-VL, instalado en el propio servidor. La foto no se envía a otras empresas. Puede tardar hasta un minuto. |
| 1:15 | Resultado: «Tizón tardío (*Phytophthora infestans*)», confianza, severidad, descripción, causas, tratamiento, prevención; señalar el aviso «Es una primera revisión, no un diagnóstico definitivo». | El resultado indica la enfermedad probable, la confianza, la severidad y qué la causa, cómo tratarla y cómo prevenirla. Siempre aparece este aviso: es una primera revisión, no un diagnóstico definitivo. |
| 1:50 | Clic en «Obtener plan de manejo». | Pida el plan de manejo para el Perú: urgencia, pasos, productos con dosis y una alternativa orgánica. |
| 2:20 | Señalar «Consultar a un agrónomo». | Si el plan lo recomienda, consulte a un agrónomo; en el video 10 vemos cómo hacerlo desde AgroYachay. |
| 2:35 | Diapositiva: límites de la herramienta. | Es importante entender sus límites. Esta es una herramienta de **triaje**, no un diagnóstico definitivo. En la validación del artículo, con 509 imágenes, detectó todas las plantas enfermas, una sensibilidad del cien por ciento, pero su especificidad fue del sesenta y dos por ciento: algunas plantas sanas aparecieron como enfermas. |
| 3:15 | Diapositiva: qué hacer con un resultado positivo. | Por eso, ante un resultado de enfermedad, revise más plantas del campo y, antes de aplicar productos, confirme con un técnico o agrónomo. |
| 3:35 | Sección «Historial» en `/app/pests`. | Todos sus análisis quedan en el historial. |
| 3:50 | — | Cierre: «Ahora calculemos los insumos de una campaña». |

---

## Video 8. Cálculo de insumos y catálogo

- **Objetivo:** calcular fertilizante, semilla, cal y jornales con costos, y
  consultar el catálogo de productos.
- **Duración:** 3:00
- **Requisitos previos:** ninguno (se puede usar un cultivo registrado).

| Tiempo | Pantalla / acción | Narración |
|---|---|---|
| 0:00 | Menú **Decisiones** → Insumos `/app/inputs`. | En Insumos calcula lo que necesita para una campaña y cuánto cuesta. |
| 0:10 | Elegir especie papa, área 0,5 ha, rendimiento objetivo 18 t/ha. | Elija el cultivo, el área y, si quiere, el rendimiento que espera. |
| 0:30 | Resultado: N-P-K, semilla, cal, jornales; cantidad, unidad, precio, subtotal y total. | AgroYachay calcula fertilizante nitrogenado, fosfatado y potásico, semilla, cal y jornales, con el precio de cada uno y el total en soles. |
| 1:10 | Señalar que los precios vienen del catálogo. | Los precios vienen del catálogo, que mantiene el administrador. Compárelos con los de su zona. |
| 1:30 | Pestaña «Catálogo»: filtrar por categoría «Semillas»; buscar «quinua». | En el catálogo hay agroquímicos, semillas, fertilizantes y equipos. Puede filtrar y buscar. |
| 2:05 | Abrir un producto con enlace al proveedor. | Cada producto indica la unidad, el precio y el proveedor. |
| 2:30 | Repetir el cálculo con quinua y 1 ha. | Pruebe con otros cultivos y áreas para comparar. |
| 2:50 | — | Cierre: «Con los costos claros, estimemos la cosecha». |

---

## Video 9. Estimación de cosecha e ingresos

- **Objetivo:** obtener una estimación de rendimiento e ingreso y leer cada
  factor del modelo.
- **Duración:** 3:30
- **Requisitos previos:** cultivo registrado con fecha de siembra y ubicación.

| Tiempo | Pantalla / acción | Narración |
|---|---|---|
| 0:00 | Menú **Decisiones** → Cosecha `/app/yield`. | Aquí estima cuánto puede cosechar y cuánto puede ganar. |
| 0:10 | Elegir el cultivo «Papa – parcela norte»; «Estimar». | Elija uno de sus cultivos. También puede escribir especie, área y fecha de siembra sin registrarlo. |
| 0:30 | Resultado: t/ha, toneladas totales, ingreso en soles, confianza. | El resultado muestra el rendimiento por hectárea, la producción total, el ingreso esperado y un nivel de confianza. |
| 1:00 | Tabla de factores: rendimiento base, clima (temperatura, humedad, lluvia), fenología, área, precio. | Lo más importante: AgroYachay muestra cada factor del cálculo. Parte de un rendimiento base de la especie y lo ajusta por el clima, por la etapa del cultivo y por el tamaño de la parcela. |
| 1:50 | Señalar un factor climático menor que 1. | Un factor menor que uno baja la estimación; aquí, por ejemplo, la temperatura de las últimas semanas. |
| 2:15 | Señalar el precio por kilo y la fórmula del ingreso. | El ingreso es la producción por el precio de referencia por kilo. |
| 2:35 | Señalar la confianza y lo que la sube (más datos de sensores, cultivo más avanzado). | La confianza sube cuando hay más lecturas de sensores y el cultivo está más avanzado. Es una estimación, no una garantía. |
| 3:00 | Historial de estimaciones. | Las estimaciones se guardan para comparar a lo largo de la campaña. |
| 3:20 | — | Cierre: «Si tiene dudas, pida asesoría». |

---

## Video 10. Asesoría: asistente IA y solicitud a un agrónomo

- **Objetivo:** conversar con el asistente y enviar una consulta a un
  agrónomo; mostrar cómo responde un administrador.
- **Duración:** 3:30
- **Requisitos previos:** cuenta de agricultor y, para la última parte, cuenta
  de administrador.

| Tiempo | Pantalla / acción | Narración |
|---|---|---|
| 0:00 | Menú **Decisiones** → Asesoría `/app/advisory`, pestaña del asistente. | Asesoría tiene dos partes: un asistente automático y la consulta a una persona. |
| 0:10 | Escribir: «¿Cuándo debo aporcar mi papa?»; respuesta. | El asistente usa por defecto un modelo abierto instalado en el propio servidor. Responde en su idioma y conoce sus cultivos, su zona y las últimas lecturas de sus sensores. |
| 0:45 | Pregunta de seguimiento sobre la humedad del suelo actual. | Puede seguir la conversación como en un chat. |
| 1:10 | Rótulo: el asistente puede equivocarse. | Las respuestas automáticas pueden tener errores. Para decisiones importantes, consulte a un profesional. |
| 1:25 | Pestaña «Solicitar a un agrónomo»: tema, prioridad, descripción, cultivo. | Para eso está la solicitud a un agrónomo. Indique el tema, la prioridad y describa el problema. |
| 1:55 | Enviar; la solicitud aparece como «abierta» con un borrador de IA adjunto. | AgroYachay adjunta un borrador automático para que el agrónomo empiece más rápido. |
| 2:15 | Cambio a cuenta de administrador: lista de solicitudes; abrir una; escribir respuesta; estado «respondida». | El administrador o agrónomo ve todas las solicitudes, revisa el borrador, escribe su respuesta y la marca como respondida. |
| 2:50 | Volver a la cuenta del agricultor: ver la respuesta. | El agricultor ve la respuesta en su lista de solicitudes. |
| 3:20 | — | Cierre: «Ahora veamos cómo sacar informes». |

---

## Video 11. Informes

- **Objetivo:** generar el informe imprimible (PDF) y descargar hojas de
  cálculo.
- **Duración:** 2:30
- **Requisitos previos:** datos de cultivos, lecturas y estimaciones.

| Tiempo | Pantalla / acción | Narración |
|---|---|---|
| 0:00 | Menú **Registros** → Informes `/app/reports`. | En Informes junta la información de su campaña. |
| 0:10 | Vista del informe: cultivos, resumen de lecturas, alertas, estimaciones. | El informe resume sus cultivos, las lecturas, las alertas y las estimaciones. |
| 0:35 | «Imprimir o guardar como PDF»; diálogo de impresión del navegador; elegir «Guardar como PDF». | Para tenerlo en PDF, pulse imprimir y elija «Guardar como PDF». Sirve para presentarlo a una cooperativa, un programa o una entidad de crédito. |
| 1:15 | Descargar Excel: cultivos, lecturas, finanzas. | También puede descargar hojas de Excel con sus cultivos, sus lecturas y los datos económicos. |
| 1:45 | Abrir el archivo de lecturas en una hoja de cálculo. | Así puede hacer sus propios cálculos o compartir los datos con su técnico. |
| 2:20 | — | Cierre: «El último módulo es para administradores». |

---

## Video 12. Administración

- **Objetivo:** mostrar las tareas de administración. Solo para cuentas
  administrador y superadministrador.
- **Duración:** 4:00
- **Requisitos previos:** cuenta superadministrador de demostración.

| Tiempo | Pantalla / acción | Narración |
|---|---|---|
| 0:00 | Grupo **Administración** del menú; abrir `/app/admin`. Rótulo: «Solo administradores». | Este grupo del menú solo aparece para administradores. |
| 0:10 | Estadísticas: usuarios por rol, activos en 7 días, dispositivos, lecturas de 24 h, diagnósticos. | La primera vista resume el uso del sistema. |
| 0:35 | Menú **Usuarios** (`/app/admin/users`): buscar; abrir un usuario (correo difuminado); desactivar y reactivar. | En Usuarios puede buscar cuentas y desactivarlas si hace falta. |
| 1:05 | Cambiar el rol de un usuario a administrador. | El cambio a administrador o superadministrador solo lo puede hacer un superadministrador. |
| 1:30 | Menú **Bitácora** (`/app/admin/audit`): filtrar por acción «login_failed» y por fechas. | La bitácora registra los ingresos, los intentos fallidos, los registros, los cambios de rol y de configuración y las vinculaciones de dispositivos. Sirve para auditar quién hizo qué y cuándo. |
| 2:10 | Menú **Catálogo** (`/app/admin/catalog`): crear un producto (nombre, categoría, unidad, precio, proveedor, enlace); editar un precio. | En Catálogo se mantienen los productos y precios que usa el cálculo de insumos. |
| 2:50 | Menú **Configuración** (`/app/admin/settings`, solo superadministrador): anuncio, registro abierto, región por defecto, proveedor del modelo de lenguaje («llama.cpp (local)» o «Groq»). | En Configuración, el superadministrador puede publicar un anuncio, abrir o cerrar el registro, fijar la región por defecto y elegir el proveedor del modelo de lenguaje: el modelo local, que no saca datos del servidor, o Groq. Las fotos siempre se analizan con el modelo local. |
| 3:30 | Escribir un anuncio y guardarlo; verlo en la cuenta de agricultor. | Los cambios quedan anotados en la bitácora. |
| 3:50 | — | Cierre: «Terminamos con cómo usar y citar AgroYachay». |

---

## Video 13. Cierre: código abierto y cómo citar

- **Objetivo:** indicar dónde está el código, su licencia y cómo citar el
  trabajo.
- **Duración:** 1:30
- **Requisitos previos:** ninguno.

| Tiempo | Pantalla / acción | Narración |
|---|---|---|
| 0:00 | Repositorio en GitHub `Andre031222/agroyachay`. | AgroYachay es software libre con licencia MIT. El código está en GitHub. |
| 0:15 | README: relación entre AgroYachay 3 y la versión v1.0.1. | La versión descrita en el artículo de SoftwareX es AgroYachay 1.0.1, que sigue disponible y archivada en Zenodo. AgroYachay 3 es su nueva versión. |
| 0:35 | Carpetas `api`, `web`, `firmware`, `simulation`, `deploy`. | Ahí están el servidor, la aplicación web, el firmware del nodo, una simulación que corre en el navegador sin hardware y las guías de instalación. |
| 0:55 | Sección «Citation» y botón «Cite this repository». | Si usa AgroYachay en una investigación, cite el artículo: SoftwareX, volumen 36, 2026, artículo 103037. |
| 1:10 | Créditos: autores y afiliaciones (UNALM, UNAP). | AgroYachay es obra de investigadores de la Universidad Nacional Agraria La Molina y la Universidad Nacional del Altiplano. La versión 3 la desarrolla y mantiene Richar Andre Vilca Solorzano. |
| 1:25 | Logo y dirección `agroyachay.ginit.dev`. | Cierre: «Gracias. AgroYachay: información de su chacra para decidir mejor». |
