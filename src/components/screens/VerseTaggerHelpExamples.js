import React, { useCallback, useState } from "react"
import { StyleSheet, Text } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { getRefFromLoc } from "@bibletags/bibletags-versification"
import { i18n } from "inline-i18n"

import { memo, safelyExecuteSelects } from "../../utils/toolbox"

import VerseTaggerContent from "./VerseTaggerContent"
import CoverAndSpin from "../basic/CoverAndSpin"
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
  style,

  eva: { style: themedStyle={} },

  myBibleVersions,
}) => {

  const [ examplePassages, setExamplePassages ] = useState()
  const [ exampleIndex, setExampleIndex ] = useState(0)
  const incrementExampleIndex = useCallback(() => setExampleIndex(exampleIndex + 1), [ exampleIndex ])

  const { downloadedVersionIds } = useBibleVersions({ myBibleVersions })

  useEffectAsync(
    async () => {

      const totalToFind = 25
      const newExamplePassages = []

      for(let versionId of downloadedVersionIds) {
        if(versionId === 'original') continue
        if(newExamplePassages.length >= totalToFind) break

        const tagSetSelectObj = {
          database: `versions/${versionId}/tagSets`,
          statement: () => `SELECT * FROM tagSets WHERE status=? LIMIT ?`,
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
    <VerseTaggerContent
      key={JSON.stringify(passage)}
      passage={passage}
      viewOnly={true}
      incrementExampleIndex={examplePassages.length >= 2 ? incrementExampleIndex : null}
    />
  )

}

const mapStateToProps = ({ myBibleVersions }) => ({
  myBibleVersions,
})

const matchDispatchToProps = dispatch => bindActionCreators({
}, dispatch)

export default memo(connect(mapStateToProps, matchDispatchToProps)(VerseTaggerHelpExamples), { name: 'VerseTaggerHelpExamples' })