import { REQUEST_GRAVATAR, RECEIVE_GRAVATAR } from "../actions/gravatar";

const gravatar = (state = { email: "" }, action) => {
	switch (action.type) {
		case REQUEST_GRAVATAR:
			return { ...state, isFetching: true };
		case RECEIVE_GRAVATAR:
			return {
				...state,
				isFetching: false,
				email: action.gravatar,
				lastUpdated: action.receivedAt,
			};
		default:
			return state;
	}
};

export default gravatar;
