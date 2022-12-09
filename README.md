Generate scaled images from an AWS S3 bucket source. Deliver the scaled
versions from an Amazon Cloudfront CDN instance according to a query
parameter.

These files are inspired by the article,
[Resizing Images with Amazon CloudFront & Lambda@Edge][cdnBlog]
at the AWS CDN Blog.

The strategy is to
- generate scaled images in a derived image bucket when images are added or
  modified in a source image bucket.
- use a query parameter to rewrite the path of image requests to the CDN,
  so as to return a scaled version of the image
- fall back on the source bucket and return the source image if the rewritten
  path fails to return an image

The `request.js` function works as a "CloudFront" function on the viewer
request event. Copy it and paste it into the code editor for the function
created under the Functions list of the AWS CloudFront console.

The `prescale.js` function does the scaling. Install it as an AWS Lambda
function triggered by changes in the S3 source image bucket.

The `recover.js` function handles recovery when the path produced by
`request.js` comes up empty. It returns a "not found" status or, if the
original images exists, a redirect that fetches the original image without
path rewriting.

## Development

The project uses `npm`, the Node package manager for configuration and
dependency management, and for the running of scripts.

- Clone the project
- Install the NodeJS and the Node package manager if not already installed
- Run `npm install`.
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

The project has scripts for setting-up the machine, cloning and
initializing the awsLambdaImage project, building, and distributing the
Lambda function. The are in the `script` directory. You can use `scp` to
copy them to the EC2 instance and run them there.

First run the script, [`ec2_image_setup.sh`][setup]. It updates packages,
installs git and the Node version manager (nvm), and installs NodeJS.

Next run the script, [`project_setup.sh`][project]. It clones the project
(read only) from GitHub, installs the Node packages, and runs the tests.


### Building a distribution

The build script, [`build_dist.sh`][dist] invokes `sed` to replace environment
variable references in the JS sources with their values. This is to avoid
configuring environment variables in Lambda and CloudFront.  The environment
variables capture the source and destination buckets and the region they are
in.

    AWS_S3_RESIZE_SRC_NAME="source bucket name - source images"
    AWS_S3_RESIZE_DST_NAME="destination bucket name - scaled images"
    AWS_S3_RESIZE_REGION="region containing the buckets"

Naturally, we don't want to hard code these and check them into the repository.
Export these variables before building the Lambda function packaged zip files
using the build script.


### Uploading the distribution packages

I can copy the distribution zip files to my local machine using `scp`. My
machine has configured the AWS CLI with my AWS account.  It is possible to
use the `aws configure` command on the EC2 instance and enter a new set of
AWS IAM account access keys there, generated from the AWS IAM console.
I simply find it easier to download the images from the EC2 instance, then
install them from my already configured local environment.

The remote copy commands are something like these:

    scp -i "~/.ssh/AWSEC2.pem" \
      ec2-user@ec2-id.eu-west-1.compute.amazonaws.com:~/awsLambdaImage/resize.zip .
    scp -i "~/.ssh/AWSEC2.pem" \
      ec2-user@ec2-id.eu-west-1.compute.amazonaws.com:~/awsLambdaImage/request.zip .

Either way, the [`upload_dist.sh`][upload] script will invoke `aws lambda
update-function-code` a few times in order to update all of the functions.  The
uploads go very quickly if done directly from the EC2 instance.

All of the above could be set-up for continuous delivery using AWS CodePipeline,
CodeBuild, and CloudFormation. I'm hoping that I don't have to update the
functions so frequently that the pain is less to configure the continuous
delivery pipeline.


## Architecture

What follows is a description of the parts and pieces and how they fit together.

## CloudFront functions ViwerRequest

The `rewrite_request_url` function is
a CloudFront function. As a CloudFront function it uses a different style
of JavaScript. I installed and tested it using the CloudFront console functions
form.

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

