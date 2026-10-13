package app.still.planner;
import org.json.JSONObject;
/** Resolve the same named accents as the web UI from the saved preferences. */
final class StartupAppearance {
 final boolean dark;final String accent;final String background;
 private StartupAppearance(boolean d,String a,String seed){dark=d;accent=a;background=mix(seed,d?0:255,d?.90:.95);}
 static String mix(String seed,int target,double amount){StringBuilder out=new StringBuilder("#");for(int i=1;i<7;i+=2){int n=Integer.parseInt(seed.substring(i,i+2),16);out.append(String.format(java.util.Locale.ROOT,"%02x",Math.round(n+(target-n)*amount)));}return out.toString();}
 static StartupAppearance resolve(String raw,boolean systemDark){
  JSONObject p=new JSONObject();try{p=new JSONObject(raw).optJSONObject("preferences");if(p==null)p=new JSONObject();}catch(Exception ignored){}
  String mode=p.optString("theme","system");boolean dark="dark".equals(mode)||("system".equals(mode)&&systemDark);
  String id=p.optString(dark?"darkAccent":"lightAccent",dark?"violet":"stone");
  String[] ids={"stone","violet","sage","teal","rose","amber"};
  String[] light={"#635b4f","#70519B","#4D694E","#286E70","#92516A","#86601D"};
  String[] night={"#D2C4AF","#B89DFF","#A3CCA2","#87CFCC","#E4A3BD","#E3BF7D"};
  int selected=dark?1:0;for(int i=0;i<ids.length;i++)if(ids[i].equals(id)){selected=i;break;}
  return new StartupAppearance(dark,(dark?night:light)[selected],light[selected]);
 }
}
