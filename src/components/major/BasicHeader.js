import React from "react"
import { StyleSheet, Dimensions, Platform } from "react-native"
import { Title, Left, Right, Button, Body } from "native-base"

import AppHeader from "../basic/AppHeader"
import HeaderIcon from "../basic/HeaderIcon"

const styles = StyleSheet.create({
  title: {
    ...(Platform.OS === 'android' ? { textAlign: "left" } : {}),
  },
})

class BasicHeader extends React.PureComponent {

  onBackPress = () => {
    const { navigation } = this.props
    
    navigation.goBack()
  }

  render() {
    const { title } = this.props

    const { width } = Dimensions.get('window')
    const maxTitleWidth = width - 120

    return (
      <AppHeader>
        <Left>
          <Button
            transparent
            onPress={this.onBackPress}
          >
            <HeaderIcon name="arrow-back" />
          </Button>
        </Left>
        <Body>
          <Title style={[
            styles.title,
            { width: maxTitleWidth },
          ]}>
            {title}
          </Title>
        </Body>
        <Right />
      </AppHeader>
    )
  }
}

export default BasicHeader
