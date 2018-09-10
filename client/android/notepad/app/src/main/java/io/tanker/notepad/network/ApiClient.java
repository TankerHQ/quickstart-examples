package io.tanker.notepad.network;

import android.util.Base64;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.nio.charset.Charset;

import io.tanker.notepad.BuildConfig;
import okhttp3.Response;
import okio.Buffer;
import okio.BufferedSource;

import static io.tanker.notepad.network.HttpClient.MEDIA_TYPE_PLAIN_TEXT;

// Singleton
public class ApiClient {
    // Private constructor: never call directly, use getInstance!
    private ApiClient() {
        mHttpClient = new HttpClient(BuildConfig.API_ROOT);
    }

    private static ApiClient instance = null;

    public static ApiClient getInstance() {
        if (instance == null) {
            instance = new ApiClient();
        }

        return instance;
    }

    private HttpClient mHttpClient;
    private String mCurrentUserId;

    public String getCurrentUserId() {
        return mCurrentUserId;
    }

    public void logout() throws IOException {
        mHttpClient.getSync("/logout");
        mHttpClient.clearCookies();
        mCurrentUserId = null;
    }

    public Response authenticate(String path, String email, String password) throws IOException, JSONException {
        JSONObject data = new JSONObject();
        data.put("email", email);
        data.put("password", password);
        Response res = mHttpClient.postSync(path, data.toString());

        // Extract current user id by reading the body, but don't prevent
        // the caller of this method to read the body themselves.
        // See: https://stackoverflow.com/a/33862068
        if (res.isSuccessful()) {
            BufferedSource source = res.body().source();
            source.request(Long.MAX_VALUE); // request the entire body.
            Buffer buffer = source.buffer();
            // clone buffer before reading from it
            String responseBodyString = buffer.clone().readString(Charset.forName("UTF-8"));
            JSONObject body = new JSONObject(responseBodyString);
            mCurrentUserId = body.getString("id");
        }

        return res;
    }

    public Response login(String email, String password) throws IOException, JSONException {
        return authenticate("/login", email, password);
    }

    public Response signup(String email, String password) throws IOException, JSONException {
        return authenticate("/signup", email, password);
    }

    public Response getMe() throws IOException {
        return mHttpClient.getSync("/me");
    }

    public JSONObject getConfig() throws IOException, JSONException {
        Response res = mHttpClient.getSync("/config");
        if (!res.isSuccessful()) {
            throw new Error("Couldn't get the Tanker config, did you start the server?");
        }
        return new JSONObject(res.body().string());
    }

    public Response updateEmail(String newEmail) throws IOException, JSONException {
        JSONObject data = new JSONObject();
        data.put("email", newEmail);
        return mHttpClient.putSync("/me/email", data.toString());
    }

    public Response updatePassword(String oldPassword, String newPassword) throws IOException, JSONException {
        JSONObject data = new JSONObject();
        data.put("oldPassword", oldPassword);
        data.put("newPassword", newPassword);
        return mHttpClient.putSync("/me/password", data.toString());
    }

    public String getUserIdFromEmail(String email) throws IOException, JSONException {
        Response res = mHttpClient.getSync("/users");
        JSONArray users = new JSONArray(res.body().string());

        for (int i = 0; i < users.length(); i++) {
            JSONObject user = users.getJSONObject(i);
            if (user.has("email") && user.getString("email").equals(email)) {
                return user.getString("id");
            }
        }
        return null;
    }

    public byte[] getData(String userId) throws IOException {
        Response res = mHttpClient.getSync("/data/" + userId);
        if (!res.isSuccessful()) {
            throw new Error(res.message());
        }

        String content = res.body().string();
        if (content == null) {
            return null;
        }

        return Base64.decode(content, Base64.DEFAULT);
    }

    public void putData(byte[] encryptedData) throws IOException {
        String base64 = Base64.encodeToString(encryptedData, Base64.NO_WRAP);
        Response res = mHttpClient.putSync("/data", base64, MEDIA_TYPE_PLAIN_TEXT);
        if (!res.isSuccessful()) {
            throw new Error(res.message());
        }
    }

    public Response share(String to) throws IOException, JSONException {
        JSONArray recipients = new JSONArray();
        recipients.put(to);

        JSONObject data = new JSONObject();
        data.put("from", mCurrentUserId);
        data.put("to", recipients);

        return mHttpClient.postSync("/share", data.toString());
    }
}
