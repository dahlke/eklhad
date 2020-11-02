import { connect } from "react-redux";

import LinksList from "../component/linksList/LinksList";
import moment from "moment";

function _sortByTimestamp(data) {
	data = data ? data : [];

	data.sort((a, b) => {
		return b.timestamp - a.timestamp;
	});

	return data;
}

function _processBlogs(blogs) {
	blogs.forEach((blog) => {
		const d = moment.unix(blog.timestamp).format("YYYY-MM-DD");
		blog.date = d;
	});

	return _sortByTimestamp(blogs);
}

const mapStateToProps = (state) => {
	const sortedLinks = _sortByTimestamp(state.links.items);
	const sortedBlogs = _processBlogs(state.blogs.items);

	return {
		links: sortedLinks,
		blogs: sortedBlogs,
	};
};

const mapDispatchToProps = (dispatch) => ({});

export default connect(mapStateToProps, mapDispatchToProps)(LinksList);
