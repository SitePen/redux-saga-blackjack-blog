import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider, useDispatch, useSelector } from 'react-redux';
import './index.css';
import { actions, getDealer, getPlayer, getPlayers, getStatus } from './slice';
import { store } from './store';

const Game = () => {
	const dispatch = useDispatch();
	const status = useSelector(getStatus);
	const players = useSelector(getPlayers);
	const dealer = useSelector(getDealer);
	const currentPlayer = useSelector(getPlayer);

	if (status === 'IDLE') {
		return (
			<div className="root">
				<div className="center">
					<button className="button" onClick={() => dispatch(actions.start({ playerCount: 5 }))}>
						Start Game
					</button>
				</div>
			</div>
		);
	}

	const dealerHand =
		!dealer?.hand.length || dealer.hand.length < 2
			? Array(2)
					.fill(null)
					.map((_, i) => dealer?.hand[i] || null)
			: dealer?.hand;

	return (
		<div className="root">
			<div className="table">
				<div className="dealer">
					<div className="hand">
						{dealerHand.map((card, i) => {
							if (card) {
								const isDealer = status === 'PLAYING' && currentPlayer?.type === 'DEALER';
								if (isDealer || i === 0 || status === 'ENDED') {
									return (
										<div key={i} className="card">
											<div data-suit={card.suit.toLowerCase()} data-rank={card.name} />
										</div>
									);
								}
							}
							return <div key={i} className="card back" />;
						})}
					</div>
				</div>
				<div className="players">
					{players.map((player) => {
						if (player.type === 'DEALER') {
							return null;
						}
						const playerHand =
							player.hand.length < 2
								? Array(2)
										.fill(null)
										.map((_, i) => player.hand[i] || null)
								: player.hand;
						return (
							<div key={player.id} className="player">
								<div className="player-actions">
									{status === 'PLAYING' && currentPlayer?.id === player.id && (
										<>
											<button className="button" onClick={() => dispatch(actions.hit())}>
												Hit
											</button>
											<button className="button" onClick={() => dispatch(actions.stick())}>
												Stick
											</button>
										</>
									)}
								</div>

								<div className="player-hand">
									<div className="hand">
										{playerHand.map((card, i) => {
											if (card === null) {
												return <div key={i} className="card back" />;
											}
											return (
												<div key={i} className="card">
													<div
														data-suit={card.suit.toLowerCase()}
														data-rank={card.name}
													></div>
												</div>
											);
										})}
									</div>
									<div className="center">
										{player.result && (
											<div className="result">
												{player.result === 'BLACKJACK' ? 'BJ' : player.result}
											</div>
										)}
									</div>
								</div>
							</div>
						);
					})}
				</div>

				<div style={{ height: '50px' }}>
					{status === 'ENDED' && (
						<button className="button" onClick={() => dispatch(actions.reset())}>
							Reset Game
						</button>
					)}
				</div>
			</div>
		</div>
	);
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<React.StrictMode>
		<Provider store={store}>
			<Game />
		</Provider>
	</React.StrictMode>
);
