export const setRef = ({ ref }) => ({
  type: "SET_REF",
  ref,
})

export const setVersionId = ({ versionId }) => ({
  type: "SET_VERSION_ID",
  versionId,
})

export const setParallelVersionId = ({ parallelVersionId }) => ({
  type: "SET_PARALLEL_VERSION_ID",
  parallelVersionId,
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
