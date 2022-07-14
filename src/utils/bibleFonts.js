import bibleFonts from "../../fonts"

const variants = [
  "regular",
  "italic",
  "bold",
  "boldItalic",
  "light",
  "lightItalic",
]

export const bibleFontList = bibleFonts.map(({ name }) => name)

export const bibleFontLoads = {
  'original-heb': require(`../../assets/fonts/OriginalHebrewFont.ttf`),
  'original-grc': require(`../../assets/fonts/OriginalGreekFont.ttf`),
  ...(
    bibleFonts
      .reduce(
        (acc, font) => ({
          ...acc,
          ...variants
            .reduce(
              (acc2, variant) => ({
                ...acc2,
                ...(
                  font[variant]
                    ? {
                      [`${font.name}-${variant}`]: font[variant],
                    }
                    : {}
                )
              }),
              {},
            )
        }),
        {},
      )
  ),
}

export const getValidFontName = ({ font, bold, italic, light }) => {

  if([ 'original-heb', 'original-grc' ].includes(font)) {
    return font
  }

  if(!bibleFontList.includes(font)) {
    font = bibleFontList[0]
  }

  const variant = {
    "i": "italic",
    "b": "bold",
    "bi": "boldItalic",
    "l": "light",
    "il": "lightItalic",
  }[`${bold ? 'b' : ''}${italic ? 'i' : ''}${light ? 'l' : ''}`]
  
  return bibleFontLoads[`${font}-${variant}`]
    ? `${font}-${variant}`
    : `${font}-regular`
}