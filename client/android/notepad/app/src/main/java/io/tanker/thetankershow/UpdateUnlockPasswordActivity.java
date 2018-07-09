package io.tanker.thetankershow;

import android.content.Intent;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.util.Base64;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;

import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;

import io.tanker.api.Password;
import io.tanker.api.Tanker;

public class UpdateUnlockPasswordActivity extends AppCompatActivity {

    private URL updatePasswordUrl(String newPassword) throws Throwable {
        String address  = ((TheTankerApplication) getApplication()).getServerAddress();

        String userId = getIntent().getStringExtra("EXTRA_USERID");
        String oldPassword = getIntent().getStringExtra("EXTRA_PASSWORD");

        return new URL(address + "password/?userId=" + userId + "&password=" + oldPassword + "&newPassword=" + newPassword);
    }

    private void updateAppPassword(String newPassword) throws Throwable {
        URL url = updatePasswordUrl(newPassword);
        HttpURLConnection connection = (HttpURLConnection)url.openConnection();
        connection.setRequestProperty("Content-Type", "text/plain; charset=utf-8");
        connection.setRequestMethod("PUT");
        connection.getInputStream();

        int mError = connection.getResponseCode();
        if (mError < 200 || mError > 202)
            throw new IOException("Update password failed with error code "+mError);
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_update_unlock_password);

        Button unlockButton = findViewById(R.id.input_unlock_password_unlock_button);
        unlockButton.setOnClickListener(view -> {
            EditText unlockPasswordEdit = findViewById(R.id.input_unlock_password_edit);
            String unlockPassword = unlockPasswordEdit.getText().toString();
            if (unlockPassword.isEmpty()) {
                unlockPasswordEdit.setError("Please input your new unlock password");
                unlockPasswordEdit.requestFocus();
                return;
            }

            Tanker tanker = ((TheTankerApplication) getApplication()).getTankerInstance();
            if (tanker == null) {
                Log.e("TheTankerShow", "Empty tanker instance");
                throw new NullPointerException("Empty tanker instance");
            }

            tanker.updateUnlockPassword(new Password(unlockPassword)).then((validateFuture) -> {
               if (validateFuture.getError() != null) {
                   runOnUiThread (() -> {
                       unlockPasswordEdit.setError("Error, couldn't update unlock password!");
                       unlockPasswordEdit.requestFocus();
                   });
                   return null;
               }

                try {
                    updateAppPassword(unlockPassword);
                } catch (Throwable throwable) {
                    runOnUiThread (() -> {
                        unlockPasswordEdit.setError("Failed to update notepad server password. Please open a bug report.");
                        unlockPasswordEdit.requestFocus();
                        throwable.printStackTrace();
                    });
                    return null;
                }

                runOnUiThread (() -> {
                    Intent intent = new Intent(UpdateUnlockPasswordActivity.this, MainActivity.class);
                    startActivity(intent);
                });

               return null;
            });

        });

    }
}
