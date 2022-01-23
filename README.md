This software is a web application that describes DCase.
By synchronizing the work contents between users in real time, it supports the description of DCase over the network while cooperating with multiple users.

## Installation
### 1. Requirements
* Ubuntu 20.04

### 2. Requirements
`apt-get update`  
`apt-get upgrade -y`  

`apt-get install -y nginx php-fpm composer postfix php-dev php-pear python3 python3-pip python3-dev mongodb php-mongodb supervisor git php-mbstring mecab libmecab-dev mecab-ipadic-utf8`  

`pip3 install -U pip setuptools & hash -r pip`  
`pip3 install -U websocket-server`

`mkdir -p /var/run/mongodb/`  
`mkdir -p /var/www/html/dcase/`  
`cp -rf ./html/* /var/www/html/dcase/*`  

`cp ./docker/mecab.ini /etc/php/7.4/mods-available/mecab.ini`  
`cp ./docker/mecab.ini /etc/php/7.4/cli/conf.d/20-mecab.ini`  
`cp ./docker/mecab.ini /etc/php/7.4/fpm/conf.d/20-mecab.ini`  

`cp ./docker/nginx.default /etc/nginx/sites-enabled/default` 

`cp ./docker/supervisor-mongo.conf /etc/supervisor/conf.d/mongo.conf`  
`cp ./docker/supervisor-dcase.conf /etc/supervisor/conf.d/dcase.conf`  

`/etc/init.d/php7.4-fpm start`  
`/etc/init.d/supervisor start`  
`/etc/init.d/nginx start`  


## How to Use
Access to http://localhost/dcase/

## Building Docker Container
`cd ./docker/`  
`cp ../html ./`  

`docker build . -t dcase_com`  
`docker run -it --rm -p 80:80 -v [host dir]:/data dcase_com:least`  