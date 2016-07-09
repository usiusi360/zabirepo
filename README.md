# ZabiRepo #

[![license](https://img.shields.io/github/license/usiusi360/zabirepo.svg?style=flat-square)](https://github.com/usiusi360/zabirepo/blob/master/LICENSE.txt)
[![Gitter](https://badges.gitter.im/usiusi360/zabirepo.svg)](https://gitter.im/usiusi360/zabirepo?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

ZabiRepo -Dashboard using the API of Zabbix-

YouTube:

[![zabirepo](http://img.youtube.com/vi/hf_Y7E9xL6k/0.jpg)](https://www.youtube.com/watch?v=hf_Y7E9xL6k)


## Features
- You can aggregate the Zabbix of events in the pivot table like.
- Aggregate event information can be graphed.
- You can see the list of the graph with a simple operation.

## Requirements
- Zabbix >= 3.0

## Installation ##

2 ways to setup.

### A. Zip download ###

Zip is downloaded and developed in zabbix directories of http server.

````
$ wget https://github.com/usiusi360/zabirepo/archive/master.zip
$ unzip master.zip
$ sudo mv ./zabirepo-master /usr/share/zabbix/zabirepo
````

### B. Git clone ###

````
$ cd /usr/share/zabbix/
$ sudo git clone https://github.com/usiusi360/zabirepo.git
````

## Usage ##

Access the browser.

````
http://<ZabbixServer>/zabbix/zabirepo/
````
Log in with a Zabbix user.

## FAQ

- What's this message? [the number of items has exceeded the limit] 

Limit the number to be displayed at the same time.
We want you to change the following parameters.


```
* zabirepo/dist/js/zabirepo-param.js

GRAPH_CELL_LIMIT : 40 (default)
GRAPH_ITEM_LIMIT : 40 (default)
```

- Network Error is displayed.
I want to see if the URL path is correct.
Default is /zabbix. But, necessary to change the different if setting.

```
* zabirepo/dist/js/zabirepo-param.js

var baseURL = '//' + location.host + '/zabbix/';
```

## Contact ##
gitter: https://gitter.im/usiusi360/zabirepo

## Gallery ##
![image](https://raw.githubusercontent.com/usiusi360/zabirepo/master/gallery/image001.png)
![image](https://raw.githubusercontent.com/usiusi360/zabirepo/master/gallery/image002.png)
![image](https://raw.githubusercontent.com/usiusi360/zabirepo/master/gallery/image003.png)
![image](https://raw.githubusercontent.com/usiusi360/zabirepo/master/gallery/image004.png)
![image](https://raw.githubusercontent.com/usiusi360/zabirepo/master/gallery/image005.png)
![image](https://raw.githubusercontent.com/usiusi360/zabirepo/master/gallery/image006.png)
