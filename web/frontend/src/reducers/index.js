import { combineReducers } from 'redux'
import locations from './locations'
import links from './links'
import instagrams from './instagrams'
import activityVisibilityFilter from './activityVisibilityFilter'

export default combineReducers({
  locations,
  links,
  instagrams,
  activityVisibilityFilter
})
