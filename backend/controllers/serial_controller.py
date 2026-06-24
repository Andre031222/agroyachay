from flask import Blueprint, request, jsonify
import json
import time
import socket

try:
    import serial
    import serial.tools.list_ports
    SERIAL_AVAILABLE = True
except ImportError:
    SERIAL_AVAILABLE = False

serial_bp = Blueprint('serial', __name__)

ESP32_KEYWORDS = [
    'CP210', 'CH340', 'CH341', 'Silicon Labs', 'USB Serial',
    'USB-SERIAL', 'USB to UART', 'UART Bridge', 'FT232',
]


def _puerto_es_esp32(descripcion: str) -> bool:
    if not descripcion:
        return False
    desc_lower = descripcion.lower()
    return any(kw.lower() in desc_lower for kw in ESP32_KEYWORDS)


def _abrir_puerto(port: str, timeout: float = 5.0, boot_wait: float = 0.0):
    try:
        s = serial.Serial()
        s.port = port
        s.baudrate = 115200
        s.timeout = timeout
        s.write_timeout = 3
        s.dtr = False
        s.rts = False
        s.open()
        if boot_wait > 0:
            time.sleep(boot_wait)
        return s
    except serial.SerialException as e:
        msg = str(e)
        if 'PermissionError' in msg or 'Access is denied' in msg or 'could not open port' in msg.lower():
            raise PermissionError(f"El puerto {port} está en uso por otro proceso. Cierra el Monitor Serie de Arduino IDE u otro programa que lo tenga abierto.")
        raise RuntimeError(f"No se pudo abrir {port}: {msg}")


def _enviar_comando(ser, cmd_dict: dict, read_timeout: float = 8.0) -> dict:
    ser.reset_input_buffer()

    payload = json.dumps(cmd_dict, separators=(',', ':')) + '\n'
    ser.write(payload.encode('utf-8'))
    ser.flush()

    deadline = time.time() + read_timeout
    buf = b''
    while time.time() < deadline:
        chunk = ser.read(ser.in_waiting or 1)
        if chunk:
            buf += chunk
            if b'\n' in buf:
                lines = buf.split(b'\n')
                for line in lines:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        return json.loads(line.decode('utf-8'))
                    except (json.JSONDecodeError, UnicodeDecodeError):
                        continue
        else:
            time.sleep(0.05)

    raise TimeoutError(f"El ESP32 no respondió en {read_timeout:.0f}s. Verifica que esté en modo Setup (LED parpadeando rápido).")


@serial_bp.route('/detectar', methods=['GET'])
def detectar():
    if not SERIAL_AVAILABLE:
        return jsonify({
            'success': False,
            'message': 'pyserial no está instalado. Ejecuta: pip install pyserial'
        }), 500

    puertos = []
    for port_info in serial.tools.list_ports.comports():
        desc = port_info.description or ''
        if _puerto_es_esp32(desc):
            puertos.append({
                'port': port_info.device,
                'descripcion': desc,
            })

    todos = []
    for port_info in serial.tools.list_ports.comports():
        todos.append({
            'port': port_info.device,
            'descripcion': port_info.description or port_info.device,
        })

    return jsonify({
        'success': True,
        'puertos': puertos,
        'todos': todos,
    })


@serial_bp.route('/identificar', methods=['POST'])
def identificar():
    if not SERIAL_AVAILABLE:
        return jsonify({'success': False, 'message': 'pyserial no instalado'}), 500

    data = request.get_json(silent=True) or {}
    port = data.get('port', '').strip()
    if not port:
        return jsonify({'success': False, 'message': 'Falta el campo "port"'}), 400

    try:
        ser = _abrir_puerto(port, timeout=5.0, boot_wait=0.5)
        try:
            resultado = _enviar_comando(ser, {'cmd': 'identify'}, read_timeout=6.0)
        finally:
            ser.close()

        if resultado.get('ok'):
            return jsonify({'success': True, **resultado})
        else:
            return jsonify({'success': False, 'message': resultado.get('error', 'Respuesta inesperada del ESP32')}), 400

    except PermissionError as e:
        return jsonify({'success': False, 'message': str(e)}), 409
    except TimeoutError as e:
        return jsonify({'success': False, 'message': str(e)}), 408
    except Exception as e:
        return jsonify({'success': False, 'message': 'Error interno del servidor'}), 500


@serial_bp.route('/scan-wifi', methods=['POST'])
def scan_wifi():
    if not SERIAL_AVAILABLE:
        return jsonify({'success': False, 'message': 'pyserial no instalado'}), 500

    data = request.get_json(silent=True) or {}
    port = data.get('port', '').strip()
    if not port:
        return jsonify({'success': False, 'message': 'Falta el campo "port"'}), 400

    try:
        ser = _abrir_puerto(port, timeout=16.0, boot_wait=0.3)
        try:
            resultado = _enviar_comando(ser, {'cmd': 'scan'}, read_timeout=15.0)
        finally:
            ser.close()

        if resultado.get('ok'):
            return jsonify({'success': True, 'networks': resultado.get('networks', [])})
        else:
            return jsonify({'success': False, 'message': resultado.get('error', 'Error al escanear redes')}), 400

    except PermissionError as e:
        return jsonify({'success': False, 'message': str(e)}), 409
    except TimeoutError as e:
        return jsonify({'success': False, 'message': str(e)}), 408
    except Exception as e:
        return jsonify({'success': False, 'message': 'Error interno del servidor'}), 500


@serial_bp.route('/configurar', methods=['POST'])
def configurar():
    if not SERIAL_AVAILABLE:
        return jsonify({'success': False, 'message': 'pyserial no instalado'}), 500

    data = request.get_json(silent=True) or {}
    port = data.get('port', '').strip()
    ssid = data.get('ssid', '').strip()
    password = data.get('pass', '')
    server_url = data.get('server_url', '').strip()

    if not port:
        return jsonify({'success': False, 'message': 'Falta el campo "port"'}), 400
    if not ssid:
        return jsonify({'success': False, 'message': 'Falta el campo "ssid"'}), 400
    if not server_url:
        return jsonify({'success': False, 'message': 'Falta el campo "server_url"'}), 400

    try:
        ser = _abrir_puerto(port, timeout=8.0, boot_wait=0.3)
        try:
            cmd = {
                'cmd': 'config',
                'ssid': ssid,
                'pass': password,
                'server': server_url,
            }
            resultado = _enviar_comando(ser, cmd, read_timeout=8.0)
        finally:
            ser.close()

        if resultado.get('ok'):
            return jsonify({
                'success': True,
                'device_id': resultado.get('device_id', ''),
                'message': 'ESP32 configurado correctamente. Conectándose a WiFi...',
            })
        else:
            return jsonify({'success': False, 'message': resultado.get('error', 'Error al configurar')}), 400

    except PermissionError as e:
        return jsonify({'success': False, 'message': str(e)}), 409
    except TimeoutError as e:
        return jsonify({'success': False, 'message': str(e)}), 408
    except Exception as e:
        return jsonify({'success': False, 'message': 'Error interno del servidor'}), 500


@serial_bp.route('/server-info', methods=['GET'])
def server_info():
    collected = []

    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(('8.8.8.8', 80))
            primary = s.getsockname()[0]
            if primary and not primary.startswith('127.'):
                collected.append(primary)
    except Exception:
        pass

    try:
        hostname = socket.gethostname()
        for info in socket.getaddrinfo(hostname, None, socket.AF_INET):
            ip = info[4][0]
            if ip and not ip.startswith('127.') and ip not in collected:
                collected.append(ip)
    except Exception:
        pass

    try:
        ip = socket.gethostbyname(socket.gethostname())
        if ip and not ip.startswith('127.') and ip not in collected:
            collected.append(ip)
    except Exception:
        pass

    port = 5000
    host_header = request.host or ''
    if ':' in host_header:
        try:
            port = int(host_header.rsplit(':', 1)[-1])
        except ValueError:
            pass

    endpoint = '/api/sensores/lectura'
    options = [
        {
            'ip': ip,
            'url': f'http://{ip}:{port}{endpoint}',
            'label': _label_ip(ip),
        }
        for ip in collected
    ]

    suggested = options[0]['url'] if options else f'http://127.0.0.1:{port}{endpoint}'

    return jsonify({
        'success': True,
        'port': port,
        'suggested': suggested,
        'options': options,
    })


def _label_ip(ip: str) -> str:
    parts = ip.split('.')
    if len(parts) != 4:
        return ip
    first, second = int(parts[0]), int(parts[1])
    if first == 192 and second == 168:
        return f'{ip}  (Red local)'
    if first == 10:
        return f'{ip}  (Red privada)'
    if first == 172 and 16 <= second <= 31:
        return f'{ip}  (Red privada)'
    return ip
