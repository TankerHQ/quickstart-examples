//
//  SignUpViewController.m
//  tanker-ui-demo
//
//  Created by Loic on 09/04/2018.
//  Copyright © 2018 Tanker. All rights reserved.
//

#import "SignUpViewController.h"

@interface SignUpViewController ()
@property (weak, nonatomic) IBOutlet UITextField *unameField;
@property (weak, nonatomic) IBOutlet UITextField *passwordField;
@property (weak, nonatomic) IBOutlet UITextField *confirmPasswordField;

@end

@implementation SignUpViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    // Do any additional setup after loading the view.
}

- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

- (IBAction)triggerSignUp:(UIButton *)sender {
}

/*
#pragma mark - Navigation

// In a storyboard-based application, you will often want to do a little preparation before navigation
- (void)prepareForSegue:(UIStoryboardSegue *)segue sender:(id)sender {
    // Get the new view controller using [segue destinationViewController].
    // Pass the selected object to the new view controller.
}
*/

- (IBAction)signUpButton:(UIButton *)sender {
  if (_passwordField != _confirmPasswordField) {
    NSLog(@"Error wrong password confirmation");
  }
  NSString* url = [NSString stringWithFormat:@"http://10.208.24.94:8080/signup/?userId=%@&password=%@", _unameField, _passwordField];
}

@end
