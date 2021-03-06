phpBB_v3.0.x-Notifications
=========================================
  
This was the notification mod used in the ahkscript phpBB v3.0.x forum.  
The one used over at ahkscript had a few tiny differences.  
  
- [What is it?](#what-is-it)
- [Getting started](#getting-started)
- [Pluging it in](#pluging-it-in)
- [Finishing off](#finishing-off)
- [Credits](#credits)
  
## What is it?
  
Please see this great forum topic that should explain everything you need to know about it.  
http://ahkscript.org/boards/viewtopic.php?f=2&t=5496  
  
## Getting started
  
Once you have phpBB installed, keep in mind the path of where you had phpBB installed.  
Say, you installed it under `http://example.com/myForum`.  
  
You will find the following files in the `src` folder :  
  - json2.min.js
  - notifs.css
  - notifs.js
  - notifs.php
  
You will need to upload these files to the following places :  
  - http://example.com/js/json2.min.js
  - http://example.com/css/notifs.css
  - http://example.com/js/notifs.js
  - http://example.com/myForum/notifs.php
  
Next, you will have to edit `notifs.js` and `notifs.php`.
  
In `notifs.js` :  
```Javascript
  var phpBB_BaseDir = "/boards";
  var NotifsPHP_API = "/boards/notifs.php";
```
Following our example, you would need to change `boards` to `myForum`.  

In `notifs.php` :  
```PHP
  $dbhost_n = "BLAHBLAH.SOMESERVER.com";
  $dbname_n = "DBNAME";
  $dbuser_n = "DBUSERNAME";
  $dbpasswd_n = "DBPASSWORD";
```
Update the SQL connection information for the phpBB SQL Database.  
  
## Pluging it in
  
For our example, we are going to use the `subsilver2` theme.  
Open up the phpBB ACP (Administration Control Panel), then navigate to the following :  
`ACP -> Styles -> Templates -> subsilver2 : Edit`  
  
Now, select the `overall_header.html` template file.  
Find the closing tag `</head>` and add the following code right before it :  
```HTML
<!-- IF not S_IS_BOT -->
<!-- IF S_USER_LOGGED_IN -->
<!-- PHP -->
$NotifsServerSide_PHP = true; //contact Notifs.php to set the following vars
require '/path/to/baseDir/boards/notifs.php';
echo '<script type="text/javascript">
var NotifsServerSide_JSON = \''.$NotifsServerSide_JSON.'\';
var NotifsServerSide_JSON_count = \''.$NotifsServerSide_JSON_count.'\';
var NotifsServerSide_email_chk = \''.$NotifsServerSide_email_chk.'\';
</script>';
<!-- ENDPHP -->
<link rel="stylesheet" href="/css/notifs.css" type="text/css" />
<script src="/js/notifs.js"></script>
<script src="/js/json2.min.js"></script>
<!-- ENDIF -->
<!-- ENDIF -->
```
**NOTE!** : You will need to update this line from the code :  
`require '/path/to/baseDir/boards/notifs.php';`  
Following our example, say our root directory is `/` and the html files are in `/public_html`. Then it would be `require '/public_html/notifs.php';` based on our root FTP directory.  
  
At around line 242, add the following code after the line containing `<!-- IF PRIVATE_MESSAGE_INFO_UNREAD -->` :
```
&nbsp;&nbsp;<a href="#" id="notifyLink"><img src="{T_THEME_PATH}/images/icon_mini_message.gif" width="12" height="13" alt="*" /> <strong id="notifyCount">Loading...</strong> new notifications</a>
```
Add the following code before the first instance of `</table>` :  
```HTML
<tr>
	<td class="genmed">
		<!-- IF not S_IS_BOT -->
			<!-- IF S_USER_LOGGED_IN -->
				<div id="notifyWin" style="display:none;"></div>
			<!-- ENDIF -->
		<!-- ENDIF -->
	</td>
</tr>
```

## Finishing off
  
Now, hit the `Submit` button to save these changes. PhpBB should automatically update the cached version for you. If the "new notifications" link does not appear next to the "new messages" link, you can try a phpBB cache refresh. To do so, open up the phpBB ACP (Administration Control Panel), then navigate to the following :  
`ACP -> Styles -> Templates -> subsilver2 : Refresh`  
It will ask for confirmation. Click the `Yes` button.  
  
#### Congrats, you are done!
  
## Credits
  
This phpBB modification was created by ahkscript forum users [`Bruttosozialprodukt`](http://ahkscript.org/boards/memberlist.php?mode=viewprofile&u=57116) and [`joedf`](http://ahkscript.org/boards/memberlist.php?mode=viewprofile&u=55).  
  
Released under the [MIT License](http://opensource.org/licenses/MIT) as follows :  
`Copyright (c) <2014> <ahkscript.org>`
