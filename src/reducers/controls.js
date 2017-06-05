/*eslint dot-notation: 0*/
import * as types from "../actions/types";
import * as globals from "../util/globals";
import getColorScale from "../util/getColorScale";
import moment from 'moment';
import d3 from "d3";
import { determineColorByGenotypeType } from "../util/urlHelpers";

const checkLikelihood = function (attrs, colorBy) {
  if (attrs.indexOf(colorBy + "_likelihoods") > -1) {
    return {display: true, on: false};
  }
  return {display: false, on: false};
};

const getMinDateViaRoot = function (rootAttr) {
  const rootDate = Object.keys(rootAttr).indexOf("num_date_confidence") > -1 ?
    rootAttr.num_date_confidence[0] : rootAttr.num_date;
  const years = rootDate.toString().split(".")[0];
  let days = Math.floor(rootDate % 1 * 365.25).toString();
  if (days === "0") {days = 1;}
  const root = moment("".concat(years, "-", days), "Y-DDD");
  root.subtract(1, "days"); /* slider should be earlier than actual day */
  return root;
};

/* defaultState is a fn so that we can re-create it
at any time, e.g. if we want to revert things (e.g. on dataset change)
*/
const getDefaultState = function () {
  return {
    showBranchLabels: false,
    selectedLegendItem: null,
    selectedBranch: null,
    selectedNode: null,
    region: null,
    search: null,
    strain: null,
    mutType: globals.mutType,
    confidence: {exists: false, display: false, on: false},
    layout: globals.defaultLayout,
    distanceMeasure: globals.defaultDistanceMeasure,
    dateMin: moment().subtract(globals.defaultDateRange, "years").format("YYYY-MM-DD"),
    dateMax: moment().format("YYYY-MM-DD"),
    absoluteDateMin: moment().subtract(globals.defaultDateRange, "years").format("YYYY-MM-DD"),
    absoluteDateMax: moment().format("YYYY-MM-DD"),
    colorBy: globals.defaultColorBy,
    colorByLikelihood: {display: false, on: false},
    colorScale: getColorScale(globals.defaultColorBy, {}, {}, {}, 1),
    analysisSlider: false,
    geoResolution: globals.defaultGeoResolution,
    datasetPathName: "",
    filters: {},
    dateScale: d3.time.scale().domain([new Date(2000, 0, 0), new Date(2100, 0, 0)]).range([2000, 2100]),
    dateFormat: d3.time.format("%Y-%m-%d")
  };
};

