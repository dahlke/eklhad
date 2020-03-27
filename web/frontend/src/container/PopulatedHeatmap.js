import { connect } from 'react-redux'
import { setActivityVisibilityFilter } from '../actions'

import Heatmap from '../component/heatmap/Heatmap'
import moment from "moment";

function _processInstagrams(data) {
    data = data ? data : [];

    // TODO: use the same keys across data stream type
    data.sort((a, b) => {
      return b.taken_at_timestamp - a.taken_at_timestamp;
    });

    return data;
}

function _processLinks(data) {
    data = data ? data : [];

    data.sort((a, b) => {
      return b.timestamp - a.timestamp;
    });

    return data
}

function _processHeatmapDateMap(instagrams, links) {
    var heatmapDateMap = {};

    links.forEach((link) => {
      const d = moment.unix(link.timestamp).format("YYYY-MM-DD");
      link.date = d;
      if (!heatmapDateMap[d]) {
        heatmapDateMap[d] = {
          instagrams: [],
          links: []
        };
      }
      heatmapDateMap[d]["links"].push(link);
    });

    instagrams.forEach((instagram) => {
      const d = moment.unix(instagram.taken_at_timestamp).format("YYYY-MM-DD");
      instagram.date = d;
      if (!heatmapDateMap[d]) {
        heatmapDateMap[d] = {
          instagrams: [],
          links: []
        };
      }
      heatmapDateMap[d]["instagrams"].push(instagram);
    });

    return heatmapDateMap;
}


const mapStateToProps = (state) => {
  const sortedInstagrams = _processInstagrams(state.instagrams.items)
  const sortedLinks = _processLinks(state.links.items)
  const heatmapDateMap = _processHeatmapDateMap(sortedInstagrams, sortedLinks)

  return {
    instagrams: sortedInstagrams,
    links: sortedLinks,
    heatmapDateMap: heatmapDateMap,
    activityVisibilityFilter: state.activityVisibilityFilter
  }
}

const mapDispatchToProps = dispatch => ({
  setActivityVisibilityFilter: filter => dispatch(setActivityVisibilityFilter(filter))
})

export default connect(mapStateToProps, mapDispatchToProps)(Heatmap)