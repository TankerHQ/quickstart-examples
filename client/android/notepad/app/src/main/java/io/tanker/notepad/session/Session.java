package io.tanker.notepad.session;

import android.content.Context;
import android.os.AsyncTask;
import android.util.Log;

import org.json.JSONObject;

import java.io.IOException;

import io.tanker.api.Tanker;
import io.tanker.api.TankerOptions;
import io.tanker.notepad.BuildConfig;
import io.tanker.notepad.R;

// Singleton
public class Session {
    private Context mAppContext;

    private ApiClient mApiClient;

    private Tanker mTanker;
    private TankerOptionsTask mTankerOptionsTask;

    private static Session instance = null;

    public static Session getInstance(Context context) {
        if (instance == null) {
            instance = new Session(context);
        }

        return instance;
    }

    public ApiClient getApiClient() {
        return mApiClient;
    }

    public Tanker getTanker() {
        if (mTanker == null) {
            try {
                TankerOptions options = mTankerOptionsTask.get();
                mTanker = new Tanker(options);
            } catch (Throwable throwable) {
                Log.e("Notepad", mAppContext.getString(R.string.tanker_init_error));
                throwable.printStackTrace();
                return null;
            }
        }

        return mTanker;
    }

    // Private constructor: never call directly, use getInstance!
    private Session(Context context) {
        mAppContext = context;
        mApiClient = new ApiClient(BuildConfig.API_ROOT);
        mTankerOptionsTask = new TankerOptionsTask();
        mTankerOptionsTask.execute();
    }

    public void close() throws IOException {
        mApiClient.logout();
        mTanker.close().get();
        mTanker = null;
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
                Log.e("Notepad", mAppContext.getString(R.string.no_trustchain_config));
                throwable.printStackTrace();
                return null;
            }

            return options;
        }
    }
}
