import {
  REQUEST_INSTAGRAMS,
  RECEIVE_INSTAGRAMS
} from '../actions'


const instagrams = (state = {items: []}, action) => {
  switch (action.type) {
    case REQUEST_INSTAGRAMS:
      return Object.assign({}, state, {
        isFetching: true
      })
    case RECEIVE_INSTAGRAMS:
      return Object.assign({}, state, {
        isFetching: false,
        items: action.instagrams,
        lastUpdated: action.receivedAt
      })
    default:
      return state
  }
}


export default instagrams