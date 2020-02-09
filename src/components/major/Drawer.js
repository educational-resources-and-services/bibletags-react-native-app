import React from "react"
import Constants from "expo-constants"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { Image, StyleSheet, Linking, Dimensions, StatusBar, TouchableOpacity } from "react-native"
import NetInfo from '@react-native-community/netinfo'
import { Container, Content, Text, List, View } from "native-base"

import { i18n } from "inline-i18n"
import { isConnected } from "../../utils/toolbox.js"
import menuItems from '../../../menu.js'
import DrawerItem from '../basic/DrawerItem'

const {
  LINK_TO_BIBLE_TAGS_MARKETING_SITE,
  INCLUDE_BIBLE_TAGS_PROMO_TEXT,
} = Constants.manifest.extra
        
const styles = StyleSheet.create({
  separator: {
    flex: 0,
    height: 10,
    backgroundColor: '#e8e8e8',
  },
  image: {
    width: '100%',
    height: 0,
    paddingBottom: '50%',
    resizeMode: 'cover',
    backgroundColor: '#e8e8e8',
  },
  offline: {
    opacity: .25,
  },
  list: {
    flex: 1,
  },
  createdByContainer: {
    paddingTop: 40,
    paddingBottom: 20,
  },
  createdBy: {
    textAlign: 'center',
    fontSize: 12,
    color: '#cccccc',
  },
  launchYour: {
    textAlign: 'center',
    fontSize: 12,
    color: '#999999',
  },
  contrast: {
    color: '#000000',
  },
})

class Drawer extends React.Component {

  state = {
    offline: false,
  }

  componentDidMount() {
    isConnected().then(this.setOfflineStatus)
    NetInfo.addEventListener('connectionChange', this.setOfflineStatus)
  }

  componentWillUnmount() {
    NetInfo.removeEventListener('connectionChange', this.setOfflineStatus)
  }

  setOfflineStatus = connectionInfo => {
    this.setState({ offline: connectionInfo.type === 'none' })
  }

  // goToRead = () => {
  //   const { navigation } = this.props

  //   debounce(navigation.navigate, "Read")
  // }

  goToBibleTagsMarketingSite = () => {
    Linking.openURL("https://bibletags.org").catch(err => {
      console.log('ERROR: Request to open URL failed.', err)
      navigation.navigate("ErrorMessage", {
        message: i18n("Your device is not allowing us to open this link."),
      })
    })
  }

  render() {
    const { navigation, displaySettings } = this.props
    const { offline } = this.state

    const { height } = Dimensions.get('window')
    const minHeight = height - (StatusBar.currentHeight || 0)

    return (
      <Container>
        <Content>
          <View style={{ minHeight }}>
            <Image
              source={require('../../../assets/images/drawer.png')}
              style={styles.image}
            />
            <List style={styles.list}>
              {menuItems.map((menuItem, idx) => (
                <DrawerItem
                  key={idx}
                  offline={offline}
                  navigation={navigation}
                  {...menuItem}
                />
              ))}
            </List>
            {!!LINK_TO_BIBLE_TAGS_MARKETING_SITE &&
              <TouchableOpacity
                onPress={this.goToBibleTagsMarketingSite}
              >
                <View style={styles.createdByContainer}>
                  <Text
                    style={[
                      styles.createdBy,
                      displaySettings.theme === 'high-contrast' ? styles.contrast : null,
                    ]}
                  >
                    {i18n("Powered by Bible Tags")}
                  </Text>
                  {!!INCLUDE_BIBLE_TAGS_PROMO_TEXT &&
                    <Text
                      style={[
                        styles.launchYour,
                        displaySettings.theme === 'high-contrast' ? styles.contrast : null,
                      ]}
                    >
                      {i18n("Open source Bible apps")}
                    </Text>
                  }
                </View>
              </TouchableOpacity>
            }
          </View>
        </Content>
      </Container>
    )
  }
}

const mapStateToProps = ({ displaySettings }) => ({
  displaySettings
})

const matchDispatchToProps = (dispatch, x) => bindActionCreators({
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(Drawer)
