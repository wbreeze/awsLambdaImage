if [[ -n ${AWS_S3_RESIZE_SRC_NAME} && -n ${AWS_S3_RESIZE_DST_NAME} && -n ${AWS_S3_RESIZE_REGION} ]]; then
  [[ -e dist ]] || mkdir dist
  npx parcel build
  cd dist
  zip recover.zip recover.js
  #rm index.js
  cd ..
else
  echo "Missing environment variable"
  exit 2
fi
