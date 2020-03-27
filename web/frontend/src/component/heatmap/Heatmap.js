import React, { Component } from "react";
import Select from "react-select"
import { ActivityFilters, YearFilters } from '../../actions'
import PropTypes from 'prop-types';
import CalendarHeatmap from "react-calendar-heatmap";
import DateDetailList from "../../component/dateDetailList/DateDetailList";
import moment from "moment";

import "./Heatmap.scss";


class Heatmap extends Component {

    state = {
        yearFilter: parseInt(moment().subtract(0, "years").format("YYYY")),
        selectedActivityType: ActivityFilters.SHOW_ALL,
        selectedDate: null
    }

    /*
    // TODO: handle change of a filter
    // TODO: handle mobile
    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.state.selectedDate !== prevState.selectedDate && this.state.width <= BREAKPOINT_TABLET) {
        const dateDetailList = document.getElementById("DateDetailList")
        if (dateDetailList) {
            dateDetailList.scrollIntoView(false);
        }
        }
    }
    */

    _selectDate(cell) {
        this.setState({
            selectedDate: cell ? cell.date : null
        });
    }

    _selectYear(event) {
        this.setState({
            yearFilter: event.value,
            selectedDate: null
        });
    }

    // TODO: rename this class / classNames
    render() {
        const startDate = new Date(`${this.props.yearFilter}-01-01`);
        const endDate = new Date(`${this.props.yearFilter}-12-31`);
        const dataForDate = this.state.selectedDate ? this.props.heatmapDateMap[this.state.selectedDate] : [];
        const dateDetailList = this.state.selectedDate ? (
            <DateDetailList
                ref="date-detail-list"
                data={dataForDate}
            />
        ) : null;
        const isSelectedDateMap = parseInt(moment(this.state.selectedDate).format("YYYY")) === this.props.yearFilter;

        var mapVals = [];
        if (this.props.activityFilter === ActivityFilters.SHOW_ALL) {
            mapVals = this.props.links.concat(this.props.instagrams);
        } else if (this.props.activityFilter === ActivityFilters.SHOW_INSTAGRAMS) {
            mapVals = this.props.instagrams;
        } else if (this.props.activityFilter === ActivityFilters.SHOW_LINKS) {
            mapVals = this.props.links;
        }

        const yearOptions = Object.keys(YearFilters).reverse().map((key) => {
            return { value: key, label: key };
        });

        const activityOptions = Object.keys(ActivityFilters).map((key) => {
            return { value: key, label: key };
        });

        return (
            <div className="heatmap">
                <div className="select">
                <Select
                    options={yearOptions}
                    value={{value: this.props.yearFilter, label: this.props.yearFilter}}
                    onChange={this.props.setYearFilter}
                    isSearchable={false}
                />
                </div>

                <div className="select wide">
                <Select
                    options={activityOptions}
                    value={{value: this.props.activityFilter, label: this.props.activityFilter}}
                    onChange={this.props.setActivityFilter}
                    isSearchable={false}
                />
                </div>

                <h4>{this.props.year}</h4>
                <CalendarHeatmap
                    startDate={startDate}
                    endDate={endDate}
                    values={mapVals}
                    onClick={this._selectDate.bind(this)}
                    showMonthLabels={true}
                    showWeekdayLabels={true}
                    horizontal={this.props.horizontal}
                />
                {isSelectedDateMap ? dateDetailList : undefined}
            </div>
        );
    }
}

// TODO
Heatmap.propTypes = {
  instagrams: PropTypes.array,
  links: PropTypes.array
}

Heatmap.defaultProps = {
  instagrams: [],
  links: []
};

export default Heatmap;
