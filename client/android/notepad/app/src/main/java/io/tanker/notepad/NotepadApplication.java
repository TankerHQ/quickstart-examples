package io.tanker.notepad;

import android.app.Application;

import io.tanker.api.Tanker;

public class NotepadApplication extends Application {
    private Tanker mTanker;
    private String mEmail;
    private String mPassword;
    private String mUserId;

    public Tanker getTankerInstance() {
        return mTanker;
    }

    public void setTankerInstance(Tanker tanker) {
        mTanker = tanker;
    }

    public void setEmail(String email) {
        mEmail = email;
    }

    public String getEmail() {
        return mEmail;
    }

    public void setPassword(String password) {
        mPassword = password;
    }

    public String getPassword() {
        return mPassword;
    }

    public void setUserId(String userId) {
        mUserId = userId;
    }

    public String getUserId() {
        return mUserId;
    }

}