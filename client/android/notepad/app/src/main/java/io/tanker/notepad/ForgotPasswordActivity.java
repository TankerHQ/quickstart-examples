package io.tanker.notepad;

import android.os.Bundle;
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
        AutoCompleteTextView emailView = findViewById(R.id.forgot_password_input);
        String email = emailView.getText().toString();
        if (isEmailValid(email)) {
            showToast(getString(R.string.recovery_email));
        } else {
            emailView.setError("Invalid email");
            emailView.requestFocus();
        }
    }
}
