import { describe, expect, it } from 'vitest';
import { Card } from '../../../src/cards/Card.js';
import { InvalidCardColumnError, InvalidCardTitleError, InvalidPriorityError } from '../../../src/cards/errors.js';
import { NotImplementedError } from '../../../src/shared/errors.js';

describe('Card.create', () => {
  it('cria um cartão com prioridade baixa e descrição vazia por padrão', () => {
    const card = Card.create('Configurar ambiente', 'col-todo');

    expect(card.title).toBe('Configurar ambiente');
    expect(card.columnId).toBe('col-todo');
    expect(card.priority).toBe('baixa');
    expect(card.description).toBe('');
    expect(card.id).toBeTypeOf('string');
  });

  it('aceita prioridade e descrição customizadas, normalizando o título', () => {
    const card = Card.create('  Mover cartão  ', 'col-doing', 'alta', '  detalhes  ');

    expect(card.title).toBe('Mover cartão');
    expect(card.priority).toBe('alta');
    expect(card.description).toBe('detalhes');
  });

  it('rejeita título com menos de 3 caracteres', () => {
    expect(() => Card.create('ab', 'col-todo')).toThrow(InvalidCardTitleError);
  });

  it('rejeita título com mais de 120 caracteres', () => {
    expect(() => Card.create('a'.repeat(121), 'col-todo')).toThrow(InvalidCardTitleError);
  });

  it('rejeita título que não é string', () => {
    // @ts-expect-error propositalmente passando um tipo inválido
    expect(() => Card.create(123, 'col-todo')).toThrow(InvalidCardTitleError);
  });

  it('rejeita columnId vazio', () => {
    expect(() => Card.create('Título válido', '   ')).toThrow(InvalidCardColumnError);
  });

  it('rejeita columnId que não é string', () => {
    // @ts-expect-error propositalmente passando um tipo inválido
    expect(() => Card.create('Título válido', 42)).toThrow(InvalidCardColumnError);
  });

  it('rejeita prioridade inválida', () => {
    // @ts-expect-error propositalmente passando um valor fora do union
    expect(() => Card.create('Título válido', 'col-todo', 'urgente')).toThrow(InvalidPriorityError);
  });
});

describe('Card.restore', () => {
  it('reconstrói um cartão a partir de um snapshot já persistido', () => {
    const original = Card.create('Cartão original', 'col-todo', 'média', 'descrição');
    const restored = Card.restore(original.toSnapshot());

    expect(restored.toSnapshot()).toEqual(original.toSnapshot());
  });
});

describe('Card#changeColumn', () => {
  it('altera a coluna do cartão quando o columnId é válido', () => {
    const card = Card.create('Cartão', 'col-todo');

    card.changeColumn('col-doing');

    expect(card.columnId).toBe('col-doing');
  });

  it('rejeita columnId inválido', () => {
    const card = Card.create('Cartão', 'col-todo');

    expect(() => card.changeColumn('   ')).toThrow(InvalidCardColumnError);
  });
});

describe('Card#rename', () => {
  it('renomeia o cartão e atualiza a descrição se informada', () => {
    const card = Card.create('Cartão original', 'col-todo', 'baixa', 'desc original');

    card.rename('  Novo título  ', '  nova desc  ');

    expect(card.title).toBe('Novo título');
    expect(card.description).toBe('nova desc');
  });

  it('mantém a descrição atual se nova descrição não for informada', () => {
    const card = Card.create('Cartão original', 'col-todo', 'baixa', 'desc original');

    card.rename('Novo título');

    expect(card.title).toBe('Novo título');
    expect(card.description).toBe('desc original');
  });

  it('rejeita novo título inválido', () => {
    const card = Card.create('Cartão original', 'col-todo');

    expect(() => card.rename('ab')).toThrow(InvalidCardTitleError);
  });
});

describe('Card#changePriority', () => {
  it('altera a prioridade para um valor válido', () => {
    const card = Card.create('Cartão', 'col-todo', 'baixa');

    card.changePriority('alta');

    expect(card.priority).toBe('alta');
  });

  it('rejeita prioridade inválida', () => {
    const card = Card.create('Cartão', 'col-todo');

    // @ts-expect-error propositalmente passando um valor fora do union
    expect(() => card.changePriority('urgente')).toThrow(InvalidPriorityError);
  });
});

