import { combineReducers } from 'redux'
import locations from './locations'
import visibilityFilter from './visibilityFilter'

export default combineReducers({
  locations,
  visibilityFilter
})
