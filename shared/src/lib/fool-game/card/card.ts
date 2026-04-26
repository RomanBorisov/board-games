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
