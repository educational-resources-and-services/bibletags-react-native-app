export const setRef = ({ ref, wasSwipe }) => ({
  type: "SET_REF",
  ref,
  wasSwipe,
})

export const setPassageScroll = ({ y }) => ({
  type: "SET_PASSAGE_SCROLL",
  y,
})

export const setSearchScrollInfo = ({ scrollInfo }) => ({
  type: "SET_SEARCH_SCROLL_INFO",
  scrollInfo,
})

export const setVersionId = ({ versionId }) => ({
  type: "SET_VERSION_ID",
  versionId,
})

export const setParallelVersionId = ({ parallelVersionId }) => ({
  type: "SET_PARALLEL_VERSION_ID",
  parallelVersionId,
})

export const removeParallelVersion = () => ({
  type: "REMOVE_PARALLEL_VERSION",
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

export const addBibleVersion = ({ id, download }) => ({
  type: "ADD_BIBLE_VERSION",
  id,
  download,
})

export const removeBibleVersion = ({ id }) => ({
  type: "REMOVE_BIBLE_VERSION",
  id,
})

export const setMyBibleVersionsOrder = ({ ids }) => ({
  type: "SET_MY_BIBLE_VERSIONS_ORDER",
  ids,
})

export const setBibleVersionDownloadStatus = ({ id, download, downloaded, searchDownloaded }) => ({
  type: "SET_BIBLE_VERSION_DOWNLOAD_STATUS",
  id,
  download,
  downloaded,
  searchDownloaded,
})
