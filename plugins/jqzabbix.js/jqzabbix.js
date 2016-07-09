/*!
 *  jQuery plugin for Zabbix API
 *
 *  jQuery plugin for Zabbix API is a simple and easy-use plugin for jQuery JavaScript Library.
 *  It can be used for development of original Zabbix web application using Zabbix API.
 *
 *  Documentation on Mozaby site http://www.mozaby.com
 *  Issue tracking on GitHub http://github.com/kodai/jqzabbix
 *
 *  jQuery plugin for Zabbix API is Released under the MIT License.
 *  Copyright (c) 2011, Kodai Terashima http://kodai74.blogpot.com.
 *  Mozaby project http://www.mozaby.com
 *
 *  ------------------------------------------
 *  2016/3 Modify the jquery.deffered from callback  by usiusi360
 *
 */


(function($) {

	$.jqzabbix = function(options) {

		// initialize options
		options = $.extend({
			// default settings
			url : 'http://localhost/zabbix/api_jsonrpc.php',
			username : 'Admin',
			password : 'zabbix',
			basicauth : false,
			busername : '',
			bpassword : '',
			timeout : 100000,
			limit : 1000,
		}, options);

		// initialize variables
		var rpcid = 0;
		var authid = null;
		var apiversion = null;
		var errormsg = null;

		function createAjaxOption(method, params) {

			// check method option
			if (method === null || typeof method === 'undefined') {
				return false;
			}

			// check params option
			if (params === null || typeof params === 'undefined') {
				params = {};
			}

			// default params
			params = $.extend({
				extendoutput : true,
				limit : options.limit
			}, params);

			// merge params with username and password
			$.extend(params, {
				user : options.username,
				password : options.password
			});

			// create sending data
			var data = {
				jsonrpc : '2.0',
				id : ++rpcid,
				auth : authid,
				method : method,
				params : params
			};



			// create AJAX option
			var ajaxOption = {
				contentType : 'application/json-rpc',
				dataType : 'json',
				type : 'POST',
				async : true,
				cache : false,
				processData : false,
				timeout : options.timeout,
				url : options.url,
				data : JSON.stringify(data),
			};

			// if use http basic authentication
			if (options.basicauth === true) {
				var base64 = base64encode(options.busername + ':' + options.bpassword);
				ajaxOption.beforeSend = function(xhr) {
					xhr.setRequestHeader("Authorization", "Basic " + base64);
				};
			}

			return ajaxOption;
		}

		function base64encode(string) {

			var base64list = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
			var t = '', p = -6, a = 0, i = 0, v = 0, c;

			while ((i < string.length) || (p > -6)) {
				if (p < 0) {
					if (i < string.length) {
						c = string.charCodeAt(i++);
						v += 8;
					} else {
						c = 0;
					}
					a = ((a & 255) << 8) | (c & 255);
					p += 8;
				}
				t += base64list.charAt((v > 0) ? (a >> p) & 63 : 64);
				p -= 6;
				v -= 6;
			}
			return t;
		}

		this.init = function() {
			rpcid = 0;
			authid = null;
			apiversion = null;
			errormsg = null;

			return true;
		};

		this.setOptions = function(addoptions) {

			options = $.extend(options, addoptions);
		};

		this.isError = function() {

			if (errormsg) {
				return errormsg;
			} else {
				return false;
			}
		};


		this.sendAjaxRequest = function(method, params) {

			var defer = $.Deferred();
			var jqXHR = $.ajax(createAjaxOption(method, params));

			jqXHR.done(function(data, statusText, jqXHR) {

				if (jqXHR.status == 200) {
					if ('error' in data) {
						errormsg = "Response Data Error / Response Code: " + jqXHR.status + " / Response Text: "
								+ jqXHR.responseText;
						defer.rejectWith(this, arguments);
					} else {
						// success
						defer.resolveWith(this, arguments);
					}
				} else {
					errormsg = "Response Code Error / Response Code: " + jqXHR.status + " : " + jqXHR.responseText;
					defer.rejectWith(this, arguments);
				}

			});

			jqXHR.fail(function(jqXHR, statusText, errorThrown) {

				if (jqXHR && statusText) {
					errormsg = "Network Error";
				} else {
					errormsg = "Unknown error";
				}
				defer.rejectWith(this, arguments);

			});

			jqXHR.always(function() {
				if (errormsg !== null) {
					console.log(errormsg);
				}
			});

			return $.extend({}, jqXHR, defer.promise());

		};

		this.getApiVersion = function() {

			var method = 'apiinfo.version';
			var jqXHR = this.sendAjaxRequest(method);

			jqXHR.done(function(data, statusText, jqXHR) {
				this.apiversion = data.result;
			});

			return jqXHR;
		};

		this.userLogin = function() {

			// reset rpcid
			rpcid = 0;

			// method
			switch (apiversion) {
			case '1.0':
			case '1.1':
			case '1.2':
			case '1.3':
				var method = 'user.authenticate';
				break;
			default:
				var method = 'user.login';
				break;
			}

			var jqXHR = this.sendAjaxRequest(method);

			jqXHR.done(function(data, statusText, jqXHR) {
				authid = data.result;
			});

			return jqXHR;
		};

	}; // end plugin
})(window.jQuery || window.Zepto); // function($)

