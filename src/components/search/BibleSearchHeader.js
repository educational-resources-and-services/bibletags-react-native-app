import { i18n } from "inline-i18n"
import { i18nReact } from 'inline-i18n/build/i18nReact'
import { StyleSheet, Text, View } from "react-native"
import { isOriginalLanguageSearch } from "@bibletags/bibletags-ui-helper"

import { memo } from '../../utils/toolbox'

import BibleSearchPlusVersionsMenu from './BibleSearchPlusVersionsMenu'

const paddingVertical = 7

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: paddingVertical,
    paddingBottom: paddingVertical + 1,  // +1 to match the divider
  },
  versionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    flexShrink: 1,
  },
  versions: {
    fontSize: 12,
    fontWeight: '500',
    flexShrink: 1,
    alignSelf: 'center',
  },
  hits: {
    fontSize: 12,
    paddingHorizontal: 15,
    fontWeight: '300',
    flexShrink: 1,
    alignSelf: 'center',
  },
})

const BibleSearchHeader = ({
  searchText,
  includeVersionIds,
  totalRows,
  hitsByBookId,

  eva: { style: themedStyle={} },
}) => {

  const isOrigLanguageSearch = isOriginalLanguageSearch(searchText)

  const unitLabels = {
    verse: [ i18n("verse"), i18n("verses") ],
    phrase: [ i18n("phrase"), i18n("phrases") ],
    sentence: [ i18n("sentence"), i18n("sentences") ],
    paragraph: [ i18n("paragraph"), i18n("paragraphs") ],
  }

  const [ x, same ] = searchText.match(/(?:^| )same:([a-z]+)(?: |$)/) || []
  const unit = (unitLabels[same] || unitLabels.verse)[totalRows === 1 ? 0 : 1]
  const numberOfHits = hitsByBookId && hitsByBookId.reduce((total, hits) => total + hits, 0)

  return (
    <View
      style={[
        styles.container,
        themedStyle,
      ]}
    >

      <Text
        style={styles.hits}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {
          hitsByBookId
            ? (
              i18n("{{number_of_hits}} {{hits}} in {{number_of_units}} {{unit}}", {
                hits: numberOfHits > 1 ? i18n("hits") : i18n("hit"),
                number_of_hits: numberOfHits,
                number_of_units: totalRows,
                unit,
              })
            )
            : (
              i18n("{{number_of_units}} {{unit}}", {
                number_of_units: totalRows,
                unit,
              })
            )
        }
      </Text>

      {isOrigLanguageSearch &&
        <View style={styles.versionsContainer}>
          <Text
            style={styles.versions}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            Heb+Grk
          </Text>
          <BibleSearchPlusVersionsMenu
            searchText={searchText}
            includeVersionIds={includeVersionIds}
          />
        </View>
      }

    </View>
  )
}

export default memo(BibleSearchHeader, { name: 'BibleSearchHeader' })