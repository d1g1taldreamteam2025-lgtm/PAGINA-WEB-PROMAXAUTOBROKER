#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Genera el contrato Promax/UCallNow en PDF (1 página) — ES e EN."""
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                TableStyle, HRFlowable)
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY

INK = colors.HexColor("#0d0f12")

DOCS = {
 "EN": {
  "file": "docs/Website-Agreement-Promax-UCallNow-EN.pdf",
  "title": "WEBSITE DEVELOPMENT AGREEMENT",
  "intro": ('This Website Development Agreement (the &ldquo;Agreement&rdquo;) is entered into on '
            '<b>June 18, 2026</b> (the &ldquo;Effective Date&rdquo;) by and between '
            '<b>UCallNow</b>, represented by <b>Juan Jos&eacute; Ochoa Pedroza</b> (the &ldquo;Provider&rdquo;), and '
            '<b>Promax Auto Broker</b>, represented by <b>Joel Jorda</b> (the &ldquo;Client&rdquo;).'),
  "sections": [
   ("1. Scope of Work.",
    "Provider will design, develop and deliver a complete, responsive, bilingual (Spanish / English) "
    "website for Client, including: Home; Inventory with search and filters; individual Vehicle detail "
    "pages; Financing information and an online credit application; About; Contact (form and map); FAQs; "
    "legal pages (Privacy, Terms, Sitemap, Accessibility); WhatsApp and chat integration; lead-capture "
    "forms; and an internal Referrals module &mdash; a form where the team registers referrals and whose "
    "entries are stored privately in a Google Sheet. Source code is hosted on GitHub."),
   ("2. Timeline.",
    "Provider will deliver the website within three and one-half (3.5) weeks of the Effective Date "
    "(on or about July 13, 2026), conditioned upon Client&rsquo;s timely delivery of required materials "
    "(logo, photographs, content and approvals)."),
   ("3. Fee &amp; Payment.",
    "The total fee is <b>US $750</b>, payable in three (3) installments: (1) at signing / start; "
    "(2) at the project midpoint; and (3) upon completion and delivery."),
   ("4. Ownership, Hosting &amp; No Lock-In.",
    "Upon receipt of final payment, all rights and the source code of the website transfer to Client. "
    "The website may remain hosted on Provider&rsquo;s infrastructure; if the Client wishes to migrate, "
    "Provider will deliver the complete source code so the Client can host it on its own server and "
    "domain. There is no permanence and no recurring obligation: the Client may take the deliverables and "
    "leave at any time. All rights remain reserved by Provider until final payment is received."),
   ("5. Optional Add-Ons.",
    "Elected at Client&rsquo;s sole discretion and <b>not</b> included in the base fee. "
    "<b>(a) Monthly Maintenance &mdash; US $20/month:</b> monitoring, site updates, domain renewal, and "
    "operation of the automations of the Referrals module (form &rarr; private Google Sheet); cancellable "
    "at any time. <b>(b) UCallNow Plan &mdash; US $129:</b> automatic publishing of Client&rsquo;s inventory "
    "to Facebook Marketplace via Provider&rsquo;s auto-publisher, plus a vehicle-import tool that captures "
    "vehicles from Client-specified websites and uploads them to Client&rsquo;s site with a single click "
    "(Client to specify the source websites)."),
   ("6. General.",
    "The parties act in good faith and in compliance with applicable United States law. This document "
    "constitutes the entire agreement between the parties and supersedes any prior discussions."),
  ],
  "sig_provider": ["Juan Jos&eacute; Ochoa Pedroza", "UCallNow &mdash; Provider"],
  "sig_client": ["Joel Jorda", "Promax Auto Broker &mdash; Client"],
  "date_label": "Date:",
 },
 "ES": {
  "file": "docs/Contrato-Promax-UCallNow-ES.pdf",
  "title": "CONTRATO DE DESARROLLO DE PÁGINA WEB",
  "intro": ('El presente Contrato de Desarrollo de P&aacute;gina Web (el &ldquo;Contrato&rdquo;) se celebra el '
            '<b>18 de junio de 2026</b> (la &ldquo;Fecha de Inicio&rdquo;) entre '
            '<b>UCallNow</b>, representada por <b>Juan Jos&eacute; Ochoa Pedroza</b> (el &ldquo;Proveedor&rdquo;), y '
            '<b>Promax Auto Broker</b>, representada por <b>Joel Jorda</b> (el &ldquo;Cliente&rdquo;).'),
  "sections": [
   ("1. Alcance.",
    "El Proveedor dise&ntilde;ar&aacute;, desarrollar&aacute; y entregar&aacute; un sitio web completo, responsivo y biling&uuml;e "
    "(espa&ntilde;ol / ingl&eacute;s) para el Cliente, que incluye: Inicio; Inventario con b&uacute;squeda y filtros; p&aacute;ginas "
    "de detalle de cada veh&iacute;culo; informaci&oacute;n de Financiamiento y solicitud de cr&eacute;dito en l&iacute;nea; Nosotros; "
    "Contacto (formulario y mapa); Preguntas Frecuentes; p&aacute;ginas legales (Privacidad, T&eacute;rminos, Mapa del "
    "Sitio, Accesibilidad); integraci&oacute;n de WhatsApp y chat; formularios de captura de clientes; y un m&oacute;dulo "
    "interno de Referidos &mdash; un formulario donde el equipo registra los referidos y cuyas entradas se "
    "guardan de forma privada en una hoja de Google (Google Sheets). El c&oacute;digo fuente se aloja en GitHub."),
   ("2. Plazo de Entrega.",
    "El Proveedor entregar&aacute; el sitio web en un plazo de tres semanas y media (3.5) desde la Fecha de Inicio "
    "(aproximadamente el 13 de julio de 2026), sujeto a la entrega oportuna por parte del Cliente de los "
    "materiales requeridos (logo, fotograf&iacute;as, contenido y aprobaciones)."),
   ("3. Precio y Pago.",
    "El precio total es de <b>US $750</b>, pagadero en tres (3) plazos: (1) a la firma / inicio; "
    "(2) a la mitad del proyecto; y (3) a la finalizaci&oacute;n y entrega."),
   ("4. Propiedad, Alojamiento y Sin Permanencia.",
    "Al recibir el pago final, todos los derechos y el c&oacute;digo fuente del sitio se transfieren al Cliente. "
    "El sitio puede permanecer alojado en la infraestructura del Proveedor; si el Cliente desea migrar, el "
    "Proveedor le entrega el c&oacute;digo fuente completo para alojarlo en su propio servidor y dominio. No "
    "existe permanencia ni obligaci&oacute;n recurrente: el Cliente puede llevarse los entregables y retirarse en "
    "cualquier momento. Todos los derechos quedan reservados por el Proveedor hasta recibir el pago final."),
   ("5. Complementos Opcionales.",
    "A elecci&oacute;n exclusiva del Cliente y <b>no</b> incluidos en el precio base. "
    "<b>(a) Mantenimiento Mensual &mdash; US $20/mes:</b> monitoreo, actualizaciones del sitio, renovaci&oacute;n del "
    "dominio y el funcionamiento de las automatizaciones del m&oacute;dulo de Referidos (formulario &rarr; Google "
    "Sheet privado); cancelable en cualquier momento. <b>(b) Plan UCallNow &mdash; US $129:</b> publicaci&oacute;n "
    "autom&aacute;tica del inventario del Cliente en Facebook Marketplace mediante el autopublicador del Proveedor, "
    "m&aacute;s una herramienta de importaci&oacute;n que captura veh&iacute;culos de los sitios web que el Cliente indique y "
    "los sube a su sitio con un solo clic (el Cliente debe indicar los sitios de origen)."),
   ("6. Generales.",
    "Las partes act&uacute;an de buena fe y en cumplimiento de la legislaci&oacute;n aplicable de los Estados Unidos. "
    "Este documento constituye el acuerdo completo entre las partes y reemplaza cualquier conversaci&oacute;n previa."),
  ],
  "sig_provider": ["Juan Jos&eacute; Ochoa Pedroza", "UCallNow &mdash; Proveedor"],
  "sig_client": ["Joel Jorda", "Promax Auto Broker &mdash; Cliente"],
  "date_label": "Fecha:",
 },
}

