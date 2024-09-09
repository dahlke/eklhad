// Import necessary dependencies
import { connect, ConnectedProps } from "react-redux";
import Map from "../component/map/Map";
import { RootState } from "../reducers";

// Map Redux state to component props
const mapStateToProps = (state: RootState) => ({
	locations: state.locations.items,
});

// Map Redux dispatch to component props (currently empty)
const mapDispatchToProps = () => ({});

// Create connector
const connector = connect(mapStateToProps, mapDispatchToProps);

// Infer the connected props type
type PropsFromRedux = ConnectedProps<typeof connector>;

// Connect the Map component to Redux store
export default connector(Map as React.ComponentType<PropsFromRedux>);
