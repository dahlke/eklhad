import { connect } from "react-redux";
import Map from "../component/map/Map";

const mapStateToProps = (state) => {
	return {
		locations: state.locations,
	};
};

const mapDispatchToProps = (dispatch) => ({});

export default connect(mapStateToProps, mapDispatchToProps)(Map);
