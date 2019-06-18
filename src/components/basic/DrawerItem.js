import React from "react"
// import { bindActionCreators } from "redux"
// import { connect } from "react-redux"
import { Image, StyleSheet, Linking } from "react-native"
import { ListItem, Body, Text } from "native-base"

import i18n from "../../utils/i18n.js"

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
})

class DrawerItem extends React.PureComponent {

  goToURL = event => {
    const { href } = this.props

    Linking.openURL(href).catch(err => {
      console.log('ERROR: Request to open URL failed.', err)
      navigation.navigate("ErrorMessage", {
        message: i18n("Your device is not allowing us to open this link."),
      })
    })
  }

  render() {
    const { text, image, imageWidth, imageHeight, href } = this.props

    return (
      <ListItem
        button
        data-href={href}
        onPress={this.goToURL}
        style={styles.listItem}
      >
        <Body>
          {!!text &&
            <Text>{text}</Text> 
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
