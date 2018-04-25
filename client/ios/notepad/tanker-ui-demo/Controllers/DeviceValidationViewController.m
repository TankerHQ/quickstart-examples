//
//  DeviceValidationViewController.m
//  tanker-ui-demo
//
//  Created by Loic on 12/04/2018.
//  Copyright © 2018 Tanker. All rights reserved.
//

#import "DeviceValidationViewController.h"
#import "Globals.h"
@import PromiseKit;

@interface DeviceValidationViewController ()
@property (weak, nonatomic) IBOutlet UITextField *validationField;
@property (weak, nonatomic) IBOutlet UILabel *errorLabel;

@end

@implementation DeviceValidationViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    // Do any additional setup after loading the view.
  _errorLabel.textColor = [UIColor redColor];
}

- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

- (IBAction)pressContinue:(UIButton *)sender {
  _errorLabel.text = @"";
  NSString* unlockKey = _validationField.text;
  [[Globals sharedInstance].tanker unlockCurrentDeviceWithUnlockKey:unlockKey]
  .then(^{
    NSLog(@"Tanker is open");
  }).catch(^(NSError* error) {
    if (error.code == TKRErrorInvalidUnlockKey)
    {
      _errorLabel.text = @"Wrong passphrase";
    }
    else
    {
      _errorLabel.text = @"Could not connect to Tanker";
    }
  });
}

@end
