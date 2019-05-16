import React from "react"
// import { StyleSheet, Platform } from "react-native"
import { Title, Left, Icon, Right, Button, Body } from "native-base"
import AppHeader from "../basic/AppHeader"

import { isPhoneSize, debounce } from '../../utils/toolbox.js'

// const styles = StyleSheet.create({
// })

class SearchResultsHeader extends React.PureComponent {

  onBackPress = () => {
    const { navigation } = this.props
    
    debounce(navigation.goBack)
    // debounce(navigation.goBack, navigation.state.params.pageKey)
  }

  render() {
    return (
      <AppHeader>
        <Left>
          <Button
            transparent
            onPress={this.onBackPress}
          >
            <Icon name="arrow-back" />
          </Button>
        </Left>
        <Body>
          <Title>“love”</Title>
        </Body>
        <Right>
          <Button
            transparent
            onPress={() => {}}
          >
            <Icon name="more" />
          </Button>
        </Right>
      </AppHeader>
    )
  }
}

export default SearchResultsHeader
