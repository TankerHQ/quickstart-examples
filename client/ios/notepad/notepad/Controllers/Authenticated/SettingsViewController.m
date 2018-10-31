#import "SettingsViewController.h"

@import PromiseKit;

@interface SettingsViewController ()
@property(weak, nonatomic) IBOutlet UITextField *theOldPasswordField;
@property(weak, nonatomic) IBOutlet UITextField *theNewPasswordField;
@property(weak, nonatomic) IBOutlet UITextField *thePasswordConfirmationField;
@property(weak, nonatomic) IBOutlet UIButton *changePasswordButton;
@property(weak, nonatomic) IBOutlet UILabel *errorLabel;
@property(weak, nonatomic) IBOutlet UITextField *emailField;
@property(weak, nonatomic) IBOutlet UIButton *changeEmailButton;

@end

@implementation SettingsViewController

- (void)viewDidLoad
{
  self.navbarTitle = @"Settings";
  [super viewDidLoad];
}

- (IBAction)changePasswordAction:(UIButton *)sender {
  _errorLabel.text = @"";

  NSString *theOldPassword = _theOldPasswordField.text;
  NSString *theNewPassword = _theNewPasswordField.text;
  NSString *thePasswordConfirmation = _thePasswordConfirmationField.text;

  if ([theOldPassword
          stringByTrimmingCharactersInSet:[NSCharacterSet
                                              whitespaceAndNewlineCharacterSet]]
          .length == 0) {
    _errorLabel.text = @"Current password is empty or filled with blanks";
    return;
  }

  if ([theNewPassword
          stringByTrimmingCharactersInSet:[NSCharacterSet
                                              whitespaceAndNewlineCharacterSet]]
          .length == 0) {
    _errorLabel.text = @"New password is empty or filled with blanks";
    return;
  }

  if (![thePasswordConfirmation isEqualToString:theNewPassword]) {
    _errorLabel.text = @"New password and confirmation are not equal";
    return;
  }

  // FIXME if an error occurs in the middle of password change, it will break!
  [[self session] changePasswordFrom:theOldPassword to:theNewPassword].then(^{
    self.theOldPasswordField.text = @"";
    self.theNewPasswordField.text = @"";
    self.thePasswordConfirmationField.text = @"";

    [self.tabBarController setSelectedIndex:(0)];
  });
}

- (IBAction)changeEmailAction:(UIButton *)sender {
  _errorLabel.text = @"";

  NSString *email = _emailField.text;

  if ([email
          stringByTrimmingCharactersInSet:[NSCharacterSet
                                              whitespaceAndNewlineCharacterSet]]
          .length == 0) {
    _errorLabel.text = @"New email is empty or filled with blanks";
    return;
  }

  [[self session] changeEmail:email].then(^{
    self.emailField.text = @"";
    [self.tabBarController setSelectedIndex:(0)];
  });
}

- (void)didReceiveMemoryWarning {
  [super didReceiveMemoryWarning];
  // Dispose of any resources that can be recreated.
}

@end
