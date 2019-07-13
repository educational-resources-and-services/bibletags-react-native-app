export const setRef = ({ ref, wasSwipe }) => ({
  type: "SET_REF",
  ref,
  wasSwipe,
})

export const setPassageScroll = ({ y }) => ({
  type: "SET_PASSAGE_SCROLL",
  y,
})

export const setVersionId = ({ versionId }) => ({
  type: "SET_VERSION_ID",
  versionId,
})

export const setParallelVersionId = ({ parallelVersionId }) => ({
  type: "SET_PARALLEL_VERSION_ID",
  parallelVersionId,
})

export const removeRecentPassage = ({ ref }) => ({
  type: "REMOVE_RECENT_PASSAGE",
  ref,
})

export const recordSearch = ({ searchString, versionId, numberResults }) => ({
  type: "RECORD_SEARCH",
  searchString,
  versionId,
  numberResults,
})

export const removeRecentSearch = ({ searchString }) => ({
  type: "REMOVE_RECENT_SEARCH",
  searchString,
})
export const setMode = ({ mode }) => ({
  type: "SET_MODE",
  mode,
})

export const setTextSize = ({ textSize }) => ({
  type: "SET_TEXT_SIZE",
  textSize,
})

export const setLineSpacing = ({ lineSpacing }) => ({
  type: "SET_LINE_SPACING",
  lineSpacing,
})

export const setFont = ({ font }) => ({
  type: "SET_FONT",
  font,
})

export const setTheme = ({ theme }) => ({
  type: "SET_THEME",
  theme,
})
