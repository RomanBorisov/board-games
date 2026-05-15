import { Injectable } from '@nestjs/common';
import {
  FoolGameActionType,
  FoolGameCardRank,
  FoolGameCardSuit,
  FoolGamePlayerRole,
  IFoolGameAction,
  IFoolGameAttackAction,
  IFoolGameCard,
  IFoolGameClientPlayer,
  IFoolGameClientState,
  IFoolGamePlayer,
  IFoolGameServerState,
  IGame,
  RANKS_DICTIONARY,
} from '@board-games/shared';
import { AvailableGameEngines, IGameEngine } from './game-engine.interface';
import { CardUtils } from '../utils/card';

@Injectable()
export class DurakEngine
  implements
    IGameEngine<
      IFoolGameServerState,
      IFoolGameClientState,
      IFoolGameAction,
      IGameEngineOptions
    >
{
  public readonly name: AvailableGameEngines = AvailableGameEngines.DURAK;

  public readonly game: IGame = {
    id: AvailableGameEngines.DURAK,
    name: 'Durak',
    description: 'Classic Durak card game',
  };
  public initGame(
    playerIds: string[],
    options: IGameEngineOptions,
  ): IFoolGameServerState {
    if (playerIds.length !== 2) {
      throw new Error('Players per game must be 2');
    }

    if (options.playersPerGame !== 2) {
      throw new Error('Players per game must be 2');
    }

    const rawDeck = this._createDeck(options.deckSize);
    const shuffledDeck = this._shuffleDeck(rawDeck);
    const trumpSuit = shuffledDeck[shuffledDeck.length - 1].suit;
    const fullDeck = this._markTrumpCards(shuffledDeck, trumpSuit);
    const cardsToDeal = fullDeck.slice(0, CARDS_BY_PLAYER * playerIds.length);
    const remainingDeck = fullDeck.slice(CARDS_BY_PLAYER * playerIds.length);
    const players = this._dealCards(
      cardsToDeal,
      this._createPlayers(playerIds),
    );
    const attacker = players[0];
    const defender = players[1];

    return {
      players,
      attacker,
      defender,
      currentPlayer: attacker,
      nextPlayer: defender,

      cardsOnTable: [],
      fullDeck,
      trumpSuit,
      remainingDeck,

      isGameOver: false,
      winner: null,
      losers: null,
      game: this.game,
    };
  }

  public processAction(
    state: IFoolGameServerState,
    action: IFoolGameAction,
    playerId: string,
  ): IFoolGameServerState {
    switch (action.type) {
      case FoolGameActionType.Attack:
        return this._processAttackAction(state, playerId, action);
      case FoolGameActionType.Defend:
      case FoolGameActionType.Pass:
      case FoolGameActionType.TakeCard:
      default:
        throw new Error('Not implemented');
    }
  }

  private _processAttackAction(
    state: IFoolGameServerState,
    playerId: string,
    action: IFoolGameAttackAction,
  ): IFoolGameServerState {
    const isUserInCurrentGameSession = state.players.find((p) => playerId === p.id);
    if (!isUserInCurrentGameSession) {
      throw new Error(`User with id:${playerId} cannot be found`);
    }

    const isCurrentUserTurn = state.currentPlayer.id === playerId;
    const isCurrentUserAttacker = state.attacker.id === playerId;

    if (!isCurrentUserTurn || !isCurrentUserAttacker) {
      throw new Error(
        `User with id: ${playerId} cannot do action when it's not his turn`,
      );
    }

    const cardToUse = action.payload.card;
    const playerHasUsedCardInHand = !!state.currentPlayer.hand.find(
      (c) => cardToUse.rank === c.rank && cardToUse.suit === c.suit,
    );

    if (!playerHasUsedCardInHand) {
      throw new Error(`User with id:${playerId} try to use unexisting card`);
    }
    const updatedHand = state.attacker.hand.filter(
      (card) => !(card.suit === cardToUse.suit && card.rank === cardToUse.rank),
    );
    const updatedCurrentPlayer: IFoolGamePlayer = {
      ...structuredClone(state.currentPlayer),
      hand: updatedHand,
      isHisTurn: false,
    };
    const updatedDefender: IFoolGamePlayer = {
      ...structuredClone(state.defender),
      isHisTurn: true,
      isDefender: true,
    };

    const updatedPlayers = state.players.map((player) => {
      if (player.id === state.defender.id) {
        return updatedDefender;
      }

      if (player.id === updatedCurrentPlayer.id) {
        return updatedCurrentPlayer;
      }

      return player;
    });

    return {
      ...structuredClone(state),
      attacker: updatedCurrentPlayer,
      defender: updatedDefender,
      currentPlayer: updatedDefender,
      nextPlayer: updatedCurrentPlayer,
      players: updatedPlayers,
      cardsOnTable: [
        ...structuredClone(state.cardsOnTable),
        {
          attackerCard: cardToUse,
          defenderCard: null,
        },
      ],
    };

  }

  public getStateForPlayer(
    state: IFoolGameServerState,
    playerId: string,
  ): IFoolGameClientState {
    const player = state.players.find((p) => p.id === playerId);

    if (!player) {
      throw new Error(`Player with id ${playerId} not found`);
    }

    return {
      attacker: state.attacker
        ? this._createClientPlayer(state.attacker)
        : null,
      currentPlayer: state.currentPlayer
        ? this._createClientPlayer(state.currentPlayer)
        : null,
      defender: state.defender
        ? this._createClientPlayer(state.defender)
        : null,
      hand: player.hand,
      losers: state.losers ? state.losers.map((l) => this._createClientPlayer(l)) : null,
      nextPlayer: state.nextPlayer
        ? this._createClientPlayer(state.nextPlayer)
        : null,
      players: state.players.map((p) => this._createClientPlayer(p)),
      winner: state.winner ? this._createClientPlayer(state.winner) : null,
      trumpSuit: state.trumpSuit,
      cardsOnTable: state.cardsOnTable,
      game: state.game,
      isGameOver: state.isGameOver,
    };
  }

  public isGameOver(state: IFoolGameServerState): boolean {
    return state.isGameOver;
  }

  private _createDeck(deckSize: DeckSize): IFoolGameCard[] {
    const deck: IFoolGameCard[] = [];
    const startRankIndex = this._getStartCardRankIndexByDeckSize(deckSize);

    for (let i = startRankIndex; i < RANKS_DICTIONARY.length; i++) {
      const rank = RANKS_DICTIONARY[i].rank;
      deck.push(...CardUtils.createCardsForRank(rank));
    }

    return deck;
  }

  private _getStartCardRankIndexByDeckSize(deckSize: DeckSize): number {
    let startRankIndex = CardUtils.findCardRankIndex(FoolGameCardRank.Two);

    if (deckSize === 24) {
      startRankIndex = CardUtils.findCardRankIndex(FoolGameCardRank.Nine);
    } else if (deckSize === 36) {
      startRankIndex = CardUtils.findCardRankIndex(FoolGameCardRank.Six);
    }

    return startRankIndex;
  }

  private _dealCards(
    cardsToDeal: IFoolGameCard[],
    players: IFoolGamePlayer[],
  ): IFoolGamePlayer[] {
    return players.map((player, index) => {
      const startIndex = index * CARDS_BY_PLAYER;

      return {
        ...player,
        hand: cardsToDeal.slice(startIndex, startIndex + CARDS_BY_PLAYER),
      };
    });
  }

  private _shuffleDeck(deck: IFoolGameCard[]): IFoolGameCard[] {
    const shuffledDeck = [...deck];

    for (let i = shuffledDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledDeck[i], shuffledDeck[j]] = [shuffledDeck[j], shuffledDeck[i]];
    }

    return shuffledDeck;
  }

  private _markTrumpCards(
    deck: IFoolGameCard[],
    trumpSuit: FoolGameCardSuit,
  ): IFoolGameCard[] {
    return deck.map((card) => ({
      ...card,
      isTrump: card.suit === trumpSuit,
    }));
  }

  private _createPlayers(playerIds: string[]): IFoolGamePlayer[] {
    return playerIds.map((id, index) => {
      const isAttacker = index === 0;
      const isDefender = index === 1;

      return {
        id,
        name: `Player ${id}`,
        email: '',
        isHisTurn: isAttacker,
        isAttacker,
        isDefender,
        role: isAttacker
          ? FoolGamePlayerRole.Attacker
          : FoolGamePlayerRole.Defender,
        hand: [],
      };
    });
  }

  private _createClientPlayer(player: IFoolGamePlayer): IFoolGameClientPlayer {
    return {
      id: player.id,
      name: player.name,
      email: player.email,
      isHisTurn: player.isHisTurn,
      isAttacker: player.isAttacker,
      isDefender: player.isDefender,
      role: player.role,
      cardCount: player.hand.length,
    };
  }
}

export interface IGameEngineOptions {
  deckSize: DeckSize;
  playersPerGame: PlayersPerGame;
}

type DeckSize = 24 | 36 | 52;
type PlayersPerGame = 2 | 3 | 4 | 5 | 6 | 7 | 8;

export const CARDS_BY_PLAYER = 6;
