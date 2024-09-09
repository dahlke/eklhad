// Import necessary dependencies
import { connect, ConnectedProps } from "react-redux";
import App from "../App";
import { RootState } from "../reducers";

// Map Redux state to component props
const mapStateToProps = (state: RootState) => ({
	gravatar: state.gravatar,
});

// Map Redux dispatch to component props (currently empty)
// const mapDispatchToProps = (dispatch: Dispatch) => ({});
const mapDispatchToProps = () => ({});

// Create connector
const connector = connect(mapStateToProps, mapDispatchToProps);

// Infer the connected props type
type PropsFromRedux = ConnectedProps<typeof connector>;

// Connect the App component to Redux store
export default connector(App as React.ComponentType<PropsFromRedux>);
