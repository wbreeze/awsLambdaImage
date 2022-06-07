aws lambda update-function-code \
--function-name "rewrite_request_url" \
--zip-file fileb://dist/request.zip \
--publish \
--region us-east-1
aws lambda update-function-code \
--function-name "scale_image" \
--zip-file fileb://dist/resize.zip \
--publish \
--region us-east-1
