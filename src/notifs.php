<?php
error_reporting( 0 ); //Hide all errors
header("Cache-Control: max-age=60"); // make the browser cache the result for at least one minute

define('IN_PHPBB', true);
$phpbb_root_path = (defined('PHPBB_ROOT_PATH')) ? PHPBB_ROOT_PATH : './';
$phpEx = substr(strrchr(__FILE__, '.'), 1);

@include_once($phpbb_root_path . 'common.' . $phpEx);

if (!isset($NotifsServerSide_PHP)) {
	// Start session management
	$user->session_begin();
	$auth->acl($user->data);
	$user->setup();
}

if(!$user->data["is_registered"]) {
	echo("User is not logged in"); //die();
} else {
	//if user is registered and logged in
	$userId = $user->data["user_id"];
	
	$dbhost_n = "BLAHBLAH.SOMESERVER.com";
	$dbname_n = "DBNAME";
	$dbuser_n = "DBUSERNAME";
	$dbpasswd_n = "DBPASSWORD";
	
	//global connection handle
	@$GLOBALS['hCon'] = new PDO("mysql:host=$dbhost_n;dbname=$dbname_n;charset=utf8",$dbuser_n,$dbpasswd_n);
	@$GLOBALS['hCon']->exec("SET CHARACTER SET utf8"); //Enable Unicode, character set utf8
	
	if (isset($NotifsServerSide_PHP)) {
		$NotifsServerSide_JSON = GetNotifications($userId,10,isset($_GET["sort"]));
		$NotifsServerSide_JSON_count = GetNotifications($userId,-1);
		$NotifsServerSide_email_chk = ToggleEmailNotifications($userId,-1);
	} else {
		if (isset($_GET["clearId"])) {
			ClearNotifications($userId,UIntSanitize($_GET["clearId"]));
		} elseif (isset($_GET["email_chk"])) {
			echo ToggleEmailNotifications($userId,-1);
		} elseif (isset($_GET["email"])) {
			echo ToggleEmailNotifications($userId,intval(UIntSanitize($_GET["email"])));
		} elseif (isset($_GET["clear"])) {
			ClearNotifications($userId);
		} elseif (isset($_GET["count"])) {
			echo GetNotifications($userId,-1);
		} else {
			if (isset($_GET["all"]))
				echo GetNotifications($userId,0,isset($_GET["sort"]));
			else
				echo GetNotifications($userId,10,isset($_GET["sort"]));
		}
	}
}
function UIntSanitize($dirty) {
	$scrub = filter_var($dirty,FILTER_SANITIZE_NUMBER_INT);
	return str_replace(array('+','-'),'',$scrub); //$finishingTouch
}
function ToggleEmailNotifications($userId,$nOption) {
	if ($nOption == -1) { //Return current Option
		$q = $GLOBALS['hCon']->prepare("SELECT user_notify_type FROM " . USERS_TABLE . " WHERE user_id = :userId");
		$q->execute(array(':userId' => $userId));
		$match = $q->fetch(PDO::FETCH_ASSOC);
		$nOption = intval($match["user_notify_type"]);
	} else { //turn emails ON/OFF
		$nOption = (($nOption > 0) ? 0 : 1);
		$q = $GLOBALS['hCon']->prepare("UPDATE " . USERS_TABLE . " SET user_notify_type = :nOption WHERE user_id = :userId");
		$q->execute(array(':userId' => $userId, ':nOption' => $nOption));
	}
	return (!!intval($nOption)) ? "OFF" : "ON";
}
function ClearNotifications($userId,$topicId = 0) {
	if ($topicId == 0) {
		$q = $GLOBALS['hCon']->prepare("UPDATE " . TOPICS_WATCH_TABLE . " SET notify_status = 0 WHERE user_id = :userId");
		$q->execute(array(':userId' => $userId));
	} else {
		$q = $GLOBALS['hCon']->prepare("UPDATE " . TOPICS_WATCH_TABLE . " SET notify_status = 0 WHERE user_id = :userId AND topic_id = :topicId LIMIT 1");
		$q->execute(array(':userId' => $userId,':topicId' => $topicId));
	}
}
function GetNotifications($userId,$limit,$sort = false) {
	if ($limit>0)
		$q = $GLOBALS['hCon']->prepare("SELECT topic_id FROM " . TOPICS_WATCH_TABLE . " WHERE user_id = :userId AND notify_status != 0 LIMIT ".$limit);
	else
		$q = $GLOBALS['hCon']->prepare("SELECT topic_id FROM " . TOPICS_WATCH_TABLE . " WHERE user_id = :userId AND notify_status != 0 LIMIT 50");
	$q->execute(array(':userId' => $userId));
	
	if ($limit === (-1))
		return $q->rowCount() + 0;

	$notifyArray = array();
	$i = 0;
	while($row = $q->fetch(PDO::FETCH_ASSOC)) {
		$notifyArray[$i] = TopicGetInfo($row['topic_id']);
		$notifyArray[$i]['tt'] = escapeJsonString($notifyArray[$i]['tt']);
		$i++;
	}
	if ($sort)
		$notifyArray = ReorderNotifications($notifyArray);
	return json_encode($notifyArray);
}
function escapeJsonString($value) { // http://stackoverflow.com/a/3615890/883015 
	$result = str_replace("\\","\\\\", $value);
	$escapers = array("'","'");
	$replacements = array("\'",'\"');
	$result = str_replace($escapers, $replacements, $result);
	return $result;
}
function ReorderNotifications($notifs) {
	//Reorder array by "topic_last_post_id" (tlpi), smaller numbers that "topic_last_post_time" (tlpt)
	$notifsSize = sizeof($notifs);
	$postIds = array();
	for ($i=0; $i<$notifsSize; $i++)
		$postIds[$i] = $notifs[$i]['tlpi'];
	array_multisort($postIds, SORT_DESC, $notifs); //sort array by post ids in descending order
	return $notifs;
}
function TopicGetInfo($topicId) {
	$q = $GLOBALS['hCon']->prepare("SELECT topic_id as ti,topic_last_post_time as tlpt,topic_title as tt,topic_last_poster_name as tlpn,topic_last_post_id as tlpi,topic_last_poster_colour as tlpc FROM " . TOPICS_TABLE . " WHERE topic_id = :topicId");
	$q->execute(array(':topicId' => $topicId));
	$tInfo = $q->fetch(PDO::FETCH_ASSOC);
	$tInfo['tlpt'] = date('M d Y h:i A', $tInfo['tlpt']); //convert to human readable date
	return $tInfo;
}
?>
