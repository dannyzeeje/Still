package app.still.planner;
import org.json.*;import java.nio.file.*;
public class TimerNativeTest {
 static JSONArray checks=new JSONArray();static void check(String name,boolean result){if(!result)throw new AssertionError(name);checks.put(name);}
 public static void main(String[] args)throws Exception{
  long now=1800000000000L;JSONObject timer=new JSONObject().put("id","run-a").put("mode","focus").put("total",300).put("remaining",300).put("endAt",now+120501).put("running",true).put("updatedAt","start");JSONObject root=new JSONObject().put("timer",timer).put("timerRevision",0).put("tasks",new JSONArray().put("keep"));String original=TimerState.token(timer);
  check("Pause preserves remaining seconds with ceiling",TimerState.apply(root,"pause",original,now)&&!timer.getBoolean("running")&&timer.getLong("remaining")==121);
  check("Repeated stale pause is ignored",!TimerState.apply(root,"pause",original,now+1000)&&root.getLong("timerRevision")==1);
  String paused=TimerState.token(timer);check("Resume sets a new deadline without losing time",TimerState.apply(root,"resume",paused,now+10000)&&timer.getLong("endAt")==now+131000&&timer.getBoolean("running"));
  check("Old notification cannot stop resumed timer",!TimerState.apply(root,"stop",original,now+11000)&&root.optJSONObject("timer")!=null);
  check("Wrong timer token is ignored",!TimerState.apply(root,"pause","different",now+11000));
  JSONObject incoming=new JSONObject().put("timer",new JSONObject().put("id","stale")).put("timerRevision",0).put("tasks",new JSONArray().put("new edit"));
  check("Stale web snapshot adopts native timer",TimerState.mergeNativeTimer(incoming,root)&&incoming.getJSONObject("timer").getString("id").equals("run-a"));
  check("Native timer merge preserves unrelated web edits",incoming.getJSONArray("tasks").getString(0).equals("new edit"));
  check("Current web revision can change timer",!TimerState.mergeNativeTimer(incoming,root));
  JSONObject payload=TimerIslandPayload.build(timer,now+10000),v=payload.getJSONObject("param_v2"),highlight=v.getJSONObject("highlightInfo");
  check("Expanded island uses countdown and two action buttons",highlight.getJSONObject("timerInfo").getInt("timerType")==-1&&v.getJSONArray("actions").length()==2);
  check("Expanded and compact countdown share deadline",highlight.getJSONObject("timerInfo").getLong("timerWhen")==v.getJSONObject("param_island").getJSONObject("bigIslandArea").getJSONObject("sameWidthDigitInfo").getJSONObject("timerInfo").getLong("timerWhen"));
  check("Island payload meets Xiaomi 3072-byte limit",payload.toString().getBytes("UTF-8").length<=3072);
  check("Unsupported devices retain ordinary notification fallback",!v.getBoolean("filterWhenNoPermission"));
  check("Control pause keeps expanded panel open",!v.getJSONArray("actions").getJSONObject(0).getBoolean("clickWithCollapse"));
  check("Violet dark-mode timer accent supplied",highlight.getString("colorTitleDark").equals("#B89DFF"));
  TimerState.apply(root,"pause",TimerState.token(timer),now+11000);JSONObject pausedDisplay=TimerIslandPayload.build(timer,now+50000).getJSONObject("param_v2").getJSONObject("highlightInfo");
  check("Paused island shows frozen time",pausedDisplay.getJSONObject("timerInfo").getInt("timerType")==0&&pausedDisplay.getString("title").equals("02:00"));
  check("Stop removes timer and preserves tasks",TimerState.apply(root,"stop",TimerState.token(timer),now+12000)&&root.isNull("timer")&&root.getJSONArray("tasks").getString(0).equals("keep"));
  check("Stale web save cannot resurrect a stopped timer",TimerState.mergeNativeTimer(incoming,root)&&incoming.isNull("timer"));
  check("Controls after stop are harmless",!TimerState.apply(root,"resume",paused,now+13000));
  JSONObject expired=new JSONObject().put("timer",new JSONObject(timer.toString()).put("running",true).put("endAt",now));check("Expired timer cannot be paused",!TimerState.apply(expired,"pause",TimerState.token(expired.getJSONObject("timer")),now+1));
  JSONObject longTimer=new JSONObject().put("running",false).put("remaining",86340).put("total",86340).put("mode","focus");check("Long timers keep hours in display",TimerIslandPayload.remaining(longTimer,now).equals("23:59:00"));
  Files.write(Paths.get(args[0]),new JSONObject().put("passed",checks.length()).put("checks",checks).put("scope","JVM tests of actual native state transitions and Xiaomi payload; SystemUI/device delivery remains untested.").toString(2).getBytes("UTF-8"));System.out.println(checks.length()+" native timer checks passed");
 }
}
