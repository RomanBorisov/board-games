import {
  FoolGameCardRank,
  FoolGameCardSuit,
  IFoolGameCard,
  RANKS_DICTIONARY,
} from '@board-games/shared';

export class CardUtils {
  public static createCardsForRank(rank: FoolGameCardRank): IFoolGameCard[] {
    return [
      { rank, suit: FoolGameCardSuit.Club, isTrump: false },
      { rank, suit: FoolGameCardSuit.Diamond, isTrump: false },
      { rank, suit: FoolGameCardSuit.Heart, isTrump: false },
      { rank, suit: FoolGameCardSuit.Spade, isTrump: false },
    ];
  }

  public static findCardRankIndex(rank: FoolGameCardRank): number {
    return RANKS_DICTIONARY.findIndex((r) => r.rank === rank);
  }

  public static getRandomCardFromDeck(deck: IFoolGameCard[]): IFoolGameCard {
    const randomIndex = Math.floor(Math.random() * deck.length);
    return deck[randomIndex];
  }
}
