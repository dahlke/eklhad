import { connect } from "react-redux";
import Map from "../component/map/Map";

const mapStateToProps = (state) => ({
		locations: state.locations,
	});

// const mapDispatchToProps = (dispatch) => ({});
const mapDispatchToProps = () => ({});

export default connect(mapStateToProps, mapDispatchToProps)(Map);
