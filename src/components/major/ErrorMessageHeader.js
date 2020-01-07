import React from "react"
import { StyleSheet, Platform } from "react-native"
import { Title, Left, Right, Button, Body } from "native-base"

import { i18n } from "inline-i18n"
import { isPhoneSize } from '../../utils/toolbox.js'

import AppHeader from "../basic/AppHeader"
import HeaderIcon from "../basic/HeaderIcon"

const styles = StyleSheet.create({
  title: {
    ...(Platform.OS === 'ios' && isPhoneSize() ? { marginLeft: -50, left: -20 } : {}),
  },
})

class ErrorMessageHeader extends React.PureComponent {

  onBackPress = () => {
    const { navigation } = this.props
    
    navigation.goBack()
  }

  render() {
    const { navigation } = this.props
    const { title, critical } = navigation.state.params || {}
    
    return (
      <AppHeader>
        <Left>
          {!critical &&
            <Button
              transparent
              onPress={this.onBackPress}
            >
              <HeaderIcon name="arrow-back" />
            </Button>
          }
        </Left>
        <Body>
          <Title style={styles.title}>{title || i18n("Error")}</Title>
        </Body>
        <Right />
      </AppHeader>
    )
  }
}

export default ErrorMessageHeader
