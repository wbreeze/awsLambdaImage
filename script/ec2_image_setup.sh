sudo yum update
sudo yum install git
sudo yum install libm.so.6
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
export NVM_DIR="$HOME/.nvm"
. ~/.nvm/nvm.sh
nvm install node 16
node -e "console.log('Running Node.js ' + process.version)"
