var baseURL = '//' + location.host + '/zabbix';
var graphURL = baseURL + '/chart.php';
var apiURL = baseURL + '/api_jsonrpc.php';

// ================//
var options = {};
options.url = apiURL;

var groupNames = [];
var itemNamesUniqArray = [];
var resultObj = [];
var graphLabel;
var lastPeriod;

var zabirepo = {
	VERSION : "Version 0.1.0 Bata",
	GRAPH_TYPE : 0,  // 0:line,1:stack
	GRAPH_HEIGHT :300,
	GRAPH_WIDTH : 800,
	GRAPH_CELL_LIMIT : 40,
	GRAPH_ITEM_LIMIT : 40,
	reloadId : null
};
