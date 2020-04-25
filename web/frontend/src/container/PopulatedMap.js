import { connect } from "react-redux";
import Map from "../component/map/Map";

// TODO: handle currentLocation
const mapStateToProps = (state) => ({
	locations: state.locations,
	// currentLocation: state.currentLocation
});

const mapDispatchToProps = (dispatch) => ({});

export default connect(mapStateToProps, mapDispatchToProps)(Map);
