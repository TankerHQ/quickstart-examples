#import "SettingsViewController.h"
#import "StringValidator.h"

@import PromiseKit;

@interface SettingsViewController ()

@property(weak, nonatomic) IBOutlet UITextField *emailField;
@property(weak, nonatomic) IBOutlet UIButton *changeEmailButton;
@property (weak, nonatomic) IBOutlet UILabel *emailErrorLabel;
@property(weak, nonatomic) IBOutlet UITextField *currentPasswordField;
@property(weak, nonatomic) IBOutlet UITextField *nextPasswordField;
@property(weak, nonatomic) IBOutlet UITextField *nextPasswordConfirmationField;
@property(weak, nonatomic) IBOutlet UIButton *changePasswordButton;
@property (weak, nonatomic) IBOutlet UILabel *passwordErrorLabel;

@end

@implementation SettingsViewController

- (void)viewDidLoad
{
  self.navbarTitle = @"Settings";
  [super viewDidLoad];
}

- (IBAction)changePasswordAction:(UIButton *)sender {
  self.passwordErrorLabel.text = @" ";

  NSString *currentPassword = self.currentPasswordField.text;
  NSString *nextPassword = self.nextPasswordField.text;
  NSString *nextPasswordConfirmation = self.nextPasswordConfirmationField.text;

  if ([StringValidator isBlank:currentPassword]) {
    self.passwordErrorLabel.text = @"Current password is empty or filled with blanks";
    return;
  }

  if ([StringValidator isBlank:nextPassword]) {
    self.passwordErrorLabel.text = @"New password is empty or filled with blanks";
    return;
  }

  if (![nextPasswordConfirmation isEqualToString:nextPassword]) {
    self.passwordErrorLabel.text = @"Password and confirmation are not equal";
    return;
  }

  [SVProgressHUD showWithStatus:@"Saving..."];

  // FIXME if an error occurs in the middle of password change, it will break!
  [[self session] changePasswordFrom:currentPassword to:nextPassword].then(^{
    self.currentPasswordField.text = @"";
    self.nextPasswordField.text = @"";
    self.nextPasswordConfirmationField.text = @"";

    [SVProgressHUD showSuccessWithStatus:@"Password changed"];
    [SVProgressHUD dismissWithDelay:2.0];
  });
}

- (IBAction)changeEmailAction:(UIButton *)sender {
  self.emailErrorLabel.text = @" ";

  NSString *email = self.emailField.text;

  if (![StringValidator isEmail:email]) {
    self.emailErrorLabel.text = @"Invalid email address";
    return;
  }

  [[self session] changeEmail:email].then(^{
    self.emailField.text = @"";

    [SVProgressHUD showSuccessWithStatus:@"Email address changed"];
    [SVProgressHUD dismissWithDelay:2.0];
  });
}

@end
