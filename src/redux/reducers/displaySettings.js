import { bibleFontList } from "../../utils/bibleFonts.js"

const initialState = {
  mode: 'basic',
  textSize: 1,
  lineSpacing: 1.3,
  font: bibleFontList[0],
  theme: "default"
}

const themeOptions = [
  "default",
  "low-light",
  "high-contrast",
]

export default function(state = initialState, action) {
  
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

    case "SET_THEME": {
      return {
        ...state,
        theme: themeOptions.includes(action.theme) ? action.theme : state.theme,
      }
    }

  }

  return state
}