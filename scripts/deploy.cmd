@echo off

npx version-bump-prompt --patch --commit --tag --push
if errorlevel 1 goto err

node -p "require('./package.json').version" > %temp%\tmp-ver
set /P REACT_APP_VERSION=<%temp%\tmp-ver
del %temp%\tmp-ver

set REACT_APP_ENDPOINT=http://tensorflow-stack-ts.appspot.com/stack/api/graphql
set REACT_APP_HEALTHCHECK=http://tensorflow-stack-ts.appspot.com/stack/api/_healthcheck

npm run clean
if errorlevel 1 goto err

cd client
npm run build
if errorlevel 1 goto err

cd ..
npm run build
if errorlevel 1 goto err

gcloud app deploy gcp.prod.yaml
if errorlevel 1 goto err

echo done ok
exit 0

:err
echo build failed.
exit 1
