import { IGameState } from "../../core/game-state";
import { IFoolGameCard, IFoolGameCardsOnTable,  } from "../card";
import { IFoolGameClientPlayer, IFoolGamePlayer } from "../player";

export interface IFoolGameCoreState<FoolGamePlayerType = IFoolGamePlayer> extends IGameState<FoolGamePlayerType> {
    trumpCard: IFoolGameCard;

    currentPlayer: FoolGamePlayerType;
    nextPlayer: FoolGamePlayerType;
    
    attacker: FoolGamePlayerType | null;
    defender: FoolGamePlayerType | null;

    cardsOnTable: IFoolGameCardsOnTable[];
}

export interface IFoolGameServerState extends IFoolGameCoreState<IFoolGamePlayer> {
    fullDeck: IFoolGameCard[];
    remainingDeck: IFoolGameCard[];
}

export interface IFoolGameClientState extends IFoolGameCoreState<IFoolGameClientPlayer> {
    hand: IFoolGameCard[];
}

