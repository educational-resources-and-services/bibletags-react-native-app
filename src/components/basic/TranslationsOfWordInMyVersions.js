import React, { useCallback, useMemo } from "react"
import { StyleSheet, View, Text, TouchableOpacity } from "react-native"
import { i18n } from "inline-i18n"
import useToggle from "react-use/lib/useToggle"
const { getCorrespondingRefs, getRefFromLoc } = require('@bibletags/bibletags-versification')
const { escapeRegex } = require('@bibletags/bibletags-ui-helper')
import { OverflowMenu, MenuItem } from "@ui-kitten/components"

import { getVersionInfo, getOriginalVersionInfo, orderedStatusesArray, getStatusText } from "../../utils/toolbox"
import useRouterState from "../../hooks/useRouterState"

import StatusIcon from "./StatusIcon"
import Icon from "./Icon"

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  line: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  phrase: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  hebrewPhrase: {
    flexDirection: 'row-reverse',
  },
  spacerBeforeTranslation: {
    width: 10,
  },
  spacerBeforeVersions: {
    width: 5,
  },
  punctuation: {
    color: `rgba(0,0,0,.35)`,
  },
  wordPart: {
    fontSize: 15,
    lineHeight: 20,
  },
  translationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  translation: {
  },
  versionsAbbrContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  versionAbbr: {
    top: 1,
    fontSize: 11,
    color: `rgba(0,0,0,.45)`,
  },
  noTagged: {
    fontWeight: '200',
    color: `rgba(0,0,0,.45)`,
  },
  iconButtonContainer: {
    position: 'absolute',
    top: -4,
    right: -8,
    padding: 4,
  },
  iconButton: {
    height: 16,
  },
  menu: {
    width: 260,
  },
  menuHeaderContainer: {
    marginVertical: -12,
    paddingVertical: 8,
    marginHorizontal: -16,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,.05)',
  },
  menuHeader: {
    fontStyle: 'italic',
    fontSize: 12,
    color: 'rgba(0,0,0,.5)',
  },
  versionAbbrForMenu: {
    fontWeight: '700',
  },
  versionStatus: {
    fontWeight: '200',
    fontSize: 12,
  },
  greek: {
    fontFamily: `original-grk`,
    fontSize: 16,
  },
  hebrew: {
    fontFamily: `original-heb`,
  },
})

