from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak, Image, KeepTogether
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT, TA_JUSTIFY
from reportlab.pdfgen import canvas
from datetime import datetime
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from io import BytesIO
import os

from app.models.cultivo import Cultivo, Insumo
from app.models.plaga import DeteccionPlaga
from app.models import db


def crear_grafico_cultivos_por_tipo(cultivos, filepath):
    cultivos_por_tipo = {}
    for cultivo in cultivos:
        tipo = cultivo.tipo_cultivo
        cultivos_por_tipo[tipo] = cultivos_por_tipo.get(tipo, 0) + 1

    if not cultivos_por_tipo:
        return None

    fig, ax = plt.subplots(figsize=(8, 5))
    tipos = list(cultivos_por_tipo.keys())
    cantidades = list(cultivos_por_tipo.values())

    colors_list = ['#2E7D32', '#43A047', '#66BB6A', '#81C784', '#A5D6A7', '#C8E6C9']

    bars = ax.bar(tipos, cantidades, color=colors_list[:len(tipos)], edgecolor='white', linewidth=1.5)

    for bar in bars:
        height = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., height,
                f'{int(height)}',
                ha='center', va='bottom', fontweight='bold', fontsize=12)

    ax.set_xlabel('Tipo de Cultivo', fontsize=12, fontweight='bold')
    ax.set_ylabel('Cantidad', fontsize=12, fontweight='bold')
    ax.set_title('Distribución de Cultivos por Tipo', fontsize=14, fontweight='bold', pad=20)
    ax.grid(axis='y', alpha=0.3, linestyle='--')
    ax.set_axisbelow(True)

    plt.xticks(rotation=45, ha='right')
    plt.tight_layout()
    plt.savefig(filepath, format='png', dpi=300, bbox_inches='tight')
    plt.close()

    return filepath


def crear_grafico_area_por_tipo(cultivos, filepath):
    area_por_tipo = {}
    for cultivo in cultivos:
        tipo = cultivo.tipo_cultivo
        area_por_tipo[tipo] = area_por_tipo.get(tipo, 0) + float(cultivo.area_hectareas)

    if not area_por_tipo:
        return None

    fig, ax = plt.subplots(figsize=(8, 6))

    tipos = list(area_por_tipo.keys())
    areas = list(area_por_tipo.values())

    colors_list = ['#1B5E20', '#2E7D32', '#388E3C', '#43A047', '#4CAF50', '#66BB6A']

    wedges, texts, autotexts = ax.pie(areas, labels=tipos, autopct='%1.1f%%',
                                        colors=colors_list[:len(tipos)],
                                        startangle=90,
                                        textprops={'fontsize': 11, 'weight': 'bold'})

    for autotext in autotexts:
        autotext.set_color('white')
        autotext.set_fontsize(12)
        autotext.set_weight('bold')

    ax.set_title('Distribución de Área por Tipo de Cultivo', fontsize=14, fontweight='bold', pad=20)

    plt.tight_layout()
    plt.savefig(filepath, format='png', dpi=300, bbox_inches='tight')
    plt.close()

    return filepath


def crear_grafico_costos_por_cultivo(cultivos, filepath):
    nombres = []
    costos = []

    for cultivo in cultivos:
        insumos = Insumo.query.filter_by(cultivo_id=cultivo.id).all()
        costo_total = sum([float(i.costo_total) for i in insumos if i.costo_total])
        if costo_total > 0:
            nombres.append(cultivo.nombre[:20])
            costos.append(costo_total)

    if not nombres:
        return None

    fig, ax = plt.subplots(figsize=(8, max(5, len(nombres) * 0.5)))

    colors_list = plt.cm.YlOrRd(range(len(nombres)))

    bars = ax.barh(nombres, costos, color=colors_list, edgecolor='white', linewidth=1.5)

    for i, (bar, costo) in enumerate(zip(bars, costos)):
        width = bar.get_width()
        ax.text(width, bar.get_y() + bar.get_height()/2.,
                f'S/. {costo:,.2f}',
                ha='left', va='center', fontweight='bold', fontsize=10,
                bbox=dict(boxstyle='round,pad=0.3', facecolor='white', alpha=0.8))

    ax.set_xlabel('Costo Total (S/.)', fontsize=12, fontweight='bold')
    ax.set_title('Inversión por Cultivo', fontsize=14, fontweight='bold', pad=20)
    ax.grid(axis='x', alpha=0.3, linestyle='--')
    ax.set_axisbelow(True)

    plt.tight_layout()
    plt.savefig(filepath, format='png', dpi=300, bbox_inches='tight')
    plt.close()

    return filepath


