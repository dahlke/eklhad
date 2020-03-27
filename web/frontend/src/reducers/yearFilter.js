import { YearFilters } from '../actions'

const YearFilter = (state = YearFilters["2020"], action) => {
  switch (action.type) {
    case 'SET_YEAR_FILTER':
      return action.filter.value
    default:
      return state
  }
}

export default YearFilter