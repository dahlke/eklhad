import moment from "moment";
import { connect } from "react-redux";

import LinksList from "../component/linksList/LinksList";

function _sortByTimestamp(rawData) {
	const data = rawData || [];

	data.sort((a, b) => b.timestamp - a.timestamp);

	return data;
}

function _processBlogs(blogs) {
	blogs.map((blog) => {
		const processedBlog = blog;
		const d = moment.unix(processedBlog.timestamp).format("YYYY-MM-DD");
		processedBlog.date = d;

		return processedBlog;
	});

	return _sortByTimestamp(blogs);
}

const mapStateToProps = (state) => {
	// TODO: handle the items being undefined more cleanly
	const sortedLinks = _sortByTimestamp(state.links.items);
	const sortedBlogs = _processBlogs(state.blogs.items || []);

	return {
		links: sortedLinks,
		blogs: sortedBlogs,
	};
};

// const mapDispatchToProps = (dispatch) => ({});
const mapDispatchToProps = () => ({});

export default connect(mapStateToProps, mapDispatchToProps)(LinksList);
