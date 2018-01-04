import React from "react";
import { connect } from "react-redux";
import Card from "../framework/card";
import computeResponsive from "../../util/computeResponsive";
import { titleFont, headerFont, medGrey, darkGrey } from "../../globalStyles";
import { applyFilter, changeDateFilter } from "../../actions/treeProperties";
import { prettyString } from "../../util/stringHelpers";
import { displayFilterValueAsButton } from "../framework/footer";
import { CHANGE_TREE_ROOT_IDX } from "../../actions/types";

const resetTreeButton = (dispatch) => {
  return (
    <div
      className={`boxed-item active-clickable`}
      style={{paddingLeft: '5px', paddingRight: '5px', display: "inline-block"}}
      onClick={() => dispatch({type: CHANGE_TREE_ROOT_IDX, idxOfInViewRootNode: 0})}
    >
      {"View entire tree."}
    </div>
  );
};

const months = {
  '01': 'Jan',
  '02': 'Feb',
  '03': 'Mar',
  '04': 'Apr',
  '05': 'May',
  '06': 'Jun',
  '07': 'Jul',
  '08': 'Aug',
  '09': 'Sep',
  '10': 'Oct',
  '11': 'Nov',
  '12': 'Dec'
};

const plurals = {
  country: "countries",
  authors: "authors"
};

const pluralise = (word, n) => {
  if (n === 1) {
    return word === "authors" ? "author" : word;
  }
  return plurals[word] !== undefined ? plurals[word] : word + 's';
};

const styliseDateRange = (dateStr) => {
  // 2012-01-22
  const fields = dateStr.split('-');
  return `${months[fields[1]]} ${fields[0]}`;
};

const getNumSelectedTips = (nodes, visibility) => {
  let count = 0;
  nodes.forEach((d, idx) => {
    if (!d.hasChildren && visibility[idx] === "visible") count += 1;
  });
  return count;
};

export const createSummary = (virus_count, nodes, filters, visibility, visibleStateCounts, idxOfInViewRootNode, dateMin, dateMax) => {
  const nSelectedSamples = getNumSelectedTips(nodes, visibility);
  const summary = [];
  if (idxOfInViewRootNode === 0) {
    summary.push(`Showing ${nSelectedSamples} of ${virus_count} genomes`);
  } else {
    summary.push(`Showing ${nSelectedSamples} of ${nodes[idxOfInViewRootNode].fullTipCount} genomes in the selected clade`);
  }
  Object.keys(filters).forEach((filterName) => {
    const n = Object.keys(visibleStateCounts[filterName]).length;
    summary.push((`from ${n} ${pluralise(filterName, n)}`));
  });
  summary.push(`dated ${styliseDateRange(dateMin)} to ${styliseDateRange(dateMax)}`);
  return summary;
};

@connect((state) => {
  return {
    s3bucket: state.datasets.s3bucket,
    browserDimensions: state.browserDimensions.browserDimensions,
    filters: state.controls.filters,
    mapAnimationPlayPauseButton: state.controls.mapAnimationPlayPauseButton,
    metadata: state.metadata,
    nodes: state.tree.nodes,
    idxOfInViewRootNode: state.tree.idxOfInViewRootNode,
    visibleStateCounts: state.tree.visibleStateCounts,
    totalStateCounts: state.tree.totalStateCounts,
    visibility: state.tree.visibility,
    dateMin: state.controls.dateMin,
    dateMax: state.controls.dateMax,
    absoluteDateMin: state.controls.absoluteDateMin,
    absoluteDateMax: state.controls.absoluteDateMax
  };
})
class Info extends React.Component {
  constructor(props) {
    super(props);
  }
  static propTypes = {
    sidebar: React.PropTypes.bool.isRequired,
    sidebarRight: React.PropTypes.bool.isRequired,
    filters: React.PropTypes.object.isRequired,
    metadata: React.PropTypes.object, // not required. starts as null
    nodes: React.PropTypes.array, // not required. starts as null
    visibility: React.PropTypes.array, // not required. starts as null
    dispatch: React.PropTypes.func.isRequired,
    idxOfInViewRootNode: React.PropTypes.number
  }
  getStyles(responsive) {
    let fontSize = 32;
    if (this.props.browserDimensions.width < 1000) {
      fontSize = 30;
    }
    if (this.props.browserDimensions.width < 800) {
      fontSize = 28;
    }
    if (this.props.browserDimensions.width < 600) {
      fontSize = 26;
    }
    if (this.props.browserDimensions.width < 400) {
      fontSize = 24;
    }
    return {
      base: {
        width: responsive.width + 34,
        display: "inline-block",
        lineHeight: 1.4
      },
      title: {
        fontFamily: titleFont,
        fontSize: fontSize,
        marginLeft: 5,
        marginTop: 0,
        marginBottom: 5,
        fontWeight: 300,
        color: darkGrey,
        letterSpacing: "-1px",
        maxWidth: responsive.width
      },
      n: {
        fontFamily: headerFont,
        fontSize: 14,
        marginLeft: 10,
        marginTop: 5,
        marginBottom: 5,
        fontWeight: 500,
        color: medGrey
      }
    };
  }

