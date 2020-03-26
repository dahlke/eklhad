import { combineReducers } from 'redux'
import locations from './locations'
import links from './links'
import instagrams from './instagrams'
import visibilityFilter from './visibilityFilter'

export default combineReducers({
  locations,
  links,
  instagrams,
  visibilityFilter
})
