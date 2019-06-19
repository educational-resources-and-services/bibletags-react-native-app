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

  state = {
    editing: false,
    editedSearchString: "",
  }

  componentDidMount() {
    const { navigation } = this.props
    const { editOnOpen, searchString } = navigation.state.params

    this.setState({
      editedSearchString: searchString,
      editing: !!editOnOpen,
    })
  }

  updateEditedSearchString = ({ nativeEvent }) => {
    this.setState({ editedSearchString: nativeEvent.text })
  }

  onCancel = () => {
    const { navigation } = this.props
    const { searchString } = navigation.state.params

    this.setState({
      editedSearchString: searchString,
      editing: false,
    })
  }

  editSearchString = () => this.setState({ editing: true })

  onBackPress = () => {
    const { navigation } = this.props
    
    debounce(navigation.goBack)
    // debounce(navigation.goBack, navigation.state.params.pageKey)
  }

  render() {
    const { navigation } = this.props
    const { editing, editedSearchString } = this.state

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
              autoFocus={true}
            />
          </Item>
          <Right style={styles.searchBarRight}>
            <Button
              transparent
              onPress={this.onCancel}
              disabled={!searchString}
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
