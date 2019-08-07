import React from "react"
import { Card, CardItem, Icon, Text, View, Switch, Body, ActionSheet } from "native-base"
import { StyleSheet, TouchableWithoutFeedback, Platform, Slider, StatusBar } from "react-native"
import Constants from "expo-constants"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"

import { RTL } from "../../../language.js"
import i18n from "../../utils/i18n.js"
import { getToolbarHeight, isIPhoneX, iPhoneXInset } from "../../utils/toolbox.js"
import { bibleFontList } from "../../utils/bibleFonts.js"

import BackFunction from '../basic/BackFunction'

import { setMode, setTextSize, setLineSpacing, setFont, setTheme } from "../../redux/actions.js"

const {
  INPUT_HIGHLIGHT_COLOR,
  INPUT_HIGHLIGHT_SECONDARY_COLOR,
} = Constants.manifest.extra

const SET_TEXT_SIZE_THROTTLE_MS = 100

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
  switch: {
    ...(Platform.OS === 'android' ? { marginLeft: -10 } : {}),
    marginRight: 10,
    ...(Platform.OS === 'android' && RTL ? { transform: [{ scaleX: -1 }] } : {}),
  },
  sliderText: {
    width: '100%',
    textAlign: 'left',
  },
  dropdownIcon: {
    marginLeft: RTL ? -10 : 10,
    fontSize: 20,
    ...(Platform.OS === 'ios' ? { color: '#bbbbbb' } : {}),
  },
  slider: {
    ...(Platform.OS === 'android' ? { width: 220 } : { width: 200 }),
    height: 30,
    ...(Platform.OS === 'android' ? { marginLeft: -10 } : {}),
    ...(Platform.OS === 'android' && RTL ? { transform: [{ scaleX: -1 }] } : {}),
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

class DisplaySettings extends React.PureComponent {

  constructor(props) {
    super(props)

    const { displaySettings } = props
    const { textSize, lineSpacing } = displaySettings

    this.state = {
      textSize,
      lineSpacing,
    }
  }

  toggleParallelMode = () => {
    const { setMode, displaySettings } = this.props
    const { mode } = displaySettings

    setMode({
      mode: mode === 'parallel' ? 'basic' : 'parallel',
    })
  }

  clearSetTextSizeTimeoutVars = () => {
    delete this.setTextSizeTimeoutFunc
    delete this.setTextSizeWaitTimeout
  }

  setTextSize = textSize => {
    const { setTextSize } = this.props

    // throttle because otherwise iOS gets slow

    if(this.setTextSizeTimeoutFunc) {
      this.setTextSizeTimeoutFunc = () => {
        this.clearSetTextSizeTimeoutVars()
        setTextSize({ textSize })
      }
      return
    }

    setTextSize({ textSize })
    this.setTextSizeTimeoutFunc = this.clearSetTextSizeTimeoutVars
    this.setTextSizeWaitTimeout = setTimeout(() => this.setTextSizeTimeoutFunc(), SET_TEXT_SIZE_THROTTLE_MS)
  }

  setLineSpacing = lineSpacing => {
    const { setLineSpacing } = this.props

    setLineSpacing({ lineSpacing })
  }

  selectFont = () => {
    ActionSheet.show(
      {
        title: i18n("Font"),
        options: [
          ...bibleFontList,
          ...(Platform.OS === 'ios' ? [i18n("Cancel")] : []),
        ],
        cancelButtonIndex: bibleFontList.length,
      },
      this.setFont,
    )
  }

  setFont = idx => {
    const { setFont } = this.props

    if(bibleFontList[idx]) {
      setFont({ font: bibleFontList[idx] })
    }
  }

  selectTheme = () => {
    ActionSheet.show(
      {
        title: i18n("Theme"),
        options: [
          ...themeOptions.map(({ label }) => label),
          ...(Platform.OS === 'ios' ? [i18n("Cancel")] : []),
        ],
        cancelButtonIndex: themeOptions.length,
      },
      this.setTheme,
    )
  }

  setTheme = idx => {
    const { setTheme } = this.props

    if(themeOptions[idx]) {
      setTheme({ theme: themeOptions[idx].id })
    }
  }

  render() {
    const { hideDisplaySettings, displaySettings } = this.props
    const { textSize, lineSpacing } = this.state

    const { mode, font, theme } = displaySettings

    let currentThemeLabel = themeOptions[0].label
    themeOptions.some(({ id, label }) => {
      if(id === theme) {
        currentThemeLabel = label
        return true
      }
    })

    let currentFontLabel = bibleFontList.includes(font) ? font : bibleFontList[0]

    return (
      <React.Fragment>
        <BackFunction func={hideDisplaySettings} />
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
          <TouchableWithoutFeedback
            onPress={this.toggleParallelMode}
          >
            <CardItem>
              <Switch
                onValueChange={this.toggleParallelMode}
                style={styles.switch}
                trackColor={{
                  true: INPUT_HIGHLIGHT_SECONDARY_COLOR,
                }}
                ios_backgroundColor={INPUT_HIGHLIGHT_SECONDARY_COLOR}
                thumbColor={INPUT_HIGHLIGHT_COLOR}
                value={mode === 'parallel'}
              />
              <Text>{i18n("Parallel mode")}</Text>
            </CardItem>
          </TouchableWithoutFeedback>
          <CardItem>
            <Body>
              <Text style={styles.sliderText}>{i18n("Text size")}</Text>
              <Slider
                minimumValue={.3}
                maximumValue={3}
                value={textSize}
                onValueChange={this.setTextSize}
                style={styles.slider}
                minimumTrackTintColor={INPUT_HIGHLIGHT_COLOR}
                maximumTrackTintColor={INPUT_HIGHLIGHT_SECONDARY_COLOR}
                thumbTintColor={INPUT_HIGHLIGHT_COLOR}
              />
            </Body>
          </CardItem>
          {/* <CardItem>
            <Body>
              <Text>{i18n("Line spacing")}</Text>
              <Slider
                minimumValue={1}
                maximumValue={4}
                value={lineSpacing}
                onValueChange={this.setLineSpacing}
                style={styles.slider}
                minimumTrackTintColor={INPUT_HIGHLIGHT_COLOR}
                maximumTrackTintColor={INPUT_HIGHLIGHT_SECONDARY_COLOR}
                thumbTintColor={INPUT_HIGHLIGHT_COLOR}
              />
            </Body>
          </CardItem> */}
          <CardItem button
            onPress={this.selectTheme}
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
            onPress={this.selectFont}
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
      </React.Fragment>
    )
  }
}

const mapStateToProps = ({ displaySettings }) => ({
  displaySettings,
})

const matchDispatchToProps = dispatch => bindActionCreators({
  setMode,
  setTextSize,
  setLineSpacing,
  setFont,
  setTheme,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(DisplaySettings)