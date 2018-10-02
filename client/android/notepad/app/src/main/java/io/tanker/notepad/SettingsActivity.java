package io.tanker.notepad;

import android.os.AsyncTask;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ProgressBar;

import static io.tanker.notepad.Utils.isEmailValid;

public class SettingsActivity extends DrawerActivity {
    private View mProgressView;
    private EditText mChangeEmailInput;
    private EditText mChangePasswordOldInput;
    private EditText mChangePasswordNewInput;

    @Override
    public int getContentResourceId() {
        return R.layout.content_settings;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        mProgressView = findViewById(R.id.setting_progress_bar);

        mChangeEmailInput = findViewById(R.id.change_email_input);
        mChangePasswordOldInput = findViewById(R.id.change_password_old_input);
        mChangePasswordNewInput = findViewById(R.id.change_password_new_input);

        Button changeEmailButton = findViewById(R.id.change_email_button);
        changeEmailButton.setOnClickListener((View v) -> changeEmail());

        Button changePasswordButton = findViewById(R.id.change_password_button);
        changePasswordButton.setOnClickListener((View v) -> changePassword());
    }

    private void changeEmail() {
        String newEmail = mChangeEmailInput.getText().toString();
        if (!isEmailValid(newEmail)) {
            mChangeEmailInput.setError("Email invalid");
            mChangeEmailInput.requestFocus();
            return;
        }

        new ChangeEmailTask().execute(newEmail);
    }

    public class ChangeEmailTask extends AsyncTask<String, Void, Boolean> {
        private Throwable mError;

        @Override
        protected void onPreExecute() {
            hideKeyboard();
            mProgressView.setVisibility(ProgressBar.VISIBLE);
        }

        @Override
        protected Boolean doInBackground(String... params) {
            String newEmail = params[0];
            try {
                mSession.changeEmail(newEmail);
                return true;
            } catch (Throwable throwable) {
                Log.e("Notepad", "Failed to change email: " + throwable.getMessage());
                mError = throwable;
                return false;
            }
        }

        @Override
        protected void onPostExecute(Boolean success) {
            mProgressView.setVisibility(ProgressBar.INVISIBLE);

            if (success) {
                showToast(getString(R.string.change_email_success));
                mChangeEmailInput.setText("");
            } else {
                mChangeEmailInput.setError(mError.getMessage());
                mChangeEmailInput.requestFocus();
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

        new ChangePasswordTask().execute(oldPassword, newPassword);
    }

    public class ChangePasswordTask extends AsyncTask<String, Void, Boolean> {
        private Throwable mError;

        @Override
        protected void onPreExecute() {
            hideKeyboard();
            mProgressView.setVisibility(ProgressBar.VISIBLE);
        }

        @Override
        protected Boolean doInBackground(String... params) {
            String oldPassword = params[0];
            String newPassword = params[1];
            try {
                mSession.changePassword(oldPassword, newPassword);
                return true;
            } catch (Throwable throwable) {
                Log.e("Notepad", "Failed to change password: " + throwable.getMessage());
                mError = throwable;
                return false;
            }
        }

        @Override
        protected void onPostExecute(Boolean success) {
            mProgressView.setVisibility(ProgressBar.INVISIBLE);

            if (success) {
                showToast(getString(R.string.change_password_success));
                mChangePasswordOldInput.setText("");
                mChangePasswordNewInput.setText("");
            } else {
                mChangePasswordNewInput.setError(mError.getMessage());
                mChangePasswordNewInput.requestFocus();
            }
        }
    }
}
