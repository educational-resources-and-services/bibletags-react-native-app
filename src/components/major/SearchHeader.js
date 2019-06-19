import React from "react"
import { StyleSheet } from "react-native"
import { Title, Left, Icon, Right, Button, Body, Item, Input } from "native-base"
import AppHeader from "../basic/AppHeader"

import { debounce } from '../../utils/toolbox.js'

const styles = StyleSheet.create({
  searchBarLeft: {
    flex: 0,
    marginRight: 10,
  },
  searchBarRight: {
    flex: 0,
  },
  searchString: {
    flexDirection: 'row',
  },
})

class SearchHeader extends React.PureComponent {

  constructor(props) {
    super(props)

    const { navigation } = this.props
    const { searchString } = navigation.state.params

    this.state = {
      editedSearchString: searchString || "",
    }
  }

  updateEditedSearchString = ({ nativeEvent }) => {
    this.setState({ editedSearchString: nativeEvent.text })
  }

  updateSearchString = () => {
    const { navigation, setEditing } = this.props
    const { editedSearchString } = this.state

    setEditing(false)

    debounce(
      navigation.setParams,
      {
        searchString: editedSearchString,
        editOnOpen: false,
      },
    )
  }

  onCancel = () => {
    const { navigation, setEditing } = this.props
    const { searchString } = navigation.state.params

    if(!searchString) {
      this.onBackPress()
      return
    }

    setEditing(false)

    this.setState({
      editedSearchString: searchString,
    })
  }

  editSearchString = () => {
    const { setEditing } = this.props

    setEditing(true)
  }

  onBackPress = () => {
    const { navigation } = this.props
    
    debounce(navigation.goBack)
    // debounce(navigation.goBack, navigation.state.params.pageKey)
  }

  render() {
    const { navigation, editing } = this.props
    const { editedSearchString } = this.state

    const { searchString } = navigation.state.params

    if(editing) {
      return (
        <AppHeader searchBar rounded>
          <Left style={styles.searchBarLeft}>
            <Button
              transparent
              onPress={this.onBackPress}
            >
              <Icon name="arrow-back" />
            </Button>
          </Left>
          <Item>
            <Icon name="search" />
            <Input
              placeholder="Search"
              returnKeyType="search"
              value={editedSearchString}
              onChange={this.updateEditedSearchString}
              onSubmitEditing={this.updateSearchString}
              autoFocus={true}
            />
          </Item>
          <Right style={styles.searchBarRight}>
            <Button
              transparent
              onPress={this.onCancel}
            >
              <Icon name="close" />
            </Button>
          </Right>
        </AppHeader>
      )
    }

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
          <Title>{`“${searchString}”`}</Title>
        </Body>
        <Right>
          <Button
            transparent
            onPress={this.editSearchString}
          >
            <Icon name="search" />
          </Button>
        </Right>
      </AppHeader>
    )
  }
}

export default SearchHeader
