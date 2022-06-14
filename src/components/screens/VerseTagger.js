import React, { useMemo } from "react"
import { getPassageStr } from "@bibletags/bibletags-ui-helper"
import { i18n } from "inline-i18n"

import { getVersionInfo, memo, getTextLanguageId } from "../../utils/toolbox"
import useRouterState from "../../hooks/useRouterState"
import useTaggingInstructions from "../../hooks/useTaggingInstructions"

import SafeLayout from "../basic/SafeLayout"
import BasicHeader from "../major/BasicHeader"
import HeaderIconButton from "../basic/HeaderIconButton"
import VerseTaggerContent from "./VerseTaggerContent"

const VerseTagger = ({
  style,

  eva: { style: themedStyle={} },
}) => {

  const { routerState } = useRouterState()
  const { passage } = routerState
  const { ref, versionId } = passage

  const { instructionsCover, openInstructions } = useTaggingInstructions({
    defaultOrigLangForExamples: getTextLanguageId({ languageId: 'heb+grk', ...ref }),
  })

  const { abbr } = getVersionInfo(versionId)

  const extraButtons = useMemo(
    () => [
      <HeaderIconButton
        key="help"
        name="md-information-circle-outline"
        onPress={openInstructions}
        uiStatus="unselected"
      />,
    ],
    [ openInstructions ],
  )

  return (
    <SafeLayout>

      <BasicHeader
        title={i18n("Tag the {{version_abbr}} of {{passage}}", {
          version_abbr: abbr,
          passage: getPassageStr({
            refs: [ ref ],
          })
        })}
        extraButtons={extraButtons}
      />

      <VerseTaggerContent
        passage={passage}
        instructionsCover={instructionsCover}
      />

    </SafeLayout>
  )

}

export default memo(VerseTagger, { name: 'VerseTagger' })