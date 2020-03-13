import React, { useCallback } from "react"
import Constants from "expo-constants"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { Image, StyleSheet, Linking, StatusBar, TouchableOpacity, Text, View } from "react-native"
import { List, Layout, styled } from '@ui-kitten/components'
import { i18n } from "inline-i18n"
import { useDimensions } from 'react-native-hooks'

import useThemedStyleSets from "../../hooks/useThemedStyleSets"
import menuItems from '../../../menu.js'
import useNetwork from "../../hooks/useNetwork"
import useRouterState from "../../hooks/useRouterState"

import DrawerItem from '../basic/DrawerItem'

const {
  LINK_TO_BIBLE_TAGS_MARKETING_SITE,
  INCLUDE_BIBLE_TAGS_PROMO_TEXT,
} = Constants.manifest.extra
        
const styles = StyleSheet.create({
  // separator: {                This doesn't seem to be being used anywhere
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
  // offline: {                  Also doesn't seem to be being used
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
})

const Drawer = ({
  style,

  themedStyle,
  displaySettings,
}) => {

  const { baseThemedStyle, labelThemedStyle, altThemedStyleSets } = useThemedStyleSets(themedStyle)
  const [ selectedThemedStyle={} ] = altThemedStyleSets

  const { historyPush } = useRouterState()
  const { online } = useNetwork()
  const { height } = useDimensions().window

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

  const minHeight = height - (StatusBar.currentHeight || 0)

  const renderItem = ({ item, index }) => (
    <DrawerItem
      key={index}
      offline={!online}
      {...item}
    />
  )

  return (
    <Layout>
      <View style={{ minHeight }}>
        <Image
          source={require('../../../assets/images/drawer.png')}
          style={[
            styles.image,
            selectedThemedStyle,
            style,
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
                    style,
                  ]}
                >
                  {i18n("Open source Bible apps")}
                </Text>
              }
            </View>
          </TouchableOpacity>
        }
      </View>
    </Layout>
  )

}

const mapStateToProps = ({ displaySettings }) => ({
  displaySettings
})

const matchDispatchToProps = (dispatch, x) => bindActionCreators({
}, dispatch)

Drawer.styledComponentName = 'Drawer'

export default styled(connect(mapStateToProps, matchDispatchToProps)(Drawer))
