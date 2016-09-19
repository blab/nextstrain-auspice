export const REQUEST_METADATA = "REQUEST_METADATA";
export const RECEIVE_METADATA = "RECEIVE_METADATA";
export const METADATA_FETCH_ERROR = "METADATA_FETCH_ERROR";
export const REQUEST_TREE = "REQUEST_TREE";
export const RECEIVE_TREE = "RECEIVE_TREE";
export const TREE_FETCH_ERROR = "TREE_FETCH_ERROR";
export const REQUEST_SEQUENCES = "REQUEST_SEQUENCES";
export const RECEIVE_SEQUENCES = "RECEIVE_SEQUENCES";
export const SEQUENCES_FETCH_ERROR = "SEQUENCES_FETCH_ERROR";
export const REQUEST_FREQUENCIES = "REQUEST_FREQUENCIES";
export const RECEIVE_FREQUENCIES = "RECEIVE_FREQUENCIES";
export const FREQUENCIES_FETCH_ERROR = "FREQUENCIES_FETCH_ERROR";

/* request metadata */

const requestMetadata = () => {
  return {
    type: REQUEST_METADATA
  };
};

const receiveMetadata = (data) => {
  return {
    type: RECEIVE_METADATA,
    data: data
  };
};

const metadataFetchError = (err) => {
  return {
    type: METADATA_FETCH_ERROR,
    data: err
  };
};

const fetchMetadata = (q) => {
  /*
    this will resolve to something like:
    /data/flu/h3n2/3y.meta.json
  */
  return fetch(
    "http://nextstrain.org/data/" +
    q+"_meta.json"
  );
};

export const populateMetadataStore = (queryParams) => {
  return (dispatch) => {
    dispatch(requestMetadata());
    return fetchMetadata(queryParams).then((res) => res.json()).then(
      (json) => dispatch(receiveMetadata(json)),
      (err) => dispatch(metadataFetchError(err))
    );
  };
};

/* request tree */

const requestTree = () => {
  return {
    type: REQUEST_TREE
  };
};

const receiveTree = (data) => {
  return {
    type: RECEIVE_TREE,
    data: data
  };
};

const treeFetchError = (err) => {
  return {
    type: TREE_FETCH_ERROR,
    data: err
  };
};

const fetchTree = (q) => {
  return fetch(
    "http://nextstrain.org/data/" +
      q + "_tree.json"
  );
};

export const populateTreeStore = (queryParams) => {
  return (dispatch) => {
    dispatch(requestTree());
    return fetchTree(queryParams).then((res) => res.json()).then(
      (json) => dispatch(receiveTree(json)),
      (err) => dispatch(treeFetchError(err))
    );
  };
};

/* request sequences */

const requestSequences = () => {
  return {
    type: REQUEST_SEQUENCES
  };
};

const receiveSequences = (data) => {
  return {
    type: RECEIVE_SEQUENCES,
    data: data
  };
};

const sequencesFetchError = (err) => {
  return {
    type: SEQUENCES_FETCH_ERROR,
    data: err
  };
};

const fetchSequences = (q) => {
  return fetch(
    "http://nextstrain.org/data/" +
      q + "_sequences.json"
  );
};

export const populateSequencesStore = (queryParams) => {
  return (dispatch) => {
    dispatch(requestSequences());
    return fetchSequences(queryParams).then((res) => res.json()).then(
      (json) => dispatch(receiveSequences(json)),
      (err) => dispatch(sequencesFetchError(err))
    );
  };
};

/* request frequencies */

const requestFrequencies = () => {
  return {
    type: REQUEST_FREQUENCIES
  };
};

const receiveFrequencies = (data) => {
  return {
    type: RECEIVE_FREQUENCIES,
    data: data
  };
};

const frequenciesFetchError = (err) => {
  return {
    type: FREQUENCIES_FETCH_ERROR,
    data: err
  };
};

const fetchFrequencies = (q) => {
  return fetch(
    "http://nextstrain.org/data/" +
      q + "_frequencies.json"
  );
};

export const populateFrequenciesStore = (queryParams) => {
  return (dispatch) => {
    dispatch(requestFrequencies());
    return fetchFrequencies(queryParams).then((res) => res.json()).then(
      (json) => dispatch(receiveFrequencies(json)),
      (err) => dispatch(frequenciesFetchError(err))
    );
  };
};
