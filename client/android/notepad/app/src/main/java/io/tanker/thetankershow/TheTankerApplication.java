package io.tanker.thetankershow;
import android.app.Application;

import io.tanker.api.Tanker;

public class TheTankerApplication extends Application {
    private Tanker mTanker;

    public Tanker getTankerInstance() {
        return mTanker;
    }

    public void setTankerInstance(Tanker tanker) {
        mTanker = tanker;
    }

    public String getServerAddress() { return "http://10.208.24.87:8080/"; }
}