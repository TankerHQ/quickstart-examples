package io.tanker.notepad;

import android.os.AsyncTask;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.AutoCompleteTextView;
import android.widget.Button;

import static io.tanker.notepad.Utils.isEmailValid;

public class ForgotPasswordActivity extends BaseActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_forgot_password);

        Button sendLinkButton = findViewById(R.id.send_link_button);
        sendLinkButton.setOnClickListener((View v) -> sendLink());
    }

    private void sendLink() {
        hideKeyboard();

        AutoCompleteTextView emailView = findViewById(R.id.forgot_password_input);
        String email = emailView.getText().toString();

        if (isEmailValid(email)) {
            RequestResetPassword task = new RequestResetPassword();
            boolean ok = false;
            try {
                ok = task.execute(email).get();
            } catch(Throwable throwable) {
                Log.e("Notepad", "Failed to execute RequestResetPassword task");
                throwable.printStackTrace();
            }
            if (ok) {
                showToast(getString(R.string.recovery_email));
            } else {
                showToast("Failed to sent recovery email");
            }
        } else {
            emailView.setError("Invalid email");
            emailView.requestFocus();
        }
    }

    public class RequestResetPassword extends AsyncTask<String, Void, Boolean> {
        @Override
        protected Boolean doInBackground(String... params) {
            String email = params[0];
            try {
                mApiClient.requestResetPassword(email);
                return true;
            } catch (Throwable throwable) {
                throwable.printStackTrace();
                return false;
            }
        }
    }
}
