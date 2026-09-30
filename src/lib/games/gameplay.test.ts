import { describe, expect, it } from 'vitest';

import { buildGameBoard } from './gameplay';

describe('buildGameBoard', () => {
  it('uses the server-provided answer length and shuffled letters', () => {
    expect(buildGameBoard({
      game_id: 1,
      answer_length: 3,
      letter_pool: ['X', 'D', 'G', 'O', 'A', 'T'],
    })).toEqual({
      answerLength: 3,
      letterPool: ['X', 'D', 'G', 'O', 'A', 'T'],
    });
  });

  it('rejects malformed gameplay data instead of inventing an answer', () => {
    expect(() => buildGameBoard({
      game_id: 1,
      answer_length: 0,
      letter_pool: [],
    })).toThrow('valid answer board');

    expect(() => buildGameBoard({
      game_id: 1,
      answer_length: 4,
      letter_pool: ['D', 'O', 'G'],
    })).toThrow('valid answer board');
  });
});
