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
import { memo, sentry, getVersionInfo, safelyExecuteSelects } from "../../utils/toolbox"

import DrawerItem from "../basic/DrawerItem"
import DrawerStatusItem from "../basic/DrawerStatusItem"
import useMemoAsync from "../../hooks/useMemoAsync"

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
  offline: {
    fontWeight: '700',
    marginBottom: 5,
  },
})

const Drawer = ({
  open,
  dataSyncStatus,
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

  const numTagsToSubmit = useMemoAsync(
    async () => {
      const [[{ numTagsToSubmit=0 }]] = await safelyExecuteSelects([{
        database: `submittedTagSets`,
        statement: () => `SELECT COUNT(*) AS numTagsToSubmit FROM submittedTagSets WHERE submitted=0`,
        jsonKeys: [ 'input' ],
      }])
      return numTagsToSubmit
    },
    [ open, dataSyncStatus === 'done' ],
  )

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
  let downloadingMessage

  if(online) {
    if(combinedDownloadingVersionIds[0]) {
      const { abbr } = getVersionInfo(combinedDownloadingVersionIds[0])
      downloadingMessage = (
        downloadingVersionIds.includes(combinedDownloadingVersionIds[0])
          ? (
            i18n("Downloading {{version}} Bible text...", {
              version: abbr,
            })
          )
          : (
            i18n("Downloading {{version}} search data...", {
              version: abbr,
            })
          )
      )
    } else if(![ 'done' ].includes(dataSyncStatus)) {
      downloadingMessage = {
        definitions: i18n("Downloading definitions..."),
        tags: i18n("Downloading tags..."),
        submissions: i18n("Submitting {{num}} tag set(s)...", { num: numTagsToSubmit }),
      }[dataSyncStatus]
    }
  }

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
        {!online &&
          <DrawerStatusItem
            message={i18n("You are offline.")}
            style={styles.offline}
          />
        }
        {!online && !!numTagsToSubmit &&
          <DrawerStatusItem
            message={i18n("{{num}} tag set(s) are awaiting submission.", {
              num: numTagsToSubmit,
            })}
          />
        }
        {!online && combinedDownloadingVersionIds.length > 0 &&
          <DrawerStatusItem
            message={i18n("{{num}} version(s) are awaiting download.", {
              num: combinedDownloadingVersionIds.length,
            })}
          />
        }
        {!!downloadingMessage &&
          <DrawerStatusItem
            showSpinner={true}
            message={downloadingMessage}
          />
        }
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
