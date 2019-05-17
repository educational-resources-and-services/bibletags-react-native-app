import React from "react"
import { Card, CardItem, Icon, Text, View, Switch, Body, ActionSheet } from "native-base"
import { StyleSheet, TouchableWithoutFeedback, Platform, Slider } from "react-native"
import { Constants } from "expo"

import { getToolbarHeight } from '../../utils/toolbox.js'
import i18n from "../../utils/i18n.js"

import BackFunction from '../basic/BackFunction'

const {
  CHOOSER_SELECTED_BACKGROUND_COLOR,
  CHOOSER_SELECTED_SECONDARY_BACKGROUND_COLOR,
} = Constants.manifest.extra

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    top: getToolbarHeight(),
    zIndex: 5,
  },
  cover: {
    ...StyleSheet.absoluteFill,
  },
  options: {
    position: 'absolute',
    top: -2,
    right: 1,
    minWidth: 230,
    paddingBottom: 15,
  },
  header: {
    fontWeight: 'bold',
  },
  switch: {
    ...(Platform.OS === 'android' ? { marginLeft: -10 } : {}),
    marginRight: 10,
  },
  dropdownIcon: {
    marginLeft: 10,
    fontSize: 20,
    ...(Platform.OS === 'ios' ? { color: '#bbbbbb' } : {}),
  },
  slider: {
    width: 200,
    height: 30,
    ...(Platform.OS === 'android' ? { marginLeft: -10 } : {}),
    ...(Platform.OS === 'android' ? { marginRight: -10 } : {}),
  },
})

class Options extends React.PureComponent {

  render() {
    const { requestHide } = this.props

    return (
      <View style={styles.container}>
        <BackFunction func={requestHide} />
        <TouchableWithoutFeedback
          onPress={requestHide}
        >
          <View style={styles.cover}>
          </View>
        </TouchableWithoutFeedback>
        <Card style={styles.options}>
          <CardItem header>
            <Text style={styles.header}>
              {i18n("Display options")}
            </Text>
          </CardItem>
          <CardItem button
            onPress={() => {
              //requestHide()
            }}
          >
            <Switch
              style={styles.switch}
              trackColor={{
                true: CHOOSER_SELECTED_SECONDARY_BACKGROUND_COLOR,
              }}
              ios_backgroundColor={CHOOSER_SELECTED_SECONDARY_BACKGROUND_COLOR}
              thumbColor={CHOOSER_SELECTED_BACKGROUND_COLOR}
              value={true}
            />
            <Text>{i18n("Parallel reading")}</Text>
          </CardItem>
          <CardItem>
            <Body>
              <Text>{i18n("Text size")}</Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                minimumTrackTintColor={CHOOSER_SELECTED_BACKGROUND_COLOR}
                maximumTrackTintColor={CHOOSER_SELECTED_SECONDARY_BACKGROUND_COLOR}
                thumbTintColor={CHOOSER_SELECTED_BACKGROUND_COLOR}
              />
            </Body>
          </CardItem>
          <CardItem>
            <Body>
              <Text>{i18n("Line spacing")}</Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                minimumTrackTintColor={CHOOSER_SELECTED_BACKGROUND_COLOR}
                maximumTrackTintColor={CHOOSER_SELECTED_SECONDARY_BACKGROUND_COLOR}
                thumbTintColor={CHOOSER_SELECTED_BACKGROUND_COLOR}
              />
            </Body>
          </CardItem>
          <CardItem button
            onPress={() => {
              ActionSheet.show(
                {
                  options: ['Default', 'Low light', 'High contrast'],
                  title: "Theme"
                },
                buttonIndex => {
                  //this.setState({ clicked: BUTTONS[buttonIndex] });
                }
              )
              //requestHide()
            }}
          >
            <Text>Default theme</Text>
            <Icon
              name="arrow-dropdown"
              style={styles.dropdownIcon}
            />
          </CardItem>
        </Card>
      </View>
    )
  }
}

export default Options