package app.still.planner;
import org.json.*;
import java.text.SimpleDateFormat;
import java.util.*;
/** Pure timer transitions shared by native controls and persistence conflict handling. */
final class TimerState {
 static String token(JSONObject t){return t==null?"":t.optString("id")+"@"+t.optLong("endAt")+"@"+t.optBoolean("running")+"@"+t.optString("updatedAt");}
 static String iso(long now){SimpleDateFormat f=new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",Locale.US);f.setTimeZone(TimeZone.getTimeZone("UTC"));return f.format(new Date(now));}
 static boolean apply(JSONObject root,String action,String expected,long now)throws JSONException{
  JSONObject t=root.optJSONObject("timer");if(t==null||!token(t).equals(expected))return false;
  if("pause".equals(action)){if(!t.optBoolean("running")||t.optLong("endAt")<=now)return false;t.put("remaining",Math.max(1,(t.optLong("endAt")-now+999)/1000));t.put("running",false);}
  else if("resume".equals(action)){if(t.optBoolean("running")||t.optLong("remaining")<=0)return false;t.put("endAt",now+t.optLong("remaining")*1000);t.put("running",true);}
  else if("stop".equals(action))root.put("timer",JSONObject.NULL);else return false;
  t.put("updatedAt",iso(now));root.put("timerRevision",root.optLong("timerRevision")+1);return true;
 }
 static boolean mergeNativeTimer(JSONObject incoming,JSONObject stored)throws JSONException{
  if(stored==null||stored.optLong("timerRevision")<=incoming.optLong("timerRevision"))return false;
  incoming.put("timer",stored.opt("timer")==null?JSONObject.NULL:stored.opt("timer"));incoming.put("timerRevision",stored.optLong("timerRevision"));return true;
 }
 static JSONObject envelope(JSONObject root)throws JSONException{return new JSONObject().put("timer",root.opt("timer")==null?JSONObject.NULL:root.opt("timer")).put("timerRevision",root.optLong("timerRevision"));}
}
