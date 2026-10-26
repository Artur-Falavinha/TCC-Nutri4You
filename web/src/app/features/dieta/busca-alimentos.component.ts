import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Alimento, PaginaAlimentos } from './dieta.models';

@Component({
  selector: 'app-busca-alimentos',
  imports: [FormsModule],
  templateUrl: './busca-alimentos.component.html',
  styleUrl: './busca-alimentos.component.css'
})
export class BuscaAlimentosComponent {
  @Input() categorias: string[] = [];
  @Input() categoriaErro = '';
  @Input() categoriasCarregando = false;
  @Input() alimentosCarregando = false;
  @Input() alimentosErro = '';
  @Input() mensagemAlimento = '';
  @Input() paginaAlimentos: PaginaAlimentos | null = null;
  @Input() buscaAlimento = '';
  @Input() categoriaSelecionada = '';

  @Output() buscaAlimentoChange = new EventEmitter<string>();
  @Output() categoriaSelecionadaChange = new EventEmitter<string>();
  @Output() buscar = new EventEmitter<number>();
  @Output() recarregarCategorias = new EventEmitter<void>();
  @Output() adicionarAlimento = new EventEmitter<Alimento>();
  @Output() fechar = new EventEmitter<void>();

  formatarNutriente(valor: number | null | undefined): string {
    if (valor === null || valor === undefined || !Number.isFinite(Number(valor))) return '—';
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(valor));
  }
}
