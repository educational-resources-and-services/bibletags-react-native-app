import React from "react"
import { Constants } from "expo"
// import { bindActionCreators } from "redux"
// import { connect } from "react-redux"
import { Image, StyleSheet, NetInfo, Linking, Dimensions, StatusBar, TouchableOpacity } from "react-native"
import { Container, Content, Text, List, ListItem, Left, Icon, Body, Separator, View } from "native-base"
import i18n from "../../utils/i18n.js"

import { debounce, isConnected } from "../../utils/toolbox.js"

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
            {!!LINK_TO_BIBLE_TAGS_MARKETING_SITE &&
              <TouchableOpacity
                onPress={this.goToBibleTagsMarketingSite}
              >
                <View style={styles.createdByContainer}>
                  <Text style={styles.createdBy}>{i18n("Created by Toad Reader")}</Text>
                  {!!INCLUDE_BIBLE_TAGS_PROMO_TEXT &&
                    <Text style={styles.launchYour}>{i18n("Launch your custom eReader")}</Text>
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

export default Drawer

// const mapStateToProps = (state) => ({
// })

// const matchDispatchToProps = (dispatch, x) => bindActionCreators({
// }, dispatch)

// export default connect(mapStateToProps, matchDispatchToProps)(Drawer)
