import { REQUEST_TWEETS, RECEIVE_TWEETS } from "../actions/tweets";

const tweets = (state = { items: [] }, action) => {
	switch (action.type) {
		case REQUEST_TWEETS:
			return Object.assign({}, state, {
				isFetching: true,
			});
		case RECEIVE_TWEETS:
			return Object.assign({}, state, {
				isFetching: false,
				items: action.tweets,
				lastUpdated: action.receivedAt,
			});
		default:
			return state;
	}
};

export default tweets;
