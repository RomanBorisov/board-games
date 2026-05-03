/*
@param TServerState - Server state of the game. What the server sees and can modify.
@param TClientState - Client state of the game. What the client/player sees and can modify.
@param TAction - Action of the game. What the client/player can do.
*/
export interface IGameEngine<TServerState, TClientState, TAction> { 
    readonly name: AvailableGameEngines;
  
    /*
    * Initialize the game.
    * @param playerIds - IDs of the players in the game.
    * @returns Initial state of the game.
    */
    initGame(playerIds: string[]): TServerState;
  
    /*
    * Process an action from a player.
    * @param state - Current state of the game.
    * @param action - Action to process.
    * @param playerId - ID of the player who is performing the action.
    * @returns New state of the game.
    */
    processAction(
      state: TServerState,
      action: TAction,
      playerId: string
    ): TServerState;
  
    /*
    * Get the state for a player.
    * @param state - Current state of the game.
    * @param playerId - ID of the player to get the state for.
    * @returns State for the player.
    */
    getStateForPlayer(
      state: TServerState,
      playerId: string
    ): TClientState;
  
    /*
    * Check if the game is over.
    * @param state - Current state of the game.
    * @returns True if the game is over, false otherwise.
    */
    isGameOver(state: TServerState): boolean;
}

export enum AvailableGameEngines {
    DURAK = 'durak',
}