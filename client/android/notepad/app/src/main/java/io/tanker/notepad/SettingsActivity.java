package io.tanker.notepad;

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

import io.tanker.api.Password;
import io.tanker.api.Tanker;
import io.tanker.notepad.network.ApiClient;
import okhttp3.Response;

import static io.tanker.notepad.Utils.isEmailValid;

public class SettingsActivity extends AppCompatActivity {
    private View mProgressView;
    private NotepadApplication mTankerApp;
    private ApiClient mApiClient;
    private EditText mChangeEmailInput;
    private EditText mChangePasswordOldInput;
    private EditText mChangePasswordNewInput;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_setting);

        mTankerApp = (NotepadApplication) getApplicationContext();
        mApiClient = ApiClient.getInstance();

        mProgressView = findViewById(R.id.setting_progress_bar);

        mChangeEmailInput = findViewById(R.id.change_email_input);
        mChangePasswordOldInput = findViewById(R.id.change_password_old_input);
        mChangePasswordNewInput = findViewById(R.id.change_password_new_input);

        Button changeEmailButton = findViewById(R.id.change_email_button);
        changeEmailButton.setOnClickListener((View v) -> changeEmail());

        Button changePasswordButton = findViewById(R.id.change_password_button);
        changePasswordButton.setOnClickListener((View v) -> changePassword());
    }

    private void updateAppEmail(String newEmail) throws Throwable {
        Response res = mApiClient.updateEmail(newEmail);

        int mError = res.code();

        if (mError == 200) {
            mTankerApp.setEmail(newEmail);
            runOnUiThread(() -> {
                showToast(getString(R.string.change_email_success));
            });
        } else if (mError == 409) {
            runOnUiThread(() -> {
                mChangeEmailInput.setError(getString(R.string.email_exist));
                mChangeEmailInput.requestFocus();
            });
        } else if (mError < 200 || mError > 202) {
            runOnUiThread(() -> {
                mChangeEmailInput.setError(getString(R.string.change_email_fail));
                mChangeEmailInput.requestFocus();
            });
        }
    }

    private void changeEmail() {
        String newEmail = mChangeEmailInput.getText().toString();
        if (newEmail.isEmpty() || !isEmailValid(newEmail)) {
            mChangeEmailInput.setError("Email invalid");
            mChangeEmailInput.requestFocus();
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
    }

    public class updateEmailTask extends AsyncTask<String, Void, Boolean> {
        @Override
        protected Boolean doInBackground(String... params) {
            String newEmail = params[0];
            try {
                updateAppEmail(newEmail);
                return true;
            } catch (Throwable throwable) {
                Log.e("Notepad", "Failed to change email: " + throwable.getMessage());
                return false;
            }
        }
    }

    private void changePassword() {
        String oldPassword = mChangePasswordOldInput.getText().toString();
        String newPassword = mChangePasswordNewInput.getText().toString();

        if (oldPassword.isEmpty()) {
            mChangePasswordNewInput.setError("Please input your old password");
            mChangePasswordNewInput.requestFocus();
            return;
        }

        if (newPassword.isEmpty()) {
            mChangePasswordNewInput.setError("Please input your new password");
            mChangePasswordNewInput.requestFocus();
            return;
        }

        mProgressView.setVisibility(ProgressBar.VISIBLE);

        Tanker tanker = ((NotepadApplication) getApplication()).getTankerInstance();
        if (tanker == null) {
            mProgressView.setVisibility(ProgressBar.INVISIBLE);
            Log.e("Notepad", "Empty tanker instance");
            throw new NullPointerException("Empty tanker instance");
        }

        tanker.updateUnlockPassword(new Password(newPassword)).then((validateFuture) -> {

            if (validateFuture.getError() != null) {
                Log.e("Notepad", validateFuture.getError().toString());
                runOnUiThread(() -> {
                    mChangePasswordNewInput.setError("Error, couldn't update unlock password!");
                    mChangePasswordNewInput.requestFocus();
                    mProgressView.setVisibility(ProgressBar.INVISIBLE);
                });
                return null;
            }

            Response res = mApiClient.updatePassword(oldPassword, newPassword);

            if (!res.isSuccessful()) {
                final String message = res.message();

                runOnUiThread(() -> {
                    mChangePasswordNewInput.setError(message);
                    mChangePasswordNewInput.requestFocus();
                    mProgressView.setVisibility(ProgressBar.INVISIBLE);
                });
                return null;
            }

            mTankerApp.setPassword(newPassword);

            runOnUiThread(() -> {
                mChangePasswordOldInput.setText("");
                mChangePasswordNewInput.setText("");
                mProgressView.setVisibility(ProgressBar.INVISIBLE);
            });

            showToast(getString(R.string.change_password_success));
            return null;
        });
    }

    @Override
    public void onBackPressed() {
        Intent intent = new Intent();
        setResult(Activity.RESULT_OK, intent);
        super.onBackPressed();
    }

    private void showToast(String message) {
        runOnUiThread(() -> {
            Toast.makeText(this, message,
                    Toast.LENGTH_LONG).show();
        });
    }
}
