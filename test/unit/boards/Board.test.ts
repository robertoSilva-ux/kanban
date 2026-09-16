import { describe, expect, it } from 'vitest';
import { Board } from '../../../src/boards/Board.js';
import { Column } from '../../../src/boards/Column.js';
import { ColumnNotFoundError } from '../../../src/boards/errors.js';

function buildBoard(): Board {
  const columns = [
    Column.create('col-todo', 'A Fazer', 1),
    Column.create('col-doing', 'Em Andamento', 2, 3),
  ];
  return Board.create('board-1', 'Quadro de Teste', columns);
}

describe('Board — getters básicos', () => {
  it('expõe id e a lista de colunas', () => {
    const board = buildBoard();

    expect(board.id).toBe('board-1');
    expect(board.columns).toHaveLength(2);
  });
});

describe('Board#findColumn', () => {
  it('retorna a coluna quando ela existe', () => {
    const board = buildBoard();

    expect(board.findColumn('col-todo').name).toBe('A Fazer');
  });

  it('lança ColumnNotFoundError quando a coluna não existe', () => {
    const board = buildBoard();

    expect(() => board.findColumn('col-inexistente')).toThrow(ColumnNotFoundError);
  });
});

describe('Board#hasColumn', () => {
  it('retorna true quando a coluna existe', () => {
    expect(buildBoard().hasColumn('col-doing')).toBe(true);
  });

  it('retorna false quando a coluna não existe', () => {
    expect(buildBoard().hasColumn('col-inexistente')).toBe(false);
  });
});

describe('Board#addColumn', () => {
  it('adiciona uma nova coluna com a próxima ordem e id gerado', () => {
    const board = buildBoard();

    const column = board.addColumn('Em Revisão');

    expect(column.name).toBe('Em Revisão');
    expect(column.order).toBe(3);
    expect(column.wipLimit).toBeNull();
    expect(board.columns).toHaveLength(3);
    expect(board.hasColumn(column.id)).toBe(true);
  });

  it('adiciona coluna com limite de WIP', () => {
    const board = buildBoard();

    const column = board.addColumn('Em Revisão', 5);

    expect(column.wipLimit).toBe(5);
  });
});


describe('Board#toSnapshot', () => {
  it('devolve as colunas ordenadas por order', () => {
    const columns = [Column.create('col-b', 'Segunda', 2), Column.create('col-a', 'Primeira', 1)];
    const board = Board.create('board-1', 'Quadro', columns);

    const snapshot = board.toSnapshot();

    expect(snapshot.columns.map((c) => c.id)).toEqual(['col-a', 'col-b']);
  });
});