const Controls = (state = getDefaultState(), action) => {
  switch (action.type) {
  case types.NEW_DATASET:
    const base = getDefaultState();
    base["datasetPathName"] = action.datasetPathName;
    const rootDate = getMinDateViaRoot(action.tree.attr);
    base["dateMin"] = rootDate.format("YYYY-MM-DD");
    base["absoluteDateMin"] = rootDate.format("YYYY-MM-DD");
    /* overwrite base state with data from the metadata JSON */
    if (action.meta.date_range) {
      if (action.meta.date_range.date_min) {
        if (rootDate.isBefore(moment(action.meta.date_range.date_min, "YYYY-MM-DD"))) {
          base["dateMin"] = action.meta.date_range.date_min;
        }
      }
      if (action.meta.date_range.date_max) {
        /* this may be useful if, e.g., one were to want to display an outbreak
        from 2000-2005 (the default is the present day) */
        base["dateMax"] = action.meta.date_range.date_max;
        base["absoluteDateMax"] = action.meta.date_range.date_max;
      }
    }
    if (action.meta.analysisSlider) {
      base["analysisSlider"] = {key: action.meta.analysisSlider, valid: false};
    }
    if (action.meta.defaults) {
      if (action.meta.defaults.geoResolution) {
        base["geoResolution"] = action.meta.defaults.geoResolution;
      }
      if (action.meta.defaults.colorBy) {
        base["colorBy"] = action.meta.defaults.colorBy;
      }
      if (action.meta.defaults.distanceMeasure) {
        base["distanceMeasure"] = action.meta.defaults.distanceMeasure;
      }
      if (action.meta.defaults.layout) {
        base["layout"] = action.meta.defaults.layout;
      }
    }
    /* now overwrite state with data from the URL */
    if (action.query.l) {
      base["layout"] = action.query.l;
    }
    if (action.query.m) {
      base["distanceMeasure"] = action.query.m;
    }
    if (action.query.c) {
      base["colorBy"] = action.query.c;
    }
    if (action.query.r) {
      base["geoResolution"] = action.query.r;
    }
    if (action.query.dmin) {
      base["dateMin"] = action.query.dmin;
    }
    if (action.query.dmax) {
      base["dateMax"] = action.query.dmax;
    }
    base["confidence"] = Object.keys(action.tree.attr).indexOf("num_date_confidence") > -1 ?
      {exists: true, display: true, on: false} : {exists: false, display: false, on: false};
    if (base.confidence.exists && base.layout !== "rect") {
      base.confidence.display = false;
    }
    /* basic sanity checking */
    if (Object.keys(action.meta.color_options).indexOf(base["colorBy"]) === -1) {
      /* ideally, somehow, a notification is dispatched, but redux, unlike elm,
      doesn't allow dispatches from the reducer */
      // throw new Error("colorBy (" + base["colorBy"] + ") not available.");
      const available_colorBy = Object.keys(action.meta.color_options);
      /* remove "gt" */
      if (available_colorBy.indexOf("gt") > -1) {
        available_colorBy.splice(available_colorBy.indexOf("gt"), 1);
      }
      base["colorBy"] = available_colorBy[0];
    }
    /* available tree attrs - based upon the root node */
    base["attrs"] = Object.keys(action.tree.attr);
    base["colorByLikelihood"] = checkLikelihood(base["attrs"], base["colorBy"]);
    return base;
  case types.TOGGLE_BRANCH_LABELS:
    return Object.assign({}, state, {
      showBranchLabels: !state.showBranchLabels
    });
  case types.LEGEND_ITEM_MOUSEENTER:
    return Object.assign({}, state, {
      selectedLegendItem: action.data
    });
  case types.LEGEND_ITEM_MOUSELEAVE:
    return Object.assign({}, state, {
      selectedLegendItem: null
    });
  case types.BRANCH_MOUSEENTER:
    return Object.assign({}, state, {
      selectedBranch: action.data
    });
  case types.BRANCH_MOUSELEAVE:
    return Object.assign({}, state, {
      selectedBranch: null
    });
  case types.NODE_MOUSEENTER:
    return Object.assign({}, state, {
      selectedNode: action.data
    });
  case types.NODE_MOUSELEAVE:
    return Object.assign({}, state, {
      selectedNode: null
    });
  case types.CHANGE_LAYOUT:
    const layout = action.data;
    /* if confidence and layout !== rect then disable confidence toggle */
    const confidence = Object.assign({}, state.confidence);
    if (confidence.exists) {
      confidence.display = layout === "rect";
    }
    return Object.assign({}, state, {
      layout,
      confidence
    });
  case types.CHANGE_DISTANCE_MEASURE:
    /* while this may change, div currently doesn't have CIs,
    so they shouldn't be displayed. The SVG el's still exist, they're just of
    width zero */
    if (state.confidence.exists) {
      if (state.confidence.display && action.data === "div") {
        return Object.assign({}, state, {
          distanceMeasure: action.data,
          confidence: Object.assign({}, state.confidence, {display: false})
        });
      } else if (state.layout === "rect" && action.data === "num_date") {
        return Object.assign({}, state, {
          distanceMeasure: action.data,
          confidence: Object.assign({}, state.confidence, {display: true})
        });
      }
    }
    return Object.assign({}, state, {
      distanceMeasure: action.data
    });
  case types.CHANGE_DATE_MIN:
    return Object.assign({}, state, {
      dateMin: action.data
    });
  case types.CHANGE_DATE_MAX:
    return Object.assign({}, state, {
      dateMax: action.data
    });
  case types.CHANGE_ABSOLUTE_DATE_MIN:
    return Object.assign({}, state, {
      absoluteDateMin: action.data
    });
  case types.CHANGE_ABSOLUTE_DATE_MAX:
    return Object.assign({}, state, {
      absoluteDateMax: action.data
    });
  case types.CHANGE_COLOR_BY:
    const newState = Object.assign({}, state, {
      colorBy: action.data,
      colorByLikelihood: checkLikelihood(state.attrs, action.data)
    });
    /* may need to toggle the entropy selector AA <-> NUC */
    if (determineColorByGenotypeType(action.data)) {
      newState.mutType = determineColorByGenotypeType(action.data);
    }
    return newState;
  case types.SET_COLOR_SCALE:
    return Object.assign({}, state, {
      colorScale: action.data
    });
  case types.CHANGE_GEO_RESOLUTION:
    return Object.assign({}, state, {
      geoResolution: action.data
    });
  case types.APPLY_FILTER_QUERY:
    // values arrive as array
    const filters = Object.assign({}, state.filters, {});
    filters[action.fields] = action.values;
    // console.log(filters)
    return Object.assign({}, state, {
      filters
    });
  case types.TOGGLE_MUT_TYPE:
    return Object.assign({}, state, {
      mutType: action.data
    });
  case types.TOGGLE_COLORBY_LIKELIHOOD:
    return Object.assign({}, state, {
      colorByLikelihood: {
        display: state.colorByLikelihood.display,
        on: !state.colorByLikelihood.on
      }
    });
  case types.TOGGLE_CONFIDENCE:
    return Object.assign({}, state, {
      confidence: Object.assign({}, state.confidence, {
        on: !state.confidence.on
      })
    });
  case types.ANALYSIS_SLIDER:
    if (action.destroy) {
      return Object.assign({}, state, {
        analysisSlider: false
      });
    }
    return Object.assign({}, state, {
      analysisSlider: {
        key: state.analysisSlider.key,
        // valid: true, // TESTING ONLY
        valid: false, // FIXME --- This is a temporary hack to disable the analysis slider, while keeping color options
        value: action.maxVal,
        absoluteMinVal: action.minVal,
        absoluteMaxVal: action.maxVal
      }
    });
  case types.CHANGE_ANALYSIS_VALUE:
    return Object.assign({}, state, {
      analysisSlider: Object.assign({}, state.analysisSlider, {
        value: action.value
      }
    )});
  default:
    return state;
  }
};

export default Controls;
