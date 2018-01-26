# Server installation

All installations tested on Ubuntu 16.04


## NodeJS

https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions

    curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
    sudo apt-get install -y nodejs
    sudo apt-get install -y build-essential

## RethinkDB

    source /etc/lsb-release && echo "deb http://download.rethinkdb.com/apt $DISTRIB_CODENAME main" | sudo tee /etc/apt/sources.list.d/rethinkdb.list


## Redis

https://www.digitalocean.com/community/tutorials/how-to-install-and-use-redis


## Downloading source files

    git clone
    cd dashboard


## Installing dependencies

    npm install



# Starting

    redis-server
    rethinkdb
    node web-ui-server
    cd web-ui
    node start


# Deploying

    npm run build


# Testing

To check the quality of the source code, run the following command:

    npm run lint




# DOCS

Socket.io
https://socket.io/docs/

Node Mavlink
https://github.com/omcaree/node-mavlink

Mavlink message definitions
https://mavlink.io/en/messages/common.html#PING

RethinkDB
https://rethinkdb.com/docs/guide/javascript/

RethinkDB Geospatial queries
https://rethinkdb.com/docs/geo-support/javascript/

thinky (RethinkDB ORM)
http://justonepixel.com/thinky/documentation/api/thinky/

Redis Configuration
https://redis.io/topics/config

Express session
https://github.com/expressjs/session

Express session connect-redis
https://www.npmjs.com/package/connect-redis

node-scrypt
https://github.com/barrysteyn/node-scrypt



Webix docs
https://docs.webix.com/desktop__components.html

Webix Jet
https://webix.gitbooks.io/webix-jet/content/start.html

D3
https://github.com/d3/d3/wiki/Gallery

Webix material skin
https://github.com/webix-hub/material-design-skin

Webix sidebar
http://webix-hub.github.io/components/sidebar/sample.html

Google Maps Javascript API
https://developers.google.com/maps/documentation/javascript/3.exp/reference?hl=ru#Map

G Maps Examples
https://developers.google.com/maps/documentation/javascript/examples/user-editable-shapes?hl=ru

