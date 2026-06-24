from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db
from app.models.cultivo import Cultivo, ActividadCultivo, Insumo
from app.models.plaga import DeteccionPlaga
from app.models.sensor import Informe, DatoClimatico
from app.models.user import Usuario
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.enums import TA_CENTER
from app.utils.excel_reports import (
    generar_dashboard_ejecutivo_excel,
    generar_estado_cultivos_excel,
    generar_analisis_financiero_excel,
    generar_impacto_climatico_excel
)
from app.utils.pdf_reports_advanced import generar_dashboard_ejecutivo_pdf_avanzado
from datetime import datetime
import os
import json

informes_bp = Blueprint('informes', __name__)

REPORTS_FOLDER = 'uploads/informes'

@informes_bp.route('/generar', methods=['POST'])
@jwt_required()
def generar_informe():
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()

        tipo_informe = data.get('tipo_informe')
        formato = data.get('formato', 'PDF')
        parametros = data.get('parametros', {})

        if not tipo_informe:
            return jsonify({
                'success': False,
                'message': 'Tipo de informe requerido'
            }), 400

        os.makedirs(REPORTS_FOLDER, exist_ok=True)

        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        extension = 'xlsx' if formato.upper() == 'EXCEL' else 'pdf'
        filename = f"informe_{tipo_informe.replace(' ', '_')}_{timestamp}.{extension}"
        filepath = os.path.join(REPORTS_FOLDER, filename)

        if formato.upper() == 'EXCEL':
            if tipo_informe == 'Dashboard Ejecutivo':
                generar_dashboard_ejecutivo_excel(filepath, user_id)
            elif tipo_informe == 'Estado de Cultivos':
                generar_estado_cultivos_excel(filepath, user_id, parametros)
            elif tipo_informe == 'Análisis Financiero':
                generar_analisis_financiero_excel(filepath, user_id, parametros)
            elif tipo_informe == 'Impacto Climático':
                generar_impacto_climatico_excel(filepath, user_id, parametros)
            else:
                return jsonify({
                    'success': False,
                    'message': 'Tipo de informe no válido'
                }), 400
        else:
            if tipo_informe == 'Dashboard Ejecutivo':
                generar_dashboard_ejecutivo_pdf_avanzado(filepath, user_id)
            elif tipo_informe == 'Estado de Cultivos':
                _generar_estado_cultivos(filepath, user_id, parametros)
            elif tipo_informe == 'Análisis Financiero':
                _generar_analisis_financiero(filepath, user_id, parametros)
            elif tipo_informe == 'Impacto Climático':
                _generar_impacto_climatico(filepath, user_id, parametros)
            else:
                return jsonify({
                    'success': False,
                    'message': 'Tipo de informe no válido'
                }), 400

        informe = Informe(
            usuario_id=user_id,
            tipo_informe=tipo_informe,
            formato=formato,
            archivo_url=f'/uploads/informes/{filename}',
            parametros=json.dumps(parametros)
        )

        db.session.add(informe)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Informe generado exitosamente',
            'data': {
                'informe_id': informe.id,
                'url': informe.archivo_url,
                'filename': filename
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Error interno del servidor'
        }), 500

@informes_bp.route('/mis-informes', methods=['GET'])
@jwt_required()
def mis_informes():
    try:
        user_id = int(get_jwt_identity())

        informes = Informe.query.filter_by(usuario_id=user_id)\
            .order_by(Informe.fecha_generacion.desc()).all()

        return jsonify({
            'success': True,
            'data': [i.to_dict() for i in informes]
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error interno del servidor'
        }), 500

@informes_bp.route('/descargar/<int:informe_id>', methods=['GET'])
@jwt_required()
def descargar_informe(informe_id):
    try:
        user_id = int(get_jwt_identity())
        informe = Informe.query.filter_by(id=informe_id, usuario_id=user_id).first()

        if not informe:
            return jsonify({
                'success': False,
                'message': 'Informe no encontrado'
            }), 404

        filepath = informe.archivo_url.lstrip('/')

        if not os.path.exists(filepath):
            return jsonify({
                'success': False,
                'message': 'Archivo no encontrado'
            }), 404

        return send_file(filepath, as_attachment=True)

    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error interno del servidor'
        }), 500

