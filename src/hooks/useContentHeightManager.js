import { useRef, useMemo, useState, useCallback } from "react"

import useInstanceValue from "./useInstanceValue"
import useSetTimeout from "./useSetTimeout"

const useContentHeightManager = ({ defaultHeight=0, onlyIncreaseHeightUntilClear }) => {

  const heights = useRef([])
  const [ contentHeight, setContentHeight ] = useState(defaultHeight)
  const [ setUpdateTimeout ] = useSetTimeout()
  const getOnlyIncreaseHeightUntilClear = useInstanceValue(onlyIncreaseHeightUntilClear)
  const contentHeightRef = useRef()

  const onSizeChangeFunctions = useMemo(
    () => (
      Array(10)
        .fill()
        .map((x, idx) => (
          (...params) => {

            const { nativeEvent } = params[0] || {}
            const { layout } = nativeEvent || {}
            const onlyIncreaseHeightUntilClear = getOnlyIncreaseHeightUntilClear()

            if(layout) {
              heights.current[idx] = layout.height
            } else if(typeof params[1] === 'number') {
              heights.current[idx] = params[1]
            }

            // The timeout is needed so that only one state change is made though
            // several onSizeChangeFunctions may come in at once.
            setUpdateTimeout(() => {
              const newContentHeight = Math.max(
                (onlyIncreaseHeightUntilClear && contentHeightRef.current !== defaultHeight) ? contentHeightRef.current : 0,
                heights.current.reduce((total, ht) => total + ht, 0)
              )
              setContentHeight(newContentHeight)
              contentHeightRef.current = newContentHeight
            })
          }
        ))
    ),
    [],
  )

  const clearRecordedHeights = useCallback(
    () => {
      heights.current = []
      contentHeightRef.current = defaultHeight
      setUpdateTimeout(() => {
        setContentHeight(defaultHeight)
      })
    },
    [ defaultHeight ],
  )

  return {
    contentHeight,
    onSizeChangeFunctions,
    clearRecordedHeights,
  }
}

export default useContentHeightManager