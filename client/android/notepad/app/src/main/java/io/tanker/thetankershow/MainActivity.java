package io.tanker.thetankershow;

import android.content.Intent;
import android.os.AsyncTask;
import android.os.Bundle;
import android.support.design.widget.FloatingActionButton;
import android.support.design.widget.Snackbar;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.Toolbar;
import android.util.Base64;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;

import java.io.BufferedReader;
import java.io.DataOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.ConnectException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;

import io.tanker.api.Tanker;
import io.tanker.api.TankerDecryptOptions;
import io.tanker.api.TankerEncryptOptions;

public class MainActivity extends AppCompatActivity {

    private void logout() {
        Tanker tanker = ((TheTankerApplication) getApplication()).getTankerInstance();
        tanker.close().then((closeFuture) -> {
            runOnUiThread(() -> {
                // Redirect to the Login activity
                Intent intent = new Intent(MainActivity.this, LoginActivity.class);
                startActivity(intent);
            });

            return null;
        });
    }

    private void showToast(String message) {
        runOnUiThread(() -> {
            Toast.makeText(this, message,
                    Toast.LENGTH_LONG).show();
        });
    }

    private URL getNoteUrl() throws Throwable {
        String address  = ((TheTankerApplication) getApplication()).getServerAddress();

        String userId = getIntent().getStringExtra("EXTRA_USERID");
        String password = getIntent().getStringExtra("EXTRA_PASSWORD");

        return new URL(address + "data/" + userId + "?userId=" + userId + "&password=" + password);
    }

    private URL putNoteUrl() throws Throwable {
        String address  = ((TheTankerApplication) getApplication()).getServerAddress();

        String userId = getIntent().getStringExtra("EXTRA_USERID");
        String password = getIntent().getStringExtra("EXTRA_PASSWORD");

        return new URL(address + "data/?userId=" + userId + "&password=" + password);
    }

    private void uploadToServer(byte[] encryptedData) throws Throwable{
        URL url = putNoteUrl();
        HttpURLConnection connection = (HttpURLConnection)url.openConnection();
        connection.setRequestProperty("Content-Type", "text/plain; charset=utf-8");
        connection.setRequestMethod("PUT");
        connection.setDoOutput(true);

        String base64 = Base64.encodeToString(encryptedData, Base64.NO_WRAP);
        Log.i("TheTankerShow", base64);
        connection.getOutputStream().write( base64.getBytes() );
        connection.getInputStream();
    }

    private byte[] dataFromServer() throws Throwable {
        URL url = getNoteUrl();
        HttpURLConnection connection = (HttpURLConnection)url.openConnection();
        connection.setRequestMethod("GET");
        connection.connect();

        BufferedReader in = new BufferedReader(
                new InputStreamReader(
                        connection.getInputStream()));
        String content = in.readLine();

        if(content == null) {
            return null;
        }
        return Base64.decode(content, Base64.DEFAULT);
    }

    private void updatePassword() {
        Intent intent = new Intent(MainActivity.this, UpdateUnlockPasswordActivity.class);
        intent.putExtra("EXTRA_USERID", getIntent().getStringExtra("EXTRA_USERID"));
        intent.putExtra("EXTRA_PASSWORD", getIntent().getStringExtra("EXTRA_PASSWORD"));
        startActivity(intent);
    }

    private void saveData() {
        TankerEncryptOptions options = new TankerEncryptOptions();

        EditText contentEdit = findViewById(R.id.main_content_edit);
        String clearText = contentEdit.getText().toString();

        Tanker tanker = ((TheTankerApplication) getApplication()).getTankerInstance();
        try {
            tanker.encrypt(clearText.getBytes("UTF-8"), options).then((encryptFuture) -> {
                if (encryptFuture.getError() != null) {

                    return null;
                }

                byte[] encryptedData = encryptFuture.get();
                try {
                    uploadToServer(encryptedData);
                    showToast("Saved !");
                } catch (Throwable e) {
                    Log.e("TheTankerShow", "uploadError", e);
                    showToast("An error happened :(");
                }

                return null;
            });

        } catch (Throwable e) {
            Log.e("TheTankerShow", "saveDataError", e);
        }
    }

    private void loadData() {

        TankerDecryptOptions options = new TankerDecryptOptions();

        try {
            byte[] data = dataFromServer();

            if(data == null) {
                return;
            }

            Tanker tanker = ((TheTankerApplication) getApplication()).getTankerInstance();
            tanker.decrypt(data, options).then((decryptFuture) -> {
                if (decryptFuture.getError() != null) {
                    return null;
                }

                byte[] clearData = decryptFuture.get();
                String clearString = new String(clearData, "UTF-8");

                runOnUiThread(() -> {
                    EditText contentEdit = findViewById(R.id.main_content_edit);
                    contentEdit.setText(clearString);
                });
                return null;
            });

        } catch (Throwable e) {
            Log.e("TheTankerShow", "loadDataError", e);
        }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        Button logoutButton = findViewById(R.id.main_logout_button);
        logoutButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                logout();
            }
        });

        Button updatePasswordButton = findViewById(R.id.main_update_password_button);
        updatePasswordButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                updatePassword();
            }
        });

        Button saveButton =  findViewById(R.id.main_save_button);
        saveButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                saveData();
            }
        });

        FetchDataTask backgroundTask = new FetchDataTask();
        backgroundTask.execute();
    }

    @Override
    public void onBackPressed() {
        logout();
    }


    public class FetchDataTask extends AsyncTask<Void, Void, Boolean> {
        @Override
        protected Boolean doInBackground(Void... params) {
            loadData();
            return true;
        }
    }
}

