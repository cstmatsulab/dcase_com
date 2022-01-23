#!/bin/bash

mkdir -p /data/mongodb/

/etc/init.d/php7.4-fpm start
/etc/init.d/supervisor start

/usr/sbin/nginx -g "daemon off;"