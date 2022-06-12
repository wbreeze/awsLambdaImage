Resize images on the fly from
AWS S3 bucket source
to Amazon Cloudfront CDN
using Lambda@Edge.

These files are variations of those given by [Resizing Images with Amazon CloudFront & Lambda@Edge][cdnBlog] at the AWS CDN Blog.

The main change is the method of parsing file size out of the URL.
I've also broken-up the sources given in the article and added tests.

## Development

The project uses `npm`, the Node package manager for configuration and
dependency management, and for the running of scripts.

- To get started, assuming you have the Node package manager installed, run
  `npm install`.
- To run a script type, for example, `npm run test`.

## Building and Deploying

The project requires compilation of some native code for the image
transformation module, "sharp". We have to compile the native code and package
the AWS Lambda deployment in an environment sufficiently similar or equivalent
to the runtime environment used in Lambda.

The [AWS Docs for deploying Node.js Lambda functions][depl] cover the topic,
more or less, together with [Using Native nodejs Modules in Lambda][native].

We use an [Amazon EC2][ec2] instance running the Amazon Linux operating system.
Launch one there, then...

Sign-in to the instance,

    ssh -i "AWSEC2.pem" \
    ec2-user@ec2-18-202-225-225.eu-west-1.compute.amazonaws.com

where `AWSEC2.pem`
is the file with the private key generated when you created the instance. We
follow the [Tutorial: Setting Up Node.js on an Amazon EC2 Instance][nodec2].

### On the EC2 Instance, Amazon Linux

The following commands, roughly, are in the file, [`ec2_image_setup.sh`][setup]

    [~]$ sudo yum update
    [~]$ sudo yum install git
    [~]$ curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
    [~]$ export NVM_DIR="$HOME/.nvm"
    [~]$ . ~/.nvm/nvm.sh
    [~]$ nvm install node 16
    [~]$ node -e "console.log('Running Node.js ' + process.version)"
    Running Node.js v16.15.0

The following commands, roughly, are in the file, [`project_setup.sh`][project]

    [~]$ git clone https://github.com/wbreeze/awsLambdaImage.git
    [~]$ cd awsLambdaImage/
    [awsLambdaImage]$ npm install
    [awsLambdaImage]$ npm run test

### Building a distribution

The following commands, roughly, are in the file, [`build_dist.sh`][dist]

    [awsLambdaImage]$ npm install --only=prod
    [awsLambdaImage]$ cp resize.js index.js
    [awsLambdaImage]$ zip -r dist/resize.zip index.js node_modules
    [awsLambdaImage]$ cp request.js index.js
    [awsLambdaImage]$ zip -r dist/request.zip index.js node_modules
    [awsLambdaImage]$ rm index.js
    [awsLambdaImage]$ npm install

The script in actuality invokes `sed` to replace environment variable
references in `resize.js` with their values. This is because, while
Lambda supports setting environment variables, Lambda@Edge does not.
The environment variables capture the source and destination buckets
and the region they are in.

    AWS_S3_RESIZE_SRC_NAME="source bucket name - source images"
    AWS_S3_RESIZE_DST_NAME="destination bucket name - scaled images"
    AWS_S3_RESIZE_REGION="region containing the buckets"

Naturally, we don't want to hard code these and check them into the repository.

### Uploading the distribution packages

I can copy the distribution zip files to my local machine using `scp`. My
machine has configured the AWS CLI with my AWS account.  Alternatively, I
use the `aws configure` command on the EC2 instance and enter a new set of
AWS IAM account access keys there, generated from the AWS IAM console.
The remote copy commands are something like these:

    scp -i "~/.ssh/AWSEC2.pem" \
      ec2-user@ec2-id.eu-west-1.compute.amazonaws.com:~/awsLambdaImage/resize.zip .
    scp -i "~/.ssh/AWSEC2.pem" \
      ec2-user@ec2-id.eu-west-1.compute.amazonaws.com:~/awsLambdaImage/request.zip .

Either way, the upload goes as follows:

The following commands, roughly, are in the file, [`upload_dist.sh`][upload]:

    $ aws lambda update-function-code \
    --function-name "rewrite_request_url" \
    --zip-file fileb://dist/request.zip \
    --publish \
    --region us-east-1

    $ aws lambda update-function-code \
    --function-name "scale_image" \
    --zip-file fileb://dist/resize.zip \
    --publish \
    --region us-east-1

The uploads go very quickly if done directly from the EC2 instance.

[depl]: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-package.html
[native]: https://aws.amazon.com/blogs/compute/nodejs-packages-in-lambda/
[ec2]: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/concepts.html
[nodec2]: https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-up-node-on-ec2-instance.html
[dist]: https://github.com/wbreeze/awsLambdaImage/blob/master/script/build_dist.sh
[upload]: https://github.com/wbreeze/awsLambdaImage/blob/master/script/upload_dist.sh
[setup]: https://github.com/wbreeze/awsLambdaImage/blob/master/script/ec2_image_setup.sh
[project]: https://github.com/wbreeze/awsLambdaImage/blob/master/script/project_setup.sh
[cdnBlog]: https://aws.amazon.com/es/blogs/networking-and-content-delivery/resizing-images-with-amazon-cloudfront-lambdaedge-aws-cdn-blog/
  "Resizing Images with Amazon CloudFront & Lambda@Edge"