def crear_grafico_estado_cultivos(cultivos, filepath):
    estados = {}
    for cultivo in cultivos:
        estado = cultivo.estado
        estados[estado] = estados.get(estado, 0) + 1

    if not estados:
        return None

    fig, ax = plt.subplots(figsize=(8, 6))

    estados_nombres = list(estados.keys())
    estados_valores = list(estados.values())

    color_map = {
        'Sembrado': '#2196F3',
        'Crecimiento': '#4CAF50',
        'Floración': '#FF9800',
        'Maduración': '#FFC107',
        'Cosechado': '#8BC34A',
        'Inactivo': '#9E9E9E'
    }

    colors_list = [color_map.get(estado, '#757575') for estado in estados_nombres]

    wedges, texts, autotexts = ax.pie(estados_valores, labels=estados_nombres, autopct='%1.1f%%',
                                        colors=colors_list,
                                        startangle=90,
                                        textprops={'fontsize': 11, 'weight': 'bold'})

    for autotext in autotexts:
        autotext.set_color('white')
        autotext.set_fontsize(12)
        autotext.set_weight('bold')

    ax.set_title('Estado de los Cultivos', fontsize=14, fontweight='bold', pad=20)

    plt.tight_layout()
    plt.savefig(filepath, format='png', dpi=300, bbox_inches='tight')
    plt.close()

    return filepath


class NumerosPagina(canvas.Canvas):

    def __init__(self, *args, **kwargs):
        canvas.Canvas.__init__(self, *args, **kwargs)
        self.pages = []

    def showPage(self):
        self.pages.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        page_count = len(self.pages)
        for page_num, page in enumerate(self.pages, 1):
            self.__dict__.update(page)
            self.draw_page_number(page_num, page_count)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_number(self, page_num, page_count):
        self.setFont("Helvetica", 9)
        self.setFillColor(colors.HexColor('#666666'))

        self.setStrokeColor(colors.HexColor('#2E7D32'))
        self.setLineWidth(2)
        self.line(50, 40, A4[0]-50, 40)

        text = f"Página {page_num} de {page_count}"
        self.drawRightString(A4[0]-50, 25, text)

        self.drawString(50, 25, f"AgroYachay - {datetime.now().strftime('%d/%m/%Y')}")


