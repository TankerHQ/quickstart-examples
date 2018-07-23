package io.tanker.thetankershow;

import android.app.Activity;
import android.content.Intent;
import android.os.AsyncTask;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ProgressBar;
import android.widget.Toast;

import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;

import io.tanker.api.Password;
import io.tanker.api.Tanker;

import static io.tanker.thetankershow.Utils.isEmailValid;

public class SettingActivity extends AppCompatActivity {

    private View mProgressView;
    private String currentEmail;
    private String currentPassword;

    private URL updateEmailUrl() throws Throwable {
        String address = ((TheTankerApplication) getApplication()).getServerAddress();
        return new URL(address + "me/email?email=" + this.currentEmail + "&password=" + this.currentPassword);
    }

    private URL updatePasswordUrl() throws Throwable {
        String address = ((TheTankerApplication) getApplication()).getServerAddress();
        return new URL(address + "me/password?email=" + this.currentEmail + "&password=" + this.currentPassword);
    }

    private void updateAppPassword(String newPassword) throws Throwable {
        URL url = updatePasswordUrl();
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setRequestProperty("Content-Type", "application/json; charset=utf-8");
        connection.setRequestMethod("PUT");
        connection.setDoOutput(true);

        String oldPassword = getIntent().getStringExtra("EXTRA_PASSWORD");
        String jsonText = String.format("{\"oldPassword\": \"%s\", \"newPassword\": \"%s\" }", oldPassword, newPassword);
        Log.i("TheTankerShow", jsonText);
        connection.getOutputStream().write(jsonText.getBytes());
        int mError = connection.getResponseCode();
        if (mError < 200 || mError > 202)
            throw new IOException("Update password failed with error code " + mError);
    }

    private void updateAppEmail(String newEmail) throws Throwable {
        URL url = updateEmailUrl();
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setRequestProperty("Content-Type", "application/json; charset=utf-8");
        connection.setRequestMethod("PUT");
        connection.setDoOutput(true);

        String jsonText = String.format("{\"email\": \"%s\"}", newEmail);
        Log.i("TheTankerShow", String.format("PUT: %s with data: %s", url, jsonText));
        connection.getOutputStream().write(jsonText.getBytes());
        int mError = connection.getResponseCode();
        if (mError < 200 || mError > 202)
            throw new IOException("Update email failed with error code " + mError);
    }

    private void showToast(String message) {
        runOnUiThread(() -> {
            Toast.makeText(this, message,
                    Toast.LENGTH_LONG).show();
        });
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_setting);

        this.currentEmail = getIntent().getStringExtra("EXTRA_EMAIL");
        this.currentPassword = getIntent().getStringExtra("EXTRA_PASSWORD");

        mProgressView = findViewById(R.id.setting_progress_bar);

        Button changeEmailButton = findViewById(R.id.button_change_email);
        changeEmailButton.setOnClickListener(view -> {
            EditText newEmailEdit = findViewById(R.id.input_change_email);
            String newEmail = newEmailEdit.getText().toString();
            if (newEmail.isEmpty() || !isEmailValid(newEmail)) {
                newEmailEdit.setError("New email invalid");
                newEmailEdit.requestFocus();
                return;
            }

            mProgressView.setVisibility(ProgressBar.VISIBLE);

            updateEmailTask task = new updateEmailTask();
            task.execute(newEmail);

            boolean ok = false;

            try {
                ok = task.get();
            } catch (Throwable throwable) {
                throwable.printStackTrace();
            }

            mProgressView.setVisibility(ProgressBar.INVISIBLE);

            if (ok) {
                showToast("Change email successfully");
                this.currentEmail = newEmail;
            } else {
                newEmailEdit.setError("Failed to change email.");
                newEmailEdit.requestFocus();
            }
        });

        Button unlockButton = findViewById(R.id.input_unlock_password_unlock_button);
        unlockButton.setOnClickListener(view -> {
            EditText unlockPasswordEdit = findViewById(R.id.input_unlock_password_edit);
            String unlockPassword = unlockPasswordEdit.getText().toString();
            if (unlockPassword.isEmpty()) {
                unlockPasswordEdit.setError("Please input your new password");
                unlockPasswordEdit.requestFocus();
                return;
            }

            mProgressView.setVisibility(ProgressBar.VISIBLE);

            Tanker tanker = ((TheTankerApplication) getApplication()).getTankerInstance();
            if (tanker == null) {
                mProgressView.setVisibility(ProgressBar.INVISIBLE);
                Log.e("TheTankerShow", "Empty tanker instance");
                throw new NullPointerException("Empty tanker instance");
            }


            tanker.updateUnlockPassword(new Password(unlockPassword)).then((validateFuture) -> {

                if (validateFuture.getError() != null) {
                    Log.e("TheTankerShow", validateFuture.getError().toString());
                    runOnUiThread(() -> {
                        unlockPasswordEdit.setError("Error, couldn't update password!");
                        unlockPasswordEdit.requestFocus();
                    });
                    mProgressView.setVisibility(ProgressBar.INVISIBLE);
                    return null;
                }

                try {
                    updateAppPassword(unlockPassword);
                } catch (Throwable throwable) {
                    runOnUiThread(() -> {
                        unlockPasswordEdit.setError("Failed to update notepad server password. Please open a bug report.");
                        unlockPasswordEdit.requestFocus();
                        throwable.printStackTrace();
                    });
                    mProgressView.setVisibility(ProgressBar.INVISIBLE);
                    return null;
                }
                mProgressView.setVisibility(ProgressBar.INVISIBLE);
                this.currentPassword = getIntent().getStringExtra("EXTRA_PASSWORD");
                showToast("Change password successfully");
                return null;
            });

        });
    }

    public class updateEmailTask extends AsyncTask<String, Void, Boolean> {
        @Override
        protected Boolean doInBackground(String... params) {
            String newEmail = params[0];
            try {
                updateAppEmail(newEmail);
                return true;
            } catch (Throwable throwable) {
                Log.e("TheTankerShow", "Failed to change email: " + throwable.getMessage());
                return false;
            }
        }
    }

    @Override
    public void onBackPressed() {
        Intent intent = new Intent();
        intent.putExtra("EXTRA_EMAIL", this.currentEmail);
        intent.putExtra("EXTRA_PASSWORD", this.currentPassword);
        setResult(Activity.RESULT_OK, intent);
        super.onBackPressed();
    }
}
