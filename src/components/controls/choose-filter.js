import React from "react";
import PropTypes from 'prop-types';
import { filterAbbrFwd } from "../../util/globals";
import RecursiveFilter from "./recursive_filter";
import SelectLabel from "../framework/select-label";

/*
 * this component implements a series of selectors to select datasets.
 * the dataset hierarchy is specified in a datasets.json, currently
 * in ../../util/globals
*/
class ChooseFilter extends React.Component {
  constructor(props) {
    super(props);
  }
  static propTypes = {
    shortKey: PropTypes.string.isRequired,
    filterType: PropTypes.string.isRequired,
    filterOptions: PropTypes.object.isRequired
  }

  parseFilterQuery(query) {
    if (query===""){
      return {fields:[], filters:[]}
    } else {
      const tmp = query.split("-").map((d) => d.split("."));
      return {"fields": tmp.map( (d) => d[0] ), "filters": tmp.map( (d) => d[d.length - 1] )};
    }
  }


  render() {
    // pull out filter query

    // TODO GET THIS INFO FROM REDUX NOT THE URL
    // let filterQuery = this.props.location.query[this.props.filterType] || "";
    let filterQuery = ""; // this was broken above anyway
    // names of the current filters, i.e. [geo, north_america, mexico]
    const filters = this.parseFilterQuery(filterQuery).filters.map((d) => (filterAbbrFwd[d] || d) );
    //if (filters[filters.length-1]["value"] !== "all") { filters.push({"value":"all"}); }
    // pointer used to move through the hierarchy if filters -- currently at the top level
    let level = this.props.filterOptions;
    // fields will hold the accessor keys of the filter options in node.attr
    // those will be fed into query along with the choices
    const fields = [];
    // list to contain the pull-down menus for the different filters
    const selectors = [];
    for (let vi = 0; vi <= filters.length; vi++) {
      if (vi===filters.length || filters[vi]) {
        // pull options from the current level of the filter hierarchy, ignore 'name'
        const options = Object.keys(level).filter((d) => d !== "name");
        // memorize the number of items corresponding to each option
        const counts = options.map( (d) => level[d].count);
        // in case options exist, make a drop down menu
        if (options.length > 1 || vi === 0) {
          fields.push(level.name);
          selectors.push((
            <div key={vi} style={{marginBottom: 10}}>
              <RecursiveFilter
                shortKey={this.props.shortKey}
                filterType={this.props.filterType}
                filterTree={filters.slice(0, vi)}
                options={options}
                counts={counts}
                fields={fields}
              />
            </div>
          ));
        }
        // move to the next level in the filter hierarchy
        if (filters[vi] && level[filters[vi]]) {
          level = level[filters[vi]]["subcats"];
        } else {
          break;
        }
      }
    }
    // return a list of selectors in the order of the data set hierarchy
    return (
      <div>
        <SelectLabel text={this.props.filterType}/>
        {selectors}
      </div>
    );
  }
}

export default ChooseFilter;
