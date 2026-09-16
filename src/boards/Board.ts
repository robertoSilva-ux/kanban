import { randomUUID } from 'node:crypto';
import { Column, type ColumnSnapshot } from './Column.js';
import { ColumnNotFoundError } from './errors.js';

export interface BoardSnapshot {
  id: string;
  name: string;
  columns: ColumnSnapshot[];
}

/**
 * MODEL — o quadro (aggregate root): agrupa as colunas. Nesta versão do
 * template só existe UM quadro fixo (ver `src/seed.ts`); suportar vários
 * quadros é uma atividade de estica (Atividade 10).
 */
export class Board {
  private constructor(
    private readonly _id: string,
    private readonly _name: string,
    private readonly _columns: Column[],
  ) {}

  static create(id: string, name: string, columns: Column[]): Board {
    return new Board(id, name, columns);
  }

  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get columns(): readonly Column[] {
    return this._columns;
  }

  findColumn(columnId: string): Column {
    const column = this._columns.find((c) => c.id === columnId);
    if (!column) {
      throw new ColumnNotFoundError(columnId);
    }
    return column;
  }

  hasColumn(columnId: string): boolean {
    return this._columns.some((c) => c.id === columnId);
  }

  /**
   * Atividade 7: criar e adicionar uma nova coluna ao quadro.
   */
  addColumn(name: string, wipLimit: number | null = null): Column {
    const id = `col-${randomUUID()}`;
    const maxOrder = this._columns.reduce((max, c) => Math.max(max, c.order), 0);
    const column = Column.create(id, name, maxOrder + 1, wipLimit);
    this._columns.push(column);
    return column;
  }


  toSnapshot(): BoardSnapshot {
    return {
      id: this._id,
      name: this._name,
      columns: this._columns.map((c) => c.toSnapshot()).sort((a, b) => a.order - b.order),
    };
  }
}
