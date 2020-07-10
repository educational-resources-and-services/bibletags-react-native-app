import React, { useMemo, useRef } from "react"
import { Modal, Select, styled } from "@ui-kitten/components"
import { StyleSheet, Platform, Slider, I18nManager, Text, View } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { i18n } from "inline-i18n"

import useThemedStyleSets from "../../hooks/useThemedStyleSets"
import { bibleFontList } from "../../utils/bibleFonts"
import useBack from "../../hooks/useBack"
import useThrottledCallback from "../../hooks/useThrottledCallback"
import { setTextSize, setLineSpacing, setFont, setTheme } from "../../redux/actions"

const THROTTLE_MS = 100

const styles = StyleSheet.create({
  container: {
    padding: 15,
    elevation: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowColor: "black",
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  title: {
    fontWeight: '600',
    fontSize: 15,
    marginBottom: 5,
  },
  line: {
    marginTop: 15,
  },
  label: {
    textAlign: 'left',
    fontSize: 13,
  },
  selectLabel: {
    fontWeight: 'normal',
    fontSize: 13,
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

const DisplaySettings = React.memo(({
  hideDisplaySettings,
  style,
  labelStyle,

  themedStyle,

  displaySettings,

  setTextSize,
  setLineSpacing,
  setFont,
  setTheme,
}) => {
  
  const { baseThemedStyle, labelThemedStyle, altThemedStyleSets } = useThemedStyleSets(themedStyle)
  const [ tintThemedStyle={} ] = altThemedStyleSets

  const { textSize, lineSpacing, font, theme } = displaySettings

  const initialTextSize = useRef(textSize).current
  const initialLineSpacing = useRef(lineSpacing).current

  useBack(hideDisplaySettings)

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
        text: font,
        font,
      }))
    ),
    [ bibleFontList ],
  )


  const selectedThemeOption = themeOptions.filter(themeOption => themeOption.theme === theme)[0] || themeOptions[0]
  const selectedFontOption = fontOptions.filter(fontOption => fontOption.font === font)[0] || fontOptions[0]

  return (
    <Modal
      backdropStyle={styles.cover}
      onBackdropPress={hideDisplaySettings}
      visible={true}
    >
      <View 
        style={[
          styles.container,
          baseThemedStyle,
          style,
        ]}>
        <Text style={styles.title}>
          {i18n("Display options")}
        </Text>
        <View style={styles.line}>
          <Text style={styles.label}>{i18n("Text size")}</Text>
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
          <Text style={styles.label}>{i18n("Line spacing")}</Text>
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
          label={i18n("Theme")}
          style={styles.line}
          labelStyle={[
            styles.selectLabel,
            labelThemedStyle,
            labelStyle,
          ]}
          data={themeOptions}
          selectedOption={selectedThemeOption}
          onSelect={setTheme}
        /> */}
        <Select
          label={i18n("Bible font")}
          style={styles.line}
          labelStyle={[
            styles.selectLabel,
            labelThemedStyle,
            labelStyle,
          ]}
          data={fontOptions}
          selectedOption={selectedFontOption}
          onSelect={setFont}
        />
      </View>
    </Modal>
  )

})

const mapStateToProps = ({ displaySettings }) => ({
  displaySettings,
})

const matchDispatchToProps = dispatch => bindActionCreators({
  setTextSize,
  setLineSpacing,
  setFont,
  setTheme,
}, dispatch)

DisplaySettings.styledComponentName = 'DisplaySettings'

export default styled(connect(mapStateToProps, matchDispatchToProps)(DisplaySettings))