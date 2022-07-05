import React, { useCallback } from "react"
import Constants from "expo-constants"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { Image, StyleSheet, Linking, TouchableOpacity, Text, View } from "react-native"
import { List, Layout, Divider } from "@ui-kitten/components"
import { i18n } from "inline-i18n"

import useThemedStyleSets from "../../hooks/useThemedStyleSets"
import menuItems from "../../../menu"
import useNetwork from "../../hooks/useNetwork"
import useRouterState from "../../hooks/useRouterState"
import useBibleVersions from "../../hooks/useBibleVersions"
import { memo, sentry, getVersionInfo } from "../../utils/toolbox"

import DrawerItem from "../basic/DrawerItem"
import Spin from "../basic/Spin"

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
    paddingBottom: 10,
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
    paddingTop: 10,
    paddingBottom: 20,
  },
  divider: {
    marginVertical: 10,
  },
  downloading: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
    marginHorizontal: 40,
  },
  downloadingText: {
    fontSize: 10,
    textAlign: 'center',
  },
  spin: {
    height: 5,
    transform: [{
      scale: .5,
    }],
  },
})

const Drawer = ({
  style,
  imageStyle,
  labelStyle,

  eva: { style: themedStyle={} },

  myBibleVersions,
}) => {

  const { baseThemedStyle, labelThemedStyle, altThemedStyleSets } = useThemedStyleSets(themedStyle)
  const [
    imageThemedStyle={},
    subversionThemedStyle={}
  ] = altThemedStyleSets

  const { historyPush } = useRouterState()
  const { online } = useNetwork()

  const { downloadingVersionIds, searchDownloadingVersionIds } = useBibleVersions({ myBibleVersions })

  const goToBibleTagsMarketingSite = useCallback(
    () => {
      Linking.openURL("https://bibletags.org").catch(err => {
        sentry({ error })
        historyPush("/ErrorMessage", {
          message: i18n("Your device is not allowing us to open this link."),
        })
      })
    },
    [],
  )

  const renderItem = ({ item, index }) => (
    item.type === 'divider'
      ? (
        <Divider style={styles.divider} />
      )
      : (
        <DrawerItem
          key={index}
          offline={!online}
          {...item}
        />
      )
  )

  const combinedDownloadingVersionIds = [ ...downloadingVersionIds, ...searchDownloadingVersionIds ]

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
        {!online && combinedDownloadingVersionIds.length > 0 &&
          <View style={styles.downloading}>
            <Text
              style={[
                styles.downloadingText,
                baseThemedStyle,
                style,
              ]}
            >
              {i18n("There are {{num}} versions that will download next time you connect to the internet.", {
                num: combinedDownloadingVersionIds.length,
              })}
            </Text>
          </View>
        }
        {online && combinedDownloadingVersionIds.map(versionId => (
          <View
            key={versionId}
            style={styles.downloading}
          >
            <Spin
              size="small"
              style={styles.spin}
            />
            <Text
              style={[
                styles.downloadingText,
                baseThemedStyle,
                style,
              ]}
            >
              {
                downloadingVersionIds.includes(versionId)
                  ? (
                    i18n("Downloading {{version}} Bible text...", {
                      version: getVersionInfo(versionId).abbr,
                    })
                  )
                  : (
                    i18n("Downloading {{version}} search data...", {
                      version: getVersionInfo(versionId).abbr,
                    })
                  )
              }
            </Text>
          </View>
        ))}
        <Text
          style={[
            styles.subversion,
            subversionThemedStyle,
          ]}
        >
          Updated PUSH_DATE_STRING
        </Text>
      </View>
    </Layout>
  )

}

const mapStateToProps = ({ myBibleVersions }) => ({
  myBibleVersions
})

const matchDispatchToProps = (dispatch, x) => bindActionCreators({
}, dispatch)

export default memo(connect(mapStateToProps, matchDispatchToProps)(Drawer), { name: 'Drawer' })
