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

export const setTextSize = ({ textSize }) => ({
  type: "SET_TEXT_SIZE",
  textSize,
})

export const setTextSpacing = ({ textSpacing }) => ({
  type: "SET_TEXT_SPACING",
  textSpacing,
})

export const setTheme = ({ theme }) => ({
  type: "SET_THEME",
  theme,
})
