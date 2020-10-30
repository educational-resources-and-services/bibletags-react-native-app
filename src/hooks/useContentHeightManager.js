import { useRef, useMemo, useState, useCallback } from "react"

const useContentHeightManager = defaultHeight => {

  const heights = useRef([])
  const [ contentHeight, setContentHeight ] = useState(defaultHeight)

  const onSizeChangeFunctions = useMemo(
    () => (
      Array(10)
        .fill()
        .map((x, idx) => (
          (...params) => {

            const { nativeEvent } = params[0] || {}
            const { layout } = nativeEvent || {}

            if(layout) {
              heights.current[idx] = layout.height
            } else if(typeof params[1] === 'number') {
              heights.current[idx] = params[1]
            }

            setContentHeight(heights.current.reduce((total, ht) => total + ht, 0))
          }
        ))
    ),
    [],
  )

  const clearRecordedHeights = useCallback(
    () => {
      heights.current = []
    },
    [],
  )

  return {
    contentHeight,
    onSizeChangeFunctions,
    clearRecordedHeights,
  }
}

export default useContentHeightManager