$(document).ready(function() {

	if (typeof localStorage == "undefined") {
		window.alert("This browser does not support.");
		return;
	}

	$("#zabirepoVersion").text(zabirepo.VERSION);

	// TODO 保存されたセッションIDでログインする
	// var zbxsession = db.get("zbxsession");
	// if (zbxsession !== null) {
	// server.authid = zbxsession;
	//
	// $("#top_login").hide();
	// $(".body").removeClass("login-page");
	// $("#top_contents").show();
	// int.ready();
	// }

	$("#submit_login").click(function() {
		int.ready();
	});

});

var zbxApi = {
	// for Test
	apiTest : {
		get : function() {
			var method = "item.get";
			var params = {
				// "output" : "extend",
				"output" : [ "name", "lastvalue" ],
				"selectHosts" : [ "host" ],
				"filter" : {
					"value_type" : [ 0, 3 ]
				},
				"sortfield" : "name",
				"monitored" : true,
				"limit" : "50000"
			};
			return server.sendAjaxRequest(method, params);
		},
		success : function(data) {
			console.log(data);

			$.each(data.result, function(result_index, result_value) {
				$.each(result_value.hosts, function(host_index, host_value) {
					console.log(host_value.host + " / " + result_value.name + " / " + result_value.lastvalue);
				});
			});
		}
	},
	auth : {
		get : function() {
			return server.userLogin();
		},

		success : function(data) {

			Cookies.set('zbx_sessionid', data.result, {
				expires : 7,
				path : '/zabbix',
				domain : (baseURL.split('/')[2]).split(':')[0]
			});

			// db.set("zbxsession", data.result)
			return data;
		}
	},

	itemNames : {
		get_all : function() {
			var method = "item.get";
			var params = {
				"output" : [ "key_" ],
				"monitored" : true,
				"sortfield" : "key_",
				"filter" : {
					"value_type" : [ 0, 3 ]
				},
				"limit" : "50000"
			};

			return server.sendAjaxRequest(method, params);
		},
		success_all : function(data) {
			itemKeyNamesUniqArray = db.get("itemKeyNamesUniqArray");

			if (itemKeyNamesUniqArray === null) {
				setTimeout(function() {
					var itemKeyNamesArray = [];
					$.each(data.result, function(key, value) {
						itemKeyNamesArray.push(value.key_);
					});
					itemKeyNamesUniqArray = itemKeyNamesArray.filter(function(x, i, self) {
						return self.indexOf(x) === i;
					});
					db.set("itemKeyNamesUniqArray", itemKeyNamesUniqArray);
				}, 0);
			}
		}
	},

	itemIDs : {
		get : function(groupName, itemfilterName) {
			var method = "item.get";
			var params = {
				"output" : [ "itemid", "name", "key_" ],
				"group" : groupName,
				"searchWildcardsEnabled" : true,
				"search" : {
					"key_" : [ itemfilterName ]
				},
				"limit" : "50000"
			};
			return server.sendAjaxRequest(method, params);
		}
	},

	multiSelectHostGroupNames : {
		get : function() {
			var method = "hostgroup.get";
			var params = {
				"output" : [ "groupid", "name" ],
				"sortfield" : "name",
				"with_monitored_items" : "true"
			};
			return server.sendAjaxRequest(method, params);
		}
	},
	alertTrigger : {
		get : function() {
			var method = "trigger.get";
			var params = {
				"output" : "",
				"monitored" : true,
				"skipDependent" : true,
				"filter" : {
					"value" : "1"
				},
				"countOutput" : true,
				"limit" : "10000"
			};

			return server.sendAjaxRequest(method, params);

		},
		success : function(data) {
			$("#infobox_alertTrigger").text(data.result);
		}

	},
	unAckknowledgeEvent : {
		get : function() {
			var method = "trigger.get";
			var params = {
				"output" : "",
				"monitored" : true,
				"skipDependent" : true,
				"withUnacknowledgedEvents" : true,
				"countOutput" : true,
				"limit" : "10000"
			};

			return server.sendAjaxRequest(method, params);

		},
		success : function(data) {
			$("#unAcknowledgedEvents").text(data.result);
		}

	},

	event : {
		get : function() {
			var beforeMinites = db.get("beforeDay") * 60 * 60 * 24;
			var nowUtime = Math.floor($.now() / 1000);

			var method = "event.get";
			var params = {
				"output" : "extend",
				"selectHosts" : [ "host" ],
				"selectRelatedObject" : [ "description", "priority" ],
				"sortfield" : "clock",
				"time_from" : nowUtime - beforeMinites,
				"limit" : "10000"
			};
			return server.sendAjaxRequest(method, params);
		},

		success : function(data) {

			var resultArray = [];
			resultArray.push([ "Date", "Host", "Description", "Status", "Severity" ]);

			$.each(data.result, function(top_index, top_value) {
				if (top_value.hosts.length !== 0) {
					var innerArray = [ convTime(top_value.clock), top_value.hosts[0].host, top_value.relatedObject.description, convStatus(top_value.value), convPriority(top_value.relatedObject.priority) ];
					resultArray.push(innerArray);
				}

			});

			return resultArray;
		}
	},
	triggerInfo : {
		get : function() {
			var method = "trigger.get";
			var params = {
				"output" : [ "description", "priority", "value", "lastchange" ],
				"monitored" : true,
				"skipDependent" : true,
				"expandDescription" : true,
				"selectGroups" : [ "name" ],
				"selectHosts" : [ "host", "maintenance_status" ],
				"selectItems" : [ "itemid" ],
				"sortfield" : "description",

				// TODO アラート状態のトリガーだけでなく、直近ステータス変更があったトリガーに変更
				"only_true" : true,
				// "filter" : {
				// "value" : [ 1 ]
				// },

				"selectLastEvent" : "true",
				"limit" : "10000"
			};

			return server.sendAjaxRequest(method, params);

		},
		success : function(data) {

			var resultArray = [];

			if (data.result.length === 0) {
				var innerArray = {
					"host" : "No Problem host",
					"group" : "No Problem group",
					"status" : "OK",
					"severity" : "information",
					"description" : "No Problem trigger",
					"lastchange" : convTime(),
					"age" : "00d 00h 00m"

				};
				resultArray.push(innerArray);
			} else {

				// console.log(data);

				$.each(data.result, function(top_index, top_value) {
					if (top_value.hosts.length !== 0 && top_value.groups.length !== 0) {

						// TODO アイテムのシンプルグラフへのリンクを表示する
						var itemArray = [];
						$.each(top_value.items, function(second_index, second_value) {
							itemArray.push(second_value);
						});

						var innerArray = {
							"host" : top_value.hosts[0].host,
							"group" : top_value.groups[0].name,
							"status" : convStatus(top_value.value),
							"severity" : convPriority(top_value.priority),
							"description" : top_value.description,
							"lastchange" : convTime(top_value.lastchange),
							"age" : convDeltaTime(top_value.lastchange),
							"ack" : convAck(top_value.lastEvent.acknowledged),
							"mainte_status" : top_value.hosts[0].maintenance_status,
							// "triggerid" : triggerid,
							"itemids" : top_value.items
						};
						resultArray.push(innerArray);
					}
				});
			}

			// console.log(resultArray);

			return resultArray;
		}
	}
};

var int = {
	ready : function() {
		lastPeriod = 3600;
		options.username = $("#inputUser").val();
		options.password = $("#inputPasswd").val();

		// for API Login
		server = new $.jqzabbix(options);
		server.getApiVersion().then(function() {
			return zbxApi.auth.get();
		}, function() {
			$.unblockUI(blockUI_opt_all);
			alertDiag(server.isError);
		}).then(function(data) {
			return zbxApi.auth.success(data);
		}, function(data) {
			alertDiag(data.error.data);
			// end API Login
		}).then(function() {
			// for Dashboard
			$.blockUI(blockUI_opt_all);
			$("#top_login").hide();
			$(".body").removeClass("login-page");
			$("#top_contents").show();
			// for dashboard
			int.dashboardView();
		}).then(function() {
			// for multiSelectHostGroup in setting
			int.createMultiSelectHostGroupNames();
		}).then(function() {
			// for suggest
			return zbxApi.itemNames.get_all();
		}).then(function(data, status, jqXHR) {
			zbxApi.itemNames.success_all(data);
		}).then(function() {
			// DOM event attach
			int.createEvents();

			$.unblockUI(blockUI_opt_all);
		});
	},

	createEvents : function() {

		// ##### Window resize #####
		var timer = false;
		$(window).resize(function() {
			if (timer !== false) {
				clearTimeout(timer);
			}
			timer = setTimeout(function() {

				// TODO スマホだとウインドウを動かす度にリロードしてしまうので保留
				// if ($("#base_graph").css("display") === "block")
				// {
				// int.createGraphTable();
				// }

			}, 200);
		});

		// ##### Menu Link #####

		var ret_settingCheck = int.settingCheck();
		if (ret_settingCheck === true) {
			int.createGraphMenu();
		}

		$("#menu_dashboard").click(function() {
			$("[id^=base]").hide();
			$("#base_dashboard").show();
			int.dashboardView();
		});

		$("#menu_histogram").click(function() {
			$("[id^=base]").hide();
			pivotDisplay();
			$("#base_event").show();
			$("#base_histogram").show();
		});

		$("#menu_pivottable").click(function() {
			$("[id^=base]").hide();
			pivotDisplay();
			$("#base_event").show();
			$("#base_pivottable").show();
		});

		$("#menu_treemap").click(function() {
			$("[id^=base]").hide();
			pivotDisplay();
			$("#base_event").show();
			$("#base_treemap").show();
		});

		$("#menu_free").click(function() {
			$("[id^=base]").hide();
			pivotDisplay();
			$("#base_event").show();
			$("#base_free").show();
		});

		$("#menu_setting").click(function() {
			$("[id^=base]").hide();
			$("#base_setting").show();
		});

		$("#groupSelect_li").click(function() {
			$("#contents_top > div").hide();
			$("#graph").show();
		});

		$("#groupSelect li a").click(function() {
			$("#contents_top > div").hide();
			$("#graph").show();

			var targetPeriod = eval(db.get("lastPeriod"));
			var menuGroup = $(this).attr("id");
			createGraphTable(targetPeriod, menuGroup);
		});

		$("#menu_setting").click(function() {
			$("#contents_top > div").hide();
			$("#form_beforeDay").val(db.get("beforeDay"));
			$("#setting").show();
		});

		// ##### dashboard #####

		$("#reload_dashboard").click(function() {
			int.dashboardView();
		});

		$(function($) {
			$('#reload_dashboard_selecter').change(function() {
				var selectVal = $(this).val();
				if (selectVal != 0) {
					$("#reload_dashboard").attr({
						"disabled" : "disabled"
					});

					reloadTimer(true, selectVal);

				} else {
					$("#reload_dashboard").removeAttr("disabled");

					reloadTimer(false);
				}
			});
		});

		// ##### events #####

		var filterDisp = {
			on : function(labelName) {
				$("#label_" + labelName).removeClass("label-info").addClass("label-warning").text("Filter ON");
				alertFade("#alert_" + labelName);
			},

			off : function(labelName) {
				$("#label_" + labelName).removeClass("label-warning").addClass("label-info").text("Filter OFF");
				alertFade("#alert_" + labelName);

			}
		};

		$("#save_event_histogram").click(function() {
			db.set("event_histogram", db.get("event_histogram_tmp"));
			filterDisp.on("event_histogram");
		});

		$("#clear_event_histogram").click(function() {
			db.remove("event_histogram");
			filterDisp.off("event_histogram");
			pivotDisplay();
		});

		$("#save_event_pivot").click(function() {
			db.set("event_pivot", db.get("event_pivot_tmp"));
			filterDisp.on("event_pivot");
		});

		$("#clear_event_pivot").click(function() {
			db.remove("event_pivot");
			filterDisp.off("event_pivot");
			pivotDisplay();
		});

		$("#save_event_treemap").click(function() {
			db.set("event_treemap", db.get("event_treemap_tmp"));
			filterDisp.on("event_treemap");
		});

		$("#clear_event_treemap").click(function() {
			db.remove("event_treemap");
			filterDisp.off("event_treemap");
			pivotDisplay();
		});

		$("#save_event_free").click(function() {
			db.set("event_free", db.get("event_free_tmp"));
			filterDisp.on("event_free");
		});

		$("#clear_event_free").click(function() {
			db.remove("event_free");
			filterDisp.off("event_free");
			pivotDisplay();
		});

		// ##### graphs #####

		$("#reflesh_graph").click(function() {
			int.createGraphTable();
		});

		$("#periodSelect button").click(function() {
			$(this).addClass("active").siblings().removeClass("active");
			switch ($("#periodSelect button").index(this)) {
			case 0:
				lastPeriod = 3600;
				int.createGraphTable();
				break;
			case 1:
				lastPeriod = 3600 * 2;
				int.createGraphTable();
				break;
			case 2:
				lastPeriod = 3600 * 3;
				int.createGraphTable();
				break;
			case 3:
				lastPeriod = 3600 * 6;
				int.createGraphTable();
				break;
			case 4:
				lastPeriod = 3600 * 12;
				int.createGraphTable();
				break;
			case 5:
				lastPeriod = 3600 * 24;
				int.createGraphTable();
				break;
			case 6:
				lastPeriod = 3600 * 24 * 3;
				int.createGraphTable();
				break;
			case 7:
				lastPeriod = 3600 * 24 * 7;
				int.createGraphTable();
				break;
			case 8:
				lastPeriod = 3600 * 24 * 14;
				int.createGraphTable();
				break;
			case 9:
				lastPeriod = 3600 * 24 * 30;
				int.createGraphTable();
				break;
			case 10:
				lastPeriod = 3600 * 24 * 90;
				int.createGraphTable();
				break;
			case 11:
				lastPeriod = 3600 * 24 * 180;
				int.createGraphTable();
				break;
			case 12:
				lastPeriod = 3600 * 24 * 365;
				int.createGraphTable();
				break;
			}
		});

		// ##### Setting #####

		// ##### Setting => events
		$("#submit_form_beforeDay").click(function() {

			if ($("#form_beforeDay").val() === "") {
				alertDiag("Setting Save Error");
				return;
			}

			db.set("beforeDay", $("#form_beforeDay").val());
			alertFade("#alert_form_beforeDay");
		});

		$("#cancel_form_beforeDay").click(function() {
			$("#form_beforeDay").val(db.get("beforeDay"));
			alertFade("#alert_form_beforeDay");
		});

		// ##### Setting => graphs

		$('a[href="#tab_graph_setting"]').click(function() {
			int.settingTabGraph();
		});

		$(document).on("click", ".addList", function() {
			$("#graph_setting-tbody > tr").eq(0).clone().insertAfter($(this).parent().parent());
			setting.graphAutocomp();
			setting.graphCheckRowCount();
		});

		$(document).on("click", ".removeList", function() {
			$(this).parent().parent().remove();
			setting.graphAutocomp();
			setting.graphCheckRowCount();

		});

		$("#submit_graph_setting").click(function() {

			// keySetting
			var itemKeys = [];
			$("#graph_setting-tbody > tr").each(function() {
				var input_key = $(this).find(".input_zbx_key").val();

				if ($(this).find(".input_zbx_split").prop("checked")) {
					var input_split = 1;
				} else {
					var input_split = 0;
				}

				if (input_key !== "") {
					itemKeys.push({
						"search_key" : input_key,
						"split_flag" : input_split
					});
				}
			});

			if (Object.keys(groupNames).length === 0 || itemKeys == null || itemKeys.length === 0) {
				alertDiag("Setting Save Error");
				return;
			}

			db.set("groupNamesArray", sortObjectStr(groupNames, "groupName"));
			db.set("keyNamesArray", itemKeys);

			int.createGraphMenu();
			int.settingTabGraph();
			alertFade("#alert_graph_setting");
		});

		$("#cancel_graph_setting").click(function() {
			var ret_settingCheck = int.settingCheck();
			if (ret_settingCheck === true) {
				int.createGraphMenu();
			}
			int.settingTabGraph();
			alertFade("#alert_graph_setting");
		});

		// ##### Setting => etc

		$("#allClear").click(function() {
			localStorage.clear();
			infoDiag("Success:Setting All Clear");
		});

		// TODO 保存した設定をダウンロードできるようにする。
		$("#export").click(function() {

			// 指定されたデータを保持するBlobを作成する。
			var blob = new Blob([ content ], {
				"type" : "application/x-msdownload"
			});

			// Aタグのhref属性にBlobオブジェクトを設定し、リンクを生成
			window.URL = window.URL || window.webkitURL;
			$("#" + id).attr("href", window.URL.createObjectURL(blob));
			$("#" + id).attr("download", "tmp.txt");

			var data = JSON.stringify(tasks);
			var a = document.createElement('a');
			a.textContent = 'export';
			a.download = 'tasks.json';
			a.href = window.URL.createObjectURL(new Blob([ data ], {
				type : 'text/plain'
			}));
			a.dataset.downloadurl = [ 'text/plain', a.download, a.href ].join(':');

			var exportLink = document.getElementById('export-link');
			exportLink.appendChild(a);

		});

		// TODO 設定をインポートできるようにする。
		$("#import").click(function() {

			infoDiag("Success:Setting Import");
		});

		// Logout
		$("#log-out").click(function() {
			$.blockUI(blockUI_opt_all);
			db.remove("zbxsession");
			jQuery.getScript("js/zabirepo-param.js");

			$(".body").addClass("login-page");
			$("#top_contents").hide('fade', '', 500, function() {
				$("#top_login").show('fade', '', 500, function() {
					location.reload($.unblockUI(blockUI_opt_all));
				});
			});
		});

	},

	createGraphMenu : function() {
		$("#menu_group_top").empty();
		$("#menu_item_top").empty();

		var groupNames = db.get("groupNamesArray");
		var keyNames = db.get("keyNamesArray");

		var groupNames_array = [];
		$.each(groupNames, function(index, elem) {
			groupNames_array.push(elem.groupName);
		});
		groupNames_array.sort();

		$.each(groupNames_array, function(index, elem) {
			$('<li><p><a class="menu_group"><i class="fa"></i><font size="2">' + elem + '</font></a></p></li>').appendTo("#menu_group_top");
		});

		$.each(keyNames, function(index, elem) {
			$('<li><p><a class="menu_item" data-splitFlag="' + elem.split_flag + '"><i class="fa"></i><font size="2">' + elem.search_key + '</font></a></li>').appendTo("#menu_item_top");

			$("#menu_item_top li:last-child").data("split_flag2", elem.split_flag);
		});

		$(document).off("click", ".menu_group");
		$(document).on("click", ".menu_group", function() {
			var i = 0;
			if (i === 0) {
				int.createGraphArray(this.text, "group");
				i++;
			}
		});

		$(document).off("click", ".menu_item");
		$(document).on("click", ".menu_item", function() {
			var i = 0;
			if (i === 0) {
				int.createGraphArray(this.text, "item");
				i++;
			}
		});

	},

	createGraphArray : function(clickText, type) {
		var kickCount = 0;
		var endCount = 0;
		resultObj = [];
		graphLabel = clickText;

		if (type === "group") {
			var keyNames = db.get("keyNamesArray");
			$.each(keyNames, function(k_key, k_value) {

				var jqXHR = zbxApi.itemIDs.get(clickText, k_value.search_key);
				jqXHR.done(function(data, status, jqXHR) {
					endCount++;
					if (data.result.length !== 0) {
						var resultMap = {
							rpcid : data.id,
							data : data.result,
							split : k_value.split_flag,
						};
						resultObj.push(resultMap);
					}

					if (kickCount == endCount) {
						resultObj = sortObject(resultObj, "rpcid");
						int.createGraphTable();
					}
				});
				kickCount++;
			});

		} else { // for item click
			var groupNames = db.get("groupNamesArray");

			$.each(groupNames, function(g_key, g_value) {
				var jqXHR = zbxApi.itemIDs.get(g_value.groupName, clickText);
				jqXHR.done(function(data, status, jqXHR) {
					endCount++;
					if (data.result.length !== 0) {
						var resultMap = {
							rpcid : data.id,
							data : data.result,
							split : 1,

						};
						resultObj.push(resultMap);
					}

					if (kickCount == endCount) {
						resultObj = sortObject(resultObj, "rpcid");
						int.createGraphTable();
					}
				});
				kickCount++;
			});
		}
	},
	createGraphTable : function() {

		// TODO ホスト別に選択可能にする
		// $("#multiSelectSample1").multiselect({
		// enableFiltering : true,
		// onSelectAll : true,
		// maxHeight : 250
		// });
		//
		// $('#multiSelectSample1').multiselect('selectAll', true);
		// $('#multiSelectSample1').multiselect('updateButtonText');

		// TODO タイムピッカーを付ける

		// var graphtype = '0';
		// var graphWidth = '700';

		$("[id^=base]").hide();
		$('#base_graph').show();

		$('#table').empty();
		$("#reportName").text("Display Report ： 【 " + graphLabel + " 】");

		if (resultObj.length === 0) {
			$('<div class="center-block"><strong>Item is not found.</strong></div>').appendTo("#table");
			return;
		}

		// create uniq key
		var itemKeyTmp = [];
		$.each(resultObj, function(top_index, top_value) {
			$.each(top_value.data, function(second_index, second_value) {
				itemKeyTmp.push(second_value.key_);
			});
		});

		var itemKeyUniqArray = itemKeyTmp.filter(function(x, i, self) {
			return self.indexOf(x) === i;
		});
		// end create uniq key

		// split option check
		var itemKeys = [];
		$.each(resultObj, function(top_index, top_value) {
			if (top_value.split === 1) {
				$.each(itemKeyUniqArray, function(itemKeyUniq_index, itemKeyUniq_value) {
					var itemKeysTmp = [];
					$.each(top_value.data, function(second_index, second_value) {

						if (itemKeyUniq_value === second_value.key_) {
							itemKeysTmp.push(second_value.itemid);
						}
					});
					if (itemKeysTmp.length !== 0) {
						itemKeys.push(itemKeysTmp);
					}
				});
			} else {
				var itemKeysTmp = [];
				$.each(top_value.data, function(second_index, second_value) {
					itemKeysTmp.push(second_value.itemid);
				});
				if (itemKeysTmp.length !== 0) {
					itemKeys.push(itemKeysTmp);
				}
			}
		});

		var i = 0;
		var addUrl = "";
		var trUrl = "";
		var blockCount;
		var width_val;

		var windowWidth = $(window).width();
		if (windowWidth > 1280) {
			blockCount = 2;
			width_val = "33%";
		} else if (windowWidth > 768) {
			blockCount = 1;
			width_val = "50%";
		} else {
			blockCount = 0;
			width_val = "100%";
		}

		if (itemKeys.length >= zabirepo.GRAPH_CELL_LIMIT) {
			$('<div class="text-center center-block graphCell graphLimit">The number of graphs has exceeded the limit. (graphs : ' + itemKeys.length + ' / limit : ' + zabirepo.GRAPH_CELL_LIMIT + ')</div>').appendTo("#table");
			return;
		}

		$("#graphCount").text("Display " + itemKeys.length + " of graph");

		$.each(itemKeys, function(top_index, top_value) {
			var first = 0;
			var itemUrl = "";

			if (top_value.length <= zabirepo.GRAPH_ITEM_LIMIT) {

				$.each(top_value, function(second_index, second_value) {
					if (first !== 0) {
						itemUrl = itemUrl + '&';
					}

					itemUrl = itemUrl + 'itemids%5B' + second_value + '%5D=' + second_value;
					first = 1;
				});

				var srcUrl = "";
				var addUrl = "";
				var timestamp = new Date().getTime();
				var srcUrl = graphURL + '?period=' + lastPeriod + '&height=' + zabirepo.GRAPH_HEIGHT + '&width=' + zabirepo.GRAPH_WIDTH + '&type=' + zabirepo.GRAPH_TYPE + '&batch=1' + '&' + itemUrl + '&' + timestamp;

				var addUrl = '<div><img class="img-thumbnail img-responsive graphCell" data-action="zoom" src=' + srcUrl + '>';
				$(addUrl).appendTo("#table");

			} else {
				$('<div class="text-center center-block graphCell graphLimit">The number of items has exceeded the limit. (Items : ' + top_value.length + ' / limit : ' + zabirepo.GRAPH_ITEM_LIMIT + ')</div>').appendTo("#table");
			}

			if (i == blockCount) {
				$('<div class="graphSparater"></div>').appendTo("#table");
				i = 0;
			} else {
				i = i + 1;
			}
		});

		$(".graphCell").css('width', width_val);

	},

	dashboardView : function() {

		$(".info-box-content").block(blockUI_opt_el);

		$.when(zbxApi.alertTrigger.get(), zbxApi.unAckknowledgeEvent.get()).done(function(data_a, data_b) {
			zbxApi.alertTrigger.success(data_a[0]);
			zbxApi.unAckknowledgeEvent.success(data_b[0]);
			$("#lastUpdateDashboard").text(convTime());

		}).fail(function() {
			console.log("dashboardView : Network Error");
			alertDiag("Network Error");
		}).always(function() {
			$(".info-box-content").unblock(blockUI_opt_el);
		});
		int.dcCreate();
	},

	dcCreate : function() {
		// $("#chart_severity").empty();
		// $("#chart_hostGroup").empty();
		// $("#chart_host").empty();
		// $("#eventList").empty();
		//
		// $("#chart_severity *").off();
		// $("#chart_hostGroup *").off();
		// $("#chart_host *").off();
		// $("#eventList *").off();

		// for SystemStatus
		zbxApi.triggerInfo.get().done(function(data, status, jqXHR) {

			var cf = crossfilter(zbxApi.triggerInfo.success(data));
			// Severity
			var dimSeverity = cf.dimension(function(d) {
				return d.severity;
			});
			var gpSeverity = dimSeverity.group().reduceCount();
			var chartSeverity = dc.pieChart('#chart_severity');
			chartSeverity.width(250).height(200).cx(160).radius(90).innerRadius(35).slicesCap(Infinity) // すべて表示
			.dimension(dimSeverity).group(gpSeverity).ordering(function(t) {
				return -t.value;
			}).legend(dc.legend())
			chartSeverity.label(function(d) {
				return d.key + ' : ' + d.value;
			});
			chartSeverity.render();

			// hostgroup
			var dimGroup = cf.dimension(function(d) {
				return d.group;
			});
			var gpGroup = dimGroup.group().reduceCount();
			var chartGroup = dc.rowChart('#chart_hostGroup');
			chartGroup.width(300).height(220).dimension(dimGroup).group(gpGroup).ordering(function(t) {
				return -t.value;
			}).legend(dc.legend());

			chartGroup.elasticX(1);
			// chartGroup.xAxis().ticks(1);
			chartGroup.label(function(d) {
				return d.key + ' : ' + d.value;
			});
			chartGroup.render();

			// host
			var dimHost = cf.dimension(function(d) {
				return d.host;
			});
			var gpHost = dimHost.group().reduceCount();
			var chartHost = dc.rowChart('#chart_host');
			chartHost.width(300).height(220).dimension(dimHost).group(gpHost).ordering(function(t) {
				return -t.value;
			}).legend(dc.legend());
			chartHost.elasticX(1);
			// chartHost.xAxis().ticks(10);
			chartHost.label(function(d) {
				return d.key + ' : ' + d.value;
			});
			chartHost.render();

			// event list
			var dimEventList = cf.dimension(function(d) {
				return d.description;
			});

			var tbl = dc.dataTable('#eventList');
			tbl.dimension(dimEventList).size(30).group(function(d) {
				return d.severity;
			}).columns([ function(d) {
				return d.severity;
			}, function(d) {
				return d.status;
			}, function(d) {
				return d.lastchange;
			}, function(d) {
				return d.age;
			}, function(d) {
				return d.ack;
			}, function(d) {
				return d.host;
			}, function(d) {
				return d.description;
			}, function(d) {
			} ]).render();

			tbl.on("postRedraw", function(tbl) {
				addDcTableColor();
			});

			addDcTableColor();

		});

	},

	createMultiSelectHostGroupNames : function() {

		zbxApi.multiSelectHostGroupNames.get().done(function(data, status, jqXHR) {
			$('#zbxGroup').empty();
			$.each(data.result, function(key, value) {
				$('#zbxGroup').append("<option value='" + value.groupid + "," + value.name + "'>" + value.name + "</option>");
			});

			$('#zbxGroup').multiSelect({
				selectableHeader : "<div class='custom-header'>Selectable Groups</div>",
				selectionHeader : "<div class='custom-header'>Selection Groups</div>",
				afterSelect : function(values) {
					$.each(values, function(key, value) {
						var add_value = value.split(",");
						var addObj = {
							groupid : add_value[0],
							groupName : add_value[1]
						};
						groupNames.push(addObj);
					});
				},
				afterDeselect : function(values) {
					$.each(values, function(key, value) {
						var del_value = value.split(",");
						var del_target = del_value[0];
						groupNames.some(function(v, i) {
							if (v.groupid == del_target)
								groupNames.splice(i, 1);
						});
					});
				}
			});

			$('#select-all-zbxGroup').click(function() {
				$('#zbxGroup').multiSelect('select_all');
				return false;
			});

			$('#deselect-all-zbxGroup').click(function() {
				$('#zbxGroup').multiSelect('deselect_all');
				return false;
			});

		}).fail(function() {
			console.log("createMultiSelectHostGroupNames : Network Error");
			alertDiag("Network Error");
		});
	},

	settingTabGraph : function() {
		// groupSetting
		$('#zbxGroup').multiSelect('refresh');

		if (db.get('groupNamesArray') == null) {
			groupNames = [];
		} else {
			groupNames = [];
			var groupNames_tmp = db.get('groupNamesArray');
			$.each(groupNames_tmp, function(index, value) {
				$('#zbxGroup').multiSelect('select', value.groupid + "," + value.groupName);
			});
		}

		var blockWidth;
		var windowWidth = $(window).width();
		if (windowWidth >= 1366) {
			blockWidth = 900;
		} else if (windowWidth >= 640) {
			blockWidth = 600;
		} else if (windowWidth < 640) {
			blockWidth = 280;
		}
		$(".ms-container").css("width", blockWidth);

		// itemSetting
		$("#graph_setting-tbody > tr").not(":first").remove();
		if (db.get("keyNamesArray") == null) {
			$("#graph_setting-tbody > tr").eq(0).clone().insertAfter($("#graph_setting-tbody > tr:last-child"));
		} else {
			var keyNames = db.get("keyNamesArray");
			$.each(keyNames, function(index, value) {
				$("#graph_setting-tbody > tr").eq(0).clone().insertAfter($("#graph_setting-tbody > tr:last-child"));
				$("#graph_setting-tbody .input_zbx_key:last").val(value.search_key);

				if (value.split_flag == 0) {
					$(".input_zbx_split:last").prop("checked", false);
				}
			});
		}

		setting.graphAutocomp();
		setting.graphCheckRowCount();

		$("#graph_setting-tbody").sortable({
			tolerance : "pointer",
			distance : 1,
			cursor : "move",
			revert : true,
			handle : ".graph_setting-icon",
			scroll : true,
			helper : "original"
		});
		
		$("#graph_setting-tbody").bind('click.sortable mousedown.sortable',function(ev){
		    ev.target.focus();
		});
		
		$("#graph_setting-tbody").disableSelection();

	},
	settingCheck : function() {
		if (db.get("beforeDay") === null || db.get("beforeDay").length === 0) {
			db.set("beforeDay", "7");
			$("#form_beforeDay").val("7");

		}
		var groupNames = db.get("groupNamesArray");
		var keyNames = db.get("keyNamesArray");
		if (groupNames === null || $.isEmptyObject(groupNames) === true || keyNames === null || $.isEmptyObject(keyNames) === true) {
			$("#form_beforeDay").val(db.get("beforeDay"));
			$("[id^=base]").hide();
			$("#base_setting").show();
			infoDiag("Please First Setting");
			return false;
		}
		return true;
	}
};

var pivotDisplay = function() {

	$.blockUI(blockUI_opt_all);
	var beforeDay = db.get("beforeDay");

	zbxApi.event.get().done(function(data, statusText, jqXHR) {

		var Latest_events = zbxApi.event.success(data);
		pivotMain(Latest_events, "event_histogram");
		pivotMain(Latest_events, "event_pivot");
		pivotMain(Latest_events, "event_treemap");
		pivotMain(Latest_events, "event_free");
		$.unblockUI(blockUI_opt_all);
	}).fail(function(jqXHR, statusText, errorThrown) {
		$.unblockUI(blockUI_opt_all);
		console.log("pivotDisplay : Network Error");
		alertDiag("Network Error");
	});

};

var pivotMain = function(Latest_events, event_type) {

	var derivers = $.pivotUtilities.derivers;
	var renderers = $.extend($.pivotUtilities.renderers, $.pivotUtilities.c3_renderers, $.pivotUtilities.d3_renderers);
	var dateFormat = $.pivotUtilities.derivers.dateFormat;
	var sortAs = $.pivotUtilities.sortAs;
	var event_conf = {
		renderers : renderers,
		menuLimit : 3000,
		rows : [ "" ],
		cols : [ "" ],
		vals : [ "" ],
		exclusions : {
			"Status" : [ "OK" ]
		},
		aggregatorName : "Count",
		rendererName : "",
		derivedAttributes : {
			"Year" : dateFormat("Date", "%y"),
			"Month" : dateFormat("Date", "%m"),
			"Day" : dateFormat("Date", "%d"),
			"Hour" : dateFormat("Date", "%H"),
			"Minute" : dateFormat("Date", "%M"),
			"Second" : dateFormat("Date", "%S"),
			"Day name" : dateFormat("Date", "%w")
		},
		utcOutput : false,
		sorters : function(attr) {
			if (attr == "Day name") {
				return sortAs([ "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" ]);
			}
			if (attr == "Severity") {
				return sortAs([ "Disaster", "High", "Average", "Warning", "Information", "Not Classfied" ]);
			}
			if (attr == "Status") {
				return sortAs([ "PROBLEM", "OK" ]);
			}
		},
		hiddenAttributes : [ "Date" ],
		onRefresh : function(config) {
			db.set(event_type + "_tmp", config);
			$("#base_event").find(".pvtVal[data-value='null']").css("background-color", "palegreen");
		}
	};

	var event_obj = db.get(event_type);
	if (event_obj != null) {
		event_conf["rows"] = event_obj["rows"];
		event_conf["cols"] = event_obj["cols"];
		event_conf["vals"] = event_obj["vals"];
		event_conf["exclusions"] = event_obj["exclusions"];
		event_conf["aggregatorName"] = event_obj["aggregatorName"];
		event_conf["rendererName"] = event_obj["rendererName"];
		$("#label_" + event_type).removeClass("label-info").addClass("label-warning").text("Filter ON");
	} else {

		if (event_type == "event_histogram") {
			event_conf["rows"] = [ "Severity" ];
			event_conf["cols"] = [ "Year", "Month", "Day" ];
			event_conf["rendererName"] = [ "Stacked Bar Chart" ];
		} else if (event_type == "event_pivot") {
			event_conf["rows"] = [ "Host", "Description" ];
			event_conf["cols"] = [ "Year", "Month", "Day" ];
			event_conf["rendererName"] = [ "Heatmap" ];
		} else if (event_type == "event_treemap") {
			event_conf["rows"] = [ "Description" ];
			event_conf["rendererName"] = [ "Treemap" ];
		} else {
			// free
		}
		$("#label_" + event_type).removeClass("label-warning").addClass("label-info").text("Filter OFF");
	}

	$("#" + event_type).pivotUI(Latest_events, event_conf, {
		overwrite : "true"
	});

	$("#base_event").find(".pvtAggregator").css("visibility", "hidden");

};

var alertDiag = function(data) {
	$("#modal-alert-text").text(data);
	$('#modal-alert').modal('show');
};

var infoDiag = function(data) {
	$("#modal-info-text").text(data);
	$('#modal-info').modal('show');
};

var alertFade = function(target) {
	$(target).fadeIn(1000).delay(2000).fadeOut(1000);
};

var sortObject = function(object, key) {
	var sorted = [];
	var array = [];

	$.each(object, function(object_index, object_data) {
		array.push(object_data[key]);
	});

	array.sort(function(a, b) {
		if (a < b)
			return -1;
		if (a > b)
			return 1;
		return 0;
	});

	$.each(array, function(array_index, array_data) {
		$.each(object, function(object_index, object_data) {
			if (array_data === object_data[key]) {
				sorted.push(object_data);
			}
		});
	});

	return sorted;
}

var sortObjectStr = function(object, key) {
	var sorted = [];
	var array = [];

	$.each(object, function(object_index, object_data) {
		array.push(object_data[key]);
	});

	array.sort();

	$.each(array, function(array_index, array_data) {
		$.each(object, function(object_index, object_data) {
			if (array_data === object_data[key]) {
				sorted.push(object_data);
			}
		});
	});

	return sorted;
}

var blockUI_opt_all = {

	message : '<h4><img src="./dist/img/loading.gif" />　Please Wait...</h4>',
	fadeIn : 200,
	fadeOut : 200,
	css : {
		border : 'none',
		padding : '15px',
		backgroundColor : '#000',
		'-webkit-border-radius' : '10px',
		'-moz-border-radius' : '10px',
		opacity : .5,
		color : '#fff'
	}
};

var blockUI_opt_el = {
	message : '<img src="./dist/img/loading.gif" />',
	fadeIn : 200,
	fadeOut : 200,

};

var db = {
	set : function(key, obj) {
		localStorage.setItem(key, JSON.stringify(obj));
	},
	get : function(key) {
		return JSON.parse(localStorage.getItem(key));
	},
	remove : function(key) {
		localStorage.removeItem(key);
	}
};

var setting = {

	graphAutocomp : function() {
		$(".input_zbx_key").autocomplete({
			source : itemKeyNamesUniqArray,
			autoFocus : false,
			delay : 100,
			minLength : 0
		});
	},
	graphCheckRowCount : function() {
		if ($(".removeList").length == 2) {
			$(".removeList").prop("disabled", true);
		} else {
			$(".removeList").prop("disabled", false);
		}
	}
};

var convTime = function(date) {

	if (date === undefined) {
		var d = new Date();
	} else {
		var d = new Date(date * 1000);
	}

	var year = d.getFullYear();
	var month = d.getMonth() + 1;
	var day = d.getDate();
	var hour = (d.getHours() < 10) ? '0' + d.getHours() : d.getHours();
	var min = (d.getMinutes() < 10) ? '0' + d.getMinutes() : d.getMinutes();
	var sec = (d.getSeconds() < 10) ? '0' + d.getSeconds() : d.getSeconds();
	var date = year + '/' + month + '/' + day + ' ' + hour + ':' + min + ':' + sec;

	return date;
};

var convDeltaTime = function(lastchange) {

	var SECOND_MILLISECOND = 1000;
	var MINUTE_MILLISECOND = 60 * SECOND_MILLISECOND;
	var HOUR_MILLISECOND = 60 * MINUTE_MILLISECOND;
	var DAY_MILLISECOND = 24 * HOUR_MILLISECOND;

	var nowUtime = new Date().getTime();
	var diffTime = nowUtime - (lastchange * 1000);
	var deltaDay = Math.floor(diffTime / DAY_MILLISECOND);
	var diffDay = diffTime - (deltaDay * DAY_MILLISECOND);
	var deltaHour = Math.floor(diffDay / HOUR_MILLISECOND);
	var diffHour = diffDay - (deltaHour * HOUR_MILLISECOND);
	var deltaMin = Math.floor(diffHour / MINUTE_MILLISECOND);
	var diffMin = diffHour - (deltaMin * MINUTE_MILLISECOND);
	var deltaSec = Math.floor(diffMin / SECOND_MILLISECOND);

	var deltaDate = "";
	if (deltaDay !== 0) {
		deltaDate += deltaDay + "d ";
	}
	if (deltaHour !== 0) {
		deltaDate += deltaHour + "h ";
	}
	if (deltaMin !== 0) {
		deltaDate += deltaMin + "m ";
	}
	if (deltaSec !== 0 && deltaDay === 0) {
		deltaDate += deltaSec + "s";
	}

	return deltaDate;

};

var convStatus = function(status) {

	if (status === "0") {
		return "OK";
	} else {
		return "problem";
	}

};

var convAck = function(ack) {

	if (ack === "0") {
		return "Unacked";
	} else {
		return "Acked";
	}

};

var convPriority = function(priority) {

	switch (priority) {
	case "0":
		return "not classified";
	case "1":
		return "information";
	case "2":
		return "warning";
	case "3":
		return "average";
	case "4":
		return "high";
	case "5":
		return "disaster";
	}
}

var reloadTimer = function(flag, interval) {
	if (flag === true) {
		clearInterval(zabirepo.reloadId);
		var counter = interval;
		$("#countDownTimer").text(interval);

		zabirepo.reloadId = setInterval(function() {
			counter--;
			$("#countDownTimer").text(counter);

			if (counter === 0) {
				int.dashboardView();
				counter = interval;
			}

		}, 1000);
	} else {
		clearInterval(zabirepo.reloadId);
		$("#countDownTimer").text("");
	}
};

var addDcTableColor = function() {
	$.each($(".dc-table-column._1"), function(index, value) {
		if (this.textContent === "problem") {
			$(this).css('color', 'Red');
			$(this).addClass('flash');
		} else {
			$(this).css('color', 'blue');
			$(this).addClass('flash');
		}
	});

	$.each($(".dc-table-column._4"), function(index, value) {
		if (this.textContent === "Unacked") {
			$(this).css('color', 'Red');
			$(this).addClass('flash');
		} else {
			$(this).css('color', 'green');
			$(this).addClass('flash');
		}
	});

	$.each($(".dc-table-column._0"), function(index, value) {
		switch (this.textContent) {
		case "not classified":
			$(this).css('background-color', '#97AAB3');
			break;
		case "information":
			$(this).css('background-color', '#7499FF');
			break;
		case "warning":
			$(this).css('background-color', '#FFC859');
			break;
		case "average":
			$(this).css('background-color', '#FFA059');
			break;
		case "high":
			$(this).css('background-color', '#E97659');
			break;
		case "disaster":
			$(this).css('background-color', '#E45959');
			break;
		}
	});
};
