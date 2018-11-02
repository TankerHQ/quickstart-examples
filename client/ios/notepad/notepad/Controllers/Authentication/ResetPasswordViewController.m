#import "ResetPasswordViewController.h"
#import "StringValidator.h"

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
  self.errorLabel.text = @" ";

  NSString *password = self.passwordField.text;
  NSString *passwordConfirmation = self.passwordConfirmationField.text;

  if ([StringValidator isBlank:password]) {
    self.errorLabel.text = @"Password is empty or filled with blanks";
    return;
  }

  if (![passwordConfirmation isEqualToString:password]) {
    self.errorLabel.text = @"Password and confirmation are not equal";
    return;
  }

  [SVProgressHUD show];

  [[self session] resetPasswordTo:password withToken:self.token.appToken verificationCode:self.token.tankerToken].then(^{
    UITabBarController *controller = [self.storyboard
                                      instantiateViewControllerWithIdentifier:@"LoggedInTabBarController"];
    [self.navigationController pushViewController:controller animated:YES];

    [SVProgressHUD dismiss];
  }).catch(^(NSError *error) {
    [SVProgressHUD dismiss];

    NSLog(@"Failed to reset password: %@", [error localizedDescription]);
    self.errorLabel.text = @"Failed to reset password";
  });
}

@end
