//
//  ChangePasswordViewController.m
//  tanker-ui-demo
//
//  Created by Loic on 06/07/2018.
//  Copyright © 2018 Tanker. All rights reserved.
//

#import "ChangePasswordViewController.h"
#import "Globals.h"
#import "HomeViewController.h"

@import PromiseKit;

@interface ChangePasswordViewController ()
@property (weak, nonatomic) IBOutlet UITextField *passwordField;
@property (weak, nonatomic) IBOutlet UIButton *changePasswordButton;
@property (weak, nonatomic) IBOutlet UILabel *errorLabel;

@end

@implementation ChangePasswordViewController
- (IBAction)changePasswordAction:(UIButton *)sender {
  _errorLabel.text = @"";

  NSString* password = _passwordField.text;

  if ([password stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]].length == 0)
  {
    _errorLabel.text = @"UserID is empty or filled with blanks";
    return;
  }
  // Not safe, if Tanker returns an error, there is a password mismatch!
  [Globals changePassword:password].then(^{
    return [[Globals sharedInstance].tanker updateUnlockPassword:password];
  }).then(^{
    HomeViewController* controller = [self.storyboard instantiateViewControllerWithIdentifier:@"HomeViewController"];
    [self.navigationController pushViewController:controller animated:YES];
  });
}

- (void)viewDidLoad {
  [super viewDidLoad];
  // Do any additional setup after loading the view, typically from a nib.
}


- (void)didReceiveMemoryWarning {
  [super didReceiveMemoryWarning];
  // Dispose of any resources that can be recreated.
}


@end
