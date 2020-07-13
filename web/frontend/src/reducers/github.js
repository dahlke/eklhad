import { REQUEST_GITHUB_EVENTS, RECEIVE_GITHUB_EVENTS, REQUEST_GITHUB_ACTIVITY, RECEIVE_GITHUB_ACTIVITY } from "../actions/github";

const github = (state = { events:[], activity: [] }, action) => {
    switch (action.type) {
        case REQUEST_GITHUB_ACTIVITY:
            return Object.assign({}, state, {
                isFetching: true,
            });
        case RECEIVE_GITHUB_ACTIVITY:
            return Object.assign({}, state, {
                isFetching: false,
                activity: action.githubActivity,
                lastUpdated: action.receivedAt,
            });
        default:
            return state;
    }
};

export default github;
