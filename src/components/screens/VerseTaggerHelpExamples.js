import React, { useCallback, useState } from "react"
import { StyleSheet, Text } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { getRefFromLoc } from "@bibletags/bibletags-versification"
import { i18n } from "inline-i18n"

import { memo, safelyExecuteSelects } from "../../utils/toolbox"

import VerseTaggerContent from "./VerseTaggerContent"
import CoverAndSpin from "../basic/CoverAndSpin"
import LowerPanel from "../basic/LowerPanel"
import useEffectAsync from "../../hooks/useEffectAsync"
import useBibleVersions from "../../hooks/useBibleVersions"

const styles = StyleSheet.create({
  none: {
    paddingTop: 100,
    paddingHorizontal: 20,
    fontWeight: '200',
    textAlign: 'center',
  },
})

const VerseTaggerHelpExamples = ({
  showHebrewExamples,
  showGreekExamples,
  style,

  eva: { style: themedStyle={} },

  myBibleVersions,
}) => {

  const [ examplePassages, setExamplePassages ] = useState()
  const [ exampleIndex, setExampleIndex ] = useState(0)
  const incrementExampleIndex = useCallback(() => setExampleIndex(exampleIndex + 1), [ exampleIndex ])
  const [ selectedData, setSelectedData ] = useState({})

  const { downloadedVersionIds } = useBibleVersions({ myBibleVersions })

  useEffectAsync(
    async () => {

      const totalToFind = 100
      const newExamplePassages = []

      for(let versionId of downloadedVersionIds) {
        if(versionId === 'original') continue
        if(newExamplePassages.length >= totalToFind) break

        const testamentCondition = (
          showHebrewExamples === showGreekExamples
            ? ``
            : (
              showHebrewExamples
                ? `AND (id LIKE "0%" OR id LIKE "1%" OR id LIKE "2%" OR id LIKE "3%")`
                : `AND (id LIKE "4%" OR id LIKE "5%" OR id LIKE "6%")`
            )
        )

        const tagSetSelectObj = {
          database: `versions/${versionId}/tagSets`,
          statement: () => `SELECT * FROM tagSets WHERE status=? LIMIT ?`,
          statement: () => `SELECT * FROM tagSets WHERE status=? ${testamentCondition} LIMIT ?`,
          args: [
            `confirmed`,
            totalToFind - newExamplePassages.length,
          ],
          jsonKeys: [ 'tags' ],
        }

        const [ tagSets ] = await safelyExecuteSelects([ tagSetSelectObj ])

        tagSets.forEach(({ id }) => {
          const [ loc ] = id.split('-')
          newExamplePassages.push({
            ref: getRefFromLoc(loc),
            versionId,
          })
        })

      }

      setExamplePassages(newExamplePassages)

    },
    [ downloadedVersionIds ],
  )

  if(!examplePassages) return <CoverAndSpin />

  if(!examplePassages[0]) {
    return (
      <Text style={styles.none}>
        {i18n("There are no examples available at this time.")}
      </Text>
    )
  }

  const passage = examplePassages[exampleIndex % examplePassages.length]

  return (
    <>

      <VerseTaggerContent
        key={JSON.stringify(passage)}
        passage={passage}
        viewOnly={true}
        incrementExampleIndex={examplePassages.length >= 2 ? incrementExampleIndex : null}
        lowerPanelWordId={(selectedData.selectedInfo || {})[`x-id`]}
        setSelectedData={setSelectedData}
      />

      <LowerPanel
        selectedData={selectedData}
        hideEditTagIcon={true}
      />

    </>
  )

}

const mapStateToProps = ({ myBibleVersions }) => ({
  myBibleVersions,
})

const matchDispatchToProps = dispatch => bindActionCreators({
}, dispatch)

export default memo(connect(mapStateToProps, matchDispatchToProps)(VerseTaggerHelpExamples), { name: 'VerseTaggerHelpExamples' })