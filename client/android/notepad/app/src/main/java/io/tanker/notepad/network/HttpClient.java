package io.tanker.notepad.network;

import android.util.Log;

import java.io.IOException;

import okhttp3.Callback;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class HttpClient {
    public static final MediaType MEDIA_TYPE_PLAIN_TEXT
            = MediaType.parse("text/plain; charset=utf-8");
    public static final MediaType MEDIA_TYPE_JSON
            = MediaType.parse("application/json; charset=utf-8");

    private NonPersistentCookieJar mCookieJar;
    private OkHttpClient mOkHttpClient;
    private String mRoot;

    public HttpClient(String root) {
        mCookieJar = new NonPersistentCookieJar();
        mOkHttpClient = new OkHttpClient.Builder().cookieJar(mCookieJar).build();
        mRoot = root;
    }

    public void log(String message) {
        Log.w("HttpClient", message);
    }

    public void clearCookies() {
        mCookieJar.clear();
    }

    private Request buildGetRequest(String path) {
        return new Request.Builder()
                .url(mRoot + path)
                .header("Accept", "application/json")
                .build();
    }

    private Request buildPostRequest(String path, String body, MediaType bodyType) {
        return new Request.Builder()
                .url(mRoot + path)
                .header("Accept", "application/json")
                .post(RequestBody.create(bodyType, body))
                .build();
    }

    private Request buildPutRequest(String path, String body, MediaType bodyType) {
        return new Request.Builder()
                .url(mRoot + path)
                .header("Accept", "application/json")
                .put(RequestBody.create(bodyType, body))
                .build();
    }

    private Response requestSync(final Request request) throws IOException {
        log("sync " + request.method() + " " + request.url());
        return mOkHttpClient.newCall(request).execute();
    }

    public Response getSync(String path) throws IOException {
        Request request = buildGetRequest(path);
        return requestSync(request);
    }

    public Response postSync(String path, String body, MediaType type) throws IOException {
        Request request = buildPostRequest(path, body, type);
        return requestSync(request);
    }

    public Response postSync(String path, String body) throws IOException {
        return postSync(path, body, MEDIA_TYPE_JSON);
    }

    public Response putSync(String path, String body, MediaType type) throws IOException {
        Request request = buildPutRequest(path, body, type);
        return requestSync(request);
    }

    public Response putSync(String path, String body) throws IOException {
        return putSync(path, body, MEDIA_TYPE_JSON);
    }

    private void requestAsync(final Request request, final Callback callback) {
        log("async " + request.method() + " " + request.url());
        mOkHttpClient.newCall(request).enqueue(callback);
    }

    public void getAsync(String path, Callback callback) {
        Request request = buildGetRequest(path);
        requestAsync(request, callback);
    }

    public void postAsync(String path, String body, MediaType type, Callback callback) {
        Request request = buildPostRequest(path, body, type);
        requestAsync(request, callback);
    }

    public void postAsync(String path, String body, Callback callback) {
        postAsync(path, body, MEDIA_TYPE_JSON, callback);
    }

    public void putAsync(String path, String body, MediaType type, Callback callback) {
        Request request = buildPutRequest(path, body, type);
        requestAsync(request, callback);
    }

    public void putAsync(String path, String body, Callback callback) {
        putAsync(path, body, MEDIA_TYPE_JSON, callback);
    }
}
