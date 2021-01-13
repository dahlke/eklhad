import { connect } from "react-redux";
import App from "../App";

const mapStateToProps = (state) => ({
	gravatar: state.gravatar,
});

// const mapDispatchToProps = (dispatch) => ({});
const mapDispatchToProps = () => ({});

export default connect(mapStateToProps, mapDispatchToProps)(App);
