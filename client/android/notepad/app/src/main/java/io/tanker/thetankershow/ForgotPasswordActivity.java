package io.tanker.thetankershow;

import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.AutoCompleteTextView;
import android.widget.Button;
import android.widget.Toast;

import static io.tanker.thetankershow.Utils.isEmailValid;

public class ForgotPasswordActivity extends AppCompatActivity {

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
            Toast.makeText(getApplicationContext(), getString(R.string.recovery_email),
                    Toast.LENGTH_LONG).show();
        } else {
            emailView.setError("Invalid email");
            emailView.requestFocus();
        }

    }
}
