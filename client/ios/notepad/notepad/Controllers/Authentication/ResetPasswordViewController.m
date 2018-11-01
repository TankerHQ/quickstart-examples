#import "ResetPasswordViewController.h"

@interface ResetPasswordViewController ()

@property (weak, nonatomic) IBOutlet UITextField *passwordField;
@property (weak, nonatomic) IBOutlet UITextField *passwordConfirmationField;
@property (weak, nonatomic) IBOutlet UILabel *errorLabel;

@end

@implementation ResetPasswordViewController

- (void)viewDidLoad {
  [super viewDidLoad];

  NSLog(@"Got appToken %@ and verificationCode %@", self.token.appToken, self.token.tankerToken);
}

- (IBAction)resetPassword:(id)sender {
  _errorLabel.text = @"";

  NSString *password = _passwordField.text;
  NSString *passwordConfirmation = _passwordConfirmationField.text;

  NSCharacterSet *cs = [NSCharacterSet whitespaceAndNewlineCharacterSet];
  if ([password stringByTrimmingCharactersInSet:cs].length == 0) {
    _errorLabel.text = @"Password is empty or filled with blanks";
    return;
  }

  if (![passwordConfirmation isEqualToString:password]) {
    _errorLabel.text = @"New password and confirmation are not equal";
    return;
  }

  [[self session] resetPasswordTo:password withToken:self.token.appToken verificationCode:self.token.tankerToken].then(^{
    UITabBarController *controller = [self.storyboard
                                      instantiateViewControllerWithIdentifier:@"LoggedInTabBarController"];
    [self.navigationController pushViewController:controller animated:YES];
  });
}

@end
