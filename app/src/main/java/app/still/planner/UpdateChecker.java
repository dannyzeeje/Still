package app.still.planner;
import org.json.*;import java.net.*;import java.io.*;import javax.net.ssl.HttpsURLConnection;
/** Explicit, metadata-only checks. Task data is never sent. */
final class UpdateChecker {
 static final String REPOSITORY="dannyzeeje/still";
 static final String METADATA="https://raw.githubusercontent.com/"+REPOSITORY+"/main/update.json";
 static final String RELEASES="https://github.com/"+REPOSITORY+"/releases";
 static JSONObject parse(String raw,int installed)throws Exception{
  JSONObject j=new JSONObject(raw);if(!"app.still.planner".equals(j.getString("package")))throw new IOException("Wrong app");
  int code=j.getInt("versionCode");String version=j.getString("version"),url=j.getString("apkUrl"),hash=j.getString("sha256");
  if(code<1||!version.matches("[0-9]+\\.[0-9]+(?:\\.[0-9]+)?")||!hash.matches("[a-fA-F0-9]{64}")||!validDownload(url))throw new IOException("Invalid release");
  return new JSONObject().put("status",code>installed?"available":"current").put("version",version).put("versionCode",code).put("url",url).put("sha256",hash);
 }
 static boolean validDownload(String raw){try{URI u=new URI(raw);return "https".equals(u.getScheme())&&"github.com".equals(u.getHost())&&u.getPort()==-1&&u.getUserInfo()==null&&u.getQuery()==null&&u.getFragment()==null&&u.getPath().startsWith("/"+REPOSITORY+"/releases/download/")&&u.getPath().endsWith(".apk")&&!u.getPath().contains("..")&&!raw.contains("%");}catch(Exception e){return false;}}
 static JSONObject check(int installed){HttpsURLConnection c=null;try{
  c=(HttpsURLConnection)new URL(METADATA).openConnection();c.setConnectTimeout(6000);c.setReadTimeout(8000);c.setInstanceFollowRedirects(false);c.setRequestProperty("Accept","application/json");c.setRequestProperty("User-Agent","Still-Update-Checker");c.setUseCaches(false);
  int status=c.getResponseCode();if(status==404)return new JSONObject().put("status","unpublished");if(status!=200)throw new IOException("HTTP "+status);
  ByteArrayOutputStream out=new ByteArrayOutputStream();try(InputStream in=c.getInputStream()){byte[] buffer=new byte[2048];int n;while((n=in.read(buffer))!=-1){if(out.size()+n>65536)throw new IOException("Metadata too large");out.write(buffer,0,n);}}
  return parse(out.toString("UTF-8"),installed);
 }catch(Exception e){JSONObject error=new JSONObject();try{error.put("status","error");}catch(JSONException ignored){}return error;}finally{if(c!=null)c.disconnect();}}
}
