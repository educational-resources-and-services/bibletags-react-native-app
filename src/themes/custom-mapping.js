import Constants from "expo-constants"
import deepmerge from "deepmerge"

import { objectMap } from "../utils/toolbox"

const {
  MAPPING_CUSTOMIZATION=[],
} = Constants.manifest.extra

const getComponentSetup = ({ parameters={}, appearance="default", variantGroups={}, isCustom=true }={}) => {

  let { state, ...parametersIncludingFromVariantGroups } = parameters
  const states = {}

  const addToStates = stateValue => {
    if(!states[stateValue]) {
      states[stateValue] = {
        default: false,
        priority: Object.keys(states).length,
        scope: 'all',
      }
    }
  }

  const addToParametersAndStates = state => {
    for(let stateValue in state) {
      parametersIncludingFromVariantGroups = {
        ...parametersIncludingFromVariantGroups,
        ...state[stateValue],
      }

      addToStates(stateValue)
    }
  }

  addToStates('none')  // It is unclear why this is needed, but it is.
  addToParametersAndStates(state)

  for(let group in variantGroups) {
    for(let groupValue in variantGroups[group]) {

      const { state={}, ...params } = variantGroups[group][groupValue]

      parametersIncludingFromVariantGroups = {
        ...parametersIncludingFromVariantGroups,
        ...params,
      }

      addToParametersAndStates(state)
    }
  }

  return {
    meta: {
      parameters: objectMap(parametersIncludingFromVariantGroups, val => ({
        type: typeof val,
      })),
      ...(!isCustom ? {} : {
        variantGroups: objectMap(variantGroups, group => (
          objectMap(group, (val, key, index) => ({
            default: false,
          }))
        )),
        states,
        appearances: {
          [appearance]: {
            default: appearance === 'default',
          },
        },  
      }),
    },
    appearances: {
      [appearance]: {
        mapping: parameters,
        variantGroups,
      },
    },
  }
}

const getComponentMapping = componentInfos => (
  deepmerge.all(
    componentInfos.map(({ component, ...info }) => ({
      [component]: getComponentSetup(info),
    }))
  )
)

