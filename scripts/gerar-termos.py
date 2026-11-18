"""Gera o PDF versionado distribuído pela API do Nutri4You."""

from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph, SimpleDocTemplate


ROOT = Path(__file__).resolve().parent.parent
DESTINO = ROOT / 'backend/src/main/resources/privacidade/termos-2026-11-16.2.pdf'
fontes = [
    (Path('C:/Windows/Fonts/arial.ttf'), Path('C:/Windows/Fonts/arialbd.ttf')),
    (Path('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'), Path('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf')),
]
regular, negrito = next((par for par in fontes if all(arquivo.is_file() for arquivo in par)), (None, None))
if regular is None:
    raise SystemExit('Instale as fontes Arial ou DejaVu Sans para gerar o documento.')
pdfmetrics.registerFont(TTFont('NutriSans', str(regular)))
pdfmetrics.registerFont(TTFont('NutriSans-Bold', str(negrito)))

estilos = getSampleStyleSheet()
titulo = ParagraphStyle('TituloNutri', parent=estilos['Title'], fontName='NutriSans-Bold',
                         fontSize=19, leading=25, textColor=colors.HexColor('#006f1e'), spaceAfter=6)
subtitulo = ParagraphStyle('SubtituloNutri', fontName='NutriSans', fontSize=9, leading=14,
                            textColor=colors.HexColor('#64748b'), spaceAfter=20)
secao = ParagraphStyle('SecaoNutri', fontName='NutriSans-Bold', fontSize=11, leading=16,
                       textColor=colors.HexColor('#17391f'), spaceBefore=9, spaceAfter=5, keepWithNext=True)
corpo = ParagraphStyle('CorpoNutri', fontName='NutriSans', fontSize=9.5, leading=15,
                       textColor=colors.HexColor('#26352c'), spaceAfter=7)

conteudo = [
    ('Uso da plataforma', 'O Nutri4You permite agendar consultas e acompanhar atendimentos nutricionais. Use uma conta individual, mantenha suas credenciais em sigilo e informe dados corretos. O sistema não substitui avaliação profissional ou serviços de urgência.'),
    ('Tratamento de dados', 'O sistema trata dados cadastrais e de contato para operar a conta e a agenda. Medidas, anamnese, exames, prescrições e demais informações clínicas são dados sensíveis tratados para atendimento e acompanhamento nutricional. O acesso deve ser limitado a quem precisar dos dados para a finalidade informada.'),
    ('Vínculo e acompanhamento', 'Ao solicitar vínculo ou aceitar um convite, o paciente autoriza o vínculo operacional com o profissional identificado. O vínculo pode ser encerrado em Dados pessoais. O encerramento não é um pedido de eliminação do prontuário. Dados clínicos podem ser conservados para cumprir obrigações legais ou regulatórias. O paciente continua com acesso aos seus dados e à dieta publicada durante a vigência.'),
    ('Google Agenda', 'Se o usuário escolher abrir um evento no Google Agenda, os dados exibidos no evento serão enviados ao Google. O uso desse recurso é opcional.'),
    ('Contato e direitos do titular', 'Para dúvidas sobre o sistema e seus dados pessoais, entre em contato com a informática da UFPR pelo e-mail suporte@ufpr.br. Para exercer direitos de titular perante a UFPR, consulte as orientações em https://ufpr.br/lgpd/direitos-do-titular/. A eliminação depende da finalidade, da base legal e das obrigações de conservação aplicáveis.'),
    ('Referências', 'Lei nº 13.709/2018 (LGPD), Lei nº 13.787/2018 e Resolução CFN nº 594/2017.'),
]

documento = SimpleDocTemplate(str(DESTINO), pagesize=A4, leftMargin=24 * mm, rightMargin=24 * mm,
                               topMargin=20 * mm, bottomMargin=20 * mm, title='Nutri4You - Termos de uso e aviso de privacidade', author='Nutri4You')
elementos = [Paragraph('Nutri4You', titulo), Paragraph('Termos de uso e aviso de privacidade | Versão 2026-11-16.2', subtitulo)]
for cabecalho, texto in conteudo:
    elementos.extend([Paragraph(escape(cabecalho), secao), Paragraph(escape(texto), corpo)])

def desenhar_rodape(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor('#dbe7de'))
    canvas.line(24 * mm, 16 * mm, A4[0] - 24 * mm, 16 * mm)
    canvas.setFont('NutriSans', 8)
    canvas.setFillColor(colors.HexColor('#64748b'))
    canvas.drawCentredString(A4[0] / 2, 10 * mm, f'Nutri4You | Termos de uso e privacidade | {doc.page}')
    canvas.restoreState()

documento.build(elementos, onFirstPage=desenhar_rodape, onLaterPages=desenhar_rodape)
print(DESTINO)
