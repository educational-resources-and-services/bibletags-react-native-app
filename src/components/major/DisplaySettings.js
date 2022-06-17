import React, { useCallback, useMemo, useRef } from "react"
import { Select, SelectItem, IndexPath, CheckBox, Divider } from "@ui-kitten/components"
import Slider from "@react-native-community/slider"
import { StyleSheet, Platform, I18nManager, Text, View } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { i18n } from "inline-i18n"

import useThemedStyleSets from "../../hooks/useThemedStyleSets"
import { bibleFontList } from "../../utils/bibleFonts"
import useThrottledCallback from "../../hooks/useThrottledCallback"
import { setTextSize, setLineSpacing, setFont, setTheme, setHideCantillation } from "../../redux/actions"
import { memo } from '../../utils/toolbox'

import Dialog from "./Dialog"

const THROTTLE_MS = 100

const styles = StyleSheet.create({
  firstLine: {
    marginTop: 5,
  },
  line: {
    marginTop: 15,
  },
  label: {
    textAlign: 'left',
  },
  selectText: {
    textAlign: 'left',
  },
  selectLabel: {
    textAlign: 'left',
    fontWeight: 'normal',
    fontSize: 14,
    marginBottom: 4,
  },
  divider: {
    marginVertical: 15,
    marginHorizontal: -15,
    paddingHorizontal: 15,
  },
  advanced: {
    fontWeight: '700',
    fontSize: 13,
  },
  checkBox: {
    marginTop: 15,
    marginBottom: 5,
  },
  slider: {
    width: Platform.OS === 'android' ? 220 : 200,
    height: 30,
    ...(Platform.OS === 'android' ? { marginLeft: -10 } : {}),
    ...(Platform.OS === 'android' && I18nManager.isRTL ? { transform: [{ scaleX: -1 }] } : {}),
  },
})

const themeOptions = [
  {
    theme: 'default',
    text: i18n("Default"),
  },
  {
    theme: 'low-light',
    text: i18n("Low light"),
  },
  {
    theme: 'high-contrast',
    text: i18n("High contrast"),
  },
]

const DisplaySettings = ({
  hideDisplaySettings,

  eva: { style: themedStyle={} },

  displaySettings,

  setTextSize,
  setLineSpacing,
  setFont,
  // setTheme,
  setHideCantillation,
}) => {
  
  const { baseThemedStyle, labelThemedStyle, altThemedStyleSets } = useThemedStyleSets(themedStyle)
  const [ tintThemedStyle={} ] = altThemedStyleSets

  const { textSize, lineSpacing, font, theme, hideCantillation } = displaySettings

  const initialTextSize = useRef(textSize).current
  const initialLineSpacing = useRef(lineSpacing).current

  const updateTextSize = useThrottledCallback(
    textSize => setTextSize({ textSize }),
    THROTTLE_MS,
    [ setTextSize ],
  )

  const updateLineSpacing = useThrottledCallback(
    lineSpacing => setLineSpacing({ lineSpacing }),
    THROTTLE_MS,
    [ setLineSpacing ],
  )

  const fontOptions = useMemo(
    () => (
      bibleFontList.map(font => ({
        title: font,
        font,
      }))
    ),
    [ bibleFontList ],
  )

  // const onSelectTheme = useCallback(({ row: index }) => setTheme(themeOptions[index]), [ themeOptions ])
  const onSelectFont = useCallback(({ row: index }) => setFont(fontOptions[index]), [ fontOptions ])

  // const { selectedThemeIndex, selectedThemeValue } = useMemo(
  //   () => {
  //     const index = themeOptions.findIndex(themeOption => themeOption.theme === theme) || 0
  //     return {
  //       selectedThemeIndex: new IndexPath(index),
  //       selectedThemeValue: themeOptions[index].title,
  //     }
  //   }
  // )

  const { selectedFontIndex, selectedFontValue } = useMemo(
    () => {
      const index = fontOptions.findIndex(fontOption => fontOption.font === font) || 0
      return {
        selectedFontIndex: new IndexPath(index),
        selectedFontValue: fontOptions[index].title,
      }
    }
  )

  return (
    <Dialog
      title={i18n("Display Options")}
      goHide={hideDisplaySettings}
      style={baseThemedStyle}
    >

      <View style={styles.firstLine}>
        <Text style={styles.label}>{i18n("Text Size")}</Text>
        <Slider
          minimumValue={.3}
          maximumValue={3}
          value={initialTextSize}
          onValueChange={updateTextSize}
          style={styles.slider}
          minimumTrackTintColor={tintThemedStyle.minimumTrackTintColor}
          maximumTrackTintColor={tintThemedStyle.maximumTrackTintColor}
          thumbTintColor={tintThemedStyle.thumbTintColor}
        />
      </View>

      <View style={styles.line}>
        <Text style={styles.label}>{i18n("Line Spacing")}</Text>
        <Slider
          minimumValue={1}
          maximumValue={3}
          value={initialLineSpacing}
          onValueChange={updateLineSpacing}
          style={styles.slider}
          minimumTrackTintColor={tintThemedStyle.minimumTrackTintColor}
          maximumTrackTintColor={tintThemedStyle.maximumTrackTintColor}
          thumbTintColor={tintThemedStyle.thumbTintColor}
        />
      </View>

      {/* <Select
        label={evaProps => (
          <Text
            {...evaProps}
            style={[
              styles.selectLabel,
              labelThemedStyle,
            ]}
          >
            {i18n("Theme")}
          </Text>
        )}
        style={styles.line}
        selectedIndex={selectedThemeIndex}
        value={selectedThemeValue}
        onSelect={onSelectTheme}
      >
        {themeOptions.map(({ title }) => (
          <SelectItem
            key={title}
            title={title}
            style={styles.selectText}
          />
        ))}
      </Select> */}

      <Select
        label={evaProps => (
          <Text
            {...evaProps}
            style={[
              styles.selectLabel,
              labelThemedStyle,
            ]}
          >
            {i18n("Bible Font")}
          </Text>
        )}
        style={styles.line}
        selectedIndex={selectedFontIndex}
        value={selectedFontValue}
        onSelect={onSelectFont}
      >
        {fontOptions.map(({ title }) => (
          <SelectItem
            key={title}
            title={title}
            style={styles.selectText}
          />
        ))}
      </Select>

      <Divider style={styles.divider} />

      <Text style={styles.advanced}>
        {i18n("Advanced")}
      </Text>

      <CheckBox
        style={styles.checkBox}
        checked={!hideCantillation}
        onChange={nextChecked => setHideCantillation({ hideCantillation: !nextChecked })}
      >
        <Text>
          <Text style={styles.selectLabel}>
            {i18n("Show diacritical marks (Hebrew)")}
          </Text>
        </Text>
      </CheckBox>

    </Dialog>
  )

}

const mapStateToProps = ({ displaySettings }) => ({
  displaySettings,
})

const matchDispatchToProps = dispatch => bindActionCreators({
  setTextSize,
  setLineSpacing,
  setFont,
  setTheme,
  setHideCantillation,
}, dispatch)

export default memo(connect(mapStateToProps, matchDispatchToProps)(DisplaySettings), { name: 'DisplaySettings' })