# docker build . -t dcase_com
# docker run -it --rm -p 80:80 -v `pwd`:/data dcase_com
# docker run -d -p 80:80 -v `pwd`:/data dcase_com

FROM ubuntu:20.04

RUN apt-get -y update && apt-get -y upgrade && DEBIAN_FRONTEND=noninteractive \
  apt-get install -y nginx php-fpm composer postfix php-dev php-pear python3 python3-pip python3-dev mongodb php-mongodb supervisor git php-mbstring php-imagick \
                     mecab libmecab-dev mecab-ipadic-utf8 && \
  rm -rf /var/lib/apt/lists/*

RUN pip3 install -U pip setuptools & hash -r pip && \
  pip3 install -U websocket-server

RUN mkdir -p /var/run/mongodb/

RUN rm /var/www/html/index.nginx-debian.html
COPY ./docker/index.html /var/www/html/index.html

COPY ./html/ /var/www/html/dcase/
    
ADD ./docker/mecab.ini /etc/php/7.4/mods-available/mecab.ini
ADD ./docker/mecab.ini /etc/php/7.4/cli/conf.d/20-mecab.ini
ADD ./docker/mecab.ini /etc/php/7.4/fpm/conf.d/20-mecab.ini

RUN sed -ri 's/#*upload_max_filesize.*/upload_max_filesize = 20M/g' /etc/php/7.4/fpm/php.ini && \
    sed -ri 's/#*post_max_size.*/post_max_size = 20M/g' /etc/php/7.4/fpm/php.ini

ADD ./docker/mongodb.conf /etc/mongodb.conf
ADD ./docker/nginx.default /etc/nginx/sites-enabled/default

ADD ./docker/supervisor-mongo.conf /etc/supervisor/conf.d/mongo.conf
ADD ./docker/supervisor-dcase.conf /etc/supervisor/conf.d/dcase.conf

ADD ./docker/init.sh /init.sh

CMD ["/bin/bash", "/init.sh"]
