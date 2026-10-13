package app.still.planner;
import android.app.Activity;import android.os.*;import android.view.*;import android.widget.*;import android.graphics.Color;import android.animation.ValueAnimator;
/** Fade the logo against an opaque cover, then reveal the ready Home frame. */
final class StartupScreen {
 private final FrameLayout root;private final FrameLayout cover;private final ImageView logo;private boolean ready=false,systemReleased,finishing=false;
 StartupScreen(Activity a,FrameLayout parent,final int bg,final int accent){root=parent;systemReleased=Build.VERSION.SDK_INT<31;
  cover=new FrameLayout(a);cover.setBackgroundColor(bg);cover.setClickable(true);cover.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO_HIDE_DESCENDANTS);logo=new ImageView(a);logo.setImageDrawable(new android.graphics.drawable.Drawable(){
   final android.graphics.Paint paint=new android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG);
   public void draw(android.graphics.Canvas c){int save=c.save();c.translate(getBounds().left,getBounds().top);c.scale(getBounds().width()/108f,getBounds().height()/108f);android.graphics.Path leaf=new android.graphics.Path();leaf.moveTo(41,69);leaf.cubicTo(38,45,54,43,68,37);leaf.cubicTo(71,59,59,73,46,64);leaf.lineTo(41,69);leaf.close();paint.setStyle(android.graphics.Paint.Style.FILL);paint.setColor(accent);c.drawPath(leaf,paint);paint.setColor(bg);paint.setStyle(android.graphics.Paint.Style.STROKE);paint.setStrokeWidth(1.5f);c.drawLine(40,73,60,48,paint);c.restoreToCount(save);}
   public void setAlpha(int a){}public void setColorFilter(android.graphics.ColorFilter f){}public int getOpacity(){return android.graphics.PixelFormat.TRANSLUCENT;}public int getIntrinsicWidth(){return 288;}public int getIntrinsicHeight(){return 288;}
  });int size=Math.round(288*a.getResources().getDisplayMetrics().density);cover.addView(logo,new FrameLayout.LayoutParams(size,size,Gravity.CENTER));root.addView(cover,new FrameLayout.LayoutParams(-1,-1));
  if(Build.VERSION.SDK_INT>=31)Api31.install(a,this);
  root.postDelayed(new Runnable(){public void run(){systemReleased=true;finish();}},12000);
 }
 void finish(){ready=true;if(systemReleased){fadeLogo();return;}root.postDelayed(new Runnable(){public void run(){systemReleased=true;fadeLogo();}},250);}
 private void fadeLogo(){if(!ready||finishing)return;finishing=true;final Runnable reveal=new Runnable(){public void run(){root.removeView(cover);}};
  if(!ValueAnimator.areAnimatorsEnabled()){reveal.run();return;}
  // The cover always stays alpha=1. Home cannot bleed through this transition.
  logo.animate().alpha(0f).setDuration(160).setInterpolator(new android.view.animation.LinearInterpolator()).withEndAction(reveal).start();
 }
 private static final class Api31 {
  static void install(Activity a,final StartupScreen owner){a.getSplashScreen().setOnExitAnimationListener(new android.window.SplashScreen.OnExitAnimationListener(){public void onSplashScreenExit(android.window.SplashScreenView view){view.remove();owner.systemReleased=true;owner.fadeLogo();}});}
 }
}