@informes_bp.route('/estadisticas', methods=['GET'])
@jwt_required()
def estadisticas_informes():
    try:
        user_id = int(get_jwt_identity())

        total_informes = Informe.query.filter_by(usuario_id=user_id).count()

        informes_por_tipo = db.session.query(
            Informe.tipo_informe,
            db.func.count(Informe.id)
        ).filter_by(usuario_id=user_id)\
         .group_by(Informe.tipo_informe).all()

        total_cultivos = Cultivo.query.filter_by(usuario_id=user_id).count() or 0

        try:
            cultivos_ids = [c.id for c in Cultivo.query.filter_by(usuario_id=user_id).all()]
            if cultivos_ids:
                total_detecciones = DeteccionPlaga.query.filter(
                    DeteccionPlaga.cultivo_id.in_(cultivos_ids)
                ).count() or 0
            else:
                total_detecciones = 0
        except Exception:
            total_detecciones = 0

        return jsonify({
            'success': True,
            'data': {
                'total_informes': total_informes,
                'por_tipo': {tipo: count for tipo, count in informes_por_tipo},
                'metricas': {
                    'total_cultivos': total_cultivos,
                    'total_detecciones': total_detecciones
                }
            }
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error interno del servidor'
        }), 500


def _generar_dashboard_ejecutivo(filepath, user_id):
    doc = SimpleDocTemplate(filepath, pagesize=A4)
    story = []
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#2d5016'),
        spaceAfter=30,
        alignment=TA_CENTER
    )

    story.append(Paragraph("Dashboard Ejecutivo - AgroYachay", title_style))
    story.append(Spacer(1, 0.3*inch))

    fecha_actual = datetime.utcnow().strftime('%d/%m/%Y')
    story.append(Paragraph(f"Fecha de generación: {fecha_actual}", styles['Normal']))
    story.append(Spacer(1, 0.3*inch))

    cultivos = Cultivo.query.filter_by(usuario_id=user_id).all()
    cultivos_activos = [c for c in cultivos if c.estado in ['Sembrado', 'Crecimiento', 'Floración', 'Maduración']]
    area_total = sum([float(c.area_hectareas) for c in cultivos])

    data = [
        ['Métrica', 'Valor'],
        ['Total de Cultivos', str(len(cultivos))],
        ['Cultivos Activos', str(len(cultivos_activos))],
        ['Área Total (ha)', f'{area_total:.2f}'],
        ['Rendimiento Promedio', 'Calculando...']
    ]

    table = Table(data, colWidths=[3*inch, 2*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2d5016')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 14),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))

    story.append(table)
    story.append(Spacer(1, 0.5*inch))

    story.append(Paragraph("Distribución de Cultivos por Tipo", styles['Heading2']))
    story.append(Spacer(1, 0.2*inch))

    cultivos_por_tipo = {}
    for cultivo in cultivos:
        tipo = cultivo.tipo_cultivo
        cultivos_por_tipo[tipo] = cultivos_por_tipo.get(tipo, 0) + 1

    data_tipo = [['Tipo de Cultivo', 'Cantidad']]
    for tipo, cantidad in cultivos_por_tipo.items():
        data_tipo.append([tipo, str(cantidad)])

    table_tipo = Table(data_tipo, colWidths=[3*inch, 2*inch])
    table_tipo.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2d5016')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.lightgreen),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))

    story.append(table_tipo)

    doc.build(story)


def _generar_estado_cultivos(filepath, user_id, parametros):
    doc = SimpleDocTemplate(filepath, pagesize=A4)
    story = []
    styles = getSampleStyleSheet()

    story.append(Paragraph("Informe de Estado de Cultivos", styles['Title']))
    story.append(Spacer(1, 0.3*inch))

    cultivos = Cultivo.query.filter_by(usuario_id=user_id).all()

    for cultivo in cultivos:
        story.append(Paragraph(f"<b>{cultivo.nombre}</b> ({cultivo.tipo_cultivo})", styles['Heading2']))

        dias_desde_siembra = (datetime.utcnow().date() - cultivo.fecha_siembra).days

        info = [
            ['Área', f'{float(cultivo.area_hectareas):.2f} ha'],
            ['Estado', cultivo.estado],
            ['Días desde siembra', str(dias_desde_siembra)],
            ['Fecha siembra', cultivo.fecha_siembra.strftime('%d/%m/%Y')]
        ]

        table = Table(info, colWidths=[2*inch, 3*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))

        story.append(table)
        story.append(Spacer(1, 0.3*inch))

    doc.build(story)


def _generar_analisis_financiero(filepath, user_id, parametros):
    doc = SimpleDocTemplate(filepath, pagesize=A4)
    story = []
    styles = getSampleStyleSheet()

    story.append(Paragraph("Análisis Financiero", styles['Title']))
    story.append(Spacer(1, 0.3*inch))

    cultivos = Cultivo.query.filter_by(usuario_id=user_id).all()
    costo_total = 0

    for cultivo in cultivos:
        insumos = Insumo.query.filter_by(cultivo_id=cultivo.id).all()
        costo_cultivo = sum([float(i.costo_total) for i in insumos])
        costo_total += costo_cultivo

        story.append(Paragraph(f"<b>{cultivo.nombre}</b>", styles['Heading2']))
        story.append(Paragraph(f"Costo total en insumos: S/. {costo_cultivo:.2f}", styles['Normal']))
        story.append(Spacer(1, 0.2*inch))

    story.append(Spacer(1, 0.3*inch))
    story.append(Paragraph(f"<b>Inversión Total: S/. {costo_total:.2f}</b>", styles['Heading2']))

    doc.build(story)


def _generar_impacto_climatico(filepath, user_id, parametros):
    doc = SimpleDocTemplate(filepath, pagesize=A4)
    story = []
    styles = getSampleStyleSheet()

    story.append(Paragraph("Informe de Impacto Climático", styles['Title']))
    story.append(Spacer(1, 0.3*inch))

    datos_clima = DatoClimatico.query.order_by(DatoClimatico.fecha_hora.desc()).limit(10).all()

    if datos_clima:
        temp_promedio = sum([float(d.temperatura) for d in datos_clima if d.temperatura]) / len(datos_clima)
        humedad_promedio = sum([float(d.humedad) for d in datos_clima if d.humedad]) / len(datos_clima)

        story.append(Paragraph(f"Temperatura promedio: {temp_promedio:.1f}°C", styles['Normal']))
        story.append(Paragraph(f"Humedad promedio: {humedad_promedio:.1f}%", styles['Normal']))
        story.append(Spacer(1, 0.2*inch))

        story.append(Paragraph("Análisis de Impacto:", styles['Heading2']))

        if temp_promedio < 10:
            story.append(Paragraph("[!] Temperaturas bajas - Riesgo de heladas", styles['Normal']))
        elif temp_promedio > 25:
            story.append(Paragraph("[!] Temperaturas altas - Mayor demanda hidrica", styles['Normal']))
        else:
            story.append(Paragraph("[OK] Temperaturas favorables", styles['Normal']))

        if humedad_promedio < 40:
            story.append(Paragraph("[!] Baja humedad - Aumentar frecuencia de riego", styles['Normal']))
        elif humedad_promedio > 80:
            story.append(Paragraph("[!] Alta humedad - Riesgo de enfermedades fungicas", styles['Normal']))
        else:
            story.append(Paragraph("[OK] Humedad adecuada", styles['Normal']))

    doc.build(story)
