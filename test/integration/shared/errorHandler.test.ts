import { describe, expect, it, vi } from 'vitest';
import type { Response } from 'express';
import { errorHandler } from '../../../src/shared/errorHandler.js';
import { NotImplementedError } from '../../../src/shared/errors.js';
import { ColumnNotFoundError } from '../../../src/boards/errors.js';
import {
  CardNotFoundError,
  DuplicateCardTitleError,
  WipLimitExceededError,
} from '../../../src/cards/errors.js';

function buildResponseDouble(): Response {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.render = vi.fn().mockReturnValue(res);
  return res as Response;
}

describe('errorHandler', () => {
  it('mapeia um erro conhecido (NotImplementedError) para o status registrado', () => {
    const res = buildResponseDouble();

    errorHandler(new NotImplementedError('X#y'), {} as never, res, () => undefined);

    expect(res.status).toHaveBeenCalledWith(501);
    expect(res.render).toHaveBeenCalledWith('error', expect.objectContaining({ status: 501 }));
  });

  it('mapeia outro erro conhecido (ColumnNotFoundError) para 404', () => {
    const res = buildResponseDouble();

    errorHandler(new ColumnNotFoundError('col-x'), {} as never, res, () => undefined);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('mapeia CardNotFoundError para 404', () => {
    const res = buildResponseDouble();

    errorHandler(new CardNotFoundError('card-x'), {} as never, res, () => undefined);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('mapeia DuplicateCardTitleError para 409', () => {
    const res = buildResponseDouble();

    errorHandler(new DuplicateCardTitleError('Título', 'col-1'), {} as never, res, () => undefined);

    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('mapeia WipLimitExceededError para 409', () => {
    const res = buildResponseDouble();

    errorHandler(new WipLimitExceededError('Em Andamento', 3), {} as never, res, () => undefined);

    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('usa 500 para um erro que não está no mapa', () => {
    const res = buildResponseDouble();

    errorHandler(new Error('algo inesperado'), {} as never, res, () => undefined);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