const mapping = {

  // See https://github.com/eva-design/eva/blob/master/packages/eva/mapping.json  

  // Eg.
  // components: {
  //   TopNavigation: {
  //     appearances: {
  //       default: {
  //         mapping: {
  //           titleLineHeight: 150,
  //         },
  //       },
  //     },
  //   },
  // },
  
  components: getComponentMapping([
    {
      component: 'Layout',
      parameters: {
        flex: 1,
      },
      isCustom: false,
    },
    {
      component: 'OverflowMenu',
      parameters: {
        borderWidth: 1,
        borderColor: "border-basic-color-3",
        borderRadius: 0,
      },
      isCustom: false,
    },
    {
      component: 'AppHeader',
      parameters: {
        backgroundColor: "background-basic-color-1",
        borderColor: "color-basic-active-border",
      },
    },
    {
      component: 'StatusBarWithBackground',
      parameters: {
        backgroundColor: "background-basic-color-1",
      },
    },
    {
      component: 'ChooserBook',
      variantGroups: {
        uiStatus: {
          unselected: {},
          selected: {
            backgroundColor: "background-alternative-color-4",
            labelColor: "text-alternate-color",
          },
        },
      },
    },
    {
      component: 'ChooserChapter',
      variantGroups: {
        uiStatus: {
          unselected: {},
          selected: {
            backgroundColor: "background-alternative-color-4",
            labelColor: "text-alternate-color",
          },
        },
      },
    },
    {
      component: 'ChooserVersion',
      variantGroups: {
        uiStatus: {
          unselected: {},
          selected: {
            backgroundColor: "background-alternative-color-4",
            labelColor: "text-alternate-color",
            iconColor: "color-basic-control-transparent-600",
          },
        },
      },
    },
    {
      component: 'CoverAndSpin',
      parameters: {
        backgroundColor: "background-basic-color-4",
      },
    },
    {
      component: 'LanguageItem',
      variantGroups: {
        uiStatus: {
          unselected: {},
          selected: {
            color: "border-danger-color-3",
            fontWeight: 'bold',
          },
        },
      },
    },
    {
      component: 'RecentBookmark',
      parameters: {
        color: "text-control-color",
      },
    },
    {
      component: 'RecentRef',
      variantGroups: {
        uiStatus: {
          unselected: {
            backgroundColor: "color-basic-600",
          },
          selected: {
            backgroundColor: "background-alternative-color-4",
          },
        },
      },
    },
    {
      component: 'RecentSearch',
      parameters: {
        backgroundColor: "color-danger-700",
      },
    },
    {
      component: 'SearchResult',
      parameters: {
        alt0Color: "border-danger-color-3",
      },
      variantGroups: {
        uiStatus: {
          unselected: {
            color: "text-hint-color",
            labelcolor: "text-basic-color",
          },
          selected: {
            color: "text-basic-color",
          },
        },
      },
    },
    {
      component: 'SearchSuggestion',
      parameters: {
        labelColor: "color-basic-1100",
        alt0Color: "color-basic-600",
        alt1Color: "color-basic-700",
        alt2Color: "color-basic-700",
      },
    },
    {
      component: 'SearchSuggestions',
      parameters: {
        backgroundColor: "background-basic-color-1",
      },
    },
    {
      component: 'Spin',
      parameters: {
        color: "border-danger-color-3",
        backgroundColor: "background-basic-color-2",
      },
    },
    {
      component: 'TapOptions',
      parameters: {
        labelColor: "text-alternate-color",
        backgroundColor: "background-alternative-color-1",
      },
    },
    {
      component: 'DisplaySettings',
      parameters: {
        backgroundColor: "background-basic-color-1",
        labelColor: "text-basic-color",
        alt0MinimumTrackTintColor: "color-danger-700",
        alt0MaximumTrackTintColor: "color-basic-500",
        alt0ThumbTintColor: "color-danger-700",
      },
    },
    {
      component: 'Drawer',
      parameters: {
        color: "color-basic-700",
        labelColor: "color-basic-600",
        alt0BackgroundColor: "background-basic-color-2",
      },
    },
    {
      component: 'PassageChooser',
      parameters: {
        backgroundColor: "background-basic-color-4",
        labelColor: "text-basic-color",
        alt0BackgroundColor: "color-basic-transparent-600",
        alt1BackgroundColor: "background-basic-color-2",
      },
    },
    {
      component: 'VersionChooser',
      parameters: {
        color: "color-basic-600",  //info icon
      },
      variantGroups: {
        type: {
          primary: {
            backgroundColor: "background-basic-color-1",
          },
          secondary: {
            backgroundColor: "background-basic-color-3",
          },
          search: {
            backgroundColor: "background-basic-color-1",
          },
        },
      },
    },
    {
      component: 'ReadContentPage',
      parameters: {
        backgroundColor: "background-basic-color-3",
      },
    },
    {
      component: 'ReadHeader',
      parameters: {
        color: "text-hint-color",
        alt0Color: "text-disabled-color",
      },
    },
    {
      component: 'RecentSection',
      parameters: {
        backgroundColor: "color-basic-control-transparent-600", // originally 'rgba(255, 255, 255, .9)',
      },
    },
    {
      component: 'ReadText',
      parameters: {
        alt0Color: "color-basic-600", // majorTitleThemedStyle
        alt1Color: "color-basic-800", // majorSectionHeadingThemedStyle
        alt2Color: "color-basic-700", // section1HeadingThemedStyle
        alt3Color: "color-basic-600", // section2HeadingThemedStyle
      },
    },
    {
      component: 'Splash',
      parameters: {
        backgroundColor: "background-basic-color-1",
      },
    },
    {
      component: 'LanguageChooser',
      parameters: {
        backgroundColor: "background-basic-color-1",
      },
    },
    {
      component: 'Search',
      parameters: {
        color: "color-basic-transparent-600",
      },
    },
    {
      component: 'VersionInfo',
      parameters: {
        color: 'color-info-focus',
      },
    },
    {
      component: 'Versions',
      parameters: {
        backgroundColor: "background-basic-color-1",
      },
    },
    ...MAPPING_CUSTOMIZATION,
  ]),
  
}

export default mapping