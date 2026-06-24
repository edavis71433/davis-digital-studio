import json
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, PageBreak,
    Table, TableStyle, HRFlowable)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT
import re

PURPLE = colors.HexColor('#5b3fa0')
INK = colors.HexColor('#1a1523')
GREY = colors.HexColor('#6b6478')
CREAM = colors.HexColor('#faf8f5')
LILAC = colors.HexColor('#ede8f7')

data = json.load(open('site_copy.json', encoding='utf-8'))

# friendly URL from filename
def url_for(fn):
    slug = fn.replace('.html','')
    if slug == 'index': return 'davisdigitalstudio.com/'
    return f'davisdigitalstudio.com/{slug}'

# nice page name order: put main pages first
ORDER = ['index.html','about.html','services.html','web-design.html','seo-strategy.html',
         'monthly-retainer.html','work.html','contact.html',
         'restaurant-web-design.html','salon-web-design.html','retail-web-design.html',
         'health-wellness-web-design.html','home-services-web-design.html',
         'tools.html','ai-critique.html','audit.html','speed-test.html',
         'local-visibility.html','pricing-estimator.html','roi-calculator.html','report-card.html',
         'privacy.html','terms.html','accessibility.html']
data.sort(key=lambda d: ORDER.index(d['file']) if d['file'] in ORDER else 999)

styles = getSampleStyleSheet()
H1 = ParagraphStyle('H1', parent=styles['Heading1'], fontName='Helvetica-Bold',
    fontSize=20, textColor=PURPLE, spaceAfter=2, spaceBefore=0, leading=24)
URL = ParagraphStyle('URL', parent=styles['Normal'], fontName='Helvetica',
    fontSize=10, textColor=GREY, spaceAfter=10)
METALAB = ParagraphStyle('METALAB', parent=styles['Normal'], fontName='Helvetica-Bold',
    fontSize=8, textColor=PURPLE, spaceAfter=1)
META = ParagraphStyle('META', parent=styles['Normal'], fontName='Helvetica-Oblique',
    fontSize=9.5, textColor=INK, spaceAfter=12, leading=13, backColor=LILAC,
    borderPadding=(6,8,6,8))
HEAD = ParagraphStyle('HEAD', parent=styles['Normal'], fontName='Helvetica-Bold',
    fontSize=13, textColor=INK, spaceBefore=10, spaceAfter=3, leading=16)
SUBHEAD = ParagraphStyle('SUBHEAD', parent=styles['Normal'], fontName='Helvetica-Bold',
    fontSize=11, textColor=PURPLE, spaceBefore=7, spaceAfter=2, leading=14)
BODY = ParagraphStyle('BODY', parent=styles['Normal'], fontName='Helvetica',
    fontSize=10, textColor=INK, spaceAfter=5, leading=14)
LISTITEM = ParagraphStyle('LIST', parent=BODY, leftIndent=14, spaceAfter=3,
    bulletIndent=2)
TOC = ParagraphStyle('TOC', parent=styles['Normal'], fontName='Helvetica',
    fontSize=10.5, textColor=INK, spaceAfter=4, leading=15)
COVERT = ParagraphStyle('COVERT', parent=styles['Normal'], fontName='Helvetica-Bold',
    fontSize=30, textColor=INK, spaceAfter=6, leading=34)
COVERS = ParagraphStyle('COVERS', parent=styles['Normal'], fontName='Helvetica-Oblique',
    fontSize=13, textColor=GREY, spaceAfter=4, leading=18)

def esc(t):
    return t.replace('&','&amp;').replace('<','&lt;').replace('>','&gt;')

story=[]

# COVER
story.append(Spacer(1, 1.6*inch))
story.append(Paragraph('DAVIS DIGITAL STUDIO', ParagraphStyle('brand',parent=styles['Normal'],
    fontName='Helvetica-Bold',fontSize=13,textColor=PURPLE,spaceAfter=4)))
story.append(HRFlowable(width="100%", thickness=2, color=PURPLE, spaceAfter=14))
story.append(Paragraph('Full Site Copy', COVERT))
story.append(Paragraph('Every page, every word — for review and editing', COVERS))
story.append(Spacer(1,10))
story.append(Paragraph('24 pages of content, organized page by page. Each page shows its URL, '
    'the SEO title and meta description (highlighted), then the full body copy in reading order. '
    'Mark up anything you want changed and send it back.', BODY))
story.append(Spacer(1,6))
story.append(Paragraph('Note: navigation menus, footers, and repeated buttons are omitted so you '
    'see only the real content of each page. Interactive tool results (calculators, score widgets) '
    'show their labels and copy, not live output.', ParagraphStyle('notesm',parent=BODY,fontSize=9,textColor=GREY)))
story.append(Paragraph('Generated June 24, 2026', ParagraphStyle('date',parent=BODY,
    textColor=GREY,spaceBefore=12)))
story.append(PageBreak())

# TABLE OF CONTENTS
story.append(Paragraph('Contents', H1))
story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#d9d3e0'), spaceAfter=10))
for i,d in enumerate(data,1):
    label = d['title'].split('|')[0].strip()
    story.append(Paragraph(f'{i}.&nbsp;&nbsp;{esc(label)} &nbsp;<font color="#6b6478">— {esc(url_for(d["file"]))}</font>', TOC))
story.append(PageBreak())

# PAGES
for i,d in enumerate(data,1):
    label = d['title'].split('|')[0].strip()
    story.append(Paragraph(f'{i}. {esc(label)}', H1))
    story.append(Paragraph(esc(url_for(d['file'])), URL))
    # SEO title + meta as a highlighted box
    story.append(Paragraph('SEO TITLE TAG', METALAB))
    story.append(Paragraph(esc(d['title']), ParagraphStyle('t',parent=BODY,spaceAfter=6)))
    if d['meta']:
        story.append(Paragraph('META DESCRIPTION', METALAB))
        story.append(Paragraph(esc(d['meta']), META))
    story.append(HRFlowable(width="100%", thickness=0.7, color=colors.HexColor('#d9d3e0'), spaceAfter=8))
    # body blocks
    for tag, txt in d['blocks']:
        # skip if it's just the page title repeated
        if txt.strip() == label: continue
        t = esc(txt)
        if tag in ('h1','h2'):
            story.append(Paragraph(t, HEAD))
        elif tag in ('h3','h4'):
            story.append(Paragraph(t, SUBHEAD))
        elif tag == 'li':
            story.append(Paragraph(f'•&nbsp;&nbsp;{t}', LISTITEM))
        else:
            story.append(Paragraph(t, BODY))
    story.append(PageBreak())

doc = SimpleDocTemplate('/home/claude/Davis-Digital-Studio-Site-Copy.pdf', pagesize=letter,
    topMargin=0.8*inch, bottomMargin=0.7*inch, leftMargin=0.85*inch, rightMargin=0.85*inch,
    title='Davis Digital Studio — Full Site Copy')
doc.build(story)
print("PDF built")
