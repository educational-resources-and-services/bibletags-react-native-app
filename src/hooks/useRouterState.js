import { useCallback } from "react"
import { useHistory, useLocation } from "react-router-dom"

const useRouterState = () => {

  const history = useHistory()
  const location = useLocation()

  // If I add transitions, I made need to prevent a double tap here

  const prepRoute = useCallback(
    (route, state) => `${(route || "").replace(/^\.\//, `${location.pathname}/`) || location.pathname}${state ? `#${JSON.stringify(state)}` : ``}`,
    [ location ],
  )

  const historyPush = useCallback(
    (route, state) => history.push(prepRoute(route, state)),
    [ history, prepRoute ],
  )

  const historyReplace = useCallback(
    (route, state) => history.replace(prepRoute(route, state)),
    [ history, prepRoute ],
  )

  let routerState = {}

  try {
    routerState = JSON.parse(decodeURIComponent(location.hash).slice(1))
  } catch(e) {}

  return {
    historyPush,
    historyReplace,
    historyGoBack: history.goBack,
    historyGo: history.go,
    routerState,
    ...location,
  }
}

export default useRouterState
