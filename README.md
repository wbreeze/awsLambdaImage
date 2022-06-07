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

[cdnBlog]: https://aws.amazon.com/es/blogs/networking-and-content-delivery/resizing-images-with-amazon-cloudfront-lambdaedge-aws-cdn-blog/
  "Resizing Images with Amazon CloudFront & Lambda@Edge"

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

The following commands are in the file, `ec2_image_setup.sh`

    [~]$ sudo yum update
    [~]$ sudo yum install git
    [~]$ curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
    [~]$ export NVM_DIR="$HOME/.nvm"
    [~]$ . ~/.nvm/nvm.sh
    [~]$ nvm install node 16
    [~]$ node -e "console.log('Running Node.js ' + process.version)"
    Running Node.js v16.15.0

The following commands are in the file, `project_setup.sh`

    [~]$ git clone https://github.com/wbreeze/awsLambdaImage.git
    [~]$ cd awsLambdaImage/
    [awsLambdaImage]$ npm install
    [awsLambdaImage]$ npm run test

The following commands are in the file, `build_dist.sh`

    [awsLambdaImage]$ rm -rf node_modules/
    [awsLambdaImage]$ npm install --only=prod
    [awsLambdaImage]$ cp resize.js index.js
    [awsLambdaImage]$ zip -r resize.zip index.js node_modules
    [awsLambdaImage]$ cp request.js index.js
    [awsLambdaImage]$ zip -r request.zip index.js node_modules
    [awsLambdaImage]$ rm index.js
    [awsLambdaImage]$ npm install

### Uploading the distribution packages

To keep myself sane, I simply copy the distribution zip files to my local
machine using `scp`. My machine has configured the AWS CLI with my AWS account.
Alternatively, I could use the `aws configure` command on the EC2 instance
and enter my credentials there.

    scp -i "~/.ssh/AWSEC2.pem" \
      ec2-user@ec2-id.eu-west-1.compute.amazonaws.com:~/awsLambdaImage/resize.zip .
    scp -i "~/.ssh/AWSEC2.pem" \
      ec2-user@ec2-id.eu-west-1.compute.amazonaws.com:~/awsLambdaImage/request.zip .

Either way, the upload goes as follows:

The following commands are in the file, `upload_dist.sh`

    $ aws lambda update-function-code \
    --function-name "rewrite_request_url" \
    --zip-file fileb://request.zip \
    --publish \
    --region us-east-1

    $ aws lambda update-function-code \
    --function-name "scale_image" \
    --zip-file fileb://resize.zip \
    --publish \
    --region us-east-1

[depl]: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-package.html
[native]: https://aws.amazon.com/blogs/compute/nodejs-packages-in-lambda/
[nodec2]: https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-up-node-on-ec2-instance.html
