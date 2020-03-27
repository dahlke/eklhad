import { ActivityVisibilityFilters } from '../actions'

const activityVisibilityFilter = (state = ActivityVisibilityFilters.SHOW_ALL, action) => {
  switch (action.type) {
    case 'SET_ACTIVITY_VISIBILITY_FILTER':
      return action.filter.value
    default:
      return state
  }
}

export default activityVisibilityFilter