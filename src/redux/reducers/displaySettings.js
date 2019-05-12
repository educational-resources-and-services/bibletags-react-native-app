const initialState = {
  textSize: 16,
  textSpacing: 1.3,
  theme: "default"
}

const themeOptions = [
  "default",
  "low-light",
  "high-contrast",
]

export default function(state = initialState, action) {
  
  switch (action.type) {

    case "SET_TEXT_SIZE":
      return {
        ...state,
        textSize: parseInt(action.textSize) || state.textSize,
      }

    case "SET_TEXT_SPACING":
      return {
        ...state,
        textSpacing: parseFloat(action.textSpacing) || state.textSpacing,
      }

    case "SET_THEME":
      return {
        ...state,
        theme: themeOptions.includes(action.theme) ? action.theme : state.theme,
      }

  }

  return state
}