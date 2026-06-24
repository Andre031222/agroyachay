import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

def enviar_notificacion_asesoria(usuario_data, asesoria_data):
    try:
        mail_server = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
        mail_port = int(os.getenv('MAIL_PORT', 587))
        mail_username = os.getenv('MAIL_USERNAME')
        mail_password = os.getenv('MAIL_PASSWORD')
        admin_email = os.getenv('ADMIN_EMAIL')

        if not all([mail_username, mail_password, admin_email]):
            return False

        msg = MIMEMultipart('alternative')
        msg['Subject'] = f'🌾 Nueva Solicitud de Asesoría - {asesoria_data["tipo_asesoria"]}'
        msg['From'] = mail_username
        msg['To'] = admin_email

        prioridad_emoji = {
            'Urgente': '🔴',
            'Alta': '🟠',
            'Media': '🟡',
            'Baja': '🟢'
        }
        emoji = prioridad_emoji.get(asesoria_data.get('prioridad', 'Media'), '🟡')

        texto_plano = f"""
Nueva Solicitud de Asesoría - AgroYachay

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INFORMACIÓN DEL USUARIO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 Nombre: {usuario_data['nombre']} {usuario_data['apellido']}
📧 Email: {usuario_data['email']}
📱 Teléfono: {usuario_data.get('telefono', 'No especificado')}
📍 Región: {usuario_data.get('region', 'No especificada')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DETALLES DE LA ASESORÍA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 Tipo: {asesoria_data['tipo_asesoria']}
{emoji} Prioridad: {asesoria_data.get('prioridad', 'Media')}
📅 Fecha: {datetime.now().strftime('%d/%m/%Y %H:%M')}

📝 Descripción del Problema:
{asesoria_data['descripcion_problema']}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Accede al panel de administración para responder a esta solicitud.
        """

        html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            background-color: #f5f5f5;
        }}
        .container {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px;
            border-radius: 20px;
            margin: 20px;
        }}
        .header {{
            background-color: white;
            padding: 20px;
            border-radius: 15px;
            text-align: center;
            margin-bottom: 20px;
        }}
        .header h1 {{
            color: #667eea;
            margin: 0;
            font-size: 28px;
        }}
        .content {{
            background-color: white;
            padding: 25px;
            border-radius: 15px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }}
        .section {{
            margin-bottom: 20px;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 10px;
            border-left: 4px solid #667eea;
        }}
        .section-title {{
            font-size: 16px;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }}
        .info-row {{
            display: flex;
            padding: 8px 0;
            border-bottom: 1px solid #e9ecef;
        }}
        .info-row:last-child {{
            border-bottom: none;
        }}
        .info-label {{
            font-weight: bold;
            min-width: 120px;
            color: #555;
        }}
        .info-value {{
            color: #333;
        }}
        .problema {{
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            border-radius: 10px;
            margin-top: 15px;
        }}
        .prioridad {{
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 14px;
        }}
        .prioridad-urgente {{
            background-color: #dc3545;
            color: white;
        }}
        .prioridad-alta {{
            background-color: #fd7e14;
            color: white;
        }}
        .prioridad-media {{
            background-color: #ffc107;
            color: #333;
        }}
        .prioridad-baja {{
            background-color: #28a745;
            color: white;
        }}
        .footer {{
            text-align: center;
            margin-top: 20px;
            color: white;
            font-size: 14px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌾 AgroYachay</h1>
            <p style="margin: 5px 0; color: #666;">Nueva Solicitud de Asesoría</p>
        </div>

        <div class="content">
            <div class="section">
                <div class="section-title">👤 Información del Usuario</div>
                <div class="info-row">
                    <span class="info-label">Nombre:</span>
                    <span class="info-value">{usuario_data['nombre']} {usuario_data['apellido']}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Email:</span>
                    <span class="info-value">{usuario_data['email']}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Teléfono:</span>
                    <span class="info-value">{usuario_data.get('telefono', 'No especificado')}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Región:</span>
                    <span class="info-value">{usuario_data.get('region', 'No especificada')}</span>
                </div>
            </div>

            <div class="section">
                <div class="section-title">🎯 Detalles de la Asesoría</div>
                <div class="info-row">
                    <span class="info-label">Tipo:</span>
                    <span class="info-value">{asesoria_data['tipo_asesoria']}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Prioridad:</span>
                    <span class="info-value">
                        <span class="prioridad prioridad-{asesoria_data.get('prioridad', 'Media').lower()}">
                            {emoji} {asesoria_data.get('prioridad', 'Media')}
                        </span>
                    </span>
                </div>
                <div class="info-row">
                    <span class="info-label">Fecha:</span>
                    <span class="info-value">{datetime.now().strftime('%d/%m/%Y %H:%M')}</span>
                </div>
            </div>

            <div class="problema">
                <strong style="color: #856404;">📝 Descripción del Problema:</strong>
                <p style="margin: 10px 0 0 0; color: #333;">{asesoria_data['descripcion_problema']}</p>
            </div>
        </div>

        <div class="footer">
            <p>Accede al panel de administración para responder a esta solicitud</p>
            <p style="font-size: 12px; opacity: 0.8;">AgroYachay - Sistema Inteligente de Gestión Agrícola</p>
        </div>
    </div>
</body>
</html>
        """

        parte_texto = MIMEText(texto_plano, 'plain', 'utf-8')
        parte_html = MIMEText(html, 'html', 'utf-8')

        msg.attach(parte_texto)
        msg.attach(parte_html)

        with smtplib.SMTP(mail_server, mail_port) as server:
            server.starttls()
            server.login(mail_username, mail_password)
            server.send_message(msg)

        return True

    except Exception:
        return False
