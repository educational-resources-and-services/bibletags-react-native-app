import { useMemo } from "react"

const useJsonMemo = value => {

  let memoValue = value

  try {

    memoValue = useMemo(
      () => value,
      [ JSON.stringify(value) ],
    )

  } catch(e) {}

  return memoValue
}

export default useJsonMemo