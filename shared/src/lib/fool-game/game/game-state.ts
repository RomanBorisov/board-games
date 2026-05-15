import { IGameState } from "../../core/game-state";
import {
  FoolGameCardSuit,
  IFoolGameCard,
  IFoolGameCardsOnTable,
} from '../card';
import { IFoolGameClientPlayer, IFoolGamePlayer } from "../player";

export interface IFoolGameCoreState<FoolGamePlayerType = IFoolGamePlayer>
  extends IGameState<FoolGamePlayerType> {
  trumpSuit: FoolGameCardSuit;

  currentPlayer: FoolGamePlayerType;
  nextPlayer: FoolGamePlayerType;

  attacker: FoolGamePlayerType | null;
  defender: FoolGamePlayerType | null;

  cardsOnTable: IFoolGameCardsOnTable[];
}

/*
* Server state is used to store the game state on the server. It contains the full state of the game.
* For example, server can see the full deck of cards and the remaining deck of cards.
*/
export interface IFoolGameServerState extends IFoolGameCoreState<IFoolGamePlayer> {
    fullDeck: IFoolGameCard[];
    remainingDeck: IFoolGameCard[];
}

/*
* Client state is used to store the game state on the client. It contains the state of the game that is visible to the client (specific player's state).
* For example, player himself can see his own hand of cards, but not the hands of other players.
*/
export interface IFoolGameClientState extends IFoolGameCoreState<IFoolGameClientPlayer> {
    hand: IFoolGameCard[];
}

