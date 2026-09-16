import { Card, type CardPriority } from './Card.js';
import type { CardRepository } from './CardRepository.js';
import type { BoardRepository } from '../boards/BoardRepository.js';
import { ColumnNotFoundError } from '../boards/errors.js';
import { CardNotFoundError, DuplicateCardTitleError, WipLimitExceededError } from './errors.js';
import type { ControllerResult } from '../shared/http.js';
import { NotImplementedError } from '../shared/errors.js';

/**
 * CONTROLLER — orquestra as operações sobre os cartões do quadro.
 */
export class CardController {
  constructor(
    private readonly cardRepository: CardRepository,
    private readonly boardRepository: BoardRepository,
  ) {}

  /**
   * Atividade 1, 5, 6: cria um cartão a partir do corpo da requisição
   */
  create(body: unknown): ControllerResult {
    const data = body as {
      title?: string;
      columnId?: string;
      priority?: CardPriority;
      description?: string;
    };

    const colId = String(data.columnId);
    const board = this.boardRepository.getDefault();
    if (!board.hasColumn(colId)) {
      throw new ColumnNotFoundError(colId);
    }

    if (this.cardRepository.existsWithTitleInColumn(String(data.title), colId)) {
      throw new DuplicateCardTitleError(String(data.title), colId);
    }

    const column = board.findColumn(colId);
    if (column.wipLimit !== null && this.cardRepository.findByColumn(colId).length >= column.wipLimit) {
      throw new WipLimitExceededError(column.name, column.wipLimit);
    }

    const card = Card.create(
      data.title as string,
      colId,
      data.priority,
      data.description,
    );
    this.cardRepository.save(card);

    return { redirect: '/' };
  }

  /**
   * Atividade 2, 5, 6: mover um cartão para outra coluna
   */
  move(id: string, body: unknown): ControllerResult {
    const card = this.cardRepository.findById(id);
    if (!card) {
      throw new CardNotFoundError(id);
    }

    const data = body as { columnId?: string };
    const targetColumnId = String(data.columnId);
    const board = this.boardRepository.getDefault();
    if (!board.hasColumn(targetColumnId)) {
      throw new ColumnNotFoundError(targetColumnId);
    }

    if (card.columnId !== targetColumnId) {
      const targetColumn = board.findColumn(targetColumnId);
      if (
        targetColumn.wipLimit !== null &&
        this.cardRepository.findByColumn(targetColumnId).length >= targetColumn.wipLimit
      ) {
        throw new WipLimitExceededError(targetColumn.name, targetColumn.wipLimit);
      }

      if (this.cardRepository.existsWithTitleInColumn(card.title, targetColumnId, card.id)) {
        throw new DuplicateCardTitleError(card.title, targetColumnId);
      }

      card.changeColumn(targetColumnId);
      this.cardRepository.save(card);
    }

    return { redirect: '/' };
  }

  /**
   * Atividade 3, 6: editar título/descrição/prioridade de um cartão
   */
  update(id: string, body: unknown): ControllerResult {
    const card = this.cardRepository.findById(id);
    if (!card) {
      throw new CardNotFoundError(id);
    }

    const data = body as {
      title?: string;
      description?: string;
      priority?: CardPriority;
    };

    if (data.title !== undefined) {
      if (this.cardRepository.existsWithTitleInColumn(data.title, card.columnId, card.id)) {
        throw new DuplicateCardTitleError(data.title, card.columnId);
      }
      card.rename(data.title, data.description);
    } else if (data.description !== undefined) {
      card.rename(card.title, data.description);
    }

    if (data.priority !== undefined) {
      card.changePriority(data.priority);
    }

    this.cardRepository.save(card);
    return { redirect: '/' };
  }

  /** Atividade 4: excluir um cartão existente. */
  remove(id: string): ControllerResult {
    const card = this.cardRepository.findById(id);
    if (!card) {
      throw new CardNotFoundError(id);
    }

    this.cardRepository.delete(id);
    return { redirect: '/' };
  }

  /** TODO (Atividade 8, estica): página de detalhe de um cartão. */
  showDetail(_id: string): ControllerResult {
    throw new NotImplementedError('CardController#showDetail');
  }

  /** TODO (Atividade 9, estica): buscar cartões por título (`?query=`). */
  search(_query: unknown): ControllerResult {
    throw new NotImplementedError('CardController#search');
  }
}
