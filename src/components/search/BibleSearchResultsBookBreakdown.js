import { useCallback } from 'react'
import { StyleSheet } from "react-native"
import { i18n } from "inline-i18n"
import { getBibleBookName, getBibleBookAbbreviatedName } from '@bibletags/bibletags-ui-helper'

import { memo } from '../../utils/toolbox'

const styles = StyleSheet.create({
  container: {
    padding: 10,
    // color: ${({ theme }) => theme.palette.text.primary};  // so that the grey text that accompanies the PassagePopper doesn't affect this container
  },
  bookWithCount: {
    fontSize: 11,
    lineHeight: 20,
    textAlign: 'right',

    // ${({ $visible, theme }) => $visible ? `` : `
    //   color: ${theme.palette.grey[500]};
    // `}

    // ${({ $zero }) => $zero ? `` : `
    //   :hover {
    //     cursor: pointer;
    //     text-decoration: underline;
    //   }
    // `}

    // ${({ $zero, theme }) => !$zero ? `` : `
    //   color: ${theme.palette.grey[400]};
    //   cursor: default;
    // `}
  },
})

const sections = [
  [1,2,3,4,5],
  [6,7,8,9,10,11,12,13,14,15,16,17],
  [18,19,20,21,22],
  [23,24,25,26,27],
  [28,29,30,31,32,33,34,35,36,37,38,39],
  [40,41,42,43],
  [44],
  [45,46,47,48,49,50,51,52,53,54,55,56,57,58],
  [59,60,61,62,63,64,65],
  [66],
]

// const sectionsHebrewOrdering = [
//   [1,2,3,4,5],
//   [6,7,9,10,11,12],
//   [23,24,26,28,29,30,31,32,33,34,35,36,37,38,39],
//   [19,20,18,22,8,25,21,17,27,15,16,13,14],
//   ...sections.slice(5),
// ]

const BibleSearchResultsBookBreakdown = ({
  rowCountByBookId,
  hitsByBookId,
  hebrewOrdering,
  visibleRange,
  virtuosoRef,
  totalRows,
}) => {

  let totalRowCount = 0

  const isVisible = rowCount => (
    (
      totalRowCount + rowCount >= visibleRange.startIndex + 1
      && totalRowCount + rowCount <= visibleRange.endIndex
    )
    || (
      totalRowCount >= visibleRange.startIndex + 1
      && totalRowCount <= visibleRange.endIndex
    )
    || (
      totalRowCount <= visibleRange.startIndex + 1
      && totalRowCount + rowCount >= visibleRange.endIndex
    )
  )

  const onPress = useCallback(
    ({ target }) => {
      virtuosoRef.current.scrollToIndex({
        index: parseInt(target.getAttribute('data-index'), 10),
        behavior: totalRows < 100 ? "smooth" : "auto",
        offset: -62,
      })
    },
    [ virtuosoRef, totalRows ],
  )

  if(hitsByBookId.filter(Boolean).length <= 15) {
    return (
      <View style={styles.container}>

        {hitsByBookId.map((hits, bookId) => {
          if(hits === 0) return null

          const rowCount = rowCountByBookId[bookId]
          const index = totalRowCount
          const visible = isVisible(rowCount)
          totalRowCount += rowCount

          return (
            <Text
              style={styles.bookWithCount}
              key={bookId}
              $visible={visible}
              onPress={onPress}
              data-index={index}
            >
              {i18n("{{book}} {{hits}}x", {
                book: getBibleBookName(bookId),
                hits,
              })}
            </Text>
          )
        })}

      </View>
    )
  }

  // let sectionsToUse = hebrewOrdering ? sectionsHebrewOrdering : sections
  let sectionsToUse = sections

  if(hebrewOrdering) {
    if(rowCountByBookId.slice(1,40).reduce((total, count) => total + count, 0) === 0) {
      sectionsToUse = sectionsToUse.slice(-5)
    } else if(rowCountByBookId.slice(40).reduce((total, count) => total + count, 0) === 0) {
      sectionsToUse = sectionsToUse.slice(0, 4)
    }
  }

  return (
    <View style={styles.container}>

      {sectionsToUse.map((section, idx) => {

        const index = totalRowCount
        const rowCount = section.reduce((total, bookId) => total + rowCountByBookId[bookId], 0)
        const hits = section.reduce((total, bookId) => total + hitsByBookId[bookId], 0)
        const visible = isVisible(rowCount)
        totalRowCount += rowCount

        return (
          <Text
            style={styles.bookWithCount}
            key={idx}
            $visible={visible}
            $zero={!hits}
            onPress={hits ? onPress : null}
            data-index={index}
          >
            {i18n("{{book}} {{hits}}x", {
              book: (
                section.length > 1
                  ? (
                    i18n("{{book1}}–{{book2}}", {
                      book1: getBibleBookAbbreviatedName(section[0]),
                      book2: getBibleBookAbbreviatedName(section.at(-1)),
                    })
                  )
                  : getBibleBookName(section[0])
              ),
              hits,
            })}
          </Text>
        )
      })}

    </View>
  )
}

export default memo(BibleSearchResultsBookBreakdown, { name: 'BibleSearchResultsBookBreakdown' })