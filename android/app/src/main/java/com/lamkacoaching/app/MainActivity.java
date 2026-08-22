package com.lamkacoaching.app;

import android.os.Bundle;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SecurityPlugin.class);
        super.onCreate(savedInstanceState);
    }
}

@CapacitorPlugin(name = "Security")
class SecurityPlugin extends Plugin {

    @PluginMethod
    public void enableSecureScreen(PluginCall call) {
        getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    getActivity().getWindow().setFlags(
                        WindowManager.LayoutParams.FLAG_SECURE,
                        WindowManager.LayoutParams.FLAG_SECURE
                    );
                    JSObject ret = new JSObject();
                    ret.put("secured", true);
                    call.resolve(ret);
                } catch (Exception e) {
                    call.reject("Failed to enable FLAG_SECURE: " + e.getMessage());
                }
            }
        });
    }

    @PluginMethod
    public void disableSecureScreen(PluginCall call) {
        getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    getActivity().getWindow().clearFlags(WindowManager.LayoutParams.FLAG_SECURE);
                    JSObject ret = new JSObject();
                    ret.put("secured", false);
                    call.resolve(ret);
                } catch (Exception e) {
                    call.reject("Failed to disable FLAG_SECURE: " + e.getMessage());
                }
            }
        });
    }

    @PluginMethod
    public void isSecureScreenEnabled(PluginCall call) {
        getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    int flags = getActivity().getWindow().getAttributes().flags;
                    boolean isSecure = (flags & WindowManager.LayoutParams.FLAG_SECURE) != 0;
                    JSObject ret = new JSObject();
                    ret.put("secured", isSecure);
                    call.resolve(ret);
                } catch (Exception e) {
                    call.reject("Failed to check FLAG_SECURE: " + e.getMessage());
                }
            }
        });
    }
}