def generar_dashboard_ejecutivo_pdf_avanzado(filepath, user_id):
    doc = SimpleDocTemplate(filepath, pagesize=A4,
                          topMargin=1.5*cm, bottomMargin=2*cm,
                          leftMargin=2*cm, rightMargin=2*cm)

    story = []
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=32,
        textColor=colors.HexColor('#1B5E20'),
        spaceAfter=15,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )

    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Heading2'],
        fontSize=18,
        textColor=colors.HexColor('#2E7D32'),
        spaceAfter=12,
        spaceBefore=20,
        fontName='Helvetica-Bold',
        borderWidth=3,
        borderColor=colors.HexColor('#1B5E20'),
        borderPadding=10,
        backColor=colors.HexColor('#E8F5E9')
    )

    info_style = ParagraphStyle(
        'InfoStyle',
        parent=styles['Normal'],
        fontSize=11,
        textColor=colors.HexColor('#424242'),
        spaceAfter=8,
        leading=16,
        alignment=TA_JUSTIFY
    )

    story.append(Spacer(1, 1*inch))

    story.append(Paragraph("AgroYachay", title_style))
    story.append(Spacer(1, 0.3*inch))

    story.append(Paragraph("Dashboard Ejecutivo", ParagraphStyle(
        'Subtitle',
        parent=styles['Heading2'],
        fontSize=22,
        textColor=colors.HexColor('#1B5E20'),
        alignment=TA_CENTER,
        spaceAfter=10
    )))

    story.append(Spacer(1, 0.5*inch))

    fecha_actual = datetime.now()
    info_text = f"""
    <para align="center" fontSize="12" textColor="#666666">
    <b>Fecha de Generación:</b> {fecha_actual.strftime('%d de %B del %Y')}<br/>
    <b>Hora:</b> {fecha_actual.strftime('%H:%M:%S')}<br/>
    </para>
    """
    story.append(Paragraph(info_text, styles['Normal']))

    story.append(PageBreak())

    cultivos = Cultivo.query.filter_by(usuario_id=user_id).all()
    cultivos_activos = [c for c in cultivos if c.estado in ['Sembrado', 'Crecimiento', 'Floración', 'Maduración']]
    area_total = sum([float(c.area_hectareas) for c in cultivos])

    total_detecciones = db.session.query(db.func.count(DeteccionPlaga.id))\
        .join(Cultivo).filter(Cultivo.usuario_id == user_id).scalar() or 0

    costo_total_insumos = 0
    for cultivo in cultivos:
        insumos = Insumo.query.filter_by(cultivo_id=cultivo.id).all()
        costo_total_insumos += sum([float(i.costo_total) for i in insumos if i.costo_total])

    story.append(Paragraph("RESUMEN EJECUTIVO", subtitle_style))
    story.append(Spacer(1, 0.2*inch))

    metricas_data = [
        ['METRICA', 'VALOR', 'ESTADO'],
        ['Total de Cultivos', str(len(cultivos)), '[OK] Activo' if len(cultivos) > 0 else '[!] Vacio'],
        ['Cultivos en Produccion', str(len(cultivos_activos)), f'{(len(cultivos_activos)/len(cultivos)*100):.0f}%' if cultivos else '0%'],
        ['Area Total Cultivada', f'{area_total:.2f} ha', '[OK] Operativo'],
        ['Inversion Total', f'S/. {costo_total_insumos:,.2f}', '[$$] Registrado'],
        ['Detecciones de Plagas', str(total_detecciones), '[!] Monitoreando' if total_detecciones > 0 else '[OK] Sin plagas'],
    ]

    metricas_table = Table(metricas_data, colWidths=[4.5*cm, 3*cm, 4*cm])
    metricas_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2E7D32')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 15),
        ('TOPPADDING', (0, 0), (-1, 0), 15),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#F1F8E9'), colors.white]),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#DCEDC8')),
        ('BOX', (0, 0), (-1, -1), 2, colors.HexColor('#2E7D32')),
        ('TOPPADDING', (0, 1), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 10),
    ]))

    story.append(metricas_table)
    story.append(Spacer(1, 0.4*inch))

    story.append(Paragraph("ANÁLISIS Y RECOMENDACIONES", subtitle_style))
    story.append(Spacer(1, 0.2*inch))

    insights = []

    if len(cultivos) > 0:
        productividad = (len(cultivos_activos) / len(cultivos) * 100) if cultivos else 0
        if productividad >= 80:
            insights.append("<b>Excelente productividad:</b> Más del 80% de tus cultivos están en producción activa.")
        elif productividad >= 50:
            insights.append("<b>Productividad moderada:</b> Considera optimizar la rotación de cultivos para aumentar la producción.")
        else:
            insights.append("<b>Baja productividad:</b> Se recomienda revisar estrategias de siembra y mantenimiento.")

        if costo_total_insumos > 0:
            costo_por_hectarea = costo_total_insumos / area_total if area_total > 0 else 0
            insights.append(f"<b>Inversión promedio:</b> S/. {costo_por_hectarea:,.2f} por hectárea. {'Óptimo para agricultura intensiva.' if costo_por_hectarea > 1000 else 'Considerar aumentar inversión en insumos de calidad.'}")

        if total_detecciones > 0:
            tasa_plagas = total_detecciones / len(cultivos)
            if tasa_plagas > 2:
                insights.append(f"<b>ALERTA:</b> Alto nivel de detecciones de plagas ({total_detecciones} total). Se requiere plan de manejo integrado urgente.")
            else:
                insights.append(f"<b>Control de plagas:</b> Nivel manejable con {total_detecciones} detecciones. Mantener monitoreo preventivo.")
        else:
            insights.append("<b>Sin plagas detectadas:</b> Excelente estado sanitario de los cultivos.")

        tipos_unicos = len(set([c.tipo_cultivo for c in cultivos]))
        if tipos_unicos >= 4:
            insights.append(f"<b>Buena diversificación:</b> {tipos_unicos} tipos diferentes de cultivos reduce riesgos.")
        elif tipos_unicos <= 2:
            insights.append(f"<b>Baja diversificación:</b> Solo {tipos_unicos} tipos de cultivos. Considerar diversificar para reducir riesgos.")
    else:
        insights.append("<b>Sin cultivos registrados:</b> Comienza registrando tus primeros cultivos en el sistema.")

    for insight in insights:
        story.append(Paragraph(insight, info_style))
        story.append(Spacer(1, 0.15*inch))

    story.append(PageBreak())

    if len(cultivos) > 0:
        story.append(Paragraph("DETALLE DE CULTIVOS ACTIVOS", subtitle_style))
        story.append(Spacer(1, 0.2*inch))

        cultivos_data = [
            ['Nombre', 'Tipo', 'Área (ha)', 'Estado', 'Días desde siembra']
        ]

        for cultivo in cultivos[:10]:
            dias = (datetime.now().date() - cultivo.fecha_siembra).days if cultivo.fecha_siembra else 0
            cultivos_data.append([
                cultivo.nombre[:25],
                cultivo.tipo_cultivo,
                f"{float(cultivo.area_hectareas):.2f}",
                cultivo.estado,
                str(dias)
            ])

        cultivos_table = Table(cultivos_data, colWidths=[4.5*cm, 3.5*cm, 2.5*cm, 3*cm, 3*cm])
        cultivos_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1565C0')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('TOPPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#E3F2FD'), colors.white]),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#BBDEFB')),
            ('BOX', (0, 0), (-1, -1), 2, colors.HexColor('#1565C0')),
            ('TOPPADDING', (0, 1), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
        ]))

        story.append(cultivos_table)
        story.append(Spacer(1, 0.4*inch))

    if len(cultivos) > 0:
        temp_dir = 'uploads/temp_charts'
        os.makedirs(temp_dir, exist_ok=True)

        story.append(Paragraph("Análisis de Cultivos", subtitle_style))
        story.append(Spacer(1, 0.2*inch))

        chart1_path = os.path.join(temp_dir, f'cultivos_tipo_{user_id}.png')
        if crear_grafico_cultivos_por_tipo(cultivos, chart1_path):
            img1 = Image(chart1_path, width=5.5*inch, height=3.4*inch)
            story.append(img1)
            story.append(Spacer(1, 0.3*inch))

        chart2_path = os.path.join(temp_dir, f'area_tipo_{user_id}.png')
        if crear_grafico_area_por_tipo(cultivos, chart2_path):
            img2 = Image(chart2_path, width=5.5*inch, height=4.1*inch)
            story.append(img2)

        story.append(PageBreak())

        story.append(Paragraph("Estado Actual de Cultivos", subtitle_style))
        story.append(Spacer(1, 0.2*inch))

        chart3_path = os.path.join(temp_dir, f'estado_cultivos_{user_id}.png')
        if crear_grafico_estado_cultivos(cultivos, chart3_path):
            img3 = Image(chart3_path, width=5.5*inch, height=4.1*inch)
            story.append(img3)
            story.append(Spacer(1, 0.3*inch))

        chart4_path = os.path.join(temp_dir, f'costos_{user_id}.png')
        if crear_grafico_costos_por_cultivo(cultivos, chart4_path):
            story.append(PageBreak())
            story.append(Paragraph("Análisis Financiero", subtitle_style))
            story.append(Spacer(1, 0.2*inch))
            img4 = Image(chart4_path, width=5.5*inch, height=4.5*inch)
            story.append(img4)

    doc.build(story, canvasmaker=NumerosPagina)

    return True
