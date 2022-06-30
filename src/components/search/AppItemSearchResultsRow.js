import { StyleSheet, View } from "react-native"
// import { i18n } from "inline-i18n"

import { memo } from '../../utils/toolbox'

import Icon from "../basic/Icon"
import InlineLink from "../basic/InlineLink"

const styles = StyleSheet.create({
  container: {
    marginBottom: 5,
    fontSize: 16,
  },
  openInNewIcon: {
    height: 12,
    marginRight: -6,
    marginBottom: -2,
    marginLeft: -1,
  },
})

const AppItemSearchResultsRow = ({
  suggestedQuery,
  action,
  url,
  path,
}) => {

  return (
    <View style={styles.container}>

      <InlineLink to={url || path}>
        {suggestedQuery}
      </InlineLink>

      {action === 'open-new-tab' && <Icon name="md-open" style={styles.openInNewIcon} />}

    </View>
  )
}

export default memo(AppItemSearchResultsRow, { name: 'AppItemSearchResultsRow' })