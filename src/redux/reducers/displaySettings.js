import { bibleFontList } from "../../utils/bibleFonts"

const initialState = {
  textSize: 1,
  lineSpacing: 1.3,
  font: bibleFontList[0],
  theme: "default",
  hideNotes: false,
  hideCantillation: false,
}

const themeOptions = [
  "default",
  "low-light",
  "high-contrast",
]

export default (state = initialState, action) => {
  
  switch (action.type) {

    case "SET_TEXT_SIZE": {
      return {
        ...state,
        textSize: parseFloat(action.textSize) || state.textSize,
      }
    }

    case "SET_LINE_SPACING": {
      return {
        ...state,
        lineSpacing: parseFloat(action.lineSpacing) || state.lineSpacing,
      }
    }

    case "SET_FONT": {
      return {
        ...state,
        font: bibleFontList.includes(action.font) ? action.font : state.font,
      }
    }

    case "SET_HIDE_CANTILLATION": {
      return {
        ...state,
        hideCantillation: !!action.hideCantillation,
      }
    }

    case "SET_THEME": {
      return {
        ...state,
        theme: themeOptions.includes(action.theme) ? action.theme : state.theme,
      }
    }

  }

  return state
}