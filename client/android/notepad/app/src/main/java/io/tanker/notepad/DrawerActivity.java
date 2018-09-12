package io.tanker.notepad;

import android.content.Intent;
import android.os.AsyncTask;
import android.os.Bundle;
import android.support.design.widget.NavigationView;
import android.support.v4.view.GravityCompat;
import android.support.v4.widget.DrawerLayout;
import android.support.v7.app.ActionBarDrawerToggle;
import android.support.v7.widget.Toolbar;
import android.util.Log;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewStub;
import android.widget.Button;
import android.widget.TextView;

import io.tanker.api.Tanker;
import io.tanker.notepad.network.ApiClient;

/**

 DrawerActivity should be extended by any activity that:
 - needs all the requirements of the BaseActivity
 - needs to display the main drawer menu

 Usage example:

 public class SpecificActivity extends DrawerActivity {

 public int getContentResourceId() {
 return R.layout.content_specific;
 }

 }

 */
public abstract class DrawerActivity extends BaseActivity
        implements NavigationView.OnNavigationItemSelectedListener {

    protected ApiClient mApiClient;
    protected Toolbar mToolbar;

    // This method needs to be overridden by child classes, e.g.:
    //
    //    public int getContentResourceId() { return R.layout.content_some_activity };
    //
    public abstract int getContentResourceId();


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        mApiClient = ApiClient.getInstance();

        setRealContentView();

        initToolbar();

        initDrawerMenu();
    }

    protected void setRealContentView() {
        // Use the common layout for activities extending base
        setContentView(R.layout.activity_drawer_base);

        // Replace the stub view by the real "content_*" layout of the activity
        ViewStub stub = findViewById(R.id.content_stub);
        stub.setLayoutResource(getContentResourceId());
        stub.inflate();
    }

    protected void initToolbar() {
        mToolbar = findViewById(R.id.toolbar);
        setSupportActionBar(mToolbar);
    }

    protected void initDrawerMenu() {
        DrawerLayout drawer = findViewById(R.id.drawer_layout);
        ActionBarDrawerToggle toggle = new ActionBarDrawerToggle(
                this, drawer, mToolbar, R.string.navigation_drawer_open, R.string.navigation_drawer_close);
        drawer.setDrawerListener(toggle);
        toggle.syncState();

        NavigationView navigationView = findViewById(R.id.nav_view);
        navigationView.setNavigationItemSelectedListener(this);

        View headerView = navigationView.getHeaderView(0);
        String emailAddress = mApiClient.getCurrentUserEmail();

        TextView email = headerView.findViewById(R.id.menu_header_email);
        email.setText(emailAddress);

        TextView icon = headerView.findViewById(R.id.menu_header_icon);
        icon.setText(emailAddress.substring(0, 1).toUpperCase());

        Button logoutButton = findViewById(R.id.btn_logout);
        logoutButton.setOnClickListener((View view) -> {
            logout();
        });
    }

    @Override
    public void onBackPressed() {
        DrawerLayout drawer = findViewById(R.id.drawer_layout);
        if (drawer.isDrawerOpen(GravityCompat.START)) {
            drawer.closeDrawer(GravityCompat.START);
        } else {
            super.onBackPressed();
        }
    }

    @Override
    public boolean onNavigationItemSelected(MenuItem item) {
        // Handle navigation view item clicks here.
        int id = item.getItemId();

        if (id == R.id.nav_my_note) {
            if (!(this instanceof MyNoteActivity)) {
                Intent intent = new Intent(this, MyNoteActivity.class);
                startActivity(intent);
            }

        } else if (id == R.id.nav_shared_notes) {
            if (!(this instanceof SharedNotesActivity)) {
                Intent intent = new Intent(this, SharedNotesActivity.class);
                startActivity(intent);
            }

        } else if (id == R.id.nav_settings) {
            if (!(this instanceof SettingsActivity)) {
                Intent intent = new Intent(this, SettingsActivity.class);
                startActivity(intent);
            }
        }

        DrawerLayout drawer = findViewById(R.id.drawer_layout);
        drawer.closeDrawer(GravityCompat.START);
        return true;
    }

    private void logout() {
        LogoutTask task = new LogoutTask();
        task.execute();
        boolean ok = false;

        try {
            ok = task.get();
        } catch (Throwable e) {
            e.printStackTrace();
        }
        if (!ok) {
            showToast("Logout failed");
        }
    }

    public class LogoutTask extends AsyncTask<Void, Void, Boolean> {
        @Override
        protected Boolean doInBackground(Void... params) {
            try {
                mApiClient.logout();

                Tanker tanker = ((NotepadApplication) getApplication()).getTankerInstance();
                tanker.close().get();

                runOnUiThread(() -> {
                    // Redirect to the Login activity
                    Intent intent = new Intent(getApplicationContext(), LoginActivity.class);
                    startActivity(intent);
                });
            } catch (Throwable e) {
                Log.e("Notepad", "Failed to logout");
                return false;
            }
            return true;
        }
    }

}
