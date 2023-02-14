import { SagaIterator } from 'redux-saga';
import { delay, select, put, actionChannel, take, call } from 'redux-saga/effects';
import { Card, getDecks } from './deck';
import {
	actions,
	getDealer,
	getHand,
	getHandScore,
	getPlayers,
	getPlayerResult,
	isBlackjack,
	isBust,
	isDealer,
	Player
} from './slice';

const seed = (s: number) => {
	return () => {
		s = parseFloat(Math.sin(s).toFixed(5)) * 10000;
		return s - Math.floor(s);
	};
};

const shuffle = (array: Card[], random: () => number) => {
	let currentIndex = array.length,
		randomIndex;
	while (currentIndex != 0) {
		randomIndex = Math.floor(random() * currentIndex);
		currentIndex--;
		[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
	}
	return array;
};

function* shuffleDeckSaga(): SagaIterator {
	// create random seed number
	const seedNumber = Math.ceil(Math.random() * 100000);
	// create and shuffle deck
	const deck = shuffle(getDecks(5), seed(seedNumber));
	// set the deck for the game
	yield put(actions.setDeck({ deck }));
}

function* initialDealSaga(): SagaIterator {
	// set status to dealing
	yield put(actions.setStatus({ status: 'DEALING' }));
	// select all players
	const players: Player[] = yield select(getPlayers);
	// specify the initial cards to be dealy
	const initialCards = 2;
	for (let i = 0; i < initialCards; i++) {
		// iterate through each of the players for each
		// card that initially needs to be deal
		for (const { id } of players) {
			yield delay(250);
			// set the current player
			yield put(actions.setCurrentPlayer({ id }));
			// draw a card for the current player
			yield put(actions.draw());
			// select the hand of the current player
			const hand = yield select(getHand);
			// check if the hand is blackjack
			if (isBlackjack(hand)) {
				// if so update the status of the hand
				yield put(actions.setPlayerResult({ result: 'BLACKJACK', id }));
			}
		}
	}
}

function* resultSaga(): SagaIterator {
	// select the dealer
	const dealer: Player = yield select(getDealer);
	// select the players
	const players: Player[] = yield select(getPlayers);
	// iterate through the players to determine result against the dealer
	for (const player of players) {
		const { id, type } = player;
		if (type !== 'DEALER') {
			const result = getPlayerResult(player, dealer);
			yield put(actions.setPlayerResult({ id, result }));
		}
	}
}

function* dealerTurnSaga(): SagaIterator {
	while (true) {
		// delay the dealer action by 1000ms
		yield delay(1000);
		// select the dealer
		const dealer = yield select(getDealer);
		// calculate the dealer score
		const score = getHandScore(dealer.hand);
		// if the score is less than 17, then draw a card
		if (score < 17) {
			yield put(actions.draw());
		} else {
			// if 17 or over, then check if the dealer is bust
			const bust = yield select(isBust);
			if (bust) {
				// update the status if the dealer is bust
				yield put(actions.setPlayerResult({ result: 'BUST' }));
			}
			// otherwise, stick on a score greater than 17
			break;
		}
	}
}

function* playerTurnSaga(): SagaIterator {
	// Setup a channel that listens to the actions defined
	const channel = yield actionChannel([actions.hit, actions.stick]);
	while (true) {
		// take action from the channel
		const result = yield take(channel);
		// if the action is "hit."
		if (actions.hit.match(result)) {
			// draw a card for the player
			yield put(actions.draw());
			// check if the player is bust
			const bust = yield select(isBust);
			if (bust) {
				// if bust, set the status and exit turn
				yield put(actions.setPlayerResult({ result: 'BUST' }));
				break;
			}
		} else {
			// otherwise "stick" and finish turn
			break;
		}
	}
}

function* gameSaga(): SagaIterator {
	// Shuffle the deck for the game
	yield call(shuffleDeckSaga);
	// deal the initial cards to the players and the dealer
	yield call(initialDealSaga);
	// set status to playing
	yield put(actions.setStatus({ status: 'PLAYING' }));
	// select the dealer
	const dealer: Player = yield select(getDealer);
	// if the dealer has blackjack, skip to the results
	if (dealer.result !== 'BLACKJACK') {
		// select the players
		const players: Player[] = yield select(getPlayers);
		for (const player of players) {
			// set the current player id
			yield put(actions.setCurrentPlayer({ id: player.id }));
			// if the player is a dealer, call the dealerSaga
			if (isDealer(player)) {
				yield call(dealerTurnSaga);
				// if the player does not have Blackjack, call the player saga
			} else if (player.result !== 'BLACKJACK') {
				yield call(playerTurnSaga);
			}
		}
	}
	// calculate the results after all the players have finished
	yield call(resultSaga);
}

export function* rootSaga(): SagaIterator {
	while (true) {
		// wait for the game to start
		yield take(actions.start);
		// get the number of players
		const playerCount: number = yield select((state) => state.playerCount);
		// add each player
		for (let i = 0; i < playerCount; i++) {
			yield put(actions.addPlayer());
		}
		// add the dealer
		yield put(actions.addDealer());
		// run the game
		yield call(gameSaga);
		// set the status to "ENDED"
		yield put(actions.setStatus({ status: 'ENDED' }));
		// wait for the reset action
		yield take(actions.reset);
	}
}
