import queryString from "query-string";
import * as types from "../actions/types";

/* What is this middleware?
This middleware acts to keep the app state and the URL query state in sync by intercepting actions
and updating the URL accordingly. Thus, in theory, this middleware can be disabled and the app will still work
as expected
*/

// eslint-disable-next-line
export const changeURLMiddleware = (store) => (next) => (action) => {
  const state = store.getState(); // this is "old" state, i.e. before the reducers have updated by this action
  const result = next(action); // send action to other middleware / reducers
  // if (action.dontModifyURL !== undefined) {
  //   console.log("changeURL middleware skipped")
  //   return result;
  // }

  /* starting URL values & flags */
  let query = queryString.parse(window.location.search);
  let pathname = window.location.pathname;

  /* first switch: query change */
  switch (action.type) {
    case types.NEW_COLORS:
      query.c = action.colorBy === state.controls.defaults.colorBy ? undefined : action.colorBy;
      break;
    case types.APPLY_FILTER: {
      query[`f_${action.fields}`] = action.values.join(',');
      break;
    }
    case types.CHANGE_LAYOUT: {
      query.l = action.data === state.controls.defaults.layout ? undefined : action.data;
      break;
    }
    case types.CHANGE_GEO_RESOLUTION: {
      query.r = action.data === state.controls.defaults.geoResolution ? undefined : action.data;
      break;
    }
    case types.CHANGE_DISTANCE_MEASURE: {
      query.m = action.data === state.controls.defaults.distanceMeasure ? undefined : action.data;
      break;
    }
    case types.CHANGE_PANEL_LAYOUT: {
      query.p = action.notInURLState === true ? undefined : action.data;
      break;
    }
    case types.CHANGE_DATES_VISIBILITY_THICKNESS: {
      if (state.controls.mapAnimationPlayPauseButton === "Pause") { // animation in progress - no dates in URL
        query.dmin = undefined;
        query.dmax = undefined;
      } else {
        query.dmin = action.dateMin === state.controls.absoluteDateMin ? undefined : action.dateMin;
        query.dmax = action.dateMax === state.controls.absoluteDateMax ? undefined : action.dateMax;
      }
      break;
    }
    case types.MAP_ANIMATION_PLAY_PAUSE_BUTTON:
      if (action.data === "Play") { // animation stopping - restore dates in URL
        query.dmin = state.controls.dateMin === state.controls.absoluteDateMin ? undefined : state.controls.dateMin;
        query.dmax = state.controls.dateMax === state.controls.absoluteDateMax ? undefined : state.controls.dateMax;
      }
      break;
    case types.URL_QUERY_CHANGE:
      query = action.query;
      break;
    case types.PAGE_CHANGE:
      if (action.query) {
        query = action.query;
      } else if (action.page !== state.datasets.page) {
        query = {};
      }
      break;
    default:
      break;
  }

  /* second switch: path change */
  switch (action.type) {
    case types.PAGE_CHANGE:
      /* desired behaviour depends on the page selected... */
      if (action.page === "app") {
        pathname = action.datapath.replace(/_/g, "/");
      } else if (action.page === "splash") {
        pathname = "/";
      } else if (pathname.startsWith(`/${action.page}`)) {
        // leave the pathname alone!
      } else {
        pathname = action.page;
      }
      break;
    case types.NEW_POST:
      // strip out "post_..."" and ".md" from name. Should fix elsewhere!
      pathname = "/posts/" + action.name.replace("post_", "").replace(".md", "");
      break;
    default:
      break;
  }

  Object.keys(query).filter((k) => !query[k]).forEach((k) => delete query[k]);
  let search = queryString.stringify(query).replace(/%2C/g, ',');
  if (search) {search = "?" + search;}
  if (!pathname.startsWith("/")) {pathname = "/" + pathname;}

  if (pathname !== window.location.pathname || window.location.search !== search) {
    let newURLString = pathname;
    if (search) {newURLString += search;}
    // if (pathname !== window.location.pathname) {console.log(pathname, window.location.pathname)}
    // if (window.location.search !== search) {console.log(window.location.search, search)}
    // console.log(`Action ${action.type} Changing URL from ${window.location.href} -> ${newURLString} (pushState: ${action.pushState})`);
    if (action.pushState === true) {
      window.history.pushState({}, "", newURLString);
    } else {
      window.history.replaceState({}, "", newURLString);
    }
    next({type: types.URL, path: pathname, query: search});
  }

  return result;
};
