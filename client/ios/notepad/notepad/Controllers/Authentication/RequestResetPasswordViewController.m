#import "RequestResetPasswordViewController.h"
#import "StringValidator.h"

@interface RequestResetPasswordViewController ()

@property (weak, nonatomic) IBOutlet UITextField *emailField;
@property (weak, nonatomic) IBOutlet UILabel *errorLabel;

@end

@implementation RequestResetPasswordViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    // Do any additional setup after loading the view.
}

- (IBAction)requestResetLink:(id)sender {
  self.errorLabel.text = @" ";

  NSString *email = self.emailField.text;

  if (![StringValidator isEmail:email]) {
    self.errorLabel.text = @"Invalid email address";
    return;
  }

  [SVProgressHUD show];

  [[self session].apiClient requestResetPassword:email].then(^{
    [SVProgressHUD showSuccessWithStatus:@"Email sent. Please check your inbox!"];
    [SVProgressHUD dismissWithDelay:5.0];
  }).catch(^(NSError *error) {
    [SVProgressHUD dismiss];

    NSLog(@"Failed to request reset password link: %@", [error localizedDescription]);
    self.errorLabel.text = @"Failed to request a link";
  });
}

- (IBAction)unwindSegueToRequestLink:(UIStoryboardSegue *)segue {}

@end
