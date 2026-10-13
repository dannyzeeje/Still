package app.still.planner;
import android.app.*;import android.content.*;import android.os.*;import android.net.Uri;import android.provider.Settings;import android.graphics.drawable.Icon;import org.json.*;
final class XiaomiTimerIsland {
 static boolean permitted(Context c){
  if(Settings.System.getInt(c.getContentResolver(),"notification_focus_protocol",0)<2)return false;
  try{Bundle query=new Bundle();query.putString("package",c.getPackageName());Bundle result=c.getContentResolver().call(Uri.parse("content://miui.statusbar.notification.public"),"canShowFocus",null,query);return result!=null&&result.getBoolean("canShowFocus",false);}catch(Exception ignored){return false;}
 }
 static void attach(Context c,Notification.Builder b,JSONObject timer,Notification.Action toggle,Notification.Action stop){
  try{if(!permitted(c))return;Bundle extras=new Bundle(),actions=new Bundle(),pics=new Bundle();actions.putParcelable("miui.focus.action_toggle",toggle);actions.putParcelable("miui.focus.action_stop",stop);pics.putParcelable("miui.focus.pic_clock",Icon.createWithResource(c,R.drawable.timer_clock));extras.putBundle("miui.focus.actions",actions);extras.putBundle("miui.focus.pics",pics);extras.putString("miui.focus.param",TimerIslandPayload.build(timer,System.currentTimeMillis()).toString());b.addExtras(extras);}catch(Exception ignored){}
 }
}
