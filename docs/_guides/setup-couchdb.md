---
index: 2
layout: guide
title: Setting up CouchDB
sidebar: guides_nav.html
---

{% include anchor.html title="CouchDB: PouchDB's older sibling" hash="couchdb-pouchdbs-older-sibling" %}

One of the main benefits of learning PouchDB is that it's exactly the same as CouchDB. In fact, PouchDB is a shameless plagiarist: all of the API methods are the same, with only slight modifications to make it more JavaScript-y.

For instance, in CouchDB you would fetch all documents using:

    /db/_all_docs?include_docs=true

In PouchDB this becomes:

```js
db.allDocs({include_docs: true})
```

The APIs are the same, and the semantics are the same.

In the following examples, we will set up CouchDB and talk to it using a tool you're already familiar with: your browser.

{% include anchor.html title="Installing CouchDB" hash="installing-couchdb" %}

If you are on a Debian flavor of Linux (Ubuntu, Mint, etc.), you can install CouchDB as follows.

First, [enable the CouchDB package repository](https://docs.couchdb.org/en/stable/install/unix.html#enabling-the-apache-couchdb-package-repository) on your machine:

```
$ sudo apt update && sudo apt install -y curl apt-transport-https gnupg
$ curl https://couchdb.apache.org/repo/keys.asc | gpg --dearmor | sudo tee /usr/share/keyrings/couchdb-archive-keyring.gpg >/dev/null 2>&1
source /etc/os-release
$ echo "deb [signed-by=/usr/share/keyrings/couchdb-archive-keyring.gpg] https://apache.jfrog.io/artifactory/couchdb-deb/ ${VERSION_CODENAME} main" \
    | sudo tee /etc/apt/sources.list.d/couchdb.list >/dev/null
```

Next, update your package lists and install CouchDB:

```
$ sudo apt-get update
$ sudo apt-get install -y couchdb
```

If you are on a Mac or Windows you should install the official binaries from [the CouchDB web site](https://couchdb.apache.org/#download).

{% include anchor.html title="Next" hash="next" %}

Now that you have CouchDB installed, let's install PouchDB.
