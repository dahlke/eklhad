import { connect } from "react-redux";
import App from "../App";

const mapStateToProps = (state) => {
    return {
	    gravatar: state.gravatar
    }
};

const mapDispatchToProps = (dispatch) => ({});


export default connect(mapStateToProps, mapDispatchToProps)(App);
