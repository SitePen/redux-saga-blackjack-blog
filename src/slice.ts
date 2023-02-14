import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Card } from './deck';

export type GameStatus = 'IDLE' | 'DEALING' | 'PLAYING' | 'ENDED';
export type Result = 'WIN' | 'LOSE' | 'PUSH' | 'BUST' | 'BLACKJACK';
export type PlayerType = 'HUMAN' | 'CPU' | 'DEALER';

export interface Player {
	id: string;
	hand: Card[];
	type: PlayerType;
	result?: Result;
}

type Players = Player[];

export interface GameState {
	status: GameStatus;
	players: Players;
	deck: Card[];
	playerCount: number;
	currentPlayer?: string;
}

interface StartPayload {
	playerCount: number;
}

interface SetDeckPayload {
	deck: Card[];
}

interface SetStatusPayload {
	status: GameStatus;
}

interface SetPlayerResultPayload {
	result: Result;
	id?: string;
}

export const getPlayers = (state: GameState) => state.players;

export const getPlayer = (state: GameState) => state.players.find((player) => player.id === state.currentPlayer);

export const getDealer = (state: GameState) => state.players.find((player) => player.type === 'DEALER');

export const getHand = (state: GameState) => getPlayer(state)?.hand;

export const isDealer = (player: Player) => player.type === 'DEALER';

export const getHandScore = (hand: Card[]) => hand.reduce((score, card) => score + card.value, 0);

export const getPlayerScore = (state: GameState) => {
	const playerHand = getHand(state);
	if (playerHand) {
		return getHandScore(playerHand);
	}
};

export const isBust = (state: GameState) => {
	const score = getPlayerScore(state) || 0;
	return score > 21;
};

export const isBlackjack = (hand: Card[]) => hand.length === 2 && getHandScore(hand) === 21;

export function getPlayerResult(player: Player, dealer: Player) {
	const dealerScore = getHandScore(dealer.hand);
	const playerScore = getHandScore(player.hand);
	if (player.result === 'BLACKJACK') {
		return dealer.result === 'BLACKJACK' ? 'PUSH' : player.result;
	} else if (player.result === 'BUST') {
		return player.result;
	}
	if (dealer.result === 'BUST' || playerScore > dealerScore) {
		return 'WIN';
	}
	if (dealer.result === 'BLACKJACK' || playerScore < dealerScore) {
		return 'LOSE';
	}
	return 'PUSH';
}

const initialState: () => GameState = () => ({
	status: 'IDLE',
	players: [],
	deck: [],
	playerCount: 0
});

export const getStatus = (state: GameState) => state.status;

const slice = createSlice({
	name: 'game',
	initialState: initialState(),
	reducers: {
		setDeck(state, action: PayloadAction<SetDeckPayload>) {
			state.deck = action.payload.deck;
		},
		addPlayer(state) {
			state.players.push({
				id: `player-${state.players.length}`,
				hand: [],
				type: 'HUMAN'
			});
		},
		addDealer(state) {
			state.players.push({
				id: 'dealer',
				hand: [],
				type: 'DEALER'
			});
		},
		start(state, action: PayloadAction<StartPayload>) {
			state.playerCount = action.payload.playerCount;
		},
		setStatus(state, action: PayloadAction<SetStatusPayload>) {
			state.status = action.payload.status;
		},
		setCurrentPlayer(state, action: PayloadAction<any>) {
			state.currentPlayer = action.payload.id;
		},
		setPlayerResult(state, action: PayloadAction<SetPlayerResultPayload>) {
			const playerId = action.payload.id || state.currentPlayer;
			const player = state.players.find((player) => player.id === playerId);
			if (player) {
				player.result = action.payload.result;
			}
		},
		draw(state) {
			const player = state.players.find((player) => state.currentPlayer === player.id);
			if (player) {
				const [card, ...deck] = state.deck;
				state.deck = deck;
				player.hand.push(card!);
			}
		},
		hit() {},
		stick() {},
		reset: () => initialState()
	}
});

export const { actions } = slice;

export default slice.reducer;
