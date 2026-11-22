"""Gera o PDF distribuído pela API a partir do texto da versão informada."""

import argparse
import re
from functools import partial
from pathlib import Path
from xml.sax.saxutils import escape, quoteattr

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate


ROOT = Path(__file__).resolve().parents[1]
RECURSOS = ROOT / 'backend/src/main/resources/privacidade'
LOGO = ROOT / 'web/public/auth/logo-nutri4u.webp'
MARGEM = 22 * mm
VERDE = colors.HexColor('#005414')
TEXTO = colors.HexColor('#223128')
SECUNDARIA = colors.HexColor('#53625a')
LINHA = colors.HexColor('#dbe7de')
FONTES = (
    (Path('C:/Windows/Fonts'), 'arial.ttf', 'arialbd.ttf'),
    (Path('/usr/share/fonts/truetype/dejavu'), 'DejaVuSans.ttf', 'DejaVuSans-Bold.ttf'),
)
LINK = re.compile(r'\[([^\]]+)\]\((https://[^\s)]+)\)')


def registrar_fontes():
    for pasta, regular, negrito in FONTES:
        if (pasta / regular).is_file() and (pasta / negrito).is_file():
            pdfmetrics.registerFont(TTFont('NutriSans', str(pasta / regular)))
            pdfmetrics.registerFont(TTFont('NutriSans-Bold', str(pasta / negrito)))
            return
    raise SystemExit('Instale as fontes Arial ou DejaVu Sans para gerar o documento.')


CORPO = ParagraphStyle('Corpo', fontName='NutriSans', fontSize=10.5, leading=15,
                       textColor=TEXTO, spaceAfter=8, splitLongWords=False)
TITULO = ParagraphStyle('Titulo', parent=CORPO, fontName='NutriSans-Bold', fontSize=23,
                        leading=28, textColor=VERDE, spaceAfter=13, keepWithNext=True)
SECAO = ParagraphStyle('Secao', parent=CORPO, fontName='NutriSans-Bold', fontSize=12,
                       leading=17, textColor=VERDE, spaceBefore=7, spaceAfter=5,
                       keepWithNext=True)
ITEM = ParagraphStyle('Item', parent=CORPO, leftIndent=13, bulletIndent=1, spaceAfter=5)
AVISO = ParagraphStyle('Aviso', parent=CORPO, fontName='NutriSans-Bold', fontSize=10,
                       leading=14, backColor=colors.HexColor('#edf5ee'), borderPadding=9,
                       spaceBefore=5, spaceAfter=14)


def formatar_links(texto):
    partes = []
    inicio = 0
    for link in LINK.finditer(texto):
        partes.append(escape(texto[inicio:link.start()]))
        rotulo, url = link.groups()
        partes.append(f'<link href={quoteattr(url)} color="#005414"><u>{escape(rotulo)}</u></link>')
        inicio = link.end()
    partes.append(escape(texto[inicio:]))
    return ''.join(partes)


def montar_conteudo(texto):
    elementos = []
    for bloco in re.split(r'\n\s*\n', texto.strip()):
        if bloco == '---':
            elementos.append(PageBreak())
        elif bloco.startswith('## '):
            elementos.append(Paragraph(escape(bloco[3:]), SECAO))
        elif bloco.startswith('# '):
            elementos.append(Paragraph(escape(bloco[2:]), TITULO))
        elif bloco.startswith('! '):
            elementos.append(Paragraph(escape(bloco[2:]), AVISO))
        elif bloco.startswith('- '):
            for linha in bloco.splitlines():
                elementos.append(Paragraph(formatar_links(linha.removeprefix('- ')), ITEM, bulletText='•'))
        else:
            elementos.append(Paragraph(formatar_links(bloco), CORPO))
    return elementos


def decoracao_pagina(canvas, documento, *, logo):
    largura, altura = A4
    largura_logo = 34 * mm
    largura_original, altura_original = logo.getSize()
    altura_logo = largura_logo * altura_original / largura_original
    canvas.saveState()
    canvas.setStrokeColor(LINHA)
    canvas.line(MARGEM, altura - 17 * mm, largura - MARGEM, altura - 17 * mm)
    canvas.line(MARGEM, 16 * mm, largura - MARGEM, 16 * mm)
    canvas.drawImage(logo, MARGEM, altura - 15 * mm, largura_logo, altura_logo, mask='auto')
    canvas.setFillColor(SECUNDARIA)
    canvas.setFont('NutriSans', 8)
    canvas.drawRightString(largura - MARGEM, altura - 13 * mm, 'TERMOS E PRIVACIDADE')
    canvas.drawString(MARGEM, 11 * mm, f'Versão {documento.versao} | Para revisão')
    canvas.drawRightString(largura - MARGEM, 11 * mm, str(documento.page))
    canvas.restoreState()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('versao', help='Versão usada nos nomes dos arquivos .txt e .pdf')
    args = parser.parse_args()
    if not re.fullmatch(r'\d{4}-\d{2}-\d{2}(?:\.\d+)?', args.versao):
        parser.error('Informe a versão no formato AAAA-MM-DD ou AAAA-MM-DD.N.')

    registrar_fontes()
    fonte = RECURSOS / f'termos-{args.versao}.txt'
    destino = fonte.with_suffix('.pdf')
    documento = SimpleDocTemplate(str(destino), pagesize=A4, leftMargin=MARGEM, rightMargin=MARGEM,
                                   topMargin=23 * mm, bottomMargin=21 * mm,
                                   title='Nutri4You - Termos de uso e aviso de privacidade',
                                   author='Nutri4You', invariant=True)
    documento.versao = args.versao
    desenhar_pagina = partial(decoracao_pagina, logo=ImageReader(str(LOGO)))
    documento.build(montar_conteudo(fonte.read_text(encoding='utf-8')),
                    onFirstPage=desenhar_pagina, onLaterPages=desenhar_pagina)
    print(destino)


if __name__ == '__main__':
    main()
