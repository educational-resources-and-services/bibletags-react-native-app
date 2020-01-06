import React from "react"
import { StoreReview } from "expo"
import { Image, StyleSheet, Linking } from "react-native"
import { ListItem, Body, Text } from "native-base"

import i18n from "../../utils/i18n.js"
import { debounce, isConnected } from "../../utils/toolbox.js"

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: 0,
    paddingBottom: '50%',
    resizeMode: 'cover',
    backgroundColor: 'white',
  },
  listItem: {
    marginLeft: 0,
    paddingLeft: 10,
  },
  text: {
    textAlign: 'left',
  },
})

class DrawerItem extends React.PureComponent {

  goVersions = () => {
    const { navigation } = this.props

    debounce(
      navigation.navigate,
      "Versions",
    )
  }

  goToURL = event => {
    const { href } = this.props

    if(!href) return

    Linking.openURL(href).catch(err => {
      console.log('ERROR: Request to open URL failed.', err)
      navigation.navigate("ErrorMessage", {
        message: i18n("Your device is not allowing us to open this link."),
      })
    })
  }

  render() {
    const { text, image, imageWidth, imageHeight, onPress, type, href } = this.props

    let typeAction, typeText

    switch(type) {
      case 'rate': {
        if(!StoreReview.hasAction()) return null

        typeText = i18n("Rate this app")
        typeAction = StoreReview.requestReview
        break
      }
      case 'versions': {
        typeText = i18n("Bible version information")
        typeAction = this.goVersions
        break
      }
    }

    return (
      <ListItem
        {...((onPress || typeAction || href)
          ? {
            button: true,
            onPress: onPress || typeAction || this.goToURL,
          }
          : {}
        )}
        style={styles.listItem}
      >
        <Body>
          {!!(text || typeText) &&
            <Text style={styles.text}>{text || typeText}</Text> 
          }
          {!!image &&
            <Image
              source={image}
              style={[
                styles.image,
                {
                  width: imageWidth,
                  paddingBottom: imageHeight,
                },
              ]}
            />
          }
        </Body>
      </ListItem>
    )
  }
}

export default DrawerItem
