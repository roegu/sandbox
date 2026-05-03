import type { Cell, GameConfig, Card, CardEffect, CardRarity } from '../types';
import { CardEffect as CE, CardRarity as CR } from '../types';
import { Gamemode } from '../types';
import type { IGamemode } from './IGamemode';

// ─── Card Definitions ──────────────────────────────────────────────────────

const CARD_DEFS: { name: string; description: string; effect: CardEffect; rarity: CardRarity }[] = [
  { name: 'Shield',   description: 'Protects this cell from one mine hit',  effect: CE.Shield,   rarity: CR.Common },
  { name: 'Detonate', description: 'Reveals all 8 neighbors',              effect: CE.Detonate, rarity: CR.Common },
  { name: 'Scanner',  description: 'Reveals one random safe cell',         effect: CE.Scanner,  rarity: CR.Common },
  { name: 'Chain',    description: 'Flood-fills connected zero cells',     effect: CE.Chain,    rarity: CR.Common },
];

// ─── Gamemode ──────────────────────────────────────────────────────────────

export class ArcaneGamemode implements IGamemode {
  readonly modeName = 'Arcane Minesweeper';
  readonly icon = '🔮';

  getMode(): Gamemode { return Gamemode.Arcane; }

  private deck: Card[] = [];
  private hand: Card[] = [];
  private playedCards: Card[] = [];
  private handLimit = 5;

  init(_grid: Cell[][]): void {
    this.deck = this.createDeck();
    this.shuffle(this.deck);
    this.hand = [];
    this.playedCards = [];
  }

  onReveal(row: number, col: number, cell: Cell, grid: Cell[][]): void {
    // Draw a card from deck and apply it immediately
    if (this.deck.length > 0) {
      const card = this.deck.pop()!;
      this.applyCard(card, row, col, cell, grid);
    }
  }

  onFlag(_row: number, _col: number, _cell: Cell): void {
    // No card drawn on flag in arcane mode
  }

  onNewGame(_config: GameConfig): void {
    this.hand = [];
    this.playedCards = [];
  }

  getState(): Record<string, unknown> {
    return {
      arcaneDeck: this.deck,
      arcaneHand: this.hand,
      arcanePlayedCards: this.playedCards,
    };
  }

  // ─── Card Creation ───────────────────────────────────────────────────

  private createDeck(): Card[] {
    const deck: Card[] = [];
    let id = 0;
    // 3 copies of each of the 4 cards = 12 total
    for (const def of CARD_DEFS) {
      for (let i = 0; i < 3; i++) {
        deck.push({ ...def, id: `${def.effect}-${id++}` });
      }
    }
    return deck;
  }

  private shuffle(deck: Card[]): void {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
  }

  // ─── Card Effects ────────────────────────────────────────────────────

  private applyCard(card: Card, row: number, col: number, cell: Cell, grid: Cell[][]): void {
    // Add to played cards and hand (hand shows reference of drawn cards)
    this.playedCards.push(card);
    if (this.hand.length < this.handLimit) {
      this.hand.push(card);
    }

    switch (card.effect) {
      case CE.Shield:
        cell.shielded = true;
        break;

      case CE.Detonate:
        this.revealNeighbors(row, col, grid);
        break;

      case CE.Scanner:
        this.revealRandomSafeCell(grid);
        break;

      case CE.Chain:
        this.floodFillFrom(row, col, grid);
        break;
    }
  }

  private revealNeighbors(row: number, col: number, grid: Cell[][]): void {
    const rows = grid.length;
    const cols = grid[0].length;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
          const n = grid[nr][nc];
          if (n.state === 'hidden') {
            n.state = 'revealed';
          }
        }
      }
    }
  }

  private revealRandomSafeCell(grid: Cell[][]): void {
    const safeCells: { r: number; c: number }[] = [];
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        const cell = grid[r][c];
        if (!cell.isMine && cell.state === 'hidden') {
          safeCells.push({ r, c });
        }
      }
    }
    if (safeCells.length > 0) {
      const pick = safeCells[Math.floor(Math.random() * safeCells.length)];
      grid[pick.r][pick.c].state = 'revealed';
    }
  }

  private floodFillFrom(row: number, col: number, grid: Cell[][]): void {
    const cell = grid[row][col];
    if (cell.adjacentMines !== 0) return;

    const queue: { r: number; c: number }[] = [{ r: row, c: col }];
    const visited = new Set<string>();
    visited.add(`${row},${col}`);

    while (queue.length > 0) {
      const cur = queue.shift()!;
      const currentCell = grid[cur.r][cur.c];
      if (currentCell.state === 'revealed') continue;
      currentCell.state = 'revealed';

      if (currentCell.adjacentMines === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = cur.r + dr;
            const nc = cur.c + dc;
            if (nr >= 0 && nr < grid.length && nc >= 0 && nc < grid[0].length) {
              const key = `${nr},${nc}`;
              if (!visited.has(key) && !grid[nr][nc].isMine) {
                visited.add(key);
                queue.push({ r: nr, c: nc });
              }
            }
          }
        }
      }
    }
  }
}
