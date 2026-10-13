package app.still.planner;
import org.json.*;
/** Xiaomi's documented highlightInfo + actions timer template (template 13). */
final class TimerIslandPayload {
 static String remaining(JSONObject t,long now){long seconds=Math.max(0,t.optBoolean("running")?(t.optLong("endAt")-now+999)/1000:t.optLong("remaining"));return seconds>=3600?String.format(java.util.Locale.US,"%d:%02d:%02d",seconds/3600,seconds/60%60,seconds%60):String.format(java.util.Locale.US,"%02d:%02d",seconds/60,seconds%60);}
 static JSONObject build(JSONObject t,long now)throws JSONException{
  boolean running=t.optBoolean("running");String label="focus".equals(t.optString("mode"))?"Focus":"Break",text=remaining(t,now);
  JSONObject clock=new JSONObject().put("type",1).put("pic","miui.focus.pic_clock");
  JSONObject timer=new JSONObject().put("timerType",running?-1:0);
  if(running)timer.put("timerWhen",t.optLong("endAt")).put("timerSystemCurrent",now);
  JSONObject highlight=new JSONObject().put("title",text).put("timerInfo",timer).put("content",label).put("subContent",running?"":"Paused").put("picFunction","miui.focus.pic_clock").put("picFunctionDark","miui.focus.pic_clock").put("colorTitle","#705692").put("colorTitleDark","#B89DFF").put("colorContent","#746B80").put("colorContentDark","#B5ACC5").put("colorSubContent","#746B80").put("colorSubContentDark","#B5ACC5");
  JSONArray actions=new JSONArray().put(new JSONObject().put("type",0).put("action","miui.focus.action_toggle").put("clickWithCollapse",false)).put(new JSONObject().put("type",0).put("action","miui.focus.action_stop").put("clickWithCollapse",true));
  JSONObject island=new JSONObject().put("islandProperty",2).put("islandOrder",false).put("islandTimeout",Math.max(3600,t.optLong("total")+60)).put("highlightColor","#B89DFF")
   .put("bigIslandArea",new JSONObject().put("imageTextInfoLeft",new JSONObject().put("type",1).put("picInfo",clock)).put("sameWidthDigitInfo",new JSONObject().put("digit",text).put("timerInfo",timer).put("showHighlightColor",true)))
   .put("smallIslandArea",new JSONObject().put("picInfo",clock));
  return new JSONObject().put("param_v2",new JSONObject().put("protocol",1).put("business","timer").put("updatable",true).put("reopen","reopen").put("enableFloat",false).put("islandFirstFloat",true).put("filterWhenNoPermission",false).put("timeout",Math.max(720,(t.optLong("total")+59)/60+1)).put("ticker",label+" · "+text).put("aodTitle",label).put("highlightInfo",highlight).put("actions",actions).put("param_island",island));
 }
}
