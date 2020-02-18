import React from "react"
import { StyleSheet, View, Linking, Text } from "react-native"

import { getVersionInfo, replaceWithJSX } from "../../utils/toolbox"
import useRouterState from "../../hooks/useRouterState"

import SafeLayout from "../basic/SafeLayout"
import BasicHeader from "../major/BasicHeader"

const styles = StyleSheet.create({
  body: {
    padding: 20,
    width: '100%',
  },
  copyrightLine: {
    marginBottom: 15,
  },
  copyright: {
    lineHeight: 24,
  },
  copyrightRTL: {
    writingDirection: 'rtl',
  },
  link: {
    color: 'blue',
    textDecorationLine: 'underline',
  },
})

const VersionInfo = () => {

  const { routerState } = useRouterState()
  const { versionId } = routerState

  const { name, copyright } = getVersionInfo(versionId)

  return (
    <SafeLayout>
      <BasicHeader
        title={name}
      />
      <View
        style={styles.body}
      >
        {copyright.split(/\n/g).map((copyrightLine, idx) => (
          <View
            key={idx}
            style={styles.copyrightLine}
          >
            <Text style={[
              styles.copyright,
              (copyrightLine.replace(/[^א-ת]/g, '').length > copyrightLine.length/2) ? styles.copyrightRTL : null,
            ]}
            >
              {replaceWithJSX(copyrightLine, '<a href="([^"]+)">([^<]+)<\/a>', (x, href, linkText) => (
                <Text
                  style={styles.link}
                  onPress={() => Linking.openURL(href)}
                >
                  {linkText}
                </Text>
              ))}
            </Text>
          </View>
        ))}
      </View>
    </SafeLayout>
  )

}

export default VersionInfo
