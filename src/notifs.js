/* Notify - BEGIN */
	var phpBB_BaseDir = "/boards";
	var NotifsPHP_API = "/boards/notifs.php";
	var NotifsRequest_timeout = 10000;
	var lastNotifsCount = "0";
	var isMobileTheme = (typeof phpBBMobile !== 'undefined');
	if (!XMLHttpRequest) {
		window.XMLHttpRequest = function() {
			return new ActiveXObject('Microsoft.XMLHTTP');
		}
	}
	function XHR_Get(u) {
		var req = new XMLHttpRequest();
			req.open("GET",u,false);
			req.send();
		return req.responseText;
	}
	function XHR_GetASC(u) {
		var req = new XMLHttpRequest();
			req.open("GET",u,true);
			req.send();
		return req.responseText;
	}
	function GetNotifs() {
		var req = new XMLHttpRequest();
			req.onreadystatechange = function(){
				if(req.readyState == 4 && req.status == 200) {
					var raw = req.responseText;
					var notifs = JSON.parse(raw);
					return UpdateNotifsWindow(notifs);
				} else if(req.readyState == 4 && req.status != 200) {
					
					//Error loading...
					console.log('Notifs.js Error in "GetNotifs()" : '+req.readyState+'|'+req.status);
					NotifsError();
				}
			}
			req.timeout = NotifsRequest_timeout;
			req.ontimeout = function (){
				//Error loading...
				console.log('Notifs.js TIME_OUT in "GetNotifs()" : '+req.readyState+'|'+req.status);
				NotifsError();
			}
			req.open("GET",NotifsPHP_API+"?sort",true);
			req.send();
	}
	function UpdateNotifsWindow(notifs) {
		var notifsCount = lastNotifsCount;
		var notifsArrCount;
		if (notifs.length)
			notifsArrCount = notifs.length;
		else
			notifsArrCount = 0;
		var nDelImg = '<img src="'+phpBB_BaseDir+'/adm/images/icon_delete.gif" alt="[x]">';
		var nAllURL = phpBB_BaseDir+'/ucp.php?i=main&mode=subscribed';
		var notifsTableHtml = '';
		for (var i = 0; i<notifsArrCount; i++) {
			//Define vars
			var time = notifs[i].tlpt; //topic_last_post_time
			var title = notifs[i].tt; //topic_title
			var name = notifs[i].tlpn; //topic_last_poster_name
			var tId = notifs[i].ti; //topic_id
			var pId = notifs[i].tlpi; //topic_last_post_id
			var tUrl = phpBB_BaseDir+'/viewtopic.php?t='+tId+'&p='+pId+'#p'+pId;
			var uColor = (!notifs[i].tlpc) ? '#000' : "#"+notifs[i].tlpc; //topic_last_poster_colour
			//Define HTML
			var nClear = '<td><a href="#" onclick="ClearNotifId(' +tId+',this);">'+nDelImg+'</a></td>';
			var nTitle = '<td><a href="'+tUrl+'">'+title+'</a></td>';
			var nName =  '<td> by <b style="color:'+uColor+'">'+name+'</b></td>';
			var nTime = '<td>on '+time+'</td>';
			notifsTableHtml = notifsTableHtml + '<tr>' + nClear + nTitle + nName + nTime + '</tr>';
		}
		if (notifsCount.length > 1)
			notifsTableHtml = notifsTableHtml + '<tr><td colspan="2"><a href="'+nAllURL+'">More...</a></td></tr>';
		document.getElementById("notifyTable").innerHTML = notifsTableHtml;
		document.getElementById("notifyCount").innerHTML = notifsCount;
		
		//re-enable refresh link when done.
		var refreshLink_e = document.getElementById("notifyRefreshLink");
		refreshLink_e.onclick = CheckForNewNotifs;
		refreshLink_e.innerHTML = '<img src="'+phpBB_BaseDir+'/adm/images/icon_sync.gif" alt="[R]"> Refresh';
	}
	function ToggleNotifsWindow() {
		var notifyWin = document.getElementById("notifyWin");
		notifyWin.style.display = (notifyWin.style.display == "block") ? "none" : "block";
	}
	function ToggleNotifsEmail(opt) {
		var wBool = XHR_Get(NotifsPHP_API+"?email="+opt);
		if (wBool.length > 1)
			alert("Email notifications have been successfully turned "+wBool+".")
		else {
			alert("Email notifications: an error occurred, please try again.")
			document.getElementById("cbNotifsEmail").checked = (!opt);
		}
	}
	function CheckForNewNotifs() {
		// Disable refresh click when checking...
		var refreshLink_e = document.getElementById("notifyRefreshLink");
		refreshLink_e.onclick = null;
		refreshLink_e.innerHTML = '<img src="'+phpBB_BaseDir+'/adm/images/icon_sync_disabled.gif" alt="[R]"> <i>Refreshing...</i>';
		
		var req = new XMLHttpRequest();
			req.onreadystatechange = function(){
				if(req.readyState == 4 && req.status == 200) {
					var curNotifsCount = req.responseText;
					if (curNotifsCount == "0")
						document.getElementById("notifyCount").innerHTML ="0";
					if (curNotifsCount != lastNotifsCount) {
						lastNotifsCount = curNotifsCount;
						GetNotifs();
					} else {
						//re-enable refresh link when done.
						var refreshLink_e = document.getElementById("notifyRefreshLink");
						refreshLink_e.onclick = CheckForNewNotifs;
						refreshLink_e.innerHTML = '<img src="'+phpBB_BaseDir+'/adm/images/icon_sync.gif" alt="[R]"> Refresh';
					}
				} else if(req.readyState == 4 && req.status != 200) {
					//Error loading...
					console.log('Notifs.js Error in "CheckForNewNotifs()" : '+req.readyState+'|'+req.status);
					NotifsError();
				}
			}
			req.timeout = NotifsRequest_timeout;
			req.ontimeout = function (){
				//Error loading...
				console.log('Notifs.js TIME_OUT in "CheckForNewNotifs()" : '+req.readyState+'|'+req.status);
				NotifsError();
			}
			req.open("GET",NotifsPHP_API+"?count",true);
			req.send();
	}
	function ClearNotifsWindow() {
		var notifyCount = document.getElementById("notifyCount");
		var notifyTable = document.getElementById("notifyTable");
		notifyWin.style.display = "none";
		notifyTable.innerHTML = "";
		notifyCount.innerHTML = "0";
		lastNotifsCount = "0";
	}
	function ClearNotifId(tId,row) {
		var notifyCount = document.getElementById("notifyCount");
		
		if (tId != "ERROR") {
			var reqCId = XHR_GetASC(NotifsPHP_API+"?clearId="+tId);
			//Update Notifs window without page refresh
			var n = parseInt(notifyCount.innerHTML) - 1;
			var NotifsCount = (n>0) ? ('' + n) : "0";
		} else {
			var NotifsCount = "?";
		}
		if (NotifsCount == "0") {
			ClearNotifsWindow();
		} else {
			var rowToRemove = row.parentNode.parentNode;   // see http://stackoverflow.com/q/3387427/883015
			rowToRemove.parentNode.removeChild(rowToRemove); // tell dad/mom to kill me, they wont allow suicide... :(
			notifyCount.innerHTML = NotifsCount;
			// Not modifiying internal counter lastNotifsCount, because detection is automatic with timer
		}
	}
	function ClearNotifs() {
		if (confirm("Are you sure you want to clear ALL of your notifications?")) {
			if (lastNotifsCount == "?") {
				ClearNotifsWindow();
				lastNotifsCount = "?";
				document.getElementById("notifyCount").innerHTML = "?";
			} else {
				var reqC = XHR_GetASC(NotifsPHP_API+"?clear");
				//Update Notifs window without page refresh
				ClearNotifsWindow();
			}
		}
	}
	function NotifsFirstRun() {
		var nDelImg = '<img src="'+phpBB_BaseDir+'/adm/images/icon_delete.gif" alt="[x]">';
		var nRefImg = '<img src="'+phpBB_BaseDir+'/adm/images/icon_sync.gif" alt="[R]">';
		var nAllImg = '<img src="'+phpBB_BaseDir+'/adm/images/file_up_to_date.gif" alt="[H]">';
		var nAllURL = phpBB_BaseDir+'/ucp.php?i=main&mode=subscribed';
		var nOptImg = '<img src="'+phpBB_BaseDir+'/adm/images/icon_edit.gif" alt="[S]">';
		var nOptURL = phpBB_BaseDir+'/ucp.php?i=prefs&mode=post';
		var notifsHtml = '<b>New replies to subscribed topics</b>&nbsp;&nbsp;';
		var nEmailCbHtml = '<label><input type="checkbox" id="cbNotifsEmail" onclick="ToggleNotifsEmail((!!this.checked)+0)">'+
						 ' Email notifications</label>';
		var nHelpImg = '<img src="'+phpBB_BaseDir+'/styles/subsilver2/imageset/icon_topic_unapproved.gif">';
		var nHelpURL = '/boards/viewtopic.php?f=2&t=5496';
		if (isMobileTheme) {
			notifsHtml = notifsHtml+'<br><center><a href="'+nHelpURL+'">'+
						 nHelpImg+' Help</a>&nbsp;&nbsp;'+
						 nEmailCbHtml+'</center>';
		} else { //if desktop theme
			notifsHtml = notifsHtml+nEmailCbHtml+
						 '<a id="NotifsHelp" href="'+nHelpURL+'">'+
						 'Help '+nHelpImg+'</a><br>';
		}
		notifsHtml = notifsHtml+'<a href="#" onclick="ClearNotifs();">'+nDelImg+ ' Clear all</a>'+
					 '&nbsp;&nbsp;<a href="#" id="notifyRefreshLink">'+nRefImg+' Refresh</a>';
		if (isMobileTheme) {
			notifsHtml = notifsHtml+
					 '&nbsp;&nbsp;<a href="'+nAllURL+'">' + nAllImg + ' See all</a>'+
					 '&nbsp;&nbsp;<a href="'+nOptURL+'">' + nOptImg + ' Settings</a>';
		} else { //if desktop theme
			notifsHtml = notifsHtml+
					 '&nbsp;&nbsp;<a href="'+nAllURL+'">' + nAllImg + ' Manage subscriptions</a>'+
					 '&nbsp;&nbsp;<a href="'+nOptURL+'">' + nOptImg + ' Posting settings</a>';
		}
		notifsHtml = notifsHtml+'<table id="notifyTable"></table>';
		document.getElementById("notifyWin").innerHTML = notifsHtml;
		document.getElementById("notifyRefreshLink").onclick = CheckForNewNotifs;
		
		if (typeof NotifsServerSide_email_chk !== 'undefined') {
			if (NotifsServerSide_email_chk == "ON") {
				document.getElementById("cbNotifsEmail").checked = true;
			} else {
				document.getElementById("cbNotifsEmail").checked = false;
			}
		}
		
		//get preloaded notifs from server, if available
		if ( (typeof NotifsServerSide_JSON !== 'undefined') && (typeof NotifsServerSide_JSON_count !== 'undefined') ){
			if ( (NotifsServerSide_JSON_count.length > 0) && (NotifsServerSide_JSON.length > 0) ) {
				//set counter
				document.getElementById("notifyCount").innerHTML = NotifsServerSide_JSON_count;
				lastNotifsCount = NotifsServerSide_JSON_count;
				//update table
				UpdateNotifsWindow(JSON.parse(NotifsServerSide_JSON));
			}
		} else {
			return CheckForNewNotifs();
		}
	}
	function NotifsError() {
		//re-enable refresh link
		var refreshLink_e = document.getElementById("notifyRefreshLink");
		refreshLink_e.onclick = CheckForNewNotifs;
		refreshLink_e.innerHTML = '<img src="'+phpBB_BaseDir+'/adm/images/icon_sync.gif" alt="[R]"> Refresh';
		
		//print Error msg, etc
		var notifyTable = document.getElementById("notifyTable");
		var nt_html = notifyTable.innerHTML;
		var nDelImg = '<img src="'+phpBB_BaseDir+'/adm/images/icon_delete.gif" alt="[x]">';
		notifyTable.innerHTML = '<tr><td><a href="#" onclick="ClearNotifId(\'ERROR\',this);">'+nDelImg+'</a></td><td><strong>An error occured, try refreshing. (see console)</strong></td></tr>'; //+nt_html;
		lastNotifsCount = "?";
		document.getElementById("notifyCount").innerHTML = "?";
	}
	window.onload=NotifsFirstRun;
	setInterval(CheckForNewNotifs, 60000); //search for new notifications every minute
	//hide "notifyWin" when clicking outside of it
	document.documentElement.addEventListener('mouseup', function(e){
		var notifyWin = document.getElementById("notifyWin");
		var notifyLink = document.getElementById("notifyLink");
		if (e.target == notifyLink || notifyLink.contains(e.target)) {
			//if (lastNotifsCount>0)
				return ToggleNotifsWindow();
		}
		if (!notifyWin.contains(e.target))
			notifyWin.style.display = "none";
	});
/* Notify - END */