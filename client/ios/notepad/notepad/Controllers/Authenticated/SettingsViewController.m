#import "SettingsViewController.h"
#import "StringValidator.h"

@import PromiseKit;

@interface SettingsViewController ()
@property(weak, nonatomic) IBOutlet UITextField *currentPasswordField;
@property(weak, nonatomic) IBOutlet UITextField *nextPasswordField;
@property(weak, nonatomic) IBOutlet UITextField *nextPasswordConfirmationField;
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

  NSString *currentPassword = _currentPasswordField.text;
  NSString *nextPassword = _nextPasswordField.text;
  NSString *nextPasswordConfirmation = _nextPasswordConfirmationField.text;

  if ([StringValidator isBlank:currentPassword]) {
    _errorLabel.text = @"Current password is empty or filled with blanks";
    return;
  }

  if ([StringValidator isBlank:nextPassword]) {
    _errorLabel.text = @"New password is empty or filled with blanks";
    return;
  }

  if (![nextPasswordConfirmation isEqualToString:nextPassword]) {
    _errorLabel.text = @"Password and confirmation are not equal";
    return;
  }

  // FIXME if an error occurs in the middle of password change, it will break!
  [[self session] changePasswordFrom:currentPassword to:nextPassword].then(^{
    self.currentPasswordField.text = @"";
    self.nextPasswordField.text = @"";
    self.nextPasswordConfirmationField.text = @"";

    [self.tabBarController setSelectedIndex:(0)];
  });
}

- (IBAction)changeEmailAction:(UIButton *)sender {
  _errorLabel.text = @"";

  NSString *email = _emailField.text;

  if (![StringValidator isEmail:email]) {
    _errorLabel.text = @"Invalid email address";
    return;
  }

  [[self session] changeEmail:email].then(^{
    self.emailField.text = @"";
    [self.tabBarController setSelectedIndex:(0)];
  });
}

@end
