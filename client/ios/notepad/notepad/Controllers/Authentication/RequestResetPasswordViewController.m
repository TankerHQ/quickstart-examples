#import "RequestResetPasswordViewController.h"

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
  _errorLabel.text = @"";

  NSString *email = _emailField.text;
  NSCharacterSet *cs = [NSCharacterSet whitespaceAndNewlineCharacterSet];
  if ([email stringByTrimmingCharactersInSet:cs].length == 0) {
    _errorLabel.text = @"Email is empty or filled with blanks";
    return;
  }

  [[self session].apiClient requestResetPassword:email].then(^{
    NSLog(@"Email sent");
  });
}

@end
