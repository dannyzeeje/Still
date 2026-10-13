package app.still.planner;
import org.json.*;
public class UpdateCheckerTest {
 public static void main(String[] args)throws Exception{
  String url="https://github.com/dannyzeeje/still/releases/download/v1.18/Still-1.18.apk";
  JSONObject meta=new JSONObject().put("package","app.still.planner").put("versionCode",19).put("version","1.18").put("apkUrl",url).put("sha256",new String(new char[64]).replace('\0','a'));
  if(!"available".equals(UpdateChecker.parse(meta.toString(),18).getString("status")))throw new AssertionError();
  if(!"current".equals(UpdateChecker.parse(meta.toString(),19).getString("status")))throw new AssertionError();
  String[] bad={"http://github.com/dannyzeeje/still/releases/download/v1/app.apk","https://evil.example/app.apk","https://github.com/another/repo/releases/download/v1/app.apk",url+"?redirect=evil",url.replace("v1.18","../evil"),url.replace("github.com","github.com@evil.example")};for(String v:bad)if(UpdateChecker.validDownload(v))throw new AssertionError(v);
  meta.put("package","another.app");try{UpdateChecker.parse(meta.toString(),18);throw new AssertionError();}catch(java.io.IOException expected){}
  System.out.println("9 update metadata/security checks passed");
 }
}
