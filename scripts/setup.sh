#!/bin/bash

echo ""

TENANT_ITEMS=("app.json" "language.js" "fonts.js" "menu.js" "versions.js" "assets" "RouteSwitcher.js" "tenantComponents")
THIS_SCRIPT=$0

for TENANT_ITEM in "${TENANT_ITEMS[@]}" ; do
  if [ ! -d "defaultTenant/$TENANT_ITEM" ] && [ ! -f "defaultTenant/$TENANT_ITEM" ]; then
    INVALID_TENANT_DIR_CONTENTS=1
  fi
done

if [ $INVALID_TENANT_DIR_CONTENTS ]; then
  echo "The defaultTenant directory does not have the required contents."

else

  ##### everything checks out, now we make the switch #####

  # delete current tenant items
  for TENANT_ITEM in "${TENANT_ITEMS[@]}" ; do
    rm -Rf ./$TENANT_ITEM || exit 1;
  done

  # copy tenant items to the base dir
  for TENANT_ITEM in "${TENANT_ITEMS[@]}" ; do
    cp -R "defaultTenant/$TENANT_ITEM" ./$TENANT_ITEM || exit 1;
  done

  # optimize assets
  # npx expo-optimize

  # TODO: swap in appropriate info to app.json, etc

  echo "Default setup ready."
fi

echo ""