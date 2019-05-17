const initialState = {
  mode: 'basic',
  textSize: 16,
  lineSpacing: 1.3,
  theme: "default"
}

const modeOptions = [
  "basic",
  "parallel",
]

const themeOptions = [
  "default",
  "low-light",
  "high-contrast",
]

export default function(state = initialState, action) {
  
  switch (action.type) {

    case "SET_MODE":
      return {
        ...state,
        mode: modeOptions.includes(action.mode) ? action.mode : state.mode,
      }

    case "SET_TEXT_SIZE":
      return {
        ...state,
        textSize: parseInt(action.textSize) || state.textSize,
      }

    case "SET_LINE_SPACING":
      return {
        ...state,
        lineSpacing: parseFloat(action.lineSpacing) || state.lineSpacing,
      }

    case "SET_THEME":
      return {
        ...state,
        theme: themeOptions.includes(action.theme) ? action.theme : state.theme,
      }

  }

  return state
}