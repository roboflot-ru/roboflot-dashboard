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





# DOCS

Socket.io
https://socket.io/docs/

Node Mavlink
https://github.com/omcaree/node-mavlink

Mavlink message definitions
https://mavlink.io/en/messages/common.html#PING