def build(spec):
    styles = {
        "title": ParagraphStyle("title", fontName="Helvetica-Bold", fontSize=14,
                                 textColor=INK, alignment=TA_CENTER, leading=16),
        "intro": ParagraphStyle("intro", fontName="Helvetica", fontSize=8.9,
                                 textColor=INK, alignment=TA_JUSTIFY, leading=11.8, spaceAfter=7),
        "body": ParagraphStyle("body", fontName="Helvetica", fontSize=8.7,
                               textColor=INK, alignment=TA_JUSTIFY, leading=11.6, spaceAfter=6),
        "sig": ParagraphStyle("sig", fontName="Helvetica-Bold", fontSize=9, textColor=INK, leading=12),
        "sigsub": ParagraphStyle("sigsub", fontName="Helvetica", fontSize=8, textColor=colors.HexColor("#5b6b7c"), leading=11),
    }
    story = []
    story.append(Paragraph(spec["title"], styles["title"]))
    story.append(HRFlowable(width="100%", thickness=0.6, color=colors.HexColor("#c9ced6"), spaceBefore=5, spaceAfter=9))
    story.append(Paragraph(spec["intro"], styles["intro"]))
    for head, body in spec["sections"]:
        story.append(Paragraph("<b>%s</b> %s" % (head, body), styles["body"]))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=0.6, color=colors.HexColor("#c9ced6"), spaceAfter=13))

    def sig_cell(lines):
        return [
            Paragraph("_______________________________", styles["sig"]),
            Paragraph(lines[0], styles["sig"]),
            Paragraph(lines[1], styles["sigsub"]),
            Paragraph(spec["date_label"] + " ____________________", styles["sigsub"]),
        ]
    data = [[sig_cell(spec["sig_provider"]), sig_cell(spec["sig_client"])]]
    tbl = Table(data, colWidths=[3.1*inch, 3.1*inch])
    tbl.setStyle(TableStyle([
        ("VALIGN", (0,0), (-1,-1), "TOP"),
        ("LEFTPADDING", (0,0), (-1,-1), 0),
        ("RIGHTPADDING", (0,0), (-1,-1), 12),
        ("TOPPADDING", (0,0), (-1,-1), 0),
        ("BOTTOMPADDING", (0,0), (-1,-1), 2),
    ]))
    story.append(tbl)

    doc = SimpleDocTemplate(spec["file"], pagesize=letter,
                            leftMargin=0.8*inch, rightMargin=0.8*inch,
                            topMargin=0.65*inch, bottomMargin=0.55*inch,
                            title="Promax Auto Broker - UCallNow Agreement", author="UCallNow")
    doc.build(story)
    return spec["file"], doc.page

for lang, spec in DOCS.items():
    f, pages = build(spec)
    print("%s -> %s  (paginas: %d)" % (lang, f, pages))