  getNumSelectedAuthors() {
    if (!Object.prototype.hasOwnProperty.call(this.props.filters, "authors") || this.props.filters.authors.length === 0) {
      return Object.keys(this.props.metadata.author_info).length;
    }
    return this.props.filters.authors.length;
  }
  addFilteredDatesButton(buttons) {
    buttons.push(
      <div key={"timefilter"} style={{display: "inline-block"}}>
        <div
          className={'boxed-item-icon'}
          onClick={() => {
            this.props.dispatch(changeDateFilter({newMin: this.props.absoluteDateMin, newMax: this.props.absoluteDateMax}));
          }}
          role="button"
          tabIndex={0}
        >
          {'\xD7'}
        </div>
        <div className={"boxed-item active-with-icon"}>
          {`${styliseDateRange(this.props.dateMin)} to ${styliseDateRange(this.props.dateMax)}`}
        </div>
      </div>
    );
  }
  addNonAuthorFilterButton(buttons, filterName) {
    this.props.filters[filterName].sort().forEach((itemName) => {
      const display = (
        <g>
          {prettyString(itemName)}
          {" (" + this.props.totalStateCounts[filterName][itemName] + ")"}
        </g>
      );
      buttons.push(displayFilterValueAsButton(this.props.dispatch, this.props.filters, filterName, itemName, display, true));
    });
  }
  clearFilterButton(field) {
    return (
      <span
        style={{cursor: "pointer", color: '#5097BA'}}
        key={field}
        onClick={() => this.props.dispatch(applyFilter(field, []))}
        role="button"
        tabIndex={0}
      >
        {field}
      </span>
    );
  }

  addFilteredAuthorsButton(buttons) {
    if (!this.props.metadata.author_info) {return;}
    const nTotalAuthors = Object.keys(this.props.metadata.author_info).length;
    const nSelectedAuthors = this.getNumSelectedAuthors(); // will be equal to nTotalAuthors if none selected
    /* case 1 (no selected authors) - return now. */
    if (nTotalAuthors === nSelectedAuthors) {return;}
    const authorInfo = this.props.filters.authors.map((v) => {
      const n = this.props.totalStateCounts.authors[v];
      return {
        name: v,
        label: (
          <g>
            {prettyString(v, {stripEtAl: true})}
            <i>{" et al, "}</i>
            {`(n=${n})`}
          </g>
        ),
        longlabel: (
          <g>
            {prettyString(v, {stripEtAl: true})}
            <i>{" et al, "}</i>
            {prettyString(this.props.metadata.author_info[v].title)}
            {` (n=${n})`}
          </g>
        )
      };
    });
    /* case 2: 1 or 2 authors selected */
    if (nSelectedAuthors > 0 && nSelectedAuthors < 3) {
      authorInfo.forEach((d) => (
        buttons.push(
          displayFilterValueAsButton(this.props.dispatch, this.props.filters, "authors", d.name, d.longlabel, true)
        )
      ));
      return;
    }
    /* case 3: more than 2 authors selected. */
    authorInfo.forEach((d) => (
      buttons.push(
        displayFilterValueAsButton(this.props.dispatch, this.props.filters, "authors", d.name, d.label, true)
      )
    ));
  }

  render() {
    if (!this.props.metadata || !this.props.nodes || !this.props.visibility) return null;
    const responsive = computeResponsive({
      horizontal: 1,
      vertical: 1.0,
      browserDimensions: this.props.browserDimensions,
      sidebar: this.props.sidebar,
      sidebarRight: this.props.sidebarRight,
      minHeight: 480,
      maxAspectRatio: 1.0
    });
    const styles = this.getStyles(responsive);
    // const nSelectedAuthors = this.getNumSelectedAuthors();
    // const filtersWithValues = Object.keys(this.props.filters).filter((n) => this.props.filters[n].length > 0);
    const animating = this.props.mapAnimationPlayPauseButton === "Pause";
    const datesMaxed = this.props.dateMin === this.props.absoluteDateMin && this.props.dateMax === this.props.absoluteDateMax;
    let title = "";
    if (this.props.metadata.title) {
      title = this.props.metadata.title;
    }

    /* the content is made up of two parts:
    (1) the summary - e.g. Showing 4 of 379 sequences, from 1 author, 1 country and 1 region, dated Apr 2016 to Jun 2016.
    (2) The active filters: Filtered to [[Metsky et al Zika Virus Evolution And Spread In The Americas (76)]], [[Colombia (28)]].
    */

    const summary = createSummary(this.props.metadata.virus_count, this.props.nodes, this.props.filters, this.props.visibility, this.props.visibleStateCounts, this.props.idxOfInViewRootNode, this.props.dateMin, this.props.dateMax);

    /* part II - the active filters */
    const filters = [];
    this.addFilteredAuthorsButton(filters);
    Object.keys(this.props.filters)
      .filter((n) => n !== "authors")
      .filter((n) => this.props.filters[n].length > 0)
      .forEach((n) => this.addNonAuthorFilterButton(filters, n));
    if (!datesMaxed) {this.addFilteredDatesButton(filters);}

    return (
      <Card center infocard>
        <div style={styles.base}>
          <div width={responsive.width} style={styles.title}>
            {title}
          </div>
          <div width={responsive.width} style={styles.n}>
            {/* if staging, let the user know */}
            {this.props.s3bucket === "staging" ? (
              <span style={{color: darkGrey}}>{"Currently viewing data from the staging server. "}</span>
            ) : null}
            {animating ? `Map animation in progress. ` : null}
            {/* part 1 - the summary */}
            {!animating ? summary.map((d, i) =>
              (i + 1 !== summary.length ? <span key={i}>{`${d}, `}</span> : <span key={i}>{`${d}. `}</span>)
            ) : null}
            {/* part 2 - the filters */}
            {!animating && filters.length ? (
              <span>
                {"Filtered to "}
                {filters.map((d) => d)}
                {". "}
              </span>
            ) : null}
            {/* finally - is a branch selected? */}
            {this.props.idxOfInViewRootNode === 0 ? null :
              resetTreeButton(this.props.dispatch)}
          </div>
        </div>
      </Card>
    );
  }
}
export default Info;
