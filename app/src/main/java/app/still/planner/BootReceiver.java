package app.still.planner;
import android.content.*;
public class BootReceiver extends BroadcastReceiver {public void onReceive(final Context c,Intent i){String a=i.getAction();if(Intent.ACTION_BOOT_COMPLETED.equals(a)||Intent.ACTION_MY_PACKAGE_REPLACED.equals(a)||Intent.ACTION_TIME_CHANGED.equals(a)||Intent.ACTION_TIMEZONE_CHANGED.equals(a)){final PendingResult p=goAsync();new Thread(new Runnable(){public void run(){try{ReminderReceiver.reschedule(c);TodayWidget.refreshAll(c);}finally{p.finish();}}}).start();}}}
