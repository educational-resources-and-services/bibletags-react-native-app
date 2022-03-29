import { useCallback } from "react"
import { useNavigate, useLocation } from "react-router-dom"

const prepState = state => (state ? `#${JSON.stringify(state)}` : ``)

const useRouterState = () => {

  const navigate = useNavigate()
  const location = useLocation()

  // If I add transitions, I made need to prevent a double tap here

  const prepRoute = useCallback(
    (route, state) => `${(route || "").replace(/^\.\//, `${location.pathname}/`) || location.pathname}${prepState(state)}`,
    [ location ],
  )

  const historyPush = useCallback(
    (route, state) => navigate(prepRoute(route, state)),
    [ navigate, prepRoute ],
  )

  const historyReplace = useCallback(
    (route, state) => navigate(prepRoute(route, state), { replace: true }),
    [ navigate, prepRoute ],
  )

  const historyAlterStateByRoute = useCallback(
    (route, newState) => {
      if(location.pathname === route) {
        location.hash = prepState(newState)
      }
    },
    [ navigate, location ],
  )

  const historyGoBack = useCallback(() => navigate(-1), [ navigate ])

  let routerState = {}

  try {
    routerState = JSON.parse(decodeURIComponent(location.hash).slice(1))
  } catch(e) {}

  return {
    historyPush,
    historyReplace,
    historyGoBack,
    historyGo: navigate,
    historyAlterStateByRoute,
    routerState,
    ...location,
  }
}

export default useRouterState
