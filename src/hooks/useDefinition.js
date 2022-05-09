import { useState, useMemo } from "react"
import useCounter from "react-use/lib/useCounter"

import { getAsyncStorage, safelyExecuteSelects } from "../utils/toolbox"
import useBibleVersions from "./useBibleVersions"
import useEffectAsync from "./useEffectAsync"

const useDefinition = ({
  definitionId,
  versionId,
  myBibleVersions,
}) => {

  const [ forceDefinitionUpdateIdx, { inc: forceDefinitionUpdate }] = useCounter(0)
  const { languageIds } = useBibleVersions({ myBibleVersions })

  const [ definition, setDefinition ] = useState()
  const [ languageSpecificDefinition, setLanguageSpecificDefinition ] = useState()
  const [ translationBreakdown, setTranslationBreakdown ] = useState()
  const [ languageId, setLanguageId ] = useState(languageIds[0])

  useEffectAsync(
    async () => {

      setDefinition()

      const [ [ definition ] ] = await safelyExecuteSelects([
        {
          database: `versions/original/ready/definitions`,
          statement: () => `SELECT * FROM definitions WHERE id=?`,
          args: [
            definitionId,
          ],
          jsonKeys: [ 'lxx', 'lemmas', 'forms' ],
        },
      ])

      setDefinition(definition)

    },
    [ definitionId ],
  )

  useEffectAsync(
    async () => {

      setLanguageSpecificDefinition()

      const lastChosenDefinitionLanguageId = await getAsyncStorage(`lastChosenDefinitionLanguageId`, languageIds[0])
      const languageId =  (
        languageIds.includes(lastChosenDefinitionLanguageId)
          ? lastChosenDefinitionLanguageId
          : languageIds[0]
      )

      setLanguageId(languageId)

      const [ [ languageSpecificDefinition ] ] = await safelyExecuteSelects([
        {
          database: `${languageId}/languageSpecificDefinitions`,
          statement: () => `SELECT * FROM languageSpecificDefinitions WHERE id=?`,
          args: [
            `${definitionId}-${languageId}`,
          ],
          jsonKeys: [ 'syn', 'rel' ],
        },
      ])

      setLanguageSpecificDefinition(languageSpecificDefinition)

    },
    [ definitionId, languageIds, forceDefinitionUpdateIdx ],
  )

  useEffectAsync(
    async () => {

      setTranslationBreakdown()

      if(versionId) {

        const [ [ translationBreakdown ] ] = await safelyExecuteSelects([
          {
            database: `versions/${versionId}/translationBreakdowns`,
            statement: () => `SELECT * FROM translationBreakdowns WHERE id=?`,
            args: [
              `${definitionId}-${versionId}`,
            ],
            jsonKeys: [ 'breakdown' ],
          },
        ])

        setTranslationBreakdown(translationBreakdown)

      }

    },
    [ definitionId, versionId ],
  )

  const definitionAndForceUpdate = useMemo(
    () => ({
      definition: {
        languageId,
        ...(translationBreakdown || {}),
        ...(languageSpecificDefinition || {}),
        ...(definition || {}),
      },
      forceDefinitionUpdate,
    }),
    [ languageId, definition, languageSpecificDefinition, translationBreakdown, forceDefinitionUpdate ],
  )

  return definitionAndForceUpdate

}

export default useDefinition

// TODO: uses
  // translation - vsnum tap - word tap
  // translation - word tap ** (if tagged)
  // orig - vsnum tap - word tap
  // orig - word tap
