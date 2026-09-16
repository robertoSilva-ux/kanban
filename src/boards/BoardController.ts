import type { BoardRepository } from './BoardRepository.js';
import type { CardRepository } from '../cards/CardRepository.js';
import type { ControllerResult } from '../shared/http.js';
import { toBoardViewModel } from './boardView.js';

/**
 * CONTROLLER — orquestra o quadro: busca Board (boards/) e Cards (cards/),
 * pede para a View montar o "view model" e devolve o resultado pronto para
 * `routes.ts` renderizar.
 */
export class BoardController {
  constructor(
    private readonly boardRepository: BoardRepository,
    private readonly cardRepository: CardRepository,
  ) {}

  showBoard(): ControllerResult {
    const board = this.boardRepository.getDefault();
    const cards = this.cardRepository.findAll();
    return {
      status: 200,
      view: 'board/index',
      locals: { board: toBoardViewModel(board, cards) },
    };
  }

  /**
   * Atividade 7: criar uma nova coluna no quadro a partir do corpo
   * da requisição (`{ name, wipLimit? }`) e redirecionar de volta para `/`.
   */
  createColumn(body: unknown): ControllerResult {
    const data = body as { name?: string; wipLimit?: string | number };
    const board = this.boardRepository.getDefault();
    const parsedWip = data.wipLimit ? Number(data.wipLimit) : null;
    board.addColumn(data.name as string, parsedWip);
    return { redirect: '/' };
  }
}


