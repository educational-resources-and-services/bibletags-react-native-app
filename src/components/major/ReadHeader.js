import React from "react"
import { StyleSheet, Platform } from "react-native"
import { bindActionCreators } from "redux"
import { Title, Left, Icon, Right, Button, Body } from "native-base"
import AppHeader from "../basic/AppHeader"

import { isPhoneSize } from '../../utils/toolbox.js'

const leftIconsWidth = 50
const rightIconsWidth = 135

const styles = StyleSheet.create({
  body: {
    ...(
      Platform.OS === 'ios' && isPhoneSize() ?
        {
          alignItems: 'flex-start',
          left: (leftIconsWidth - rightIconsWidth) / 2,
        }
        : {}
    ),
    ...(
      Platform.OS === 'android' && isPhoneSize() ?
        {
          marginLeft: -5,
          marginRight: -20,
        }
        : {}
    ),
  },
})

class ReadHeader extends React.PureComponent {

  openDrawer = () => {
    const { navigation, hideOptions } = this.props

    hideOptions()
    debounce(navigation.navigate, "DrawerOpen")
  }

  onBackPress = () => {
    const { navigation } = this.props
    
    navigation.goBack(navigation.state.params.pageKey)
  }

  render() {
    let { toggleShowOptions, width, navigation } = this.props

    width -= (leftIconsWidth + rightIconsWidth)
            
    return (
      <AppHeader>
        <Left>
          <Button
            transparent
            onPress={this.openDrawer}
          >
            <Icon name="home" />
          </Button>
        </Left>
        <Body style={[
          styles.body,
          (
            isPhoneSize()
              ? {
                width,
                minWidth: width,
                maxWidth: width,
              }
              : {}
          ),
        ]}>
          <Title>Genesis 1:1</Title>
        </Body>
        <Right>
          <Button
            transparent
            onPress={() => {}}
          >
            <Icon name="search" />
          </Button>
          <Button
            transparent
            onPress={toggleShowOptions}
          >
            <Icon name="more" />
          </Button>
        </Right>
      </AppHeader>
    )
  }
}

export default ReadHeader
