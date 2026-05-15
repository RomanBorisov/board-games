export interface IFoolGameCard {
  suit: FoolGameCardSuit;
  rank: FoolGameCardRank;
  isTrump: boolean;
}

export interface IFoolGameCardsOnTable {
  attackerCard: IFoolGameCard;
  defenderCard: IFoolGameCard | null;
}

export enum FoolGameCardSuit {
  Heart = 'heart', // ♥
  Diamond = 'diamond', // ♦
  Club = 'club', // ♣
  Spade = 'spade'// ♠
}

export enum FoolGameCardRank {
  Two = '2',
  Three = '3',
  Four = '4',
  Five = '5',
  Six = '6',
  Seven = '7',
  Eight = '8',
  Nine = '9',
  Ten = '10',
  Jack = 'J',
  Queen = 'Q',
  King = 'K',
  Ace = 'A'
}

export const RANKS_DICTIONARY: IFoolGameCardRankDictionary[] = [
  { weight: 2, rank: FoolGameCardRank.Two },
  { weight: 3, rank: FoolGameCardRank.Three },
  { weight: 4, rank: FoolGameCardRank.Four },
  { weight: 5, rank: FoolGameCardRank.Five },
  { weight: 6, rank: FoolGameCardRank.Six },
  { weight: 7, rank: FoolGameCardRank.Seven },
  { weight: 8, rank: FoolGameCardRank.Eight },
  { weight: 9, rank: FoolGameCardRank.Nine },
  { weight: 10, rank: FoolGameCardRank.Ten },
  { weight: 11, rank: FoolGameCardRank.Jack },
  { weight: 12, rank: FoolGameCardRank.Queen },
  { weight: 13, rank: FoolGameCardRank.King },
  { weight: 14, rank: FoolGameCardRank.Ace },
];

export interface IFoolGameCardRankDictionary {
  weight: number;
  rank: FoolGameCardRank;
}
