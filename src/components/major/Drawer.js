import React, { useCallback } from "react"
import Constants from "expo-constants"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { Image, StyleSheet, Linking, StatusBar, TouchableOpacity, Text, View } from "react-native"
import { List, Layout } from "@ui-kitten/components"
import { i18n } from "inline-i18n"

import useThemedStyleSets from "../../hooks/useThemedStyleSets"
import menuItems from "../../../menu"
import useNetwork from "../../hooks/useNetwork"
import useRouterState from "../../hooks/useRouterState"
import { memo } from "../../utils/toolbox"

import DrawerItem from "../basic/DrawerItem"

const {
  LINK_TO_BIBLE_TAGS_MARKETING_SITE,
  INCLUDE_BIBLE_TAGS_PROMO_TEXT,
} = Constants.manifest.extra
        
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  // separator: {
  //   flex: 0,
  //   height: 10,
  //   backgroundColor: '#e8e8e8',
  // },
  image: {
    width: '100%',
    height: 0,
    paddingBottom: '50%',
    resizeMode: 'cover',
  },
  // offline: {
  //   opacity: .25,
  // },
  list: {
    flex: 1,
    backgroundColor: 'white',
  },
  createdByContainer: {
    paddingTop: 40,
    paddingBottom: 20,
  },
  createdBy: {
    textAlign: 'center',
    fontSize: 12,
  },
  launchYour: {
    textAlign: 'center',
    fontSize: 12,
  },
  subversion: {
    fontSize: 9,
    textAlign: 'center',
    color: '#ddd',
    paddingBottom: 20,
  },
})

const Drawer = ({
  style,
  imageStyle,
  labelStyle,

  themedStyle,

  displaySettings,
}) => {

  const { baseThemedStyle, labelThemedStyle, altThemedStyleSets } = useThemedStyleSets(themedStyle)
  const [ imageThemedStyle={} ] = altThemedStyleSets

  const { historyPush } = useRouterState()
  const { online } = useNetwork()

  const goToBibleTagsMarketingSite = useCallback(
    () => {
      Linking.openURL("https://bibletags.org").catch(err => {
        console.log('ERROR: Request to open URL failed.', err)
        historyPush("/ErrorMessage", {
          message: i18n("Your device is not allowing us to open this link."),
        })
      })
    },
    [],
  )

  const renderItem = ({ item, index }) => (
    <DrawerItem
      key={index}
      offline={!online}
      {...item}
    />
  )

  return (
    <Layout>
      <View style={styles.container}>
        <Image
          source={require('../../../assets/images/drawer.png')}
          style={[
            styles.image,
            imageThemedStyle,
            imageStyle,
          ]}
        />
        <List
          style={styles.list}
          data={menuItems}
          renderItem={renderItem}
        />
        {!!LINK_TO_BIBLE_TAGS_MARKETING_SITE &&
          <TouchableOpacity
            onPress={goToBibleTagsMarketingSite}
          >
            <View style={styles.createdByContainer}>
              <Text
                style={[
                  styles.createdBy,
                  baseThemedStyle,
                  style,
                ]}
              >
                {i18n("Powered by Bible Tags")}
              </Text>
              {!!INCLUDE_BIBLE_TAGS_PROMO_TEXT &&
                <Text
                  style={[
                    styles.launchYour,
                    labelThemedStyle,
                    labelStyle,
                  ]}
                >
                  {i18n("Open source Bible apps")}
                </Text>
              }
            </View>
          </TouchableOpacity>
        }
        <Text style={styles.subversion}>Updated PUSH_DATE_STRING</Text>
      </View>
    </Layout>
  )

}

const mapStateToProps = ({ displaySettings }) => ({
  displaySettings
})

const matchDispatchToProps = (dispatch, x) => bindActionCreators({
}, dispatch)

export default memo(connect(mapStateToProps, matchDispatchToProps)(Drawer), { name: 'Drawer' })
