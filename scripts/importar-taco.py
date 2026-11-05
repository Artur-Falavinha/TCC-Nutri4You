"""Gera V13 a partir da planilha oficial TACO/NEPA-UNICAMP, 4a edicao (2011).

Uso: python scripts/importar-taco.py caminho/taco.xlsx [--check]
Requer openpyxl. Fonte: https://nepa.unicamp.br/publicacoes/tabela-taco-excel/
O arquivo oficial pode ficar fora do repositorio ou em backend/target.
"""
import argparse
import hashlib
import unicodedata
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

import openpyxl

SHA256 = "a66b8ec528daeabc63bc2b015fc9bd8c6d76b941c2fc0ed93a4311d449302d14"
OUTPUT = Path(__file__).resolve().parents[1] / "backend/src/main/resources/db/migration/V13__catalogo_taco.sql"


def texto(valor):
    return "'" + str(valor).replace("'", "''") + "'"


def normalizar(valor):
    sem_acentos = "".join(c for c in unicodedata.normalize("NFD", valor.lower()) if not unicodedata.combining(c))
    return " ".join("".join(c if c.isalnum() else " " for c in sem_acentos).split())


def nutriente(valor):
    # Tr nao e zero: a publicacao nao fornece quantidade numerica mensuravel.
    if valor is None or str(valor).strip() in {"Tr", "NA", "*"}:
        return "NULL"
    numero = Decimal(str(valor))
    # Quatro carboidratos calculados por diferenca sao negativos na planilha.
    # Preservar como desconhecido, sem introduzir porcoes negativas ou inventar zero.
    if numero.is_finite() and numero < 0:
        return "NULL"
    numero = numero.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    if not numero.is_finite() or numero > Decimal("9999.99"):
        raise ValueError(f"Nutriente invalido: {valor}")
    return str(numero)


def gerar(arquivo):
    if hashlib.sha256(arquivo.read_bytes()).hexdigest() != SHA256:
        raise ValueError("Planilha diferente da fonte revisada; revise a origem antes de gerar outra migration.")
    planilha = openpyxl.load_workbook(arquivo, read_only=True, data_only=True).worksheets[0]
    categoria = None
    registros = {}
    for linha in planilha.values:
        codigo, nome = linha[:2]
        if isinstance(codigo, str) and nome is None and codigo not in {"Número do", "Legenda"}:
            categoria = codigo.strip()
        if not isinstance(codigo, (int, float)):
            continue
        if int(codigo) != codigo or codigo in registros or not categoria or not nome:
            raise ValueError(f"Linha invalida: {linha[:9]}")
        valores = [str(int(codigo)), texto(categoria), texto(nome.strip()), texto(normalizar(nome))]
        valores += [nutriente(linha[i]) for i in [3, 5, 8, 6]]
        registros[int(codigo)] = "(" + ", ".join(valores) + ")"
    if set(registros) != set(range(1, 598)):
        raise ValueError("Esperados os 597 codigos unicos da TACO, de 1 a 597.")
    return """-- TACO, 4a edicao revisada e ampliada, NEPA/UNICAMP, Campinas, 2011.
-- Fonte: https://nepa.unicamp.br/publicacoes/tabela-taco-excel/
-- Reproducao com citacao da fonte, conforme a publicacao.
-- SHA256 da planilha: """ + SHA256 + """
-- Gerado por scripts/importar-taco.py. Quantidades por 100 g, HALF_UP a 2 casas.
-- Tr, NA, *, celulas vazias: NULL (nao converter ausencias/tracos em zero).
-- Carboidratos negativos da fonte (288, 322, 337, 400): NULL, pendentes de revisao.
-- Registros legados permanecem intactos para preservar refeicoes existentes.
ALTER TABLE Alimento ADD COLUMN codigo_taco INT UNIQUE;
ALTER TABLE Alimento ADD COLUMN nome_busca VARCHAR(150) NOT NULL DEFAULT '';
ALTER TABLE Alimento ADD COLUMN disponivel_para_prescricao BOOLEAN NOT NULL DEFAULT TRUE;
UPDATE Alimento SET nome_busca = trim(regexp_replace(translate(lower(nome),
    'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc'), '[^a-z0-9]+', ' ', 'g'));

-- Apenas os cinco exemplos originais deixam a busca; IDs, nutrientes e FKs nao mudam.
UPDATE Alimento SET disponivel_para_prescricao = FALSE
WHERE (nome, kcal_100g, proteina_100g, carboidratos_100g) IN (
    ('Arroz branco cozido', 128.00, 2.50, 28.10),
    ('Feijão carioca cozido', 76.00, 4.80, 13.60),
    ('Peito de frango grelhado', 159.00, 32.00, 0.00),
    ('Ovo de galinha cozido', 146.00, 13.30, 0.60),
    ('Banana prata', 98.00, 1.30, 26.00)
);

INSERT INTO Alimento (codigo_taco, categoria, nome, nome_busca, kcal_100g, proteina_100g, carboidratos_100g, gordura_100g) VALUES
""" + ",\n".join(registros[codigo] for codigo in sorted(registros)) + ";\n"


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("planilha", type=Path)
    parser.add_argument("--check", action="store_true", help="Confere a migration sem alterar arquivos")
    args = parser.parse_args()
    sql = gerar(args.planilha)
    if args.check:
        if OUTPUT.read_text(encoding="utf-8") != sql:
            raise SystemExit("A migration difere da fonte oficial.")
        print("PASS: 597 alimentos conferidos com a planilha oficial.")
    else:
        OUTPUT.write_text(sql, encoding="utf-8", newline="\n")
        print(f"597 alimentos: {OUTPUT}")
