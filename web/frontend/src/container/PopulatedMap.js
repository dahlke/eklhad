// Import necessary dependencies
import { connect } from "react-redux";
import Map from "../component/map/Map";

// Map Redux state to component props
const mapStateToProps = (state) => ({
	locations: state.locations.items,
});

// Map Redux dispatch to component props (currently empty)
const mapDispatchToProps = () => ({});

// Connect the Map component to Redux store
export default connect(mapStateToProps, mapDispatchToProps)(Map);
