import { REQUEST_GRAVATAR, RECEIVE_GRAVATAR } from "../actions/gravatar";

interface GravatarState {
    email: string;
    isFetching?: boolean;
    lastUpdated?: number;
}

interface GravatarAction {
    type: string;
    gravatar?: string;
    receivedAt?: number;
}

const gravatar = (state: GravatarState = { email: "" }, action: GravatarAction): GravatarState => {
	switch (action.type) {
		case REQUEST_GRAVATAR:
			return { ...state, isFetching: true };
		case RECEIVE_GRAVATAR:
			return {
				...state,
				isFetching: false,
				email: action.gravatar || "",
				lastUpdated: action.receivedAt,
			};
		default:
			return state;
	}
};

export default gravatar;
