package app.still.planner;
import android.graphics.*;
import android.graphics.pdf.PdfDocument;
import android.text.*;
import android.text.style.*;
import java.io.*;
import org.json.*;

/** Offline A4 note export. StaticLayout provides Android shaping and line wrapping. */
final class NotePdf {
 private final PdfDocument document=new PdfDocument();
 private PdfDocument.Page page; private Canvas canvas; private int pages=0; private float y=52;
 private static final int WIDTH=595,HEIGHT=842,LEFT=50,RIGHT=545,BOTTOM=786;
 private void next(){if(page!=null)finish();page=document.startPage(new PdfDocument.PageInfo.Builder(WIDTH,HEIGHT,++pages).create());canvas=page.getCanvas();canvas.drawColor(Color.WHITE);y=52;}
 private void finish(){Paint footer=new Paint(Paint.ANTI_ALIAS_FLAG);footer.setColor(Color.rgb(120,125,120));footer.setTextSize(9);canvas.drawText(String.valueOf(pages),RIGHT-12,815,footer);document.finishPage(page);page=null;}
 static byte[] render(String title,JSONArray blocks)throws Exception {NotePdf writer=new NotePdf();try{writer.next();JSONObject heading=new JSONObject();heading.put("type","title");heading.put("runs",new JSONArray().put(new JSONObject().put("text",title)));writer.paragraph(heading);for(int i=0;i<blocks.length();i++)writer.paragraph(blocks.getJSONObject(i));writer.finish();ByteArrayOutputStream out=new ByteArrayOutputStream();writer.document.writeTo(out);return out.toByteArray();}finally{if(writer.page!=null)writer.document.finishPage(writer.page);writer.document.close();}}
 private void paragraph(JSONObject block)throws Exception {
  String type=block.optString("type","p"),list=block.optString("list",""),align=block.optString("align","left");
  boolean heading=type.equals("title")||type.matches("h[123]");
  float size=type.equals("title")?24:type.equals("h1")||type.equals("h2")?18:type.equals("h3")?15:12;
  int indent=Math.min(100,Math.max(0,block.optInt("level",0))*16)+(list.isEmpty()?0:12)+(type.equals("quote")?14:0);
  SpannableStringBuilder text=new SpannableStringBuilder();
  if(list.equals("bullet"))text.append("\u2022  ");else if(list.equals("number"))text.append(String.valueOf(block.optInt("number",1))).append(".  ");
  JSONArray runs=block.optJSONArray("runs");if(runs!=null)for(int i=0;i<runs.length();i++){JSONObject run=runs.getJSONObject(i);int start=text.length();text.append(run.optString("text",""));int end=text.length();if(end==start)continue;boolean bold=heading||run.optBoolean("bold"),italic=type.equals("quote")||run.optBoolean("italic");if(bold||italic)text.setSpan(new StyleSpan(bold&&italic?Typeface.BOLD_ITALIC:bold?Typeface.BOLD:Typeface.ITALIC),start,end,Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);if(run.has("font"))text.setSpan(new TypefaceSpan(run.optString("font").equals("Lora")?"serif":run.optString("font").equals("Roboto Mono")?"monospace":"sans-serif"),start,end,Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);if(run.has("size"))text.setSpan(new AbsoluteSizeSpan((int)Math.round(run.optDouble("size",12))),start,end,Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);if(run.optBoolean("underline"))text.setSpan(new UnderlineSpan(),start,end,Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);if(run.optBoolean("strike"))text.setSpan(new StrikethroughSpan(),start,end,Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);}
  if(text.length()==0)text.append(" ");TextPaint paint=new TextPaint(Paint.ANTI_ALIAS_FLAG);paint.setTypeface(Typeface.create("sans-serif",Typeface.NORMAL));paint.setColor(type.equals("quote")?Color.rgb(84,96,80):Color.rgb(35,40,35));paint.setTextSize(size);
  Layout.Alignment alignment=align.equals("center")?Layout.Alignment.ALIGN_CENTER:align.equals("right")?Layout.Alignment.ALIGN_OPPOSITE:Layout.Alignment.ALIGN_NORMAL;
  int width=RIGHT-LEFT-indent;StaticLayout layout=new StaticLayout(text,paint,width,alignment,1.23f,0,false);
  if(heading&&y+Math.min(layout.getHeight()+40,BOTTOM-52)>BOTTOM)next();
  int start=0;while(start<layout.getLineCount()){
   int top=layout.getLineTop(start),end=start;while(end<layout.getLineCount()&&layout.getLineBottom(end)-top<=BOTTOM-y)end++;
   if(end==start){next();continue;}
   int bottom=layout.getLineBottom(end-1);canvas.save();canvas.translate(LEFT+indent,y-top);canvas.clipRect(0,top,width,bottom);layout.draw(canvas);canvas.restore();y+=bottom-top;start=end;if(start<layout.getLineCount())next();
  }
  y+=heading?14:9;
 }
}
