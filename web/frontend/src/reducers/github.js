import { REQUEST_GITHUB_EVENTS, RECEIVE_GITHUB_EVENTS } from "../actions/github";

const githubEvents = (state = { items: [] }, action) => {
    switch (action.type) {
        case REQUEST_GITHUB_EVENTS:
            return Object.assign({}, state, {
                isFetching: true,
            });
        case RECEIVE_GITHUB_EVENTS:
            return Object.assign({}, state, {
                isFetching: false,
                items: action.githubEvents,
                lastUpdated: action.receivedAt,
            });
        default:
            return state;
    }
};

export default githubEvents;
