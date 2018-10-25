@echo off

call npx version-bump-prompt --patch --commit --tag --push
if errorlevel 1 goto err

node -p "require('./package.json').version" > %temp%\tmp-ver
set /P REACT_APP_VERSION=<%temp%\tmp-ver
del %temp%\tmp-ver
echo REACT_APP_VERSION=%REACT_APP_VERSION%

set DEPLOY_TO=https://tensorflow-stack-ts.appspot.com
set PUBLIC_URL=/app
set REACT_APP_ENDPOINT=%DEPLOY_TO%/stack/api/graphql
set REACT_APP_HEALTHCHECK=%DEPLOY_TO%/stack/api/_healthcheck

call npm run clean
if errorlevel 1 goto err

cd client
call npm run build
if errorlevel 1 goto err

cd ..
call npm run build
if errorlevel 1 goto err

call gcloud app deploy gcp.prod.yaml
if errorlevel 1 goto err

echo deploy ok
start %DEPLOY_TO%
exit 0

:err
echo build failed.
exit 1
