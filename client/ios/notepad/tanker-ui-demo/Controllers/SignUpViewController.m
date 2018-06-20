//
//  SignUpViewController.m
//  tanker-ui-demo
//
//  Created by Loic on 09/04/2018.
//  Copyright © 2018 Tanker. All rights reserved.
//

#import "SignUpViewController.h"
#import "SaveValidationViewController.h"
#import "Globals.h"
@import PromiseKit;
@import Tanker;

@interface SignUpViewController ()
@property UIActivityIndicatorView* activityIndicator;
@property (weak, nonatomic) IBOutlet UITextField *unameField;
@property (weak, nonatomic) IBOutlet UITextField *passwordField;
@property (weak, nonatomic) IBOutlet UILabel *errorLabel;

@end

@implementation SignUpViewController

- (void)viewDidLoad {
  [super viewDidLoad];
  // Do any additional setup after loading the view.
  
  _unameField.returnKeyType = UIReturnKeyNext;
  _unameField.delegate = self;
  _passwordField.returnKeyType = UIReturnKeyNext;
  _passwordField.delegate = self;
  
  _activityIndicator = [[UIActivityIndicatorView alloc]initWithFrame:CGRectMake(self.view.bounds.size.width / 2 - 25, self.view.bounds.size.height / 2 - 25, 50, 50)];
  [_activityIndicator setActivityIndicatorViewStyle:UIActivityIndicatorViewStyleWhiteLarge];
  [_activityIndicator setColor:[UIColor blueColor]];
  [self.view addSubview:_activityIndicator];
  
  _errorLabel.textColor = [UIColor redColor];
}

- (void)didReceiveMemoryWarning {
  [super didReceiveMemoryWarning];
  // Dispose of any resources that can be recreated.
}

-(void) signUpAction {
  _errorLabel.text = @"";
  NSString* userId = _unameField.text;
  NSString* password = _passwordField.text;
  if ([userId length] == 0
      || [[userId stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]] length] == 0)
  {
    _errorLabel.text = @"UserID is empty or filled with blanks";
    return;
  }
  if ([password length] == 0
      || [[password stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]] length] == 0)
  {
    _errorLabel.text = @"Password is empty or filled with blanks";
    return;
  }
  
  // Add your checks of userId and password Here !
  
  [_activityIndicator startAnimating];
  
  [Globals fetchUserToken:@"signup" userId:userId password:password]
  .then(^(NSString *userToken){
    [[Globals sharedInstance].tanker openWithUserID:userId userToken:userToken]
    .then(^{
      NSLog(@"Tanker is open");
      [[Globals sharedInstance].tanker generateAndRegisterUnlockKey]
      .then(^(TKRUnlockKey* unlockKey) {
        NSLog(@"Please save this unlock key in a safe place: %@", unlockKey);
        [_activityIndicator stopAnimating];
        SaveValidationViewController *controller = [self.storyboard instantiateViewControllerWithIdentifier:@"SaveValidationCode"];
        controller.passphrase = [unlockKey value];
        [self.navigationController pushViewController:controller animated:YES];
      });
    }).catch(^(NSError* error) {
      [_activityIndicator stopAnimating];
      NSLog(@"Could not open Tanker: %@", [error localizedDescription]);
      _errorLabel.text = @"Could not open Tanker";
      return error;
    });
  }).catch(^(NSError* error) {
    [_activityIndicator stopAnimating];
    switch (error.code) {
      case 409:
        _errorLabel.text = @"User already exists";
        break;
      case 503:
        _errorLabel.text = @"Server error";
        break;
      default:
        _errorLabel.text = @"Unknown error";
        break;
    }
  });
}

- (IBAction)signUpButton:(UIButton *)sender {
  [self signUpAction];
}

- (BOOL)textFieldShouldReturn:(UITextField *)textField
{
  if (textField == self.unameField) {
    [self.passwordField becomeFirstResponder];
  }
  else if (textField == self.passwordField) {
    [self signUpAction];
  }
  return true;
}

@end
