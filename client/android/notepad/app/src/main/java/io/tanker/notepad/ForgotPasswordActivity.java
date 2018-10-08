package io.tanker.notepad;

import android.content.Intent;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Bundle;
import android.support.v4.app.Fragment;
import android.support.v4.app.FragmentTransaction;
import android.util.Log;
import android.view.View;
import android.widget.AutoCompleteTextView;
import android.widget.EditText;

import static io.tanker.notepad.Utils.isEmailValid;
import static io.tanker.notepad.Utils.isURLValid;

public class ForgotPasswordActivity extends BaseActivity {
    private static class ResetPasswordToken {
        public String appToken, tankerToken;

        private ResetPasswordToken(String appToken, String tankerToken) {
            this.appToken = appToken;
            this.tankerToken = tankerToken;
        }

        // example link: <protocol>://<domain>/confirm-password-reset#<app-token>:<tanker-token>
        public static ResetPasswordToken fromLink(String link) {
            String[] tokens = link.split("#")[1].split(":");
            return new ResetPasswordToken(tokens[0], tokens[1]);
        }
    }

    ResetPasswordToken mResetToken;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_forgot_password);

        // If clicked on a reset password link received by e-mail:
        Intent intent = getIntent();
        Uri data = intent.getData();
        if (data != null) {
            Log.e("Notepad", data.toString());
            mResetToken = ResetPasswordToken.fromLink(data.toString());
            displayFragment(new ResetPasswordFragment());
        } else {
            displayFragment(new RequestResetPasswordFragment());
        }
    }

    private void displayFragment(Fragment newFragment) {
        FragmentTransaction transaction = getSupportFragmentManager().beginTransaction();
        transaction.replace(R.id.forgot_password_fragment, newFragment);
        transaction.commit();
    }

    public void debugDisplayResetLinkForm(View button) {
        displayFragment(new ResetPasswordLinkFragment());
    }

    public void debugDisplayRequestResetPassword(View button) {
        displayFragment(new RequestResetPasswordFragment());
    }

    public void debugValidateResetLinkForm(View button) {
        View fragmentView = findViewById(R.id.forgot_password_fragment);
        EditText linkInput = fragmentView.findViewById(R.id.reset_password_link_input);
        String link = linkInput.getText().toString();

        if (!isURLValid(link)) {
            linkInput.setError("Invalid link");
            linkInput.requestFocus();
            return;
        }

        mResetToken = ResetPasswordToken.fromLink(link);
        displayFragment(new ResetPasswordFragment());
    }

    public void onRequestResetPassword(View button) {
        hideKeyboard();

        View fragmentView = findViewById(R.id.forgot_password_fragment);
        AutoCompleteTextView emailView = fragmentView.findViewById(R.id.forgot_password_input);
        String email = emailView.getText().toString();

        if (!isEmailValid(email)) {
            emailView.setError("Invalid email");
            emailView.requestFocus();
            return;
        }

        new RequestResetPasswordTask().execute(email);
    }

    public void onResetPassword(View button) {
        hideKeyboard();

        View fragmentView = findViewById(R.id.forgot_password_fragment);
        EditText newPasswordInput = fragmentView.findViewById(R.id.reset_password_input);
        EditText newPasswordConfirmationInput = fragmentView.findViewById(R.id.reset_password_confirmation_input);

        String newPassword = newPasswordInput.getText().toString();
        String newPasswordConfirmation = newPasswordConfirmationInput.getText().toString();

        if (newPassword.isEmpty()) {
            newPasswordInput.setError("Please input your new password");
            newPasswordInput.requestFocus();
            return;
        }

        if (!newPasswordConfirmation.equals(newPassword)) {
            newPasswordConfirmationInput.setError("The new password and its confirmation do not match");
            newPasswordConfirmationInput.requestFocus();
            return;
        }

        new ResetPasswordTask().execute(newPassword);
    }

    public class RequestResetPasswordTask extends AsyncTask<String, Void, Boolean> {
        @Override
        protected Boolean doInBackground(String... params) {
            String email = params[0];
            try {
                mSession.getApiClient().requestResetPassword(email);
                return true;
            } catch (Throwable throwable) {
                Log.e("Notepad", "Failed to execute RequestResetPasswordTask task");
                throwable.printStackTrace();
                return false;
            }
        }

        @Override
        protected void onPostExecute(final Boolean success) {
            if (success) {
                showToast(getString(R.string.recovery_email_success));
            } else {
                showToast(getString(R.string.recovery_email_fail));
            }
        }
    }

    public class ResetPasswordTask extends AsyncTask<String, Void, Boolean> {
        @Override
        protected Boolean doInBackground(String... params) {
            String newPassword = params[0];
            try {
                mSession.resetPassword(newPassword, mResetToken.appToken, mResetToken.tankerToken);
                return true;
            } catch (Throwable throwable) {
                Log.e("Notepad", "Failed to execute ResetPassword task");
                throwable.printStackTrace();
                return false;
            }
        }

        @Override
        protected void onPostExecute(final Boolean success) {
            if (success) {
                showToast(getString(R.string.reset_password_success));
            } else {
                showToast(getString(R.string.reset_password_fail));
            }
        }
    }
}
