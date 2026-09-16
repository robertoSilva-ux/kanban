import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createServer } from '../../src/server.js';
import { createSeededRepositories } from '../../src/seed.js';

/**
 * Único fluxo ponta a ponta que faz sentido no estado inicial do template:
 * abrir o quadro e ver os dados hard-coded (`src/seed.ts`). Usa
 * `createServer()` SEM injetar repositórios — ou seja, o quadro e os
 * cartões reais que qualquer pessoa vê ao rodar `npm run dev`.
 */
describe('Estado inicial: visualização do quadro hard-coded', () => {
  it('GET / mostra o quadro, as três colunas e os cartões semeados', async () => {
    const app = createServer();

    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Quadro do Projeto');
    expect(response.text).toContain('A Fazer');
    expect(response.text).toContain('Em Andamento');
    expect(response.text).toContain('Concluído');
    expect(response.text).toContain('Criar cartão (Atividade 1)');
  });

  it('a coluna "Em Andamento" mostra o limite de WIP (1/3) e não está estourada', async () => {
    const app = createServer();

    const response = await request(app).get('/');

    expect(response.text).toContain('1/3');
  });

  it('cartões de prioridade alta, média e baixa aparecem com rótulos diferentes', async () => {
    const app = createServer();

    const response = await request(app).get('/');

    expect(response.text).toContain('alta');
    expect(response.text).toContain('média');
    expect(response.text).toContain('baixa');
  });
});

describe('Jornada completa', () => {
  it('criar cartão → mover para "Em Andamento" → editar → mover para "Concluído" → excluir, tudo via HTTP', async () => {
    const repos = createSeededRepositories();
    const app = createServer(repos);

    // 1. Criar cartão em "A Fazer" (col-todo)
    const createRes = await request(app)
      .post('/cards')
      .send({ title: 'Minha Tarefa E2E', columnId: 'col-todo', priority: 'média', description: 'desc e2e' });

    expect(createRes.status).toBe(302);
    expect(createRes.header.location).toBe('/');

    const boardRes1 = await request(app).get('/');
    expect(boardRes1.status).toBe(200);
    expect(boardRes1.text).toContain('Minha Tarefa E2E');

    const card = repos.cardRepository.findAll().find((c) => c.title === 'Minha Tarefa E2E')!;
    expect(card).toBeDefined();

    // 2. Mover para "Em Andamento" (col-doing)
    const moveRes = await request(app)
      .post(`/cards/${card.id}/move`)
      .send({ columnId: 'col-doing' });

    expect(moveRes.status).toBe(302);
    expect(moveRes.header.location).toBe('/');

    // A coluna "Em Andamento" tinha 1/3 e agora deve ter 2/3
    const boardRes2 = await request(app).get('/');
    expect(boardRes2.text).toContain('2/3');

    // 3. Editar cartão
    const updateRes = await request(app)
      .post(`/cards/${card.id}/update`)
      .send({ title: 'Minha Tarefa E2E Editada', priority: 'alta' });

    expect(updateRes.status).toBe(302);
    expect(updateRes.header.location).toBe('/');

    const boardRes3 = await request(app).get('/');
    expect(boardRes3.text).toContain('Minha Tarefa E2E Editada');

    // 4. Mover para "Concluído" (col-done)
    const moveDoneRes = await request(app)
      .post(`/cards/${card.id}/move`)
      .send({ columnId: 'col-done' });

    expect(moveDoneRes.status).toBe(302);

    // 5. Excluir cartão
    const deleteRes = await request(app).post(`/cards/${card.id}/delete`);

    expect(deleteRes.status).toBe(302);
    expect(deleteRes.header.location).toBe('/');

    const boardRes4 = await request(app).get('/');
    expect(boardRes4.text).not.toContain('Minha Tarefa E2E Editada');
  });
});
