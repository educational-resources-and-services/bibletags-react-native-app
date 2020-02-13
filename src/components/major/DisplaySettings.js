import React, { useCallback, useRef } from "react"
import { Card, CardItem, Icon, Text, View, Body, ActionSheet } from "native-base"
import { StyleSheet, TouchableWithoutFeedback, Platform, Slider, StatusBar, I18nManager } from "react-native"
import Constants from "expo-constants"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"

import { i18n } from "inline-i18n"
import { getToolbarHeight, isIPhoneX, iPhoneXInset } from "../../utils/toolbox.js"
import { bibleFontList } from "../../utils/bibleFonts.js"
import useBack from "../../hooks/useBack"
import useThrottledCallback from "../../hooks/useThrottledCallback"

import { setTextSize, setLineSpacing, setFont, setTheme } from "../../redux/actions.js"

const {
  INPUT_HIGHLIGHT_COLOR,
  INPUT_HIGHLIGHT_SECONDARY_COLOR,
} = Constants.manifest.extra

const THROTTLE_MS = 100

const styles = StyleSheet.create({
  cover: {
    ...StyleSheet.absoluteFill,
    zIndex: 15,
  },
  options: {
    position: 'absolute',
    top: getToolbarHeight() + (StatusBar.currentHeight || 0) + (isIPhoneX ? iPhoneXInset['portrait'].topInset + 2 : -2),
    right: 1,
    minWidth: 230,
    paddingBottom: 15,
    zIndex: 16,
  },
  header: {
    fontWeight: 'bold',
  },
  // switch: {
  //   ...(Platform.OS === 'android' ? { marginLeft: -10 } : {}),
  //   marginRight: 10,
  //   ...(Platform.OS === 'android' && I18nManager.isRTL ? { transform: [{ scaleX: -1 }] } : {}),
  // },
  sliderText: {
    width: '100%',
    textAlign: 'left',
  },
  dropdownIcon: {
    marginLeft: I18nManager.isRTL ? -10 : 10,
    fontSize: 20,
    ...(Platform.OS === 'ios' ? { color: '#bbbbbb' } : {}),
  },
  slider: {
    width: Platform.OS === 'android' ? 220 : 200,
    height: 30,
    ...(Platform.OS === 'android' ? { marginLeft: -10 } : {}),
    ...(Platform.OS === 'android' && I18nManager.isRTL ? { transform: [{ scaleX: -1 }] } : {}),
  },
  contrast: {
    color: 'black',
  },
})

const themeOptions = [
  {
    id: 'default',
    label: i18n("Default"),
  },
  {
    id: 'low-light',
    label: i18n("Low light"),
  },
  {
    id: 'high-contrast',
    label: i18n("High contrast"),
  },
]

const DisplaySettings = React.memo(({
  hideDisplaySettings,

  displaySettings,

  setTextSize,
  setLineSpacing,
  setFont,
  setTheme,
}) => {

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

  const selectFont = useCallback(
    () => {
      ActionSheet.show(
        {
          title: i18n("Font"),
          options: [
            ...bibleFontList,
            ...(Platform.OS === 'ios' ? [i18n("Cancel")] : []),
          ],
          cancelButtonIndex: bibleFontList.length,
        },
        idx => {
          if(bibleFontList[idx]) {
            setFont({ font: bibleFontList[idx] })
          }
        },
      )
    },
    [ setFont ],
  )

  const selectTheme = useCallback(
    () => {
      ActionSheet.show(
        {
          title: i18n("Theme"),
          options: [
            ...themeOptions.map(({ label }) => label),
            ...(Platform.OS === 'ios' ? [i18n("Cancel")] : []),
          ],
          cancelButtonIndex: themeOptions.length,
        },
        idx => {
          if(themeOptions[idx]) {
            setTheme({ theme: themeOptions[idx].id })
          }
        },
      )
    },
    [ setTheme ],
  )

  let currentThemeLabel = themeOptions[0].label
  themeOptions.some(({ id, label }) => {
    if(id === theme) {
      currentThemeLabel = label
      return true
    }
  })

  let currentFontLabel = bibleFontList.includes(font) ? font : bibleFontList[0]

  return (
    <>
      <TouchableWithoutFeedback
        style={styles.cover}
        onPress={hideDisplaySettings}
      >
        <View style={styles.cover} />
      </TouchableWithoutFeedback>
      <Card style={styles.options}>
        <CardItem header>
          <Text style={styles.header}>
            {i18n("Display options")}
          </Text>
        </CardItem>
        <CardItem>
          <Body>
            <Text style={styles.sliderText}>{i18n("Text size")}</Text>
            <Slider
              minimumValue={.3}
              maximumValue={3}
              value={initialTextSize}
              onValueChange={updateTextSize}
              style={styles.slider}
              minimumTrackTintColor={INPUT_HIGHLIGHT_COLOR}
              maximumTrackTintColor={INPUT_HIGHLIGHT_SECONDARY_COLOR}
              thumbTintColor={INPUT_HIGHLIGHT_COLOR}
            />
          </Body>
        </CardItem>
        <CardItem>
          <Body>
            <Text>{i18n("Line spacing")}</Text>
            <Slider
              minimumValue={1}
              maximumValue={3}
              value={initialLineSpacing}
              onValueChange={updateLineSpacing}
              style={styles.slider}
              minimumTrackTintColor={INPUT_HIGHLIGHT_COLOR}
              maximumTrackTintColor={INPUT_HIGHLIGHT_SECONDARY_COLOR}
              thumbTintColor={INPUT_HIGHLIGHT_COLOR}
            />
          </Body>
        </CardItem>
        <CardItem button
          onPress={selectTheme}
        >
          <Text>
            {i18n("Theme: {{theme}}", { theme: currentThemeLabel })}
          </Text>
          <Icon
            name="arrow-dropdown"
            style={[
              styles.dropdownIcon,
              displaySettings.theme === 'high-contrast' ? styles.contrast : null,
            ]}
          />
        </CardItem>
        <CardItem button
          onPress={selectFont}
        >
          <Text>
            {i18n("Font: {{font}}", { font: currentFontLabel })}
          </Text>
          <Icon
            name="arrow-dropdown"
            style={[
              styles.dropdownIcon,
              displaySettings.theme === 'high-contrast' ? styles.contrast : null,
            ]}
          />
        </CardItem>
      </Card>
    </>
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

export default connect(mapStateToProps, matchDispatchToProps)(DisplaySettings)