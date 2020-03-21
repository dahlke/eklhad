import { connect } from 'react-redux'
import { toggleTodo } from '../actions'
import Map from '../component/map/Map'


const mapStateToProps = state => ({
  locations: state.locations,
  // currentLocation: state.currentLocation
})

const mapDispatchToProps = dispatch => ({

})

export default connect(mapStateToProps, mapDispatchToProps)(Map)