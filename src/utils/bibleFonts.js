import bibleFonts from '../../assets/fonts.js'

const variants = [
  "regular",
  "italic",
  "bold",
  "boldItalic",
  "light",
  "lightItalic",
]

export const bibleFontList = bibleFonts.map(({ name }) => name)

export const bibleFontLoads = bibleFonts
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

export const getValidFontName = ({ font, variant }) => {

  if(!bibleFontList.includes(font)) {
    font = bibleFontList[0]
  }

  return bibleFontLoads[`${font}-${variant}`]
    ? `${font}-${variant}`
    : `${font}-regular`
}