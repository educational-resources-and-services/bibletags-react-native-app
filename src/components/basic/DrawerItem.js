import React, { useCallback } from "react"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import * as StoreReview from "expo-store-review"
import { Image, StyleSheet, Linking } from "react-native"
import { ListItem } from "@ui-kitten/components"
import { i18n, getLocale } from "inline-i18n"

import useRouterState from "../../hooks/useRouterState"
import useTagAnotherVerse from "../../hooks/useTagAnotherVerse"
import { sentry, memo } from "../../utils/toolbox"

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: 0,
    paddingBottom: '50%',
    resizeMode: 'cover',
  },
  listItem: {
    marginLeft: 0,
    paddingLeft: 10,
  },
  text: {
    textAlign: 'left',
  },
})

const DrawerItem = React.memo(({
  type,
  route,
  href,
  text,
  image,
  imageWidth,
  imageHeight,
  onPress,
  locales,

  myBibleVersions,
}) => {

  const { historyPush, historyReplace } = useRouterState()

  const { tagAnotherVerse: tagAnotherVerseOT } = useTagAnotherVerse({ myBibleVersions, testament: `ot` })
  const { tagAnotherVerse: tagAnotherVerseNT } = useTagAnotherVerse({ myBibleVersions, testament: `nt` })

  const changeLanguage = useCallback(() => historyReplace("/LanguageChooser"), [])
  const goVersions = useCallback(() => historyReplace("/Read/Versions"), [])

  const go = useCallback(
    event => {
      if(route) {
        historyReplace(route)
        return
      }

      if(type === 'rate') {
        href = StoreReview.storeUrl()
      }

      if(!href) return

      Linking.openURL(href).catch(error => {
        sentry({ error })
        historyPush("/ErrorMessage", {
          message: i18n("Your device is not allowing us to open this link."),
        })
      })
    },
    [ type, href, route ],
  )

  if(locales && !locales.includes(getLocale())) return null

  let typeAction, typeText

  switch(type) {
    case 'language': {
      typeText = i18n("Change app language")
      typeAction = changeLanguage
      break
    }
    case 'rate': {
      typeText = i18n("Rate this app")
      typeAction = go
      break
    }
    case 'versions': {
      typeText = i18n("Bible version information")
      typeAction = goVersions
      break
    }
    case 'tag-ot': {
      typeText = i18n("Tag {{language}} verses", { language: i18n("Hebrew") })
      typeAction = tagAnotherVerseOT
      break
    }
    case 'tag-nt': {
      typeText = i18n("Tag {{language}} verses", { language: i18n("Greek") })
      typeAction = tagAnotherVerseNT
      break
    }
  }

  return (
    <>
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
      {!image &&
        <ListItem
          {...((onPress || typeAction || route || href)
            ? {
              onPress: onPress || typeAction || go,
            }
            : {}
          )}
          style={styles.listItem}
          title={text || typeText}
        />
      }
    </>
  )

})

const mapStateToProps = ({ myBibleVersions }) => ({
  myBibleVersions,
})

const matchDispatchToProps = dispatch => bindActionCreators({
}, dispatch)

export default memo(connect(mapStateToProps, matchDispatchToProps)(DrawerItem), { name: 'DrawerItem' })