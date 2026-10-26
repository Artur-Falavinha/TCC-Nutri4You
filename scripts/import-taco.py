import argparse
import hashlib
import math
import unicodedata
from collections import Counter
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

import openpyxl


SOURCE_URL = "https://nepa.unicamp.br/publicacoes/tabela-taco-excel/"
SOURCE_SHA256 = "a66b8ec528daeabc63bc2b015fc9bd8c6d76b941c2fc0ed93a4311d449302d14"
NUTRIENTS = ((3, "energia"), (5, "proteínas"), (8, "carboidratos"), (6, "gorduras"))


def sql_text(value):
    if value is None:
        return "NULL"
    return "'" + value.replace("'", "''") + "'"


def search_name(value):
    decomposed = unicodedata.normalize("NFKD", value)
    return " ".join("".join(char for char in decomposed if not unicodedata.combining(char)).lower().split())


def nutrient(value, carbohydrate=False):
    if value in ("NA", "Tr"):
        return "0.000000"
    if value is None or value == "*":
        return "NULL"
    if carbohydrate and isinstance(value, (int, float)) and -0.05 < value < 0:
        return "0.000000"
    if not isinstance(value, (int, float)) or not math.isfinite(value) or value < 0:
        raise ValueError(f"Valor nutricional inesperado: {value!r}")
    return str(Decimal(str(value)).quantize(Decimal("0.000001"), rounding=ROUND_HALF_UP))


def source_notes(row):
    notes = []
    descriptions = (
        ("NA", "Não aplicável (NA), considerado zero para cálculo"),
        ("Tr", "Traços (Tr), aproximados por zero para cálculo"),
        ("*", "Análises em reavaliação (*)"),
        (None, "Análises não solicitadas"),
    )
    for marker, description in descriptions:
        names = [name for index, name in NUTRIENTS if row[index] == marker]
        if names:
            notes.append(f"{description}: {', '.join(names)}.")
    if isinstance(row[8], (int, float)) and row[8] < 0:
        notes.append("Resíduo negativo de carboidratos na planilha, arredondado para zero.")
    return " ".join(notes) or None


def read_foods(source):
    digest = hashlib.sha256(source.read_bytes()).hexdigest()
    if digest != SOURCE_SHA256:
        raise ValueError("A planilha não corresponde à versão oficial validada; revise a fonte antes de importar.")
    workbook = openpyxl.load_workbook(source, data_only=True, read_only=True)
    category = None
    foods = []
    for row in workbook.worksheets[0].iter_rows(values_only=True):
        code, name = row[:2]
        if isinstance(code, str) and name is None and code.strip() not in ("Número do", "Legenda"):
            category = code.strip()
        if not isinstance(code, int):
            continue
        if category is None or not isinstance(name, str):
            raise ValueError(f"Alimento sem categoria ou nome: {code}")
        values = [nutrient(row[index], carbohydrate=index == 8) for index, _ in NUTRIENTS]
        foods.append((code, name.strip(), category, values, source_notes(row)))
    workbook.close()
    if len(foods) != 597 or {food[0] for food in foods} != set(range(1, 598)):
        raise ValueError("O catálogo deve conter exatamente os 597 códigos oficiais, sem duplicatas.")
    if len(Counter(food[2] for food in foods)) != 15:
        raise ValueError("As categorias da fonte oficial não correspondem às 15 esperadas.")
    return foods


def migration(foods):
    header = f"""-- Fonte: NEPA/UNICAMP, TACO, 4ª edição revisada e ampliada (2011).
-- {SOURCE_URL}
-- SHA-256 da planilha oficial: {SOURCE_SHA256}
-- Reprodução permitida pela publicação mediante citação da fonte.
-- NA e Tr mantêm suas observações; valores em reavaliação ou ausentes não são inventados.

ALTER TABLE Alimento ADD COLUMN codigo_taco INTEGER UNIQUE;
ALTER TABLE Alimento ADD COLUMN gordura_100g DECIMAL(12,6);
ALTER TABLE Alimento ALTER COLUMN kcal_100g TYPE DECIMAL(12,6);
ALTER TABLE Alimento ALTER COLUMN proteina_100g TYPE DECIMAL(12,6);
ALTER TABLE Alimento ALTER COLUMN carboidratos_100g TYPE DECIMAL(12,6);
ALTER TABLE Alimento ADD COLUMN nome_busca VARCHAR(150);
ALTER TABLE Alimento ADD COLUMN fonte VARCHAR(240);
ALTER TABLE Alimento ADD COLUMN versao_fonte VARCHAR(40);
ALTER TABLE Alimento ADD COLUMN observacao_fonte VARCHAR(500);
ALTER TABLE Alimento ADD COLUMN disponivel_prescricao BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE Alimento ADD COLUMN catalogo_ativo BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE Alimento SET nome_busca = LOWER(nome), fonte = 'Base demonstrativa legada',
    observacao_fonte = 'Registro preservado para integridade dos dados anteriores; fora do catálogo oficial.';

INSERT INTO Alimento (id_alimento, codigo_taco, nome, categoria, nome_busca,
    kcal_100g, proteina_100g, carboidratos_100g, gordura_100g,
    fonte, versao_fonte, observacao_fonte, disponivel_prescricao, catalogo_ativo)
VALUES
"""
    records = []
    for code, name, category, values, notes in foods:
        available = "TRUE" if "NULL" not in values else "FALSE"
        fields = [str(1000 + code), str(code), sql_text(name), sql_text(category), sql_text(search_name(name))]
        fields += values + [sql_text("NEPA/UNICAMP — TACO"), sql_text("4ª edição, 2011"), sql_text(notes), available, "TRUE"]
        records.append("    (" + ", ".join(fields) + ")")
    footer = """;

ALTER TABLE Alimento ALTER COLUMN nome_busca SET NOT NULL;
CREATE INDEX idx_alimento_catalogo_nome ON Alimento (catalogo_ativo, nome_busca);
CREATE INDEX idx_alimento_catalogo_categoria ON Alimento (catalogo_ativo, categoria);
SELECT setval(pg_get_serial_sequence('alimento', 'id_alimento'), (SELECT MAX(id_alimento) FROM Alimento));
"""
    return header + ",\n".join(records) + footer


def main():
    parser = argparse.ArgumentParser(description="Gera a migração do catálogo a partir da planilha TACO oficial validada.")
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    foods = read_foods(args.source)
    args.output.write_text(migration(foods), encoding="utf-8", newline="\n")
    available = sum("NULL" not in food[3] for food in foods)
    print(f"597 alimentos; 15 categorias; {available} com dados calculáveis; SHA-256 da fonte validado.")


if __name__ == "__main__":
    main()
