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
    private EditText mNewEmailEdit;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_setting);

        mTankerApp = (NotepadApplication) getApplicationContext();
        mApiClient = ApiClient.getInstance();

        mProgressView = findViewById(R.id.setting_progress_bar);
        mNewEmailEdit = findViewById(R.id.input_change_email);

        Button changeEmailButton = findViewById(R.id.button_change_email);
        changeEmailButton.setOnClickListener((View v) -> changeEmail());

        Button unlockButton = findViewById(R.id.input_unlock_password_unlock_button);
        unlockButton.setOnClickListener((View v) -> changePassword());
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
                mNewEmailEdit.setError(getString(R.string.email_exist));
                mNewEmailEdit.requestFocus();
            });
        } else if (mError < 200 || mError > 202) {
            runOnUiThread(() -> {
                mNewEmailEdit.setError(getString(R.string.change_email_fail));
                mNewEmailEdit.requestFocus();
            });
        }
    }

    private void changeEmail() {
        String newEmail = mNewEmailEdit.getText().toString();
        if (newEmail.isEmpty() || !isEmailValid(newEmail)) {
            mNewEmailEdit.setError("Email invalid");
            mNewEmailEdit.requestFocus();
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

    private void updateAppPassword(String newPassword) throws Throwable {
        String oldPassword = mTankerApp.getPassword();

        Response res = mApiClient.updatePassword(oldPassword, newPassword);

        if (!res.isSuccessful())
            throw new IOException("Update password failed with error code " + res.code());
    }

    private void changePassword() {
        EditText unlockPasswordEdit = findViewById(R.id.input_unlock_password_edit);
        String unlockPassword = unlockPasswordEdit.getText().toString();
        if (unlockPassword.isEmpty()) {
            unlockPasswordEdit.setError("Please input your new password");
            unlockPasswordEdit.requestFocus();
            return;
        }

        mProgressView.setVisibility(ProgressBar.VISIBLE);

        Tanker tanker = ((NotepadApplication) getApplication()).getTankerInstance();
        if (tanker == null) {
            mProgressView.setVisibility(ProgressBar.INVISIBLE);
            Log.e("Notepad", "Empty tanker instance");
            throw new NullPointerException("Empty tanker instance");
        }


        tanker.updateUnlockPassword(new Password(unlockPassword)).then((validateFuture) -> {

            if (validateFuture.getError() != null) {
                Log.e("Notepad", validateFuture.getError().toString());
                runOnUiThread(() -> {
                    unlockPasswordEdit.setError("Error, couldn't update password!");
                    unlockPasswordEdit.requestFocus();
                });
                mProgressView.setVisibility(ProgressBar.INVISIBLE);
                return null;
            }

            try {
                updateAppPassword(unlockPassword);
                mTankerApp.setPassword(unlockPassword);
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
