package io.tanker.notepad;

import android.app.Application;

import io.tanker.api.Tanker;

public class NotepadApplication extends Application {
    private Tanker mTanker;

    public Tanker getTankerInstance() {
        return mTanker;
    }

    public void setTankerInstance(Tanker tanker) {
        mTanker = tanker;
    }
}