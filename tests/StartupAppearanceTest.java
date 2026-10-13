package app.still.planner;
import org.json.*;import java.nio.file.*;
public class StartupAppearanceTest {
 static int checks=0;
 static void check(boolean yes){if(!yes)throw new AssertionError("Check "+(checks+1));checks++;}
 public static void main(String[] args)throws Exception{
  JSONArray cases=new JSONArray(new String(Files.readAllBytes(Paths.get(args[0])),"UTF-8"));
  for(int i=0;i<cases.length();i++){JSONObject c=cases.getJSONObject(i);StartupAppearance a=StartupAppearance.resolve(c.getString("raw"),c.getBoolean("systemDark"));check(a.dark==c.getBoolean("dark")&&a.accent.equalsIgnoreCase(c.getString("accent"))&&a.background.equalsIgnoreCase(c.getString("background")));}
  check(StartupAppearance.resolve("",true).dark&&StartupAppearance.resolve("",true).accent.equals("#B89DFF"));
  check(!StartupAppearance.resolve("",false).dark&&StartupAppearance.resolve("",false).accent.equals("#635b4f"));
  String system="{\"preferences\":{\"theme\":\"system\",\"darkAccent\":\"teal\",\"lightAccent\":\"rose\"}}";
  check(StartupAppearance.resolve(system,true).accent.equals("#87CFCC"));check(StartupAppearance.resolve(system,false).accent.equals("#92516A"));
  check(StartupAppearance.resolve("{\"preferences\":{\"theme\":\"dark\",\"darkAccent\":\"invalid\"}}",false).accent.equals("#B89DFF"));
  Files.write(Paths.get(args[1]),new JSONObject().put("passed",checks).put("scope","JVM: twelve palette cases from actual web selections plus cold-start and system-theme defaults. No device rendering.").toString(2).getBytes("UTF-8"));System.out.println(checks+" native startup accent checks passed");
 }
}
