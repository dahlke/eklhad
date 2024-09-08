// Import necessary dependencies
import { connect } from "react-redux";
import App from "../App";

// Map Redux state to component props
const mapStateToProps = (state) => ({
	gravatar: state.gravatar,
});

// Map Redux dispatch to component props (currently empty)
// const mapDispatchToProps = (dispatch) => ({});
const mapDispatchToProps = () => ({});

// Connect the App component to Redux store
export default connect(mapStateToProps, mapDispatchToProps)(App);
