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
}

- (void)didReceiveMemoryWarning {
  [super didReceiveMemoryWarning];
  // Dispose of any resources that can be recreated.
}

/*
 #pragma mark - Navigation
 
 // In a storyboard-based application, you will often want to do a little preparation before navigation
 - (void)prepareForSegue:(UIStoryboardSegue *)segue sender:(id)sender {
 // Get the new view controller using [segue destinationViewController].
 // Pass the selected object to the new view controller.
 }
 */

PMKPromise* fetchUserToken (NSString* userId, NSString* password)
{
  NSString* urlStr = [NSString stringWithFormat:@"%@signup?userId=%@&password=%@", [Globals sharedInstance].serverAddress, userId, password];
  NSLog(@"%@", urlStr);
  NSMutableURLRequest *request = [[NSMutableURLRequest alloc]
                                  initWithURL:[NSURL URLWithString:urlStr]];
  [request setHTTPMethod:@"GET"];
  [request setValue:@"text" forHTTPHeaderField:@"Content-Type"];
  
  NSURLSession *session = [NSURLSession sharedSession];
  
  return [PMKPromise promiseWithResolver:^(PMKResolver resolve){
  [[session dataTaskWithRequest:request
              completionHandler:^(NSData * _Nullable data, NSURLResponse * _Nullable response, NSError * _Nullable error) {
                if (error)
                  resolve(error);
                NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *) response;
                if ((long)[httpResponse statusCode] != 200)
                {
                  NSLog(@"Response status code: %ld", (long)[httpResponse statusCode]);
                }
                resolve([[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding]);
    }] resume];
  }];
}

- (IBAction)signUpButton:(UIButton *)sender {
  NSString* userId = _unameField.text;
  NSString* password = _passwordField.text;
  
  // Add your checks of userId and password Here !
  
  fetchUserToken(userId, password).then(^(NSString *userToken){
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

@end