const TranslationsOfWordInMyVersions = ({
  translationsOfWordInMyVersions,
  originalLoc,
  originalLanguage,
  downloadedVersionIds,
  hideEditTagIcon,
  // onLayout,
}) => {

  const { historyPush } = useRouterState()
  const [ menuOpen, toggleMenuOpen ] = useToggle()

  const versionIds = useMemo(() => downloadedVersionIds.filter(versionId => versionId !== `original`), [ downloadedVersionIds ])

  const renderOverflowMenuAnchor = useCallback(
    () => (
      <TouchableOpacity
        style={styles.iconButtonContainer}
        onPress={toggleMenuOpen}
      >
        <Icon
          style={styles.iconButton}
          name="md-create"
        />
      </TouchableOpacity>
    ),
    [],
  )

  const onOptionSelect = useCallback(
    ({ row }) => {

      const versionId = versionIds[row - 1]
      const originalRef = getRefFromLoc(originalLoc)
      const originalVersionInfo = getOriginalVersionInfo(originalRef.bookId)

      const translationRefs = getCorrespondingRefs({
        baseVersion: {
          info: originalVersionInfo,
          ref: originalRef,
        },
        lookupVersionInfo: getVersionInfo(versionId),
      })

      const ref = translationRefs[0]  // TODO: I need to know either the loc of the translation this came from (preferred) OR the orig word number and then rerun getCorrespondingRefs to figure out which is right

      historyPush("/Read/VerseTagger", {
        passage: {
          versionId,
          ref,
        },
        selectionMethod: `next-verse`,
      })
      
    },
    [ versionIds, historyPush, originalLoc ],
  )

  const translationsOfWordInMyVersionsToShow = translationsOfWordInMyVersions.filter(({ translations }) => translations.some(({ translation }) => translation))
  const hidePhrases = translationsOfWordInMyVersionsToShow.every(({ phrase }) => phrase.length === 1)
  const spaceOrEllipsisRegex = new RegExp(`((?:${escapeRegex(i18n(" ", "word separator"))})|(?:${escapeRegex(i18n("…", "placed between nonconsecutive words"))}))`, 'g')

  const lowestStatusIdxByVersionId = {}
  translationsOfWordInMyVersionsToShow.forEach(({ translations }) => {
    translations.forEach(({ versions }) => {
      Object.keys(versions).forEach(status => {
        versions[status].forEach(versionId => {
          lowestStatusIdxByVersionId[versionId] = Math.min(lowestStatusIdxByVersionId[versionId] || Infinity, orderedStatusesArray.indexOf(status))
        })
      })
    })
  })

  return (
    <View
      style={styles.container}
      // onLayout={onLayout}
    >

      {translationsOfWordInMyVersionsToShow.length === 0 &&
        <Text style={styles.noTagged}>
          {translationsOfWordInMyVersions.length > 0
            ? i18n("Untranslated")
            : i18n("Word not yet tagged.")
          }
        </Text>
      }

      {translationsOfWordInMyVersionsToShow.map(({ phrase, translations }, idx) => (
        <View style={styles.line} key={idx}>

          {!hidePhrases &&
            <View
              style={[
                styles.phrase,
                styles[`${originalLanguage}Phrase`],
              ]}
            >
              {phrase.map(({ text, color }, idx) => (
                <Text
                  key={idx}
                  style={[
                    styles.wordPart,
                    styles[originalLanguage],
                    { color },
                  ]}
                >
                  {text}
                </Text>
              ))}
            </View>
          }

          {translations.filter(({ translation }) => translation).map(({ translation, versions }, idx) => (
            <View
              key={idx}
              style={styles.translationContainer}
            >

              {(!hidePhrases || idx > 0) &&
                <View style={styles.spacerBeforeTranslation} />
              }

              <Text
                style={[
                  styles.translation,
                  // styles.punctuation,
                ]}
              >
                {i18n("“", "open quote")}
              </Text>
              {translation.split(spaceOrEllipsisRegex).map((translationWord, idx) => (
                <Text
                  key={idx}
                  style={[
                    styles.translation,
                    translationWord === i18n("…", "placed between nonconsecutive words") ? styles.punctuation : null,
                  ]}
                >
                  {/* {idx !== 0 && ` `} */}
                  {translationWord}
                </Text>
              ))}
              <Text
                style={[
                  styles.translation,
                  // styles.punctuation,
                ]}
              >
                {i18n("”", "close quote")}
              </Text>

              <View style={styles.spacerBeforeVersions} />

              <View style={styles.versionsAbbrContainer}>
                {[ ...orderedStatusesArray ]
                  .reverse()
                  .map(status => versions[status].map(versionId => ({ status, versionId })))
                  .flat()
                  .map(({ versionId }, idx) => (
                    <React.Fragment key={idx}>

                      {idx !== 0 &&
                        <Text
                          style={[
                            styles.translation,
                            styles.punctuation,
                          ]}
                        >
                          {i18n(",", "narrow list separator")}
                        </Text>
                      }

                      <Text style={styles.versionAbbr}>
                        {getVersionInfo(versionId).abbr}
                      </Text>

                    </React.Fragment>
                  ))
                }
              </View>

            </View>
          ))}

        </View>
      ))}

      {!hideEditTagIcon &&
        <OverflowMenu
          visible={menuOpen}
          onSelect={onOptionSelect}
          onBackdropPress={toggleMenuOpen}
          anchor={renderOverflowMenuAnchor}
          placement="top end"
          style={styles.menu}
        >
          <MenuItem
            disabled={true}
            title={
              <View>
                <View style={styles.menuHeaderContainer}>
                  <Text style={styles.menuHeader}>
                    {i18n("Edit tags for the...")}
                  </Text>
                </View>
              </View>
            }
          />
          {versionIds.map(versionId => {
            const status = orderedStatusesArray[lowestStatusIdxByVersionId[versionId] || 0]
            return (
              <MenuItem
                key={versionId}
                title={
                  <Text>
                    <Text style={styles.versionAbbrForMenu}>
                      {getVersionInfo(versionId).abbr}
                    </Text>
                    {`  `}
                    <Text style={styles.versionStatus}>
                      {getStatusText(status)}
                      {` `}
                      <StatusIcon status={status} />
                      {` `}
                    </Text>
                  </Text>
                }
              />
            )
          })}
        </OverflowMenu>
      }

    </View>
  )

}

export default TranslationsOfWordInMyVersions