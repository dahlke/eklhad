import { connect } from "react-redux";

import LinksList from "../component/linksList/LinksList";

function _sortByTimestamp(data) {
	data = data ? data : [];

	data.sort((a, b) => {
		return b.timestamp - a.timestamp;
	});

	return data;
}

const mapStateToProps = (state) => {
	const sortedLinks = _sortByTimestamp(state.links.items);

	return {
		links: sortedLinks,
	};
};

const mapDispatchToProps = (dispatch) => ({});

export default connect(mapStateToProps, mapDispatchToProps)(LinksList);
