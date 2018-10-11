package io.tanker.notepad.session;

import android.content.Context;
import android.os.AsyncTask;
import android.util.Log;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;

import io.tanker.api.Password;
import io.tanker.api.Tanker;
import io.tanker.api.TankerOptions;
import io.tanker.api.VerificationCode;
import io.tanker.notepad.BuildConfig;
import io.tanker.notepad.R;

// Singleton
public class Session {
    private Context mAppContext;
    private ApiClient mApiClient;

    private Tanker mTanker;
    private TankerOptionsTask mTankerOptionsTask;
    private String mTempUnlockPassword;
    private String mTempUnlockCode;

    private static Session instance = null;

    public static Session getInstance(Context context) {
        if (instance == null) {
            instance = new Session(context);
        }

        return instance;
    }

    // Private constructor: never call directly, use getInstance!
    private Session(Context context) {
        mAppContext = context;
        mApiClient = new ApiClient(BuildConfig.API_ROOT);
        mTankerOptionsTask = new TankerOptionsTask();
        mTankerOptionsTask.execute();
    }

    public ApiClient getApiClient() {
        return mApiClient;
    }

    public Tanker getTanker() {
        if (mTanker == null) {
            mTanker = buildTanker();
        }

        return mTanker;
    }

    private Tanker buildTanker() {
        try {
            TankerOptions options = mTankerOptionsTask.get();
            Tanker tanker = new Tanker(options);
            tanker.connectUnlockRequiredHandler(() -> {
                if (mTempUnlockCode != null) {
                    // TODO: implement unlock by verification code
                    Log.e("Session", "Unlocking device by verification code NOT implemented");
                } else {
                    // Warning: due to a tconcurrent bug in SDK 1.7.3 and below, you can't .get() this Future synchronously
                    tanker.unlockCurrentDevice(new Password(mTempUnlockPassword)).then((validateFuture) -> {
                        if (validateFuture.getError() != null) {
                            Log.e("Session", "Error when unlocking device by password");
                            validateFuture.getError().printStackTrace();
                        }
                    });
                }
            });
            return tanker;
        } catch (Throwable throwable) {
            Log.e("Session", mAppContext.getString(R.string.tanker_init_error));
            throwable.printStackTrace();
            return null;
        }
    }

    public void close() throws IOException {
        mApiClient.logout();
        if (mTanker != null) {
            mTanker.close().get();
            mTanker = null;
        }
    }

    public void logIn(String email, String password) throws ApiClient.AuthenticationError, IOException, JSONException {
        JSONObject body = mApiClient.logIn(email, password);

        String userId = body.getString("id");
        String userToken = body.getString("token");

        mTempUnlockPassword = password;
        getTanker().open(userId, userToken).get();
        mTempUnlockPassword = null;
    }

    public void signUp(String email, String password) throws ApiClient.AuthenticationError, IOException, JSONException {
        JSONObject body = mApiClient.signUp(email, password);

        String userId = body.getString("id");
        String userToken = body.getString("token");

        getTanker().open(userId, userToken).get();
        getTanker().registerUnlock(null, new Password(password)).get();
    }

    public void resetPassword(String newPassword, String passwordResetToken, String verificationCode) throws ApiClient.AuthenticationError, IOException, JSONException {
        String email = mApiClient.resetPassword(newPassword, passwordResetToken);
        mTempUnlockCode = verificationCode;
        logIn(email, newPassword);
        mTempUnlockCode = null;
        getTanker().registerUnlock(null, new Password(newPassword)).get();
    }

    public void changeEmail(String newEmail) throws IOException, JSONException {
        mApiClient.changeEmail(newEmail);
        // TODO: implement unlock email update
    }

    public void changePassword(String oldPassword, String newPassword) throws IOException, JSONException {
        mApiClient.changePassword(oldPassword, newPassword);
        getTanker().registerUnlock(null, new Password(newPassword)).get();
    }

    public class TankerOptionsTask extends AsyncTask<String, Void, TankerOptions> {
        @Override
        protected TankerOptions doInBackground(String... params) {
            TankerOptions options = new TankerOptions();

            String writablePath = mAppContext.getFilesDir().getAbsolutePath();
            options.setWritablePath(writablePath);

            try {
                JSONObject tankerConfig = mApiClient.getConfig();

                String trustchainId = tankerConfig.getString("trustchainId");
                options.setTrustchainId(trustchainId);

                if (tankerConfig.has("url")) {
                    String url = tankerConfig.getString("url");
                    options.setTrustchainUrl(url);
                }
            } catch (Throwable throwable) {
                Log.e("Session", mAppContext.getString(R.string.no_trustchain_config));
                throwable.printStackTrace();
                return null;
            }

            return options;
        }
    }
}
