import type { GamePlayConfig } from '../api/games';

export interface GameBoard {
  answerLength: number;
  letterPool: string[];
}

export function buildGameBoard(config: GamePlayConfig): GameBoard {
  const answerLength = Number(config.answer_length);
  const letterPool = Array.isArray(config.letter_pool) ? [...config.letter_pool] : [];
  const hasValidLetters = letterPool.every(
    (letter) => typeof letter === 'string' && /^[A-Z0-9]$/.test(letter),
  );

  if (
    !Number.isInteger(answerLength)
    || answerLength <= 0
    || letterPool.length < answerLength
    || !hasValidLetters
  ) {
    throw new Error('This game does not have a valid answer board.');
  }

  return { answerLength, letterPool };
}
