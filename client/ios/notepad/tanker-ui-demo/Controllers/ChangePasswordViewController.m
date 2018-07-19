#import "ChangePasswordViewController.h"
#import "Globals.h"
#import "HomeViewController.h"

@import PromiseKit;

@interface ChangePasswordViewController ()
@property(weak, nonatomic) IBOutlet UITextField* theOldPasswordField;
@property(weak, nonatomic) IBOutlet UITextField* theNewPasswordField;
@property(weak, nonatomic) IBOutlet UITextField* thePasswordConfirmationField;
@property(weak, nonatomic) IBOutlet UIButton* changePasswordButton;
@property(weak, nonatomic) IBOutlet UILabel* errorLabel;

@end

@implementation ChangePasswordViewController
- (IBAction)changePasswordAction:(UIButton*)sender
{
  _errorLabel.text = @"";

  NSString* theOldPassword = _theOldPasswordField.text;
  NSString* theNewPassword = _theNewPasswordField.text;
  NSString* thePasswordConfirmation = _thePasswordConfirmationField.text;

  if ([theOldPassword stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]].length == 0)
  {
    _errorLabel.text = @"Current password is empty or filled with blanks";
    return;
  }

  if ([theNewPassword stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]].length == 0)
  {
    _errorLabel.text = @"New password is empty or filled with blanks";
    return;
  }

  if (![thePasswordConfirmation isEqualToString:theNewPassword])
  {
    _errorLabel.text = @"New password and confirmation are not equal";
    return;
  }

  // FIXME if an error occurs in the middle of password change, it will break!
  [Globals changePasswordFrom: theOldPassword to: theNewPassword].then(^{
    [[Globals sharedInstance].tanker updateUnlockPassword:theNewPassword].then(^{
      HomeViewController* controller = [self.storyboard instantiateViewControllerWithIdentifier:@"HomeViewController"];
      [self.navigationController pushViewController:controller animated:YES];
    });
  });
}

- (void)viewDidLoad
{
  [super viewDidLoad];
  // Do any additional setup after loading the view, typically from a nib.
}

- (void)didReceiveMemoryWarning
{
  [super didReceiveMemoryWarning];
  // Dispose of any resources that can be recreated.
}

@end
