//
//  LoginViewController.m
//  tanker-ui-demo
//
//  Created by Loic on 09/04/2018.
//  Copyright © 2018 Tanker. All rights reserved.
//

#import "LoginViewController.h"
#import "Globals.h"
#import "GreatSuccessViewController.h"
@import PromiseKit;

@interface LoginViewController ()
@property UIActivityIndicatorView* activityIndicator;
@property (weak, nonatomic) IBOutlet UITextField *usernameField;
@property (weak, nonatomic) IBOutlet UITextField *passwordField;
@property (weak, nonatomic) IBOutlet UILabel *errorLabel;

@end

@implementation LoginViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    // Do any additional setup after loading the view.
  
  _usernameField.returnKeyType = UIReturnKeyNext;
  _usernameField.delegate = self;
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

- (void) loginAction
{
  _errorLabel.text = @"";
  NSString* userId = _usernameField.text;
  NSString* password = _passwordField.text;
  if ([userId stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]].length == 0)
  {
    _errorLabel.text = @"UserID is empty or filled with blanks";
    return;
  }
  if ([password stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]].length == 0)
  {
    _errorLabel.text = @"Password is empty or filled with blanks";
    return;
  }
  
  [_activityIndicator startAnimating];
  [Globals fetchUserToken:@"login" userId:userId password:password]
  .then(^(NSString *userToken){
    [[Globals sharedInstance].tanker connectUnlockHandler:^{
      NSLog(@"In the handler");
      [[Globals sharedInstance].tanker unlockCurrentDeviceWithPassword:password];
    }];
    
    return [[Globals sharedInstance].tanker openWithUserID:userId userToken:userToken];
  })
  .then(^{
    [_activityIndicator stopAnimating];
    NSLog(@"Tanker is open");
    GreatSuccessViewController *controller = [self.storyboard instantiateViewControllerWithIdentifier:@"GreatSuccessViewController"];
    [self.navigationController pushViewController:controller animated:YES];
  })
  .catch(^(NSError* error) {
    // TODO check error domain to show app errors
    [_activityIndicator stopAnimating];
    NSLog(@"Could not open Tanker: %@", [error localizedDescription]);
    _errorLabel.text = @"Could not open Tanker";
  });
}

- (IBAction)triggerLogin:(UIButton *)sender
{
  [self loginAction];
}

- (BOOL)textFieldShouldReturn:(UITextField *)textField
{
  if (textField == self.usernameField) {
    [self.passwordField becomeFirstResponder];
  }
  else if (textField == self.passwordField) {
    [self loginAction];
  }
  return true;
}

@end
