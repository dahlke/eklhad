import { REQUEST_GITHUB_EVENTS, RECEIVE_GITHUB_EVENTS } from "../actions/github";

const github_events = (state = { items: [] }, action) => {
    switch (action.type) {
        case REQUEST_GITHUB_EVENTS:
            return Object.assign({}, state, {
                isFetching: true,
            });
        case RECEIVE_GITHUB_EVENTS:
            return Object.assign({}, state, {
                isFetching: false,
                items: action.github_events,
                lastUpdated: action.receivedAt,
            });
        default:
            return state;
    }
};

export default github_events;
