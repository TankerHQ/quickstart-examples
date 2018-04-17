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
@property (weak, nonatomic) IBOutlet UITextField *unameField;
@property (weak, nonatomic) IBOutlet UITextField *passwordField;

@end

@implementation SignUpViewController

- (void)viewDidLoad {
  [super viewDidLoad];
  // Do any additional setup after loading the view.
  
  _unameField.returnKeyType = UIReturnKeyNext;
  _unameField.delegate = self;
  _passwordField.returnKeyType = UIReturnKeyNext;
  _passwordField.delegate = self;
}

- (void)didReceiveMemoryWarning {
  [super didReceiveMemoryWarning];
  // Dispose of any resources that can be recreated.
}

- (IBAction)signUpButton:(UIButton *)sender {
  NSString* userId = _unameField.text;
  NSString* password = _passwordField.text;
  
  // Add your checks of userId and password Here !
  
  [Globals fetchUserToken:@"signup" userId:userId password:password].then(^(NSString *userToken){
    [[Globals sharedInstance].tanker openWithUserID:userId userToken:userToken]
    .then(^{
      NSLog(@"Tanker is open");
      [[Globals sharedInstance].tanker generateAndRegisterUnlockKey]
      .then(^(NSString* unlockKey) {
        NSLog(@"Please save this unlock key in a safe place: %@", unlockKey);
        SaveValidationViewController *controller = [self.storyboard instantiateViewControllerWithIdentifier:@"SaveValidationCode"];
        controller.passphrase = unlockKey;
        [self.navigationController pushViewController:controller animated:YES];
      });
    })
    .catch(^(NSError* error) {
      NSLog(@"Could not open Tanker: %@", [error localizedDescription]);
      return error;
    });
  });
}

- (BOOL)textFieldShouldReturn:(UITextField *)textField
{
  if (textField == self.unameField) {
    [self.passwordField becomeFirstResponder];
  }
  else if (textField == self.passwordField) {
    [self.passwordField resignFirstResponder];
  }
  return true;
}

@end
