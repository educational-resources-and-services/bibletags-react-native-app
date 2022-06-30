import React, { useContext } from 'react'
import { StyleSheet, View, Text } from "react-native"
import { i18n } from "inline-i18n"

// import { LoggedInUserContext } from '../context/LoggedInUser'
import { getOriginalWordsForSearch } from '../utils/toolbox'

import Icon from '../components/basic/Icon'

const parenthasesColors = [
  'rgb(15,106,186)',
  'rgb(202,12,46)',
  'rgb(230,151,5)',
  'rgb(168,48,255)',
  'rgb(40,174,39)',
]

const getParenthasesStyle = depth => ({
  color: parenthasesColors[depth % parenthasesColors.length],
})

const origWord = {
  position: 'absolute',
  top: -17,
  left: 0,
  right: 0,
  fontSize: 13,
  opacity: .5,
  textAlign: 'center',
  // whiteSpace: 'nowrap',
  overflow: 'hidden',
  // text-overflow: ellipsis;
}

const styles = StyleSheet.create({
  placeholder: {
    opacity: .35,
  },
  quotationMark: {
    color: 'rgb(40,174,39)',
  },
  star: {
    color: 'rgb(230,151,5)',
  },
  dotOrPlaceholderStar: {
    color: 'rgb(40,174,39),'
  },
  flag: {
    opacity: .45,
  },
  version: {
    opacity: .5,
  },
  action: {
    opacity: .45,
    borderWidth: 1,
    // borderColor: 'black',
    borderRadius: 2,
    marginTop: 14,
    marginHorizontal: 12,
    paddingVertical: 1,
    paddingHorizontal: 4,
    fontSize: 11,
    lineHeight: 14,
    // text-transform: uppercase;
    // verticalAlign: 'top',
  },
  openInNewIcon: {
    height: 12,
    marginRight: -6,
    marginBottom: -2,
    marginLeft: -1,
  },
  word: {
    flexDirection: 'row',
    // ${({ $showUnderline, theme }) => !$showUnderline ? `` : `
    //   ::before {
    //     content: "";
    //     background-color: ${theme.palette.grey[400]};
    //     height: 1px;
    //     position: absolute;
    //     left: 1px;
    //     right: 0;
    //     bottom: 11px;
    //   }
    // `}
  },
  origWord,
  gloss: {
    ...origWord,
    top: 'auto',
    bottom: -16,
    fontSize: 11,
  },
  detail: {
    // inline-block
  },
  hashOrSlash: {
    opacity: .45,
  },
  tabAddition: {
    opacity: .35,
  },
  resultCount: {
    // display: inline-block;
    opacity: .45,
    marginHorizontal: 12,
    fontSize: 12,
  },
})

const useFormattedSearchValue = ({
  value,
  action,
  versionId,
  tabAddition,
  suggestedQuery,
  resultCount,
  // logo,
}) => {

  let formattedValue = value || suggestedQuery || ``

  const user = null //useContext(LoggedInUserContext)
  const { hasToolsPlan } = user || {}

  if(!formattedValue) {
    return (
      <Text style={styles.placeholder}>
        {
          i18n("Search Bibles...")
          // hasToolsPlan
          //   ? i18n("Search Bibles, projects, and more...")
          //   : i18n("Search Bibles, and more...")
        }
      </Text>
    )
  }

  if(action) {
    const actionText = {
      open: i18n("Open"),
      read: i18n("Read"),
      "open-new-tab": (
        <>
          {i18n("Open")}
          <Icon name="md-open" style={styles.openInNewIcon} />
        </>
      ),
    }[action]

    let versionText
    if(action === 'read' && versionId && /^(.*)( .+)$/.test(formattedValue)) {
      ;[ formattedValue, versionText ] = formattedValue.match(/^(.*)( .+)$/).slice(1)
    }

    formattedValue = (
      <>
        {formattedValue}
        {!!versionText && <Text style={styles.version}>{versionText}</Text>}
        {!!actionText && <Text style={styles.action}>{`  `}{actionText}</Text>}
      </>
    )
  }

  if(!action) {
    let parenDepth = 0
    const words = formattedValue.split(/( +|[()"])/g).filter(Boolean)
    const originalWords = getOriginalWordsForSearch()
    formattedValue = (
      <>

        {words.map((word, idx) => {
          const isLastWord = idx === words.length - 1

          if(word === '"') {
            return (
              <Text style={styles.quotationMark} key={idx}>"</Text>
            )
          } else if(word === '(') {
            return (
              <Text style={getParenthasesStyle(parenDepth++)} key={idx}>(</Text>
            )
          } else if(word === ')') {
            return (
              <Text style={getParenthasesStyle(--parenDepth)} key={idx}>)</Text>
            )
          } else if(/^[0-9]+\+|\/$/.test(word)) {
            return (
              <Text style={getParenthasesStyle(Math.max(parenDepth - 1, 0))} key={idx}>{word}</Text>
            )
          } else if(word === '...') {
            return (
              <Text style={styles.dotOrPlaceholderStar} key={idx}>...</Text>
            )
          } else if(word === '*') {
            return (
              <Text style={styles.dotOrPlaceholderStar} key={idx}>*</Text>
            )
          } else if(/.\*$/.test(word)) {
            return (
              <React.Fragment key={idx}>
                {word.slice(0, -1)}
                <Text style={styles.star}>*</Text>
              </React.Fragment>
            )
          } else if(/^[a-z]+:[-a-zA-Z,/+]+(?::[0-9]+)?$/.test(word)) {
            return (
              <Text style={styles.flag} key={idx}>{word}</Text>
            )
          }

          if(!/^(?:#|(?:#[^=#]+)+|=[^=#]*)$/.test(word)) return word
          const details = word.split(/(#[^#]*)/g).filter(Boolean)
          return (
            <React.Fragment
              // style={styles.word}
              key={idx}
              // $showUnderline={!!value}
            >
              {details.map((detail, idx) => {
                const isLastDetail = idx === details.length - 1
                const tabAdditionToUse = (isLastWord && isLastDetail && tabAddition) || ``
                const originalWord = originalWords[`${detail}${tabAdditionToUse}`.replace(/^#(?:not:)?/, '')]
                return (
                  <React.Fragment key={idx}>
                    {/* {originalWord && <Text style={styles.origWord}>{originalWord.lex}</Text>} */}
                    {
                      detail
                        .split(/([#/])/g)
                        .map((hashSlashOrOtherwise, idx) => (
                          [ '#', '/' ].includes(hashSlashOrOtherwise)
                            ? <Text style={styles.hashOrSlash} key={idx}>{hashSlashOrOtherwise}</Text>
                            : <Text key={idx}>{hashSlashOrOtherwise}</Text>
                        ))
                    }
                    {!!tabAdditionToUse &&
                      <Text style={styles.tabAddition}>{tabAdditionToUse}</Text>
                    }
                    {/* {!!suggestedQuery && originalWord && <Text style={styles.gloss}>{originalWord.gloss}</Text>} */}
                  </React.Fragment>
                )
              })}
            </React.Fragment>
          )
        })}

        {!!resultCount &&
          <Text style={styles.resultCount}>
            {` `}
            {i18n("{{count}}x", {
              count: resultCount,
            })}
          </Text>
        }

      </>
    )
  }

  return formattedValue

}

export default useFormattedSearchValue
